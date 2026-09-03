# API Formula 1 (Flask + OpenAPI 3)

API REST de Fórmula 1 construída com **Flask + SQLAlchemy (SQLite)** e documentada no
padrão **OpenAPI 3.0.3** via **Flasgger** (+ apispec). Inclui coleção Postman para validação.

> Os dados são sincronizados a partir de duas APIs públicas de dados reais de F1:
> **[OpenF1](https://openf1.org)** (temporadas **2023 em diante**) e
> **[Jolpica](https://api.jolpi.ca)** — sucessora comunitária da API Ergast
> (temporadas **2022 e anteriores**), com corridas, pilotos, equipes, circuitos e
> resultados oficiais (incluindo volta mais rápida, grid, DNF/DNS/DSQ e **pontos de
> sprint** — somados no resultado da corrida principal para as classificações
> baterem com o oficial). Se ambas estiverem indisponíveis e o banco estiver vazio,
> cai no seed demonstrativo offline.
>
> A sincronização roda em **thread de background no boot** (temporada corrente é
> re-sincronizada a cada execução) e também pode ser disparada via `POST /api/v1/sync`.
> Se a OpenF1 estiver indisponível e o banco vazio, cai no seed demonstrativo.

## Estrutura

```
f1-api/
├── app/
│   ├── __init__.py        # factory create_app()
│   ├── extensions.py      # SQLAlchemy
│   ├── openf1.py          # cliente HTTP da OpenF1 (2023+)
│   ├── f1site.py          # leitor do calendário oficial formula1.com
│   ├── ergast.py          # cliente HTTP da Jolpica/Ergast (2022 e anteriores)
│   ├── sync.py            # sincronizacao -> SQLite (background)
│   ├── models/            # Team, Driver, Circuit, Race, RaceResult
│   ├── api/               # blueprints + helpers + template OpenAPI
│   └── seed.py            # dados demonstrativos (2022 / fallback offline)
├── docs/postman/          # coleção + environment do Postman
├── tests/                 # pytest
├── requirements.txt
├── Dockerfile
└── run.py
```

## Como rodar

O sistema precisa de Python 3 com `venv` (sem pip no sistema, o bootstrap usa `get-pip.py`):

```bash
python3 -m venv --without-pip .venv
python3 /tmp/get-pip.py -q --python .venv/bin/python   # ou use pip já disponível
.venv/bin/pip install -r requirements.txt
.venv/bin/python run.py                                 # http://localhost:5000
```

O banco SQLite (`instance/f1.db`) é criado no primeiro boot e **sincronizado com a OpenF1**
em background (vários minutos na primeira vez). Para resetar: apague `instance/f1.db` e
reinicie.

Com **Docker** (sobe API + frontend juntos, a partir da raiz do repositório):

```bash
docker compose up -d --build     # API em :5000, app React em :5173
```

Variáveis: `F1_DATABASE_URI` (URI do banco), `PORT`, `F1_SYNC_SEASONS`
(padrão: `2022` até o ano corrente), `F1_DEMO_SEASONS` (força seed
demonstrativo para temporadas listadas; padrão: nenhuma), `F1_SYNC_FASTEST_LAP`
(`0` desativa a busca de volta mais rápida, que é o request mais pesado da OpenF1).

## Endpoints

Base: `/api/v1` — respostas de lista seguem `{ "data": [...], "meta": {page, per_page, total, pages} }`.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Status do serviço |
| GET | `/drivers` | Lista pilotos (`page`, `per_page`, `team_id` — inclui ex-pilotos da equipe —, `season`) |
| POST | `/drivers` | Cria piloto |
| GET | `/drivers/{id}` | Detalha piloto |
| PUT | `/drivers/{id}` | Atualiza piloto |
| DELETE | `/drivers/{id}` | Remove piloto |
| GET/POST | `/teams` | Lista/cria equipes |
| GET/PUT/DELETE | `/teams/{id}` | Detalha/atualiza/remove equipe |
| GET/POST | `/circuits` | Lista/cria circuitos |
| GET/PUT/DELETE | `/circuits/{id}` | Detalha/atualiza/remove circuito |
| GET | `/races` | Lista corridas (`season`) |
| GET | `/seasons` | Temporadas com corridas cadastradas |
| GET | `/next-race` | Próxima corrida (calendário oficial **formula1.com** + horário exato da OpenF1; cache 5 min) |
| GET | `/races/{id}` | Detalha corrida |
| GET | `/races/{id}/results` | Resultado ordenado por posição |
| GET | `/standings/drivers` | Classificação de pilotos (`season`) |
| GET | `/standings/teams` | Classificação de construtores (`season`) |
| POST | `/sync` | Dispara sync OpenF1 (`season`, `force`) |
| GET | `/sync/status` | Estado do sync em background |
| GET | `/news` | Últimas notícias do site oficial (`upcoming`, `limit`) |
| GET | `/news/article` | Resumo (10 frases) de uma matéria oficial (`url`, `lang`) |
| GET | `/live/tower` | Torre de tempos ao vivo da sessão atual/última (OpenF1) |

Erros padronizados: `400` (validação, com `details.missing_fields` / `unknown_fields`),
`404` (não encontrado), `409` (duplicado/integridade).

## OpenAPI

- **Swagger UI**: http://localhost:5000/apidocs/
- **Spec JSON**: http://localhost:5000/apispec_1.json

## Testes automatizados

```bash
.venv/bin/python -m pytest tests/ -q
```

## Coleção Postman (`docs/postman/`)

1. Importe `f1-api.postman_collection.json` e `f1-api.postman_environment.json` no Postman.
2. Selecione o environment **F1 API - Local** e suba a API (`run.py`).
3. Clique em **Run collection** (Runner) na ordem padrão das pastas.

A coleção tem 37 requests com `pm.test` em todas (status, estrutura JSON, paginação,
temporadas, encadeamento de IDs criados → PUT/DELETE) e casos negativos (400/404/409).

Requisitos para repetir a execução sem falhas: banco recém-sincronizado
(apague `instance/f1.db` e reinicie; aguarde `GET /api/v1/sync/status` ficar
`running: false`) — as requests de criação esperam `201` e as de duplicado
esperam `409` a partir do próprio fluxo.

Com **newman via Docker** (sem Node no host):

```bash
docker run --rm -v "$PWD/docs/postman:/etc/newman" postman/newman:latest \
  run f1-api.postman_collection.json \
  -e f1-api.postman_environment.json
```
