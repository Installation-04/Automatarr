#!/usr/bin/env bash
set -euo pipefail

# ─── colours ──────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}[•]${RESET} $*"; }
success() { echo -e "${GREEN}[✓]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[!]${RESET} $*"; }
die()     { echo -e "${RED}[✗]${RESET} $*" >&2; exit 1; }
ask_yn()  { echo -en "${BOLD}$* [y/N] ${RESET}"; read -r _yn; [[ "$_yn" =~ ^[Yy]$ ]]; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "\n${BOLD}${RED}  Automatarr — Uninstaller${RESET}\n"
warn "This will stop and remove Automatarr containers."
echo

# ─── prerequisites ─────────────────────────────────────────────
command -v docker &>/dev/null || die "Docker is not installed."
docker info &>/dev/null       || die "Docker daemon is not running."

if docker compose version &>/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose &>/dev/null; then
  DC="docker-compose"
else
  die "Docker Compose not found."
fi

# ─── stop & remove containers ──────────────────────────────────
info "Stopping and removing all Automatarr containers…"
# Pass all known profiles so compose knows about every container
ALL_PROFILES="--profile zurg --profile plex --profile jellyfin --profile zilean \
              --profile radarr --profile sonarr --profile prowlarr --profile lidarr \
              --profile readarr --profile bazarr --profile overseerr --profile whisparr"
# shellcheck disable=SC2086
$DC $ALL_PROFILES down 2>/dev/null || true
success "Containers removed."

# ─── volumes ───────────────────────────────────────────────────
echo
warn "Docker volumes hold service configs and the Automatarr database."
echo "  • App data     automatarr.db  (your library, settings)"
echo "  • Service data radarr/sonarr/plex/jellyfin configs, etc."
echo

if ask_yn "Remove ALL Docker volumes? (irreversible — deletes settings & DB)"; then
  # shellcheck disable=SC2086
  $DC $ALL_PROFILES down --volumes 2>/dev/null || true

  # Remove any leftover named volumes in case they were already down
  VOLUMES=(
    automatarr_zurg-data automatarr_zurg-mount automatarr_rclone-cache
    automatarr_plex-config automatarr_jellyfin-config automatarr_jellyfin-cache
    automatarr_zilean-data automatarr_radarr-config automatarr_sonarr-config
    automatarr_prowlarr-config automatarr_lidarr-config automatarr_readarr-config
    automatarr_bazarr-config automatarr_overseerr-config automatarr_whisparr-config
  )
  for vol in "${VOLUMES[@]}"; do
    docker volume rm "$vol" 2>/dev/null && echo "    removed volume $vol" || true
  done
  success "Volumes removed."
else
  info "Volumes kept."
fi

# ─── local data directory ──────────────────────────────────────
if [[ -d ./data ]]; then
  echo
  if ask_yn "Remove ./data/ directory? (contains automatarr.db)"; then
    rm -rf ./data
    success "./data/ removed."
  else
    info "./data/ kept."
  fi
fi

# ─── Docker images ─────────────────────────────────────────────
echo
if ask_yn "Remove locally built Docker images (automatarr-backend, automatarr-frontend)?"; then
  docker rmi automatarr-backend automatarr-frontend 2>/dev/null && success "Images removed." || warn "Images not found (already removed or never built)."
fi

# ─── .env ──────────────────────────────────────────────────────
if [[ -f .env ]]; then
  echo
  if ask_yn "Remove .env file?"; then
    rm .env
    success ".env removed."
  else
    info ".env kept."
  fi
fi

# ─── Docker network ────────────────────────────────────────────
docker network rm automatarr_automatarr 2>/dev/null && success "Network removed." || true

echo
success "Uninstall complete."
echo
