"""Suíte de Testes da OP-07.4-R2 / OP-07.4-R3: Correção do Cron e da Semântica de Sincronização.

Cobre todos os 15 cenários mandatórios da OP-07.4-R2 e os 5 cenários adicionais da revisão OP-07.4-R3:
TC-01: Fonte externa retorna resultados vazios (idle_no_upstream_data, lease liberado, sem falso sucesso).
TC-02: Fonte externa retorna resultados válidos (completed, lease liberado, last_successful_sync_at atualizado).
TC-03: Falha de conexão com provedor (status='failed', fail-soft, lease liberado).
TC-04: Timeout do provedor (status='failed', timeout estrito respeitado, fail-soft, lease liberado).
TC-05: Exceção durante persistência (status='failed_exception', rollback atômico, lease liberado).
TC-06: Lease ocupado (rejeição com 409 / fail-fast quando lease já retido por outro worker ativo).
TC-07: Lease expirado (aquisição legítima permitida após expiração de TTL / locked_until expirado).
TC-08: Fencing token inválido ou obsoleto (ZombieWorkerError em validate_fencing_token e atomic_sync_write).
TC-09: Liberação do lease após ausência de dados (locked_by=None, last_status=idle_no_upstream_data).
TC-10: Liberação do lease após exceção (locked_by=None, last_status=failed_exception).
TC-11: Preservação do último sucesso (last_successful_sync_at não é sobrescrito por idle ou falha posterior).
TC-12: Autenticação ausente ou inválida (HTTP 401 Unauthorized em /cron/sync-results).
TC-13: Autenticação válida (HTTP 200 OK em /cron/sync-results com Bearer token correspondente).
TC-14: Configuração do Cron e maxDuration no vercel.json compatível com plano Vercel Hobby (0 22 * * * e maxDuration=60).
TC-15: Resiliência de build e registro da rota /api/v1/cron/sync-results.
TC-16 (R3): Contrato de imported_count no endpoint Cron sem novas inserções (idle_no_upstream_data).
TC-17 (R3): Contrato de imported_count no endpoint Cron com inserções e normalização de retorno legado.
TC-18 (R3): Contrato do endpoint Cron sob falha operacional de provedor (status='failed', preserva last_successful_sync_at).
TC-19 (R3): Exceção não tratada no endpoint Cron libera lease no finally com failed_exception.
TC-20 (R3): Semântica completa em ensure_race_results sob F1_SERVERLESS=1 (idle, failed, failed_exception, completed).
"""

import json
import os
from datetime import date, datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest
from app.extensions import db
from app.models import Driver, Race, RaceResult, Team
from app.results_refresh import (
    contingency_refresh_pending_standings,
    ensure_race_results,
    import_results_for_race,
    pending_races,
    refresh_pending_results_synchronous,
    reset_throttle,
)
from app.sync_lease import (
    CronSyncLease,
    FencingContextRequiredError,
    ZombieWorkerError,
    acquire_lease,
    atomic_sync_write,
    release_lease,
    renew_lease,
    validate_fencing_token,
)


def _create_mock_race(race_id=940, round_num=31, name="Custom Grand Prix", days_ago=2):
    past_date = date.today() - timedelta(days=days_ago)
    race = Race(
        id=race_id,
        season=2026,
        series="f1",
        round=round_num,
        name=name,
        date=past_date,
    )
    db.session.add(race)
    db.session.commit()
    return race


# ------------------------------------------------------------------------------
# TC-01: Fonte externa retorna resultados vazios
# ------------------------------------------------------------------------------
def test_tc01_upstream_empty_results_yields_idle_status(app, monkeypatch):
    """TC-01: Quando a fonte externa não possui resultados, status é idle_no_upstream_data e sucesso=False."""
    with app.app_context():
        reset_throttle()
        _create_mock_race(race_id=940, round_num=31)

        from app import ergast, openf1
        monkeypatch.setattr(ergast, "get", lambda *a, **k: None)
        monkeypatch.setattr(openf1, "get", lambda *a, **k: None)

        lease = acquire_lease(lease_id="f1_sync", ttl_seconds=60)
        assert lease["acquired"] is True
        f_token = lease["fencing_token"]
        w_uuid = lease["worker_uuid"]

        f_ctx = {"lease_id": "f1_sync", "worker_uuid": w_uuid, "fencing_token": f_token}
        summary = refresh_pending_results_synchronous(fencing_context=f_ctx)
        assert summary["imported_count"] == 0
        assert summary["skipped_count"] >= 1
        assert summary.get("failed_count", 0) == 0

        release_lease("f1_sync", w_uuid, f_token, status="idle_no_upstream_data", success=False)

        rec = db.session.get(CronSyncLease, "f1_sync")
        assert rec.locked_by is None
        assert rec.locked_until is None
        assert rec.last_status == "idle_no_upstream_data"
        assert rec.last_successful_sync_at is None


# ------------------------------------------------------------------------------
# TC-02: Fonte externa retorna resultados válidos
# ------------------------------------------------------------------------------
def test_tc02_upstream_valid_results_yields_completed_status(app, monkeypatch):
    """TC-02: Quando a fonte retorna resultados válidos, status é completed e last_successful_sync_at é atualizado."""
    with app.app_context():
        reset_throttle()
        race = _create_mock_race(race_id=941, round_num=32, name="São Paulo Grand Prix")

        mock_payload = [{
            "date": race.date.isoformat(),
            "Results": [
                {
                    "position": "1", "points": "25", "grid": "1", "laps": "71", "status": "Finished",
                    "Driver": {"code": "VER", "givenName": "Max", "familyName": "Verstappen"},
                    "Constructor": {"constructorId": "red_bull", "name": "Red Bull Racing"}
                }
            ]
        }]
        from app import ergast
        monkeypatch.setattr(ergast, "get", lambda *a, **k: mock_payload)

        lease = acquire_lease(lease_id="f1_sync", ttl_seconds=60)
        w_uuid = lease["worker_uuid"]
        f_token = lease["fencing_token"]
        f_ctx = {"lease_id": "f1_sync", "worker_uuid": w_uuid, "fencing_token": f_token}

        summary = refresh_pending_results_synchronous(fencing_context=f_ctx)
        assert summary["imported_count"] == 1

        release_lease("f1_sync", w_uuid, f_token, status="completed", success=True)

        rec = db.session.get(CronSyncLease, "f1_sync")
        assert rec.locked_by is None
        assert rec.last_status == "completed"
        assert rec.last_successful_sync_at is not None


# ------------------------------------------------------------------------------
# TC-03: Falha de conexão com provedor
# ------------------------------------------------------------------------------
def test_tc03_provider_connection_failure_fail_soft(app, monkeypatch):
    """TC-03: Falha de conexão com provedor externo é detectada como 'failed', tratada com fail-soft e libera o lease."""
    with app.app_context():
        reset_throttle()
        _create_mock_race(race_id=942, round_num=33)

        from app import ergast, openf1
        def conn_error(*a, **k):
            raise ConnectionError("Falha de rede com Jolpica")
        monkeypatch.setattr(ergast, "get", conn_error)
        monkeypatch.setattr(openf1, "get", lambda *a, **k: None)

        res = contingency_refresh_pending_standings(season=2026, series="f1")
        assert res is False

        rec = db.session.get(CronSyncLease, "f1_sync")
        assert rec.locked_by is None
        assert rec.locked_until is None
        assert rec.last_status == "failed"


# ------------------------------------------------------------------------------
# TC-04: Timeout do provedor
# ------------------------------------------------------------------------------
def test_tc04_provider_timeout_fail_soft(app, monkeypatch):
    """TC-04: Timeout no provedor externo registra 'failed', aborta com fail-soft e libera lease."""
    with app.app_context():
        reset_throttle()
        _create_mock_race(race_id=943, round_num=34)

        from app import ergast, openf1
        from app.ergast import JolpicaError
        def timeout_error(*a, **k):
            raise JolpicaError("Timeout simulado de 4.0s")
        monkeypatch.setattr(ergast, "get", timeout_error)
        monkeypatch.setattr(openf1, "get", lambda *a, **k: None)

        res = contingency_refresh_pending_standings(season=2026, series="f1", timeout=4.0)
        assert res is False

        rec = db.session.get(CronSyncLease, "f1_sync")
        assert rec.locked_by is None
        assert rec.locked_until is None
        assert rec.last_status == "failed"


# ------------------------------------------------------------------------------
# TC-05: Exceção durante persistência
# ------------------------------------------------------------------------------
def test_tc05_exception_during_persistence_triggers_failed_exception(app, monkeypatch):
    """TC-05: Exceção não tratada na persistência emite rollback e registra failed_exception."""
    with app.app_context():
        reset_throttle()
        race = _create_mock_race(race_id=944, round_num=35)

        mock_payload = [{
            "date": race.date.isoformat(),
            "Results": [
                {
                    "position": "1", "points": "25", "grid": "1", "laps": "71", "status": "Finished",
                    "Driver": {"code": "VER", "givenName": "Max", "familyName": "Verstappen"},
                    "Constructor": {"constructorId": "red_bull", "name": "Red Bull Racing"}
                }
            ]
        }]
        from app import ergast
        monkeypatch.setattr(ergast, "get", lambda *a, **k: mock_payload)

        with patch("app.sync_lease.atomic_sync_write", side_effect=RuntimeError("Database corruption crash")):
            res = contingency_refresh_pending_standings(season=2026, series="f1")
            assert res is False

        rec = db.session.get(CronSyncLease, "f1_sync")
        assert rec.locked_by is None
        assert rec.last_status == "failed_exception"
        assert rec.last_successful_sync_at is None


# ------------------------------------------------------------------------------
# TC-06: Lease ocupado
# ------------------------------------------------------------------------------
def test_tc06_busy_lease_conflict_rejection(app):
    """TC-06: Worker que encontra lease ocupado dentro do TTL é rejeitado (fail-fast / HTTP 409)."""
    with app.app_context():
        reset_throttle()
        lease1 = acquire_lease(lease_id="f1_sync", ttl_seconds=120)
        assert lease1["acquired"] is True

        lease2 = acquire_lease(lease_id="f1_sync", ttl_seconds=60)
        assert lease2["acquired"] is False
        assert lease2["fencing_token"] is None

        release_lease("f1_sync", lease1["worker_uuid"], lease1["fencing_token"])


# ------------------------------------------------------------------------------
# TC-07: Lease expirado
# ------------------------------------------------------------------------------
def test_tc07_expired_lease_allows_legitimate_acquisition(app):
    """TC-07: Lease cujo locked_until expirou permite aquisição por novo worker com incremento do fencing_token."""
    with app.app_context():
        reset_throttle()
        rec = db.session.get(CronSyncLease, "f1_sync")
        if not rec:
            rec = CronSyncLease(id="f1_sync")
            db.session.add(rec)
        rec.locked_by = "old_dead_worker"
        rec.fencing_token = 10
        rec.locked_until = datetime.now(timezone.utc) - timedelta(seconds=10)
        db.session.commit()

        lease = acquire_lease(lease_id="f1_sync", ttl_seconds=60)
        assert lease["acquired"] is True
        assert lease["worker_uuid"] != "old_dead_worker"
        assert lease["fencing_token"] == 11

        release_lease("f1_sync", lease["worker_uuid"], lease["fencing_token"])


# ------------------------------------------------------------------------------
# TC-08: Fencing token inválido ou obsoleto
# ------------------------------------------------------------------------------
def test_tc08_obsolete_fencing_token_raises_zombieworkererror(app):
    """TC-08: Tentativa de validação ou escrita com fencing token obsoleto levanta ZombieWorkerError."""
    with app.app_context():
        reset_throttle()
        rec = db.session.get(CronSyncLease, "f1_sync")
        if not rec:
            rec = CronSyncLease(id="f1_sync")
            db.session.add(rec)
        rec.locked_by = "active_worker"
        rec.fencing_token = 25
        rec.locked_until = datetime.now(timezone.utc) + timedelta(seconds=60)
        db.session.commit()

        with pytest.raises(ZombieWorkerError) as exc_info:
            validate_fencing_token("f1_sync", fencing_token=24)
        assert "Zombie Worker detectado" in str(exc_info.value)

        with pytest.raises(ZombieWorkerError):
            with atomic_sync_write("f1_sync", "active_worker", fencing_token=24):
                pass


# ------------------------------------------------------------------------------
# TC-09: Liberação do lease após ausência de dados
# ------------------------------------------------------------------------------
def test_tc09_lease_released_after_no_data(app, monkeypatch):
    """TC-09: Após consulta sem dados disponíveis, o lease é liberado (locked_by=None) com status idle_no_upstream_data."""
    with app.app_context():
        reset_throttle()
        _create_mock_race(race_id=945, round_num=36)

        from app import ergast, openf1
        monkeypatch.setattr(ergast, "get", lambda *a, **k: None)
        monkeypatch.setattr(openf1, "get", lambda *a, **k: None)

        res = contingency_refresh_pending_standings(season=2026, series="f1")
        assert res is False

        rec = db.session.get(CronSyncLease, "f1_sync")
        assert rec.locked_by is None
        assert rec.locked_until is None
        assert rec.last_status == "idle_no_upstream_data"


# ------------------------------------------------------------------------------
# TC-10: Liberação do lease após exceção
# ------------------------------------------------------------------------------
def test_tc10_lease_released_after_exception(app, monkeypatch):
    """TC-10: Após ocorrência de exceção interna, o lease é liberado com status failed_exception."""
    with app.app_context():
        reset_throttle()
        _create_mock_race(race_id=946, round_num=37)

        with patch("app.results_refresh.import_results_for_race", side_effect=Exception("Critical provider parser error")):
            res = contingency_refresh_pending_standings(season=2026, series="f1")
            assert res is False

        rec = db.session.get(CronSyncLease, "f1_sync")
        assert rec.locked_by is None
        assert rec.locked_until is None
        assert rec.last_status == "failed_exception"


# ------------------------------------------------------------------------------
# TC-11: Preservação do último sucesso
# ------------------------------------------------------------------------------
def test_tc11_preservation_of_last_successful_sync(app, monkeypatch):
    """TC-11: last_successful_sync_at preexistente não é sobrescrito ou anulado por tentativas posteriores sem dados ou com falha."""
    with app.app_context():
        reset_throttle()
        rec = db.session.get(CronSyncLease, "f1_sync")
        if not rec:
            rec = CronSyncLease(id="f1_sync")
            db.session.add(rec)
        past_success_time = datetime(2026, 11, 8, 20, 0, 0, tzinfo=timezone.utc)
        rec.last_successful_sync_at = past_success_time
        rec.last_status = "completed"
        db.session.commit()

        _create_mock_race(race_id=947, round_num=38)
        from app import ergast, openf1
        monkeypatch.setattr(ergast, "get", lambda *a, **k: None)
        monkeypatch.setattr(openf1, "get", lambda *a, **k: None)

        res = contingency_refresh_pending_standings(season=2026, series="f1")
        assert res is False

        rec_after = db.session.get(CronSyncLease, "f1_sync")
        assert rec_after.last_status == "idle_no_upstream_data"
        recorded_dt = rec_after.last_successful_sync_at
        if recorded_dt.tzinfo is None:
            assert recorded_dt == past_success_time.replace(tzinfo=None)
        else:
            assert recorded_dt == past_success_time


# ------------------------------------------------------------------------------
# TC-12: Autenticação ausente ou inválida
# ------------------------------------------------------------------------------
def test_tc12_cron_endpoint_unauthorized_when_secret_invalid(client, monkeypatch):
    """TC-12: Rota /api/v1/cron/sync-results rejeita com 401 requisições sem Authorization ou com secret incorreto."""
    monkeypatch.setenv("CRON_SECRET", "super_secret_test_token_123")

    resp_no_auth = client.get("/api/v1/cron/sync-results")
    assert resp_no_auth.status_code == 401
    assert resp_no_auth.json.get("error") == "Unauthorized"

    resp_bad_auth = client.get(
        "/api/v1/cron/sync-results",
        headers={"Authorization": "Bearer wrong_secret_token"}
    )
    assert resp_bad_auth.status_code == 401
    assert resp_bad_auth.json.get("error") == "Unauthorized"


# ------------------------------------------------------------------------------
# TC-13: Autenticação válida
# ------------------------------------------------------------------------------
def test_tc13_cron_endpoint_authorized_with_correct_secret(client, monkeypatch):
    """TC-13: Rota /api/v1/cron/sync-results aceita autenticação válida com Bearer <CRON_SECRET>."""
    monkeypatch.setenv("CRON_SECRET", "super_secret_test_token_123")

    resp = client.get(
        "/api/v1/cron/sync-results",
        headers={"Authorization": "Bearer super_secret_test_token_123"}
    )
    assert resp.status_code == 200
    assert "status" in resp.json
    assert "imported_count" in resp.json


# ------------------------------------------------------------------------------
# TC-14: Configuração do Cron e maxDuration no vercel.json
# ------------------------------------------------------------------------------
def test_tc14_vercel_json_cron_and_maxduration_configuration():
    """TC-14: Valida a sintaxe cron compatível com Vercel Hobby (0 22 * * *) e maxDuration=60 em vercel.json."""
    vercel_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "vercel.json")
    )
    assert os.path.exists(vercel_path), f"vercel.json deve existir em {vercel_path}"

    with open(vercel_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    crons = config.get("crons", [])
    cron_sync = next((c for c in crons if c.get("path") == "/api/v1/cron/sync-results"), None)
    assert cron_sync is not None, "Cron para /api/v1/cron/sync-results deve existir"

    schedule = cron_sync.get("schedule", "")
    parts = schedule.split()
    assert len(parts) == 5, f"Schedule deve ser cron padrão de 5 campos, obtido: {schedule}"
    assert schedule == "0 22 * * *", "Schedule deve ser compatível com o plano Vercel Hobby (1x/dia às 22:00 UTC)"

    functions = config.get("functions", {})
    api_func = functions.get("api/**", {})
    assert api_func.get("maxDuration") == 60, "api/** deve ter maxDuration configurado para 60 segundos"


# ------------------------------------------------------------------------------
# TC-15: Resiliência de build e integração de regressão
# ------------------------------------------------------------------------------
def test_tc15_route_sync_results_registered(app):
    """TC-15: Confirma que o endpoint /api/v1/cron/sync-results está devidamente registrado na aplicação."""
    rules = [rule.rule for rule in app.url_map.iter_rules()]
    assert "/api/v1/cron/sync-results" in rules or "/cron/sync-results" in rules


# ------------------------------------------------------------------------------
# TC-16 (OP-07.4-R3): Contrato de imported_count no endpoint Cron sem inserções
# ------------------------------------------------------------------------------
def test_tc16_cron_endpoint_imported_count_zero_yields_idle_no_upstream_data(client, app, monkeypatch):
    """TC-16: Endpoint Cron com corrida pendente mas sem dados na fonte retorna idle_no_upstream_data e imported_count=0."""
    monkeypatch.setenv("CRON_SECRET", "token_r3_test")
    with app.app_context():
        reset_throttle()
        _create_mock_race(race_id=950, round_num=40)

    from app import ergast, openf1
    monkeypatch.setattr(ergast, "get", lambda *a, **k: None)
    monkeypatch.setattr(openf1, "get", lambda *a, **k: None)

    resp = client.get(
        "/api/v1/cron/sync-results",
        headers={"Authorization": "Bearer token_r3_test"}
    )
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["status"] == "idle_no_upstream_data"
    assert payload["imported_count"] == 0
    assert payload["skipped_count"] >= 1
    assert payload["pending_count"] >= 1

    with app.app_context():
        rec = db.session.get(CronSyncLease, "f1_sync")
        assert rec.locked_by is None
        assert rec.last_status == "idle_no_upstream_data"
        assert rec.last_successful_sync_at is None


# ------------------------------------------------------------------------------
# TC-17 (OP-07.4-R3): Contrato de imported_count com inserções e retorno legado
# ------------------------------------------------------------------------------
def test_tc17_cron_endpoint_imported_count_contract_and_legacy_normalization(client, app, monkeypatch):
    """TC-17: Endpoint Cron preserva contrato imported_count mesmo quando retorno interno usa formato escalar ou legado."""
    monkeypatch.setenv("CRON_SECRET", "token_r3_test")
    with app.app_context():
        reset_throttle()
        _create_mock_race(race_id=951, round_num=41)

    with patch("app.results_refresh.refresh_pending_results_synchronous", return_value=2):
        resp = client.get(
            "/api/v1/cron/sync-results",
            headers={"Authorization": "Bearer token_r3_test"}
        )
        assert resp.status_code == 200
        payload = resp.get_json()
        assert payload["status"] == "completed"
        assert payload["imported_count"] == 2
        assert "skipped_count" in payload
        assert "pending_count" in payload

    with app.app_context():
        rec = db.session.get(CronSyncLease, "f1_sync")
        assert rec.locked_by is None
        assert rec.last_status == "completed"
        assert rec.last_successful_sync_at is not None


# ------------------------------------------------------------------------------
# TC-18 (OP-07.4-R3): Endpoint Cron sob falha operacional de provedor
# ------------------------------------------------------------------------------
def test_tc18_cron_endpoint_provider_failure_records_failed_and_preserves_last_success(client, app, monkeypatch):
    """TC-18: Falha operacional de provedor durante Cron registra status='failed' e preserva last_successful_sync_at."""
    monkeypatch.setenv("CRON_SECRET", "token_r3_test")
    past_success = datetime(2026, 11, 8, 22, 0, 0, tzinfo=timezone.utc)
    with app.app_context():
        reset_throttle()
        rec = db.session.get(CronSyncLease, "f1_sync")
        if not rec:
            rec = CronSyncLease(id="f1_sync")
            db.session.add(rec)
        rec.last_successful_sync_at = past_success
        rec.last_status = "completed"
        db.session.commit()
        _create_mock_race(race_id=952, round_num=42)

    from app import ergast, openf1
    from app.ergast import JolpicaError
    monkeypatch.setattr(ergast, "get", MagicMock(side_effect=JolpicaError("HTTP 503 Service Unavailable")))
    monkeypatch.setattr(openf1, "get", lambda *a, **k: None)

    resp = client.get(
        "/api/v1/cron/sync-results",
        headers={"Authorization": "Bearer token_r3_test"}
    )
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["status"] == "failed"
    assert payload["imported_count"] == 0
    assert payload["failed_count"] >= 1

    with app.app_context():
        rec_after = db.session.get(CronSyncLease, "f1_sync")
        assert rec_after.locked_by is None
        assert rec_after.last_status == "failed"
        recorded_dt = rec_after.last_successful_sync_at
        if recorded_dt.tzinfo is None:
            assert recorded_dt == past_success.replace(tzinfo=None)
        else:
            assert recorded_dt == past_success


# ------------------------------------------------------------------------------
# TC-19 (OP-07.4-R3): Exceção crítica no endpoint Cron libera lease no finally
# ------------------------------------------------------------------------------
def test_tc19_cron_endpoint_unhandled_exception_releases_lease_with_failed_exception(client, app, monkeypatch):
    """TC-19: Exceção não tratada em /cron/sync-results libera o lease com failed_exception."""
    monkeypatch.setenv("CRON_SECRET", "token_r3_test")
    with app.app_context():
        reset_throttle()
        _create_mock_race(race_id=953, round_num=43)

    with patch("app.results_refresh.refresh_pending_results_synchronous", side_effect=RuntimeError("Unexpected fatal error")):
        with pytest.raises(RuntimeError, match="Unexpected fatal error"):
            client.get(
                "/api/v1/cron/sync-results",
                headers={"Authorization": "Bearer token_r3_test"}
            )

    with app.app_context():
        rec = db.session.get(CronSyncLease, "f1_sync")
        assert rec.locked_by is None
        assert rec.locked_until is None
        assert rec.last_status.startswith("failed_exception:")


# ------------------------------------------------------------------------------
# TC-20 (OP-07.4-R3): Semântica completa em ensure_race_results (F1_SERVERLESS=1)
# ------------------------------------------------------------------------------
def test_tc20_ensure_race_results_serverless_semantics(app, monkeypatch):
    """TC-20: ensure_race_results sob F1_SERVERLESS=1 distingue idle_no_upstream_data, failed e failed_exception."""
    monkeypatch.setenv("F1_SERVERLESS", "1")
    monkeypatch.setitem(app.config, "FORCE_SYNC_REFRESH", True)

    with app.app_context():
        # 1. Caminho idle_no_upstream_data
        reset_throttle()
        race1 = _create_mock_race(race_id=954, round_num=44)
        from app import ergast, openf1
        monkeypatch.setattr(ergast, "get", lambda *a, **k: None)
        monkeypatch.setattr(openf1, "get", lambda *a, **k: None)

        assert ensure_race_results(race1, app) is False
        rec = db.session.get(CronSyncLease, "f1_sync")
        assert rec.locked_by is None
        assert rec.last_status == "idle_no_upstream_data"

        # 2. Caminho failed (erro operacional de provedor)
        reset_throttle()
        race2 = _create_mock_race(race_id=955, round_num=45)
        monkeypatch.setattr(ergast, "get", MagicMock(side_effect=ConnectionError("Upstream reset")))
        assert ensure_race_results(race2, app) is False
        rec = db.session.get(CronSyncLease, "f1_sync")
        assert rec.locked_by is None
        assert rec.last_status == "failed"

        # 3. Caminho failed_exception (exceção inesperada)
        reset_throttle()
        race3 = _create_mock_race(race_id=956, round_num=46)
        with patch("app.results_refresh.import_results_for_race", side_effect=RuntimeError("Boom")):
            assert ensure_race_results(race3, app) is False
        rec = db.session.get(CronSyncLease, "f1_sync")
        assert rec.locked_by is None
        assert rec.last_status == "failed_exception"
