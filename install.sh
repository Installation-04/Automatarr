#!/usr/bin/env bash
# shellcheck disable=SC2034
set -euo pipefail

# ── colours ────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; MAGENTA='\033[0;35m'; BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'

info()    { echo -e "  ${CYAN}▸${RESET}  $*"; }
ok()      { echo -e "  ${GREEN}✓${RESET}  $*"; }
warn()    { echo -e "  ${YELLOW}!${RESET}  $*"; }
die()     { echo -e "\n  ${RED}✗${RESET}  $*\n" >&2; exit 1; }
step()    { echo -e "\n${BOLD}${MAGENTA}  ── $* ──${RESET}\n"; }
ask_yn()  { echo -en "  ${BOLD}$1 [y/N]${RESET} "; read -r _yn; [[ "$_yn" =~ ^[Yy]$ ]]; }
ask_def() {
  local prompt="$1" default="$2"
  echo -en "  ${BOLD}${prompt}${RESET} ${DIM}[${default}]${RESET}: "
  read -r _val; echo "${_val:-$default}"
}
ask_secret() {
  local prompt="$1"
  echo -en "  ${BOLD}${prompt}${RESET} "
  read -rs _sec; echo; echo "$_sec"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── OS detection ───────────────────────────────────────────────
OS_ID=""
OS_CODENAME=""
OS_PRETTY=""
if [[ -f /etc/os-release ]]; then
  OS_ID=$(. /etc/os-release && echo "${ID:-unknown}")
  OS_CODENAME=$(. /etc/os-release && echo "${VERSION_CODENAME:-}")
  OS_PRETTY=$(. /etc/os-release && echo "${PRETTY_NAME:-Linux}")
fi
IS_DEBIAN=false
[[ "$OS_ID" == "debian" ]] && IS_DEBIAN=true

# ── debian-specific helpers ────────────────────────────────────

# Install Docker CE from the official Docker apt repo on Debian
_install_docker_debian() {
  local codename="${1:-bookworm}"
  case "$codename" in
    bookworm|trixie) ;;
    *) warn "Unknown Debian release '$codename', falling back to bookworm repos."; codename="bookworm" ;;
  esac

  info "Installing Docker CE for Debian ${codename}…"

  # Remove legacy conflicting packages that ship in Debian's own repos
  for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do
    sudo apt-get remove -y "$pkg" 2>/dev/null || true
  done

  sudo apt-get update -qq
  sudo apt-get install -y ca-certificates curl gnupg

  # Add Docker's official GPG key
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg \
    | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg

  # Add Docker's apt repository
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/debian ${codename} stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

  sudo apt-get update -qq
  sudo apt-get install -y \
    docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin

  sudo systemctl enable --now docker
  ok "Docker CE installed and started."

  # Add the current user to the docker group so they don't need sudo
  if ! groups | grep -qw docker; then
    sudo usermod -aG docker "$USER"
    echo
    warn "Added ${BOLD}${USER}${RESET}${YELLOW} to the 'docker' group."
    warn "You must start a new session for this to take effect."
    echo
    echo -e "  Run one of:"
    echo -e "    ${BOLD}newgrp docker${RESET}   — activate in this terminal only"
    echo -e "    ${BOLD}su - ${USER}${RESET}     — open a new login shell"
    echo -e "    Log out and back in to your system"
    echo
    echo -e "  Then re-run the installer:  ${BOLD}./install.sh${RESET}"
    exit 0
  fi
}

# Check /dev/fuse and offer to install fuse3 (required by the rclone container)
_ensure_fuse() {
  info "Checking FUSE support (required by rclone for the Zurg mount)…"

  if [[ ! -e /dev/fuse ]]; then
    warn "/dev/fuse not found — the rclone container won't be able to mount."

    if $IS_DEBIAN; then
      if ask_yn "  Install fuse3 and load the kernel module now?"; then
        sudo apt-get install -y fuse3
        sudo modprobe fuse 2>/dev/null || true
        [[ -e /dev/fuse ]] || die "/dev/fuse still absent after fuse3 install. Check your kernel config."
        ok "fuse3 installed and /dev/fuse is ready."
      else
        warn "Skipping fuse3 install. The rclone mount will fail until fuse3 is installed."
        warn "Install later with:  sudo apt-get install fuse3"
      fi
    else
      warn "Install the 'fuse3' (or 'fuse') package for your OS, then re-run the installer."
    fi
  else
    ok "/dev/fuse is available."
  fi

  # Ensure the kernel module is actually loaded (it might exist as a device node
  # but the module could be absent after a kernel upgrade without a reboot)
  if ! lsmod 2>/dev/null | grep -q '^fuse'; then
    info "Loading fuse kernel module…"
    sudo modprobe fuse 2>/dev/null && ok "fuse module loaded." \
      || warn "Could not load fuse module — try rebooting or running: sudo modprobe fuse"
  fi
}

# ── shared functions ───────────────────────────────────────────
_wait_for_backend() {
  local url="http://localhost:${BACKEND_PORT:-7980}/api/system/health"
  local max=30 i=0
  echo -en "  ${CYAN}▸${RESET}  Waiting for backend"
  while ! curl -sf "$url" &>/dev/null; do
    if (( i >= max )); then
      echo
      warn "Backend didn't respond after ${max}s."
      warn "Check logs with: $DC logs backend"
      return 0
    fi
    echo -n "."
    sleep 2
    (( i++ ))
  done
  echo
  ok "Backend is healthy!"
}

_show_url_summary() {
  local flags="${1:-}"
  local port="${PORT:-7979}"
  local backend="${BACKEND_PORT:-7980}"

  echo
  echo -e "  ${BOLD}${GREEN}Services running:${RESET}"
  echo -e "  ${CYAN}Automatarr${RESET}   →  http://localhost:${port}"
  echo -e "  ${DIM}API Docs${RESET}     →  http://localhost:${backend}/docs"

  [[ "$flags" == *"zurg"* ]]      && echo -e "  ${CYAN}Zurg WebDAV${RESET}  →  http://localhost:${ZURG_PORT:-9999}/dav"
  [[ "$flags" == *"plex"* ]]      && echo -e "  ${CYAN}Plex${RESET}         →  http://localhost:32400/web"
  [[ "$flags" == *"jellyfin"* ]]  && echo -e "  ${CYAN}Jellyfin${RESET}     →  http://localhost:${JELLYFIN_PORT:-8096}"
  [[ "$flags" == *"zilean"* ]]    && echo -e "  ${CYAN}Zilean${RESET}       →  http://localhost:${ZILEAN_PORT:-8182}"
  [[ "$flags" =~ radarr|arrs ]]   && echo -e "  ${CYAN}Radarr${RESET}       →  http://localhost:${RADARR_PORT:-7878}"
  [[ "$flags" =~ sonarr|arrs ]]   && echo -e "  ${CYAN}Sonarr${RESET}       →  http://localhost:${SONARR_PORT:-8989}"
  [[ "$flags" =~ prowlarr|arrs ]] && echo -e "  ${CYAN}Prowlarr${RESET}     →  http://localhost:${PROWLARR_PORT:-9696}"
  [[ "$flags" =~ lidarr|arrs ]]   && echo -e "  ${CYAN}Lidarr${RESET}       →  http://localhost:${LIDARR_PORT:-8686}"
  [[ "$flags" =~ readarr|arrs ]]  && echo -e "  ${CYAN}Readarr${RESET}      →  http://localhost:${READARR_PORT:-8787}"
  [[ "$flags" =~ bazarr|arrs ]]   && echo -e "  ${CYAN}Bazarr${RESET}       →  http://localhost:${BAZARR_PORT:-6767}"
  [[ "$flags" =~ overseerr|arrs ]] && echo -e "  ${CYAN}Overseerr${RESET}    →  http://localhost:${OVERSEERR_PORT:-5055}"
  [[ "$flags" =~ whisparr|arrs ]] && echo -e "  ${CYAN}Whisparr${RESET}     →  http://localhost:${WHISPARR_PORT:-6969}"
  echo
}

# ── banner ─────────────────────────────────────────────────────
echo -e "
${BOLD}${MAGENTA}    ╔══════════════════════════════════════╗
    ║   A U T O M A T A R R              ║
    ║   Media Automation Suite           ║
    ╚══════════════════════════════════════╝${RESET}
"

# ── prerequisites ──────────────────────────────────────────────
step "Prerequisites"

[[ -n "$OS_PRETTY" ]] && info "Detected OS: ${OS_PRETTY}"

# ── Docker ──────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  if $IS_DEBIAN; then
    warn "Docker is not installed."
    if ask_yn "  Install Docker CE from the official Docker repository?"; then
      _install_docker_debian "$OS_CODENAME"
    else
      echo
      die "Docker is required.  →  https://docs.docker.com/engine/install/debian/"
    fi
  else
    die "Docker is not installed.  →  https://docs.docker.com/get-docker/"
  fi
fi

# Check docker daemon is running (covers the case where it was just installed)
if ! docker info &>/dev/null; then
  if $IS_DEBIAN; then
    info "Starting Docker daemon…"
    sudo systemctl start docker 2>/dev/null || true
    sleep 2
    docker info &>/dev/null || die "Docker daemon failed to start.  Run: sudo systemctl status docker"
  else
    die "Docker daemon is not running. Start it first."
  fi
fi

# Check user can reach Docker without sudo (docker group membership)
if ! docker info &>/dev/null 2>&1 && sudo docker info &>/dev/null 2>&1; then
  warn "Docker requires sudo. Add yourself to the docker group:"
  echo -e "    sudo usermod -aG docker $USER && newgrp docker"
  echo
fi

# Prefer Docker Compose v2 (plugin), fall back to v1 standalone
if docker compose version &>/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose &>/dev/null; then
  DC="docker-compose"
  warn "Using legacy docker-compose v1. Consider upgrading: https://docs.docker.com/compose/migrate/"
elif $IS_DEBIAN; then
  warn "Docker Compose not found."
  if ask_yn "  Install docker-compose-plugin now?"; then
    sudo apt-get install -y docker-compose-plugin
    DC="docker compose"
    ok "docker-compose-plugin installed."
  else
    die "Docker Compose is required.  →  https://docs.docker.com/compose/install/"
  fi
else
  die "Docker Compose not found.  →  https://docs.docker.com/compose/install/"
fi

ok "Docker $(docker --version | awk '{print $3}' | tr -d ,)  ·  Compose: $($DC version --short 2>/dev/null || echo 'v1')"

# ── update mode ────────────────────────────────────────────────
RUNNING=$(docker ps --filter name=automatarr-backend --format "{{.Names}}" 2>/dev/null || true)
if [[ -n "$RUNNING" ]]; then
  step "Update Mode"
  warn "Automatarr is already running."
  if ask_yn "  Rebuild images and restart with the same configuration?"; then
    # Delegate to update.sh which handles this cleanly
    exec bash "$SCRIPT_DIR/update.sh"
  fi
  echo
  info "Continuing with full install…"
fi

# ── .env setup ─────────────────────────────────────────────────
step ".env Configuration"

if [[ -f .env ]]; then
  warn ".env already exists."
  if ! ask_yn "  Reconfigure? (No = keep existing .env)"; then
    info "Keeping existing .env."
    # shellcheck disable=SC1091
    set -a; source .env 2>/dev/null || true; set +a
    _env_skip=true
  fi
fi

if [[ "${_env_skip:-false}" == "false" ]]; then
  echo "  Automatarr needs a few values. Press Enter to accept the default shown in [brackets]."
  echo

  # Auto-detect sensible defaults
  _tz_default=$(cat /etc/timezone 2>/dev/null \
    || timedatectl show -p Timezone --value 2>/dev/null \
    || ls -la /etc/localtime 2>/dev/null | awk -F'zoneinfo/' '{print $2}' \
    || echo "UTC")
  _puid_default=$(id -u)
  _pgid_default=$(id -g)

  # Generate a random secret key
  if command -v openssl &>/dev/null; then
    _secret_default=$(openssl rand -hex 32)
  else
    _secret_default=$(date +%s%N 2>/dev/null | sha256sum 2>/dev/null | head -c 64 || echo "change-me-$(date +%s)")
  fi

  echo -e "  ${BOLD}Timezone & Permissions${RESET}"
  TZ_VAL=$(ask_def "Timezone (TZ)" "$_tz_default")
  PUID_VAL=$(ask_def "User ID   (PUID)" "$_puid_default")
  PGID_VAL=$(ask_def "Group ID  (PGID)" "$_pgid_default")

  echo
  echo -e "  ${BOLD}Media Library Paths${RESET} ${DIM}(directories on the host machine)${RESET}"
  MOVIES_PATH=$(ask_def "Movies path" "/media/movies")
  SHOWS_PATH=$(ask_def "Shows path " "/media/shows")
  MUSIC_PATH=$(ask_def "Music path " "/media/music")
  BOOKS_PATH=$(ask_def "Books path " "/media/books")
  DOWNLOADS_PATH=$(ask_def "Downloads  " "/media/downloads")

  echo
  echo -e "  ${BOLD}Ports${RESET} ${DIM}(change if defaults conflict with other services)${RESET}"
  PORT_VAL=$(ask_def "Automatarr UI port" "7979")
  BACKEND_PORT_VAL=$(ask_def "Backend API port " "7980")

  echo
  ok "Generating .env…"

  cat > .env <<EOF
# ─────────────────────────────────────────────────────────────
#  Automatarr — Environment
#  Generated by install.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# ─────────────────────────────────────────────────────────────

PORT=${PORT_VAL}
BACKEND_PORT=${BACKEND_PORT_VAL}
SECRET_KEY=${_secret_default}

PUID=${PUID_VAL}
PGID=${PGID_VAL}
TZ=${TZ_VAL}

# ── Media paths (host machine) ─────────────────────────────
MOVIES_PATH=${MOVIES_PATH}
SHOWS_PATH=${SHOWS_PATH}
MUSIC_PATH=${MUSIC_PATH}
BOOKS_PATH=${BOOKS_PATH}
DOWNLOADS_PATH=${DOWNLOADS_PATH}

# ── Zurg + rclone (--profile zurg) ────────────────────────
ZURG_PORT=9999
RCLONE_CACHE_SIZE=10G

# ── Plex (--profile plex) ─────────────────────────────────
# Get a 4-minute claim token at: https://www.plex.tv/claim/
PLEX_CLAIM=

# ── Media servers ──────────────────────────────────────────
JELLYFIN_PORT=8096
EMBY_PORT=8920

# ── Indexers ───────────────────────────────────────────────
ZILEAN_PORT=8182

# ── Arr apps ───────────────────────────────────────────────
RADARR_PORT=7878
SONARR_PORT=8989
PROWLARR_PORT=9696
LIDARR_PORT=8686
READARR_PORT=8787
BAZARR_PORT=6767
OVERSEERR_PORT=5055
WHISPARR_PORT=6969
EOF

  ok ".env written."
fi

# Load env for directory creation and URL display
set -a; source .env 2>/dev/null || true; set +a

# ── media directories ──────────────────────────────────────────
step "Media Directories"

for dir in \
  "${MOVIES_PATH:-/media/movies}" \
  "${SHOWS_PATH:-/media/shows}" \
  "${MUSIC_PATH:-/media/music}" \
  "${BOOKS_PATH:-/media/books}" \
  "${DOWNLOADS_PATH:-/media/downloads}"; do
  mkdir -p "$dir" 2>/dev/null && ok "  $dir" || warn "  Could not create $dir (may need sudo)"
done

# ── profile selection ──────────────────────────────────────────
step "Service Profiles"

cat <<'PROFILES'
  Select which optional services to run alongside Automatarr.
  Enter profile names separated by spaces (or press Enter for core only).

  ┌─ Real-Debrid Mount ──────────────────────────────────────────
  │  zurg         Zurg + rclone  ← required for symlink mode
  │
  ├─ Media Servers (require zurg) ──────────────────────────────
  │  plex         Plex Media Server
  │  jellyfin     Jellyfin
  │
  ├─ Indexers ──────────────────────────────────────────────────
  │  zilean       Self-hosted DMM indexer (faster Torrentio alt)
  │
  ├─ *Arr Apps ─────────────────────────────────────────────────
  │  radarr       Radarr   (movies)
  │  sonarr       Sonarr   (TV shows)
  │  prowlarr     Prowlarr (indexer manager)
  │  lidarr       Lidarr   (music)
  │  readarr      Readarr  (books)
  │  bazarr       Bazarr   (subtitles)
  │  overseerr    Overseerr (media requests)
  │  whisparr     Whisparr (adult content)
  │  arrs         All arr apps at once
  └──────────────────────────────────────────────────────────────
PROFILES

echo -en "  ${BOLD}Profiles to enable${RESET}: "
read -r profile_input

# ── profile validation ─────────────────────────────────────────
SELECTED_PROFILES=()
for p in $profile_input; do
  SELECTED_PROFILES+=("$p")
done

_has_profile() { [[ " ${SELECTED_PROFILES[*]} " =~ " $1 " ]]; }

# plex/jellyfin require zurg for the mount
for media_srv in plex jellyfin; do
  if _has_profile "$media_srv" && ! _has_profile "zurg"; then
    warn "$media_srv requires the zurg profile for the rclone mount."
    if ask_yn "  Add zurg automatically?"; then
      SELECTED_PROFILES+=("zurg")
      ok "Added zurg profile."
    fi
  fi
done

PROFILE_FLAGS=""
for p in "${SELECTED_PROFILES[@]:-}"; do
  [[ -n "$p" ]] && PROFILE_FLAGS="$PROFILE_FLAGS --profile $p"
done

# ── zurg setup ─────────────────────────────────────────────────
if _has_profile "zurg"; then
  step "Zurg / Real-Debrid Setup"

  # rclone uses FUSE inside the container — the host needs /dev/fuse
  _ensure_fuse
  echo

  ZURG_CFG="$SCRIPT_DIR/zurg/config.yml"
  CURRENT_TOKEN=$(grep -E '^token:' "$ZURG_CFG" 2>/dev/null | awk '{print $2}' || echo "")

  if [[ "$CURRENT_TOKEN" == "YOUR_RD_API_KEY_HERE" || -z "$CURRENT_TOKEN" ]]; then
    echo "  Zurg needs your Real-Debrid API key to connect to your account."
    echo -e "  ${DIM}Get it at: https://real-debrid.com/apitoken${RESET}"
    echo
    RD_KEY=$(ask_secret "  Real-Debrid API key:")

    if [[ -n "$RD_KEY" ]]; then
      tmp=$(mktemp)
      sed "s/YOUR_RD_API_KEY_HERE/${RD_KEY}/" "$ZURG_CFG" > "$tmp"
      mv "$tmp" "$ZURG_CFG"
      ok "Zurg config updated with your API key."
    else
      warn "No key entered. Edit zurg/config.yml manually before starting."
    fi
  else
    ok "Zurg config already has an API key configured."
    if ask_yn "  Replace the existing key?"; then
      RD_KEY=$(ask_secret "  New Real-Debrid API key:")
      if [[ -n "$RD_KEY" ]]; then
        tmp=$(mktemp)
        sed "s/${CURRENT_TOKEN}/${RD_KEY}/" "$ZURG_CFG" > "$tmp"
        mv "$tmp" "$ZURG_CFG"
        ok "Zurg config updated."
      fi
    fi
  fi

  echo
  info "Checking rclone config…"
  RCLONE_CFG="$SCRIPT_DIR/rclone/rclone.conf"
  if [[ -f "$RCLONE_CFG" ]]; then
    ok "rclone.conf exists."
  else
    warn "rclone/rclone.conf not found. Creating default…"
    mkdir -p "$SCRIPT_DIR/rclone"
    cat > "$RCLONE_CFG" <<'RCONF'
[zurg]
type = webdav
url = http://zurg:9999/dav
vendor = other
pacer_min_sleep = 0
RCONF
    ok "rclone.conf created."
  fi
fi

# ── plex claim token ───────────────────────────────────────────
if _has_profile "plex"; then
  step "Plex Setup"
  CURRENT_CLAIM=$(grep -E '^PLEX_CLAIM=' .env 2>/dev/null | cut -d= -f2 || echo "")
  if [[ -z "$CURRENT_CLAIM" ]]; then
    echo "  Plex needs a claim token to link to your account on first run."
    echo -e "  ${DIM}Get one at: https://www.plex.tv/claim  (valid for 4 minutes)${RESET}"
    echo
    PLEX_CLAIM_VAL=$(ask_def "Plex claim token (or Enter to skip)" "")
    if [[ -n "$PLEX_CLAIM_VAL" ]]; then
      tmp=$(mktemp)
      sed "s/^PLEX_CLAIM=.*/PLEX_CLAIM=${PLEX_CLAIM_VAL}/" .env > "$tmp"
      mv "$tmp" .env
      ok "Plex claim token saved."
    else
      warn "No claim token — Plex won't link automatically. You can add it later."
    fi
  else
    ok "Plex claim token already set."
  fi
fi

# ── save profiles for future updates ──────────────────────────
echo "$PROFILE_FLAGS" > .install-profiles

# ── build ──────────────────────────────────────────────────────
step "Building Images"
info "This may take a few minutes on first run…"
echo
# shellcheck disable=SC2086
$DC $PROFILE_FLAGS build

# ── start ──────────────────────────────────────────────────────
step "Starting Services"
# shellcheck disable=SC2086
$DC $PROFILE_FLAGS up -d
echo

step "Health Check"
_wait_for_backend

step "Done!"
_show_url_summary "$PROFILE_FLAGS"

echo -e "  ${BOLD}Next steps:${RESET}"
echo "  1. Open the Automatarr UI at the address above"
echo "  2. Go to Settings → enter your Real-Debrid and TMDB API keys"
echo "  3. Set your media library paths and quality profile"
echo "  4. Add movies and shows!"
echo
echo -e "  ${DIM}To update in future, run:  ./update.sh${RESET}"
echo -e "  ${DIM}To uninstall, run:         ./uninstall.sh${RESET}"
echo
