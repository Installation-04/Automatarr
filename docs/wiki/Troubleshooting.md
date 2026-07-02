# Troubleshooting

Common issues and how to fix them.

---

## Checking Logs

Always start by checking container logs:

```bash
# All services
docker compose logs --tail 50

# Backend only (most relevant)
docker compose logs backend --tail 100

# Follow logs live
docker compose logs -f backend

# rclone (symlink issues)
docker compose logs rclone-zurg --tail 50

# Zurg
docker compose logs zurg --tail 50
```

---

## UI / Frontend Issues

### Cannot access http://localhost:7979

1. Check containers are running:
   ```bash
   docker compose ps
   ```
2. Verify the frontend container shows "running" — not "exited"
3. Check if a different port is actually in use:
   ```bash
   grep PORT .env
   ```
4. Try the backend directly: `http://localhost:7980/api/system/health` — if that works, it's a frontend-only issue

### Blank page or "Cannot connect to API"

The frontend can't reach the backend. Common causes:
- Backend container crashed (check `docker compose logs backend`)
- Backend is still starting up (wait 10–15 seconds and refresh)
- CORS misconfiguration if behind a reverse proxy

---

## Backend Issues

### Backend won't start

```bash
docker compose logs backend --tail 50
```

Common errors:
- `DATABASE_URL not set` — check your `.env` file has `DATABASE_URL=sqlite+aiosqlite:///./data/automatarr.db`
- `Permission denied` on `/app/data` — check `PUID`/`PGID` match your user
- Port conflict — check if port 7980 is already in use: `ss -tlnp | grep 7980`

### "Internal Server Error" on all API requests

The database may be locked or corrupted. Check:
```bash
docker compose logs backend | grep -i "error\|exception"
```

If the database is locked by a previous unclean shutdown:
```bash
# Stop backend
docker compose stop backend

# Remove the lock file (if it exists)
ls data/automatarr.db-wal data/automatarr.db-shm
rm -f data/automatarr.db-wal data/automatarr.db-shm

# Restart
docker compose start backend
```

---

## Real-Debrid Issues

### "RD API key invalid" or 401 errors

1. Go to [real-debrid.com/apitoken](https://real-debrid.com/apitoken) and generate a new token
2. Update **Settings → Real-Debrid → API Key**

### Movies/episodes stuck in `wanted` forever

1. Verify your RD API key is valid
2. Check the indexer is reachable (Settings → Indexers → Test)
3. Check backend logs for indexer errors
4. Some content simply isn't cached on RD — try a different quality profile or wait

### Symlinks created but files not accessible

The rclone mount may have an issue. Check:
```bash
# Is the mount alive?
ls /mnt/zurg/torrents/ | head -5

# Or inside the container:
docker compose exec backend ls /mnt/zurg/torrents/ | head -5
```

If empty or errors:
```bash
docker compose logs rclone-zurg --tail 50
```

A common fix is restarting rclone:
```bash
docker compose restart rclone-zurg
```

---

## Zurg / rclone Issues

### rclone container keeps restarting

1. Check logs: `docker compose logs rclone-zurg --tail 30`
2. Ensure `/dev/fuse` is available: `ls -la /dev/fuse`
3. On Debian Bookworm/Trixie, ensure `fuse3` is installed:
   ```bash
   sudo apt-get install -y fuse3
   sudo modprobe fuse
   ```
4. The `apparmor:unconfined` security option in `docker-compose.yml` is required on Debian — do not remove it

### Zurg not connecting to Real-Debrid

1. Check your RD API key in `zurg/config.yml`:
   ```bash
   cat zurg/config.yml | grep token
   ```
2. Ensure the token matches your RD API token
3. Check Zurg logs: `docker compose logs zurg --tail 30`

---

## Media Server Issues

### Library not refreshing after download

1. Go to **Settings → Media Server** and click **Test**
2. If test fails, check the URL and token/API key
3. Check backend logs: `docker compose logs backend | grep -i "plex\|jellyfin\|emby"`
4. In Docker, use service names (`http://jellyfin:8096`), not `localhost`

### Plex: "Unauthorized" when testing

The Plex token has expired or is incorrect. Get a fresh token from:
- Plex Web → any item → ⋮ → Get Info → View XML → find `X-Plex-Token` in the URL

---

## Notification Issues

### Discord webhook not working

Test it manually:
```bash
curl -H "Content-Type: application/json" \
  -d '{"content":"Test"}' \
  YOUR_WEBHOOK_URL
```
If this fails, the webhook URL is invalid — recreate it in Discord.

### Telegram not sending

1. Verify the bot token format: `123456789:ABCdef...`
2. Verify the chat ID (negative for groups)
3. Make sure you've started the bot (send `/start` to it)
4. Test with: `https://api.telegram.org/bot<TOKEN>/getUpdates` — look for your `chat.id`

---

## Performance Issues

### UI loads slowly

The frontend is a static build served by Nginx — it should be instant. If slow:
- The backend API may be under load
- Check if the database is large: `ls -lh data/automatarr.db`
- Restart the backend: `docker compose restart backend`

### Scheduler not running

Check the scheduler started correctly:
```bash
docker compose logs backend | grep -i "scheduler\|job"
```

If the RD API key is missing, the scheduler skips all work. Ensure **Settings → Real-Debrid → API Key** is set.

---

## Getting More Help

If your issue isn't listed here:

1. Search [existing GitHub issues](https://github.com/installation-04/automatarr/issues)
2. Open a new issue with:
   - Your OS and Docker version (`docker --version`, `docker compose version`)
   - Relevant log output (`docker compose logs backend --tail 100`)
   - Steps to reproduce
