# Configuration

All configuration is done through the **Settings** page in the UI (http://localhost:7979/settings) or directly via the `.env` file for Docker-level options.

---

## Environment Variables (`.env`)

These control Docker networking and paths — set them before starting containers. Copy `.env.example` to `.env` and fill in your values.

### Core

| Variable | Default | Description |
|---|---|---|
| `PORT` | `7979` | Host port for the Automatarr web UI |
| `BACKEND_PORT` | `7980` | Host port for the backend API |
| `SECRET_KEY` | *(required)* | Random hex string for session security. Generate with `openssl rand -hex 32` |
| `CORS_ORIGINS` | *(empty = allow all)* | Comma-separated list of allowed origins for the API. Set to your domain when behind a reverse proxy: `https://automatarr.example.com` |

### System

| Variable | Default | Description |
|---|---|---|
| `PUID` | `1000` | User ID to run containers as. Get yours with `id -u` |
| `PGID` | `1000` | Group ID. Get yours with `id -g` |
| `TZ` | `America/New_York` | IANA timezone. See [full list](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) |

### Media Paths

| Variable | Default | Description |
|---|---|---|
| `MOVIES_PATH` | `/media/movies` | Host path where movie symlinks/files go |
| `SHOWS_PATH` | `/media/shows` | Host path where TV show symlinks/files go |
| `MUSIC_PATH` | `/media/music` | Used with `--profile lidarr` |
| `BOOKS_PATH` | `/media/books` | Used with `--profile readarr` |
| `DOWNLOADS_PATH` | `/media/downloads` | Used by arr apps |

### Zurg / rclone

| Variable | Default | Description |
|---|---|---|
| `ZURG_PORT` | `9999` | Host port for Zurg WebDAV |
| `RCLONE_CACHE_SIZE` | `10G` | rclone VFS cache size |

### Media Servers

| Variable | Default | Description |
|---|---|---|
| `PLEX_CLAIM` | *(empty)* | [Plex claim token](https://www.plex.tv/claim/) — only needed on first run |
| `JELLYFIN_PORT` | `8096` | Host port for Jellyfin |

### *Arr Apps

| Variable | Default |
|---|---|
| `RADARR_PORT` | `7878` |
| `SONARR_PORT` | `8989` |
| `PROWLARR_PORT` | `9696` |
| `LIDARR_PORT` | `8686` |
| `READARR_PORT` | `8787` |
| `BAZARR_PORT` | `6767` |
| `OVERSEERR_PORT` | `5055` |
| `WHISPARR_PORT` | `6969` |
| `ZILEAN_PORT` | `8182` |

---

## In-App Settings

These are stored in the database and editable via **Settings** in the UI. They survive container restarts and updates.

### Real-Debrid

| Setting | Description |
|---|---|
| **RD API Key** | Your Real-Debrid API token. Get it at [real-debrid.com/apitoken](https://real-debrid.com/apitoken) |
| **Mount Path** | Path inside the container where Zurg/rclone mounts your RD library. Default: `/mnt/zurg/torrents` |
| **Download Mode** | `symlink` (default, zero-disk-usage) or `download` (copies files locally) |

### TMDB

| Setting | Description |
|---|---|
| **TMDB API Key** | Free API key from [themoviedb.org](https://www.themoviedb.org/settings/api). Required for all metadata. |

### Library Paths

| Setting | Default | Description |
|---|---|---|
| **Movies Path** | `/media/movies` | Where movie symlinks are created |
| **Shows Path** | `/media/shows` | Where TV show symlinks are created |

### Quality

| Setting | Default | Description |
|---|---|---|
| **Default Quality** | `1080p` | Quality profile for newly added media |
| **Quality Order** | `4k,1080p,720p,any` | Preference order when multiple results exist |

Available quality profiles: `4k`, `1080p`, `720p`, `any`

### Indexers

| Setting | Default | Description |
|---|---|---|
| **Indexer** | `torrentio` | Which indexer to use: `torrentio`, `zilean`, or `both` |
| **Torrentio URL** | `https://torrentio.strem.fun` | Public Torrentio endpoint |
| **Torrentio Options** | *(empty)* | Extra query params (e.g. `providers=yts`) |
| **Zilean URL** | `http://zilean:8182` | URL for self-hosted Zilean instance |
| **Use Jackett** | `false` | Enable Jackett as an additional indexer |
| **Jackett URL** | *(empty)* | Jackett base URL |
| **Jackett API Key** | *(empty)* | Jackett API key |

### Media Server

| Setting | Description |
|---|---|
| **Media Server** | `none`, `plex`, `jellyfin`, or `emby` |
| **Plex URL** | e.g. `http://plex:32400` |
| **Plex Token** | Your Plex auth token |
| **Plex Movies Library** | Library key for movies (found in Plex admin) |
| **Plex Shows Library** | Library key for TV shows |
| **Jellyfin URL** | e.g. `http://jellyfin:8096` |
| **Jellyfin API Key** | From Jellyfin Dashboard → API Keys |
| **Emby URL** | e.g. `http://emby:8096` |
| **Emby API Key** | From Emby Dashboard → API Keys |

### Notifications

| Setting | Description |
|---|---|
| **Discord Webhook** | Discord webhook URL |
| **Telegram Bot Token** | Telegram bot token |
| **Telegram Chat ID** | Telegram chat/channel ID |
| **Webhook URL** | Generic HTTP POST webhook |
| **Notify on Grab** | Send notification when a torrent is grabbed |
| **Notify on Download** | Send notification when download completes |
| **Notify on Error** | Send notification on grab/download error |

### Scheduler

| Setting | Default | Description |
|---|---|---|
| **Search Interval** | `30` minutes | How often to search for wanted media |
| **Monitor Interval** | `5` minutes | How often to check download progress |
| **Refresh Interval** | `6` hours | How often to mark aired episodes as wanted |

### Companion Apps

Each app in the [Apps Dashboard](Apps-Dashboard) has two settings:
- `app_<name>_url` — Base URL of the app
- `app_<name>_enabled` — `true`/`false` to show/hide in the dashboard

---

## Reverse Proxy

When running behind Nginx or Traefik, set `CORS_ORIGINS` in `.env`:

```dotenv
CORS_ORIGINS=https://automatarr.yourdomain.com
```

Then proxy traffic to port `7979` (UI) and `7980` (API).

### Nginx example

```nginx
server {
    listen 443 ssl;
    server_name automatarr.yourdomain.com;

    location / {
        proxy_pass http://localhost:7979;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:7980;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
