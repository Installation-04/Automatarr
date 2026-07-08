# Installation

Automatarr runs as a set of Docker containers managed with Docker Compose. A guided installer script (`install.sh`) handles all setup steps automatically.

---

## Requirements

- **Docker** 24+ and **Docker Compose** v2 (plugin form: `docker compose`)
- **Git**
- A **Real-Debrid** subscription
- A free **TMDB API key**

### Debian / Ubuntu one-liner prerequisites

```bash
sudo apt-get update && sudo apt-get install -y git fuse3
```

> `fuse3` is required on Debian Bookworm/Trixie for rclone FUSE mounts. The installer checks for it automatically.

---

## Option A — Guided Installer (Recommended)

```bash
git clone https://github.com/installation-04/automatarr.git
cd automatarr
./install.sh
```

The installer will:
1. Check for Docker, Docker Compose, fuse3, and the fuse kernel module
2. Prompt you for media library paths, timezone, and port preferences
3. Generate a `.env` file with a random `SECRET_KEY`
4. Ask which optional profiles to enable (Zurg, Plex, Jellyfin, Zilean, arr apps)
5. Start all selected containers
6. Wait for the backend to become healthy
7. Print the URL to open in your browser

---

## Option B — Manual Setup

### 1. Clone the repo

```bash
git clone https://github.com/installation-04/automatarr.git
cd automatarr
```

### 2. Copy and edit `.env`

```bash
cp .env.example .env
```

Edit `.env`:

```dotenv
PORT=7979             # Automatarr UI port
BACKEND_PORT=7980     # API port
MOVIES_PATH=/media/movies
SHOWS_PATH=/media/shows
TZ=America/New_York
PUID=1000
PGID=1000
SECRET_KEY=$(openssl rand -hex 32)
```

### 3. Start core services

```bash
docker compose up -d
```

### 4. Add optional profiles

```bash
# Zurg + rclone (required for symlink mode)
docker compose --profile zurg up -d

# Jellyfin
docker compose --profile zurg --profile jellyfin up -d

# Plex
docker compose --profile zurg --profile plex up -d

# All *Arr apps
docker compose --profile zurg --profile arrs up -d

# Full stack example
docker compose --profile zurg --profile jellyfin --profile zilean --profile arrs up -d
```

---

## Available Profiles

| Profile | Services included |
|---|---|
| `zurg` | Zurg + rclone (FUSE mount for symlink mode) |
| `plex` | Plex Media Server |
| `jellyfin` | Jellyfin |
| `zilean` | Zilean (self-hosted DMM indexer) |
| `radarr` | Radarr |
| `sonarr` | Sonarr |
| `prowlarr` | Prowlarr |
| `lidarr` | Lidarr |
| `readarr` | Readarr |
| `bazarr` | Bazarr |
| `overseerr` | Overseerr |
| `whisparr` | Whisparr |
| `arrs` | All arr apps at once |

---

## Post-Install

1. Open **http://localhost:7979** (or your configured port)
2. Complete the **Onboarding** wizard:
   - Enter your TMDB API key
   - Enter your Real-Debrid API key
   - Set library paths
   - Connect a media server
3. Start adding movies and shows

See [Configuration](Configuration) for the full settings reference.

---

## Bare-Metal (Without Docker)

> Not officially supported, but possible for development.

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
DATABASE_URL=sqlite+aiosqlite:///./data/automatarr.db uvicorn app.main:app --host 0.0.0.0 --port 7980
```

### Frontend

```bash
cd frontend
npm install
npm run build   # static files served by nginx in Docker
# or for dev:
VITE_API_URL=http://localhost:7980 npm run dev
```

---

## Updating

See [Updating](Updating).
