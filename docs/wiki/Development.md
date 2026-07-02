# Development

Guide for contributors and developers working on Automatarr.

---

## Architecture Overview

```
automatarr/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── main.py       # App factory, CORS, startup
│   │   ├── database.py   # SQLAlchemy async engine
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── routers/      # FastAPI route handlers
│   │   └── services/     # Business logic
│   └── requirements.txt
├── frontend/             # React 18 + Vite + TanStack Query
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page-level components
│   │   ├── api/          # API client functions
│   │   └── types/        # TypeScript interfaces
│   └── package.json
├── docker-compose.yml
├── install.sh
└── update.sh
```

---

## Tech Stack

### Backend

| Library | Purpose |
|---|---|
| **FastAPI** | REST API framework |
| **SQLAlchemy** (async) | ORM + database access |
| **aiosqlite** | Async SQLite driver |
| **APScheduler** | Background job scheduling |
| **httpx** | Async HTTP client |
| **uvicorn** | ASGI server |

### Frontend

| Library | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite** | Build tool |
| **TanStack Query v5** | Data fetching and caching |
| **React Router** | Client-side routing |
| **TypeScript** | Type safety |

---

## Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL=sqlite+aiosqlite:///./data/automatarr.db
export SECRET_KEY=dev-secret-key

# Run with hot reload
uvicorn app.main:app --host 0.0.0.0 --port 7980 --reload
```

API is available at `http://localhost:7980`
Swagger docs: `http://localhost:7980/docs`

### Frontend

```bash
cd frontend
npm install

# Point to your backend
export VITE_API_URL=http://localhost:7980

npm run dev
```

Frontend dev server: `http://localhost:5173`

---

## Project Structure Details

### Backend Services

| Service | File | Purpose |
|---|---|---|
| **grabber** | `services/grabber.py` | Orchestrates search → RD grab → symlink |
| **tmdb** | `services/tmdb.py` | TMDB API client |
| **torrentio** | `services/torrentio.py` | Torrentio indexer client |
| **zilean** | `services/zilean.py` | Zilean indexer client |
| **symlink** | `services/symlink.py` | Filesystem symlink creation |
| **media_server** | `services/media_server.py` | Plex/Jellyfin/Emby refresh |
| **scheduler** | `services/scheduler.py` | APScheduler jobs |
| **settings_service** | `services/settings_service.py` | Settings CRUD with defaults |
| **notifications** | `services/notifications.py` | Discord/Telegram/webhook |

### Scheduler Jobs

Three recurring jobs run via APScheduler:

| Job | Default interval | What it does |
|---|---|---|
| `_search_wanted` | Every 30 min | Searches and grabs wanted movies/episodes |
| `_monitor_downloads` | Every 5 min | Polls RD for download progress |
| `_refresh_upcoming` | Every 6 hours | Marks aired `missing` episodes as `wanted` |

All jobs have `max_instances=1, coalesce=True` to prevent concurrent runs.

### Database Models

- `Movie` — `app/models/movie.py`
- `Show`, `Season`, `Episode` — `app/models/show.py`
- `Download` — `app/models/download.py`
- `ActivityLog` — `app/models/activity_log.py`
- `Setting` — `app/models/settings.py`

All models use `create_all` on startup — no migration tool is used.

---

## Running Tests

```bash
cd backend
pytest
```

Tests are in `backend/tests/`. The test suite covers:
- Symlink path sanitization
- Settings service CRUD
- Grabber logic (with mocked RD/indexer responses)
- Router endpoints (via FastAPI `TestClient`)

---

## Docker Build

```bash
# Build images locally
docker compose build

# Build with fresh base images
docker compose build --pull

# Build a specific service
docker compose build backend
```

---

## Adding a New Setting

1. Add the key and default to `DEFAULTS` in `backend/app/services/settings_service.py`
2. Add the UI control in `frontend/src/pages/Settings.tsx`
3. Use the setting in the backend via `await get_setting(db, "my_key")` or via `get_all_settings(db)`

---

## Adding a New Router

1. Create `backend/app/routers/my_feature.py` with a `router = APIRouter(prefix="/api/my-feature")`
2. Register it in `backend/app/main.py`:
   ```python
   from app.routers import my_feature
   app.include_router(my_feature.router)
   ```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run tests: `cd backend && pytest`
5. Open a pull request against `main`

### Commit Style

Use conventional commits:
- `feat:` new feature
- `fix:` bug fix
- `chore:` tooling, deps, config
- `docs:` documentation
- `refactor:` code restructure without behavior change

---

## DEVELOPER.md

For internal codebase notes (key invariants, architecture decisions), see `DEVELOPER.md` in the repository root.
