#!/usr/bin/env bash
set -euo pipefail

# ── colours ────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; MAGENTA='\033[0;35m'; BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'

info()   { echo -e "  ${CYAN}▸${RESET}  $*"; }
ok()     { echo -e "  ${GREEN}✓${RESET}  $*"; }
warn()   { echo -e "  ${YELLOW}!${RESET}  $*"; }
die()    { echo -e "\n  ${RED}✗${RESET}  $*\n" >&2; exit 1; }
step()   { echo -e "\n${BOLD}${MAGENTA}  ── $* ──${RESET}\n"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "\n${BOLD}${MAGENTA}    ╔══════════════════════════════════════╗
    ║   A U T O M A T A R R              ║
    ║   Updater                          ║
    ╚══════════════════════════════════════╝${RESET}\n"

# ── prerequisites ──────────────────────────────────────────────
step "Prerequisites"
command -v docker &>/dev/null || die "Docker not installed."
docker info &>/dev/null       || die "Docker daemon is not running."

if docker compose version &>/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose &>/dev/null; then
  DC="docker-compose"
else
  die "Docker Compose not found."
fi
ok "Docker ready."

# ── load configuration ─────────────────────────────────────────
[[ -f .env ]] || die ".env not found. Run ./install.sh first."
set -a; source .env 2>/dev/null || true; set +a

PROFILE_FLAGS=""
if [[ -f .install-profiles ]]; then
  PROFILE_FLAGS=$(cat .install-profiles)
  ok "Loaded saved profiles: ${PROFILE_FLAGS:-core only}"
else
  warn "No saved profile file (.install-profiles) found — updating core services only."
  warn "Run ./install.sh to set up profiles properly."
fi

# ── pull third-party images ────────────────────────────────────
step "Pulling Latest Images"
info "Pulling third-party images (zurg, rclone, *arr apps…)"
# shellcheck disable=SC2086
$DC $PROFILE_FLAGS pull --ignore-pull-failures 2>/dev/null || true
ok "Images pulled."

# ── rebuild local images ───────────────────────────────────────
step "Rebuilding Automatarr"
info "Building backend and frontend…"
# shellcheck disable=SC2086
$DC $PROFILE_FLAGS build
ok "Build complete."

# ── restart ────────────────────────────────────────────────────
step "Restarting Services"
info "Applying update…"
# shellcheck disable=SC2086
$DC $PROFILE_FLAGS up -d --remove-orphans
ok "Services restarted."

# ── health check ───────────────────────────────────────────────
_wait_for_backend() {
  local url="http://localhost:${BACKEND_PORT:-8000}/api/system/health"
  local max=30 i=0
  echo -en "  ${CYAN}▸${RESET}  Waiting for backend"
  while ! curl -sf "$url" &>/dev/null; do
    if (( i >= max )); then
      echo
      warn "Backend didn't respond in ${max}s. Check: $DC logs backend"
      return 0
    fi
    echo -n "."
    sleep 2
    (( i++ ))
  done
  echo
  ok "Backend is healthy!"
}
_wait_for_backend

step "Update Complete"
echo -e "  ${CYAN}Automatarr${RESET}  →  http://localhost:${PORT:-3000}"
echo
echo -e "  ${DIM}View running containers:  $DC ps${RESET}"
echo -e "  ${DIM}View logs:                $DC logs -f backend${RESET}"
echo
