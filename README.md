# Automatarr

Fully automated media management with Real-Debrid. Searches, grabs, and organizes your movies and TV shows automatically — then notifies Plex, Jellyfin, or Emby to scan.

## Quick Start

```bash
cp .env.example .env
# Edit .env with your paths and TZ
```

### Choose your stack

| Want | Command |
|---|---|
| Automatarr only | `docker-compose up -d` |
| + Zurg/rclone (symlink mode) | `docker-compose --profile zurg up -d` |
| + Zurg + Plex | `docker-compose --profile zurg --profile plex up -d` |
| + Zurg + Jellyfin | `docker-compose --profile zurg --profile jellyfin up -d` |

Open **http://localhost:3000** → **Settings** to configure.

## Required Setup

### 1. TMDB API Key
Get a free key at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api). Needed for searching movie/show metadata.

### 2. Real-Debrid API Key
Get yours at [real-debrid.com/apitoken](https://real-debrid.com/apitoken).

### 3. Zurg (Real-Debrid mount)

Edit [`zurg/config.yml`](zurg/config.yml) — replace `YOUR_RD_API_KEY_HERE` with your Real-Debrid API token.
The `rclone/rclone.conf` is pre-configured to talk to Zurg automatically — no changes needed there.

### 4. Plex first-run

Get a **claim token** at [plex.tv/claim](https://www.plex.tv/claim) (expires in 4 minutes) and set `PLEX_CLAIM=` in your `.env` before the first start. After linking you can remove it.

Plex runs on host network mode (required for GDM discovery), so it's at `http://YOUR_HOST_IP:32400/web`.

Add these library paths inside Plex:
- Movies → `/movies`
- TV Shows → `/shows`

### 5. Jellyfin first-run

Jellyfin UI is at `http://localhost:8096`. During setup add:
- Movies library → `/data/movies`
- Shows library → `/data/shows`

Get your API key at **Dashboard → Advanced → API Keys**, then paste it in Automatarr Settings → Media Server.

### 6. Symlink Mode (Recommended)

Automatarr creates **symlinks** from your library to your rclone/Zurg mount. This means zero disk usage — your media server streams directly from Real-Debrid via the mount.

**Setup:**
1. Install [Zurg](https://github.com/debridmediamanager/zurg-testing) to expose your RD files
2. Mount with rclone: `rclone mount zurg: /mnt/zurg --allow-other --cache-dir /tmp/rclone`
3. Set mount path in Settings → Real-Debrid → `/mnt/zurg/torrents`
4. Set library paths: `/media/movies` and `/media/shows`
5. Configure your media server to scan those library paths

**docker-compose volumes:**
```yaml
volumes:
  - /media/movies:/media/movies
  - /media/shows:/media/shows
  - /mnt/zurg:/mnt/zurg:ro
```

## Features

- **Movies & TV Shows** — add, monitor, and auto-download
- **Real-Debrid integration** — instant availability check, torrent caching
- **Symlink or direct download** mode
- **Torrentio** indexer (no setup needed) + optional Jackett/Prowlarr
- **Quality profiles** — 4K, 1080p, 720p, or Any
- **Calendar view** — see upcoming episodes
- **Activity log** — full history of grabs and downloads
- **Plex / Jellyfin / Emby** library refresh after download
- **Notifications** — Discord, Telegram, custom webhook
- **Scheduler** — fully automatic background searching

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Web UI port |
| `BACKEND_PORT` | `8000` | API port |
| `MOVIES_PATH` | `/media/movies` | Movies library on host |
| `SHOWS_PATH` | `/media/shows` | Shows library on host |
| `ZURG_MOUNT_PATH` | `/mnt/zurg` | rclone mount on host |

## API

The backend runs at `:8000/api`. Interactive docs at `http://localhost:8000/docs`.
