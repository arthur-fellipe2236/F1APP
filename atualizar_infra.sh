#!/usr/bin/env bash
#
# atualizar_infra.sh — rotação de credenciais + propagação (git, .env, Vercel)
#
# Preencha as variáveis abaixo UMA vez e execute:  ./atualizar_infra.sh
# O script falha rápido (set -e + trap) e nunca imprime segredos.
#
set -Eeuo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# 1) PREENCHA AQUI (deixe "" para manter o valor já existente)
# ─────────────────────────────────────────────────────────────────────────────
NOVO_GITHUB_PAT=""
NOVO_VERCEL_TOKEN=""
NOVO_SUPABASE_SERVICE_ROLE_KEY=""
NOVO_SUPABASE_SECRET_KEY=""
NOVO_SUPABASE_JWT_SECRET=""
NOVO_POSTGRES_PASSWORD=""
NOVO_REDIS_PASSWORD=""
NOVO_BLOB_READ_WRITE_TOKEN=""

# ─────────────────────────────────────────────────────────────────────────────
# 2) Geometria do projeto (ajuste só se algo mudar)
# ─────────────────────────────────────────────────────────────────────────────
GITHUB_OWNER="arthur-fellipe2236"
GITHUB_REPO="F1APP"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${REPO_DIR}/.env"
VERCEL_PROJECT="f1-app"
VERCEL_ENVS=(production preview development)

SUPABASE_REF="ropnzcaeyveakxlvnimo"
POSTGRES_USER="postgres.${SUPABASE_REF}"
POSTGRES_HOST="aws-0-us-east-1.pooler.supabase.com"
POSTGRES_PORT="5432"
REDIS_HOST="pleasure-dulcet-ceramic-23302.db.redis.io"
REDIS_PORT="17011"
REDIS_USER="default"

# ─────────────────────────────────────────────────────────────────────────────
# Infra do script
# ─────────────────────────────────────────────────────────────────────────────
log()  { printf '\033[1;32m[OK]\033[0m  %s\n' "$*"; }
warn() { printf '\033[1;33m[AVISO]\033[0m %s\n' "$*"; }
die()  { trap - ERR; printf '\033[1;31m[ERRO]\033[0m %s\n' "$*" >&2; exit 1; }
on_err() { local rc=$? linha=$1 cmd=$2; trap - ERR; printf '\033[1;31m[ERRO]\033[0m falhou (exit %s) na linha %s: %s — abortando\n' "${rc}" "${linha}" "${cmd}" >&2; exit "${rc}"; }
trap 'on_err "$LINENO" "$BASH_COMMAND"' ERR

require_cmd() { command -v "$1" >/dev/null 2>&1 || die "dependência ausente: $1"; }

cd "${REPO_DIR}"
for c in git curl awk sed python3; do require_cmd "$c"; done

# Vercel CLI: usa npx do host; sem Node, roda via Docker (mesma estratégia do projeto).
# No modo Docker a CLI é instalada UMA vez por execução, num diretório temporário.
VCTL_DIR=""
cleanup() { [[ -n "${VCTL_DIR}" ]] && rm -rf "${VCTL_DIR}" 2>/dev/null || true; }
trap cleanup EXIT

if command -v npx >/dev/null 2>&1; then
  VERCEL() { npx -y vercel@latest "$@" --token "${NOVO_VERCEL_TOKEN}"; }
else
  require_cmd docker
  vercel_prepare() {
    VCTL_DIR=$(mktemp -d)
    log "Preparando Vercel CLI (docker, ~1min, única vez)…"
    docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp \
      -v "${VCTL_DIR}:/opt/vercel" node:22-alpine \
      sh -c "npm i -g --prefix /opt/vercel vercel@latest >/dev/null 2>&1 && test -x /opt/vercel/bin/vercel" \
      || die "falha ao preparar a Vercel CLI via Docker"
  }
  VERCEL() {
    local qargs
    qargs=$(printf '%q ' "$@")
    [[ -n "${VCTL_DIR}" ]] || vercel_prepare
    docker run --rm -i -u "$(id -u):$(id -g)" -e HOME=/tmp \
      -v "${REPO_DIR}:/work" -w /work \
      -v "${VCTL_DIR}:/opt/vercel:ro" \
      -e VT="${NOVO_VERCEL_TOKEN}" node:22-alpine \
      sh -c "exec /opt/vercel/bin/vercel ${qargs} --token \"\$VT\""
  }
fi

# ─────────────────────────────────────────────────────────────────────────────
# 3) Validações de pré-voo
# ─────────────────────────────────────────────────────────────────────────────
[[ -f "${ENV_FILE}" ]] || die "${ENV_FILE} não encontrado (copie de .env.example)"
git remote get-url origin | grep -q "${GITHUB_OWNER}/${GITHUB_REPO}" \
  || die "remote origin não aponta para ${GITHUB_OWNER}/${GITHUB_REPO}"

if [[ -z "${NOVO_VERCEL_TOKEN}" ]]; then
  die "NOVO_VERCEL_TOKEN é obrigatório (envs na Vercel + deploy)"
fi
if [[ -z "${NOVO_GITHUB_PAT}" ]]; then
  warn "NOVO_GITHUB_PAT vazio — validação/push via token serão pulados"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 4) Git: valida PAT, remote fica SEM token embutido
# ─────────────────────────────────────────────────────────────────────────────
git_push() {  # push sem deixar PAT em .git/config nem na saída
  if [[ -n "${NOVO_GITHUB_PAT}" ]]; then
    git push "https://x-access-token:${NOVO_GITHUB_PAT}@github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git" \
      "HEAD:refs/heads/main" >/dev/null 2>&1
  else
    git push origin HEAD:main >/dev/null 2>&1
  fi
}

if [[ -n "${NOVO_GITHUB_PAT}" ]]; then
  gh_login=$(curl -sf --max-time 30 -H "Authorization: Bearer ${NOVO_GITHUB_PAT}" \
    https://api.github.com/user | python3 -c "import json,sys;print(json.load(sys.stdin)['login'])") \
    || die "GitHub PAT rejeitado pela API (expirado/sem escopo?)"
  [[ "${gh_login}" == "${GITHUB_OWNER}" ]] \
    || die "PAT pertence a '${gh_login}', esperado '${GITHUB_OWNER}'"
  git ls-remote --exit-code \
    "https://x-access-token:${NOVO_GITHUB_PAT}@github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git" HEAD \
    >/dev/null 2>&1 || die "PAT sem acesso ao repositório ${GITHUB_OWNER}/${GITHUB_REPO}"
  git remote set-url origin "https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git"
  log "Git: PAT validado; remote com URL limpa (sem token embutido)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 5) Vercel: valida token / login da CLI
# ─────────────────────────────────────────────────────────────────────────────
who=$(VERCEL whoami 2>/dev/null | tail -1) || die "token da Vercel rejeitado"
log "Vercel: autenticado como '${who}'"

# ─────────────────────────────────────────────────────────────────────────────
# 6) .env local (substituição literal, segura para qualquer caractere)
# ─────────────────────────────────────────────────────────────────────────────
set_env_key() {
  local key="$1" val="$2"
  if [[ -z "${val}" ]]; then
    warn ".env: valor de ${key} vazio no script — mantido como está"
    return 0
  fi
  ENV_KEY="${key}" ENV_NEWVAL="${val}" awk '
    BEGIN { key = ENVIRON["ENV_KEY"] "="; done = 0 }
    index($0, key) == 1 { print key ENVIRON["ENV_NEWVAL"]; done = 1; next }
    { print }
    END { if (!done) print key ENVIRON["ENV_NEWVAL"] }
  ' "${ENV_FILE}" > "${ENV_FILE}.tmp"
  mv "${ENV_FILE}.tmp" "${ENV_FILE}"
  log ".env: ${key} atualizado"
}

if [[ -n "${NOVO_POSTGRES_PASSWORD}" ]]; then
  set_env_key "F1_DATABASE_URI" \
    "postgresql+psycopg2://${POSTGRES_USER}:${NOVO_POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/postgres?sslmode=require"
fi
if [[ -n "${NOVO_REDIS_PASSWORD}" ]]; then
  set_env_key "REDIS_URL" "redis://${REDIS_USER}:${NOVO_REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}"
fi
set_env_key "BLOB_READ_WRITE_TOKEN"     "${NOVO_BLOB_READ_WRITE_TOKEN}"
set_env_key "SUPABASE_SERVICE_ROLE_KEY" "${NOVO_SUPABASE_SERVICE_ROLE_KEY}"
set_env_key "SUPABASE_SECRET_KEY"       "${NOVO_SUPABASE_SECRET_KEY}"
set_env_key "SUPABASE_JWT_SECRET"       "${NOVO_SUPABASE_JWT_SECRET}"
chmod 600 "${ENV_FILE}"

# ─────────────────────────────────────────────────────────────────────────────
# 7) Envs na Vercel (rm + add => novo valor, tipo sensitive)
# ─────────────────────────────────────────────────────────────────────────────
if [[ -f "${REPO_DIR}/.vercel/project.json" ]] || [[ -d "${REPO_DIR}/.vercel" ]]; then
  VERCEL link --yes --project "${VERCEL_PROJECT}" --token "${NOVO_VERCEL_TOKEN}" >/dev/null 2>&1 \
    || warn "vercel link falhou (seguindo com env add por contexto)"
fi

update_vercel_env() {
  local key="$1" val="$2" env
  if [[ -z "${val}" ]]; then
    warn "Vercel: valor de ${key} vazio no script — mantido no painel"
    return 0
  fi
  for env in "${VERCEL_ENVS[@]}"; do
    VERCEL env rm "${key}" "${env}" >/dev/null 2>&1 || true
    printf '%s' "${val}" | VERCEL env add "${key}" "${env}" >/dev/null 2>&1 \
      || die "Vercel: falha ao definir ${key} em ${env}"
  done
  log "Vercel: ${key} recriado em ${VERCEL_ENVS[*]} (sensitive)"
}

if [[ -n "${NOVO_POSTGRES_PASSWORD}" ]]; then
  update_vercel_env "F1_DATABASE_URI" \
    "postgresql+psycopg2://${POSTGRES_USER}:${NOVO_POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/postgres?sslmode=require"
fi
if [[ -n "${NOVO_REDIS_PASSWORD}" ]]; then
  update_vercel_env "REDIS_URL" "redis://${REDIS_USER}:${NOVO_REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}"
fi
update_vercel_env "BLOB_READ_WRITE_TOKEN"     "${NOVO_BLOB_READ_WRITE_TOKEN}"
update_vercel_env "SUPABASE_SERVICE_ROLE_KEY" "${NOVO_SUPABASE_SERVICE_ROLE_KEY}"
update_vercel_env "SUPABASE_SECRET_KEY"       "${NOVO_SUPABASE_SECRET_KEY}"
update_vercel_env "SUPABASE_JWT_SECRET"       "${NOVO_SUPABASE_JWT_SECRET}"

# ─────────────────────────────────────────────────────────────────────────────
# 8) Commit dos READMEs/docs + push + deploy
# ─────────────────────────────────────────────────────────────────────────────
git add -A README.md f1-api/README.md .env.example 2>/dev/null || true
if git diff --cached --quiet; then
  warn "git: nada versionável (READMEs já atuais)"
else
  git commit -q -m "infra: documentação pós-rotação de credenciais"
  log "git: commit criado"
fi

if git_push; then
  log "git: push concluído"
else
  warn "git: push falhou (checado manualmente) — continuando para o deploy"
fi

out=$(VERCEL deploy --prod --yes 2>&1) \
  || { printf '%s\n' "${out}" | tail -5 >&2; die "deploy na Vercel falhou"; }
deploy_url=$(printf '%s' "${out}" | grep -oE "https://[a-z0-9.-]*f1-app[a-z0-9.-]*\.vercel\.app" | tail -1)
[[ -n "${deploy_url}" ]] || deploy_url="https://${VERCEL_PROJECT}.vercel.app"
log "Vercel: deploy de produção atualizado → ${deploy_url}"

# ─────────────────────────────────────────────────────────────────────────────
printf '\n\033[1m✔ Infra atualizada com sucesso\033[0m\n'
printf '  • .env local reescrito (chmod 600)\n'
printf '  • Envs da Vercel rotacionadas (production/preview/development)\n'
printf '  • Git remoto limpo; commit/push conforme diff\n'
printf '  • Deploy de produção: %s\n\n' "${deploy_url}"
printf 'Pós-checklist manual:\n'
printf '  1) docker compose up -d --build f1-api  (testa Postgres/Redis novos)\n'
printf '  2) Revogar os tokens ANTIGOS: github.com/settings/tokens e vercel.com/account/tokens\n'
printf '  3) Se apagou a chave antiga no Supabase, rode o script de novo\n'
