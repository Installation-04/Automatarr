# Updating

Use `update.sh` to update Automatarr to the latest version with a single command.

---

## Quick Update

```bash
cd automatarr
./update.sh
```

This will:
1. Pull the latest code from `main` with `git pull`
2. Rebuild Docker images (`docker compose build --pull`)
3. Restart containers with `docker compose up -d --remove-orphans`
4. Wait for the backend to become healthy
5. Print the URL

---

## What Gets Updated

| Component | How it's updated |
|---|---|
| Frontend (React) | Rebuilt as Docker image |
| Backend (FastAPI) | Rebuilt as Docker image |
| Database schema | Auto-migrated on startup (no manual migration needed) |
| Settings | Preserved — stored in the database volume |
| `.env` | **Not touched** — your environment variables are safe |
| Companion app images (Plex, Jellyfin, etc.) | Pulled from their registries during `build --pull` |

---

## Manual Update

If you prefer to do it step by step:

```bash
cd automatarr

# 1. Pull latest code
git pull origin main

# 2. Rebuild images (--pull fetches latest base images too)
docker compose build --pull

# 3. Restart with the same profiles you used during install
docker compose --profile zurg --profile jellyfin up -d --remove-orphans

# 4. Verify health
curl -s http://localhost:7980/api/system/health
```

---

## Keeping Your Profiles

`update.sh` re-uses whichever profiles are currently running. It detects this by inspecting which containers are active.

If you started with custom profiles:
```bash
docker compose --profile zurg --profile arrs up -d --remove-orphans
```

---

## Updating the Database

The backend runs SQLAlchemy with `create_all` on startup — new tables and columns are added automatically. Existing data is never deleted during updates.

If a future version requires destructive schema changes, release notes will include manual migration instructions.

---

## Downgrading

To roll back to a specific version:

```bash
git fetch --tags
git checkout v1.2.3    # replace with the desired tag/commit
docker compose build
docker compose up -d
```

---

## Checking the Current Version

```bash
git log --oneline -5
```

Or visit `http://localhost:7980/api/system/health` — the response includes version info if configured.

---

## Auto-Updates

Automatarr does not have built-in auto-update functionality. For automatic updates, you can use a cron job:

```cron
0 3 * * 0  cd /opt/automatarr && ./update.sh >> /var/log/automatarr-update.log 2>&1
```

This runs `update.sh` every Sunday at 3 AM.

> **Warning**: Auto-updates can occasionally introduce breaking changes. Review release notes before automating.
