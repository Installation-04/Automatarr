# DEVELOPER.md

Developer reference for the Automatarr codebase — architecture, conventions, and workflows.

## What This Project Does

Automatarr is a self-hosted media automation system: it searches for movies and TV shows via TMDB, grabs torrents through Torrentio or Zilean indexers, adds them to Real-Debrid, creates symlinks into a local library, then triggers a Plex/Jellyfin/Emby scan. A scheduler runs all of this continuously in the background.

## Development Commands

### Backend (Python / FastAPI)

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API runs at `http://localhost:8000`. Interactive OpenAPI docs at `http://localhost:8000/docs`.

Type-check / sanity (no formal test suite):
```bash
cd backend
python -c "from app.main import app; print('OK')"
```

### Frontend (React / Vite)

```bash
cd frontend
npm run dev          # dev server on port 5174, proxies /api → localhost:8000
npm run build        # tsc + vite build → dist/
```

TypeScript check only (no eslint config present):
```bash
cd frontend
npx tsc --noEmit
```

### Docker (production)

```bash
cp .env.example .env          # fill in paths, TZ, secrets
docker-compose up -d          # core (backend + frontend)
docker-compose --profile zurg up -d          # + Zurg + rclone
docker-compose --profile zurg --profile plex up -d    # + Plex
docker-compose --profile zurg --profile jellyfin up -d  # + Jellyfin
```

Frontend is exposed on `$PORT` (default 3000). Backend on `$BACKEND_PORT` (default 8000).

## Architecture

### Two-process design

The app is a standard SPA + REST API split:

- **Frontend** (`frontend/`) — React 18 + Vite + TypeScript. All data fetching uses TanStack React Query with 15-second polling intervals. API calls are thin wrappers in `src/api/index.ts` over an Axios client (`src/api/client.ts`) that prefixes `/api`.
- **Backend** (`backend/`) — FastAPI with SQLAlchemy async ORM on SQLite (`data/automatarr.db`). On startup, `main.py` initialises the DB and starts three APScheduler jobs.

Vite in dev mode proxies `/api/*` to `localhost:8000`, so there's a single origin from the browser's perspective. In production, nginx (`frontend/nginx.conf`) handles the same proxy.

### Core automation loop

```
Scheduler (APScheduler)
  ├── _search_wanted()    every 30 min  → grabber.grab_movie() / grab_episode()
  ├── _monitor_downloads() every 5 min  → grabber.monitor_downloading()
  └── _refresh_upcoming()  every 6 hrs  → mark aired episodes as "wanted"
```

The key file is `backend/app/services/grabber.py`. Its flow:

1. Fetch streams from configured indexer (`_get_streams` → Torrentio or Zilean)
2. Score and pick best stream via `TorrentioClient.pick_best_stream()` against the item's quality profile (`4k | 1080p | 720p | any`)
3. Check Real-Debrid instant availability
4. Add magnet to RD (`RealDebridClient.add_and_select`)
5. If already cached on RD → finalize immediately; otherwise wait for `_monitor_downloads` to see `status == "downloaded"`
6. Finalization: create a symlink from the rclone/Zurg mount into the library path (`symlink.py`), then call `media_server.refresh_media_server()`

### Settings

All configuration is stored in the `settings` table as key-value rows. `settings_service.py` holds ~120 keys with defaults (no migration needed — defaults are applied at read time via `get_all_settings()`). API keys, URLs, and enabled flags for all 23 DUMB services live here under `app_<service>_url` / `app_<service>_enabled` keys.

### Status state machine

Movies and episodes share the same status progression:
```
wanted → searching → downloading → downloaded
                                 ↘ error
```
Episodes start at `missing` until their air date passes (handled by `_refresh_upcoming`), then become `wanted`.

### Data models

- `Movie` — flat record; holds `rd_torrent_id`, `symlink_path`, `status`
- `Show / Season / Episode` — hierarchical; episodes have independent `status`, `quality_profile`, and `monitor` flags
- `Download` — a queue record mirroring each RD torrent add
- `ActivityLog` — immutable event log (grab / download / error)
- `Setting` — simple key/value config store

### Frontend conventions

- Pages live in `src/pages/`, shared components in `src/components/ui/` and `src/components/media/`
- Every page uses `useQuery` for reads and `useMutation` + `qc.invalidateQueries` for writes
- UI uses inline `style` props for the synthwave theme (hot pink `#ff006e`, cyan `#00f5ff`, purple `#b14fff`, bg `#07001a`) rather than Tailwind color utilities — Tailwind is used only for layout/spacing
- Fonts loaded from Google Fonts in `index.html`: Orbitron (headings), Exo 2 (body), Share Tech Mono (mono)

## Key Integration Points

| Service | Config key prefix | Default |
|---|---|---|
| Real-Debrid | `rd_*` | mount at `/mnt/zurg/torrents` |
| TMDB | `tmdb_api_key` | required for search |
| Torrentio | `torrentio_url`, `torrentio_opts` | `https://torrentio.strem.fun` |
| Zilean | `zilean_url` | `http://zilean:8182` |
| Media server | `media_server` (`plex`/`jellyfin`/`emby`/`none`) | `none` |
| Notifications | `discord_webhook`, `telegram_*`, `webhook_url` | all empty |

Adding a new DUMB service: add `app_<name>_url` + `app_<name>_enabled` to `DEFAULTS` in `settings_service.py`, add a card in `frontend/src/pages/Apps.tsx`, and add settings fields in the Settings page Apps tab.
