# Security

Automatarr is designed for trusted local/LAN environments. This page covers the security model, hardening options, and known limitations.

---

## Security Model

Automatarr's API has **no built-in authentication**. It is intended to run:
- On your local machine (accessible only via `localhost`)
- On your LAN (accessible only within your home network)
- Behind a reverse proxy with authentication (when internet-accessible)

**Do not expose Automatarr directly to the internet without a protecting proxy.**

---

## Network Hardening

### Bind to localhost only

To prevent LAN access, bind Docker ports to `127.0.0.1`:

In `.env`:
```dotenv
PORT=7979
BACKEND_PORT=7980
```

In `docker-compose.yml`, change:
```yaml
ports:
  - "7979:80"
```
to:
```yaml
ports:
  - "127.0.0.1:7979:80"
```

### Reverse Proxy with Authentication

For internet access, add authentication at the proxy level:

**Nginx with basic auth:**
```nginx
location / {
    auth_basic "Automatarr";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://localhost:7979;
}
```

**Traefik with middleware** (configured via labels or dynamic config).

### CORS

When running behind a reverse proxy, restrict CORS to your domain:

```dotenv
CORS_ORIGINS=https://automatarr.yourdomain.com
```

Leaving `CORS_ORIGINS` blank allows all origins — acceptable for local installs.

---

## SSRF Protection

The `/api/system/probe` endpoint (used by onboarding to test service URLs) blocks requests to:
- `localhost` and `127.x.x.x`
- IPv6 loopback (`::1`)
- Link-local addresses (`169.254.x.x`, `fe80::/10`)

This prevents SSRF attacks where a malicious request could access services on the host machine. Docker service hostnames (e.g. `zurg`, `jellyfin`) are allowed since they resolve to container IP addresses.

---

## Path Traversal Protection

In symlink mode, torrent names from the indexer are sanitized before being used as filesystem paths:
- Removes characters illegal on Linux/Windows filesystems: `< > : " / \ | ? *`
- Removes control characters (`\x00`–`\x1f`)
- Removes `..` sequences
- Strips leading/trailing dots and spaces

After sanitization, the resolved path is validated to remain within the configured mount path. Any path that would escape the mount root is rejected.

---

## API Keys

All API keys (Real-Debrid, TMDB, Plex, Jellyfin, etc.) are stored in the SQLite database in the `settings` table as plaintext. They are:
- Never logged
- Never included in API responses (except when specifically requested via the settings endpoint by an authenticated UI session)

**Recommendation**: If you expose Automatarr externally, use a reverse proxy with authentication to prevent unauthorized access to the settings page.

---

## `SECRET_KEY`

The `SECRET_KEY` environment variable is used for session integrity. Generate a strong value:

```bash
openssl rand -hex 32
```

The `install.sh` script generates this automatically. Do not use the default placeholder (`changeme-in-production`) in production.

---

## Database

Automatarr uses SQLite stored at `./data/automatarr.db` (inside Docker: `/app/data/automatarr.db`). The `data/` directory is mounted as a volume.

**Backup:**
```bash
cp data/automatarr.db data/automatarr.db.bak
```

**Protect it:**
```bash
chmod 600 data/automatarr.db
```

---

## Docker Security

- Containers run as `PUID`/`PGID` (set in `.env`) — not as root
- rclone requires `SYS_ADMIN` capability and `apparmor:unconfined` for FUSE mounts — this is a known requirement for all FUSE-based Docker mounts
- No containers expose privileged mode beyond what's listed in `docker-compose.yml`

---

## Known Limitations

| Limitation | Notes |
|---|---|
| No built-in auth | Use a reverse proxy with auth for internet access |
| Settings stored as plaintext | Standard for self-hosted apps; protect via network access control |
| Wildcard CORS by default | Acceptable for local-only installs; restrict via `CORS_ORIGINS` for internet-facing deployments |
| rclone requires `SYS_ADMIN` | Unavoidable for FUSE mounts; standard practice |
