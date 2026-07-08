# Media Servers

Automatarr integrates with Plex, Jellyfin, and Emby to trigger library scans after downloads complete. This ensures your media server picks up new content without requiring manual refreshes.

---

## Supported Media Servers

| Server | Integration |
|---|---|
| **Plex** | Partial library scan (specific path or full refresh) |
| **Jellyfin** | Full library refresh |
| **Emby** | Full library refresh |
| None | No integration — scan manually |

---

## Plex

### Setup

1. Find your Plex server URL:
   - Local: `http://localhost:32400` or `http://YOUR_HOST_IP:32400`
   - Behind reverse proxy: your domain URL

2. Get your Plex token:
   - Sign in at [app.plex.tv](https://app.plex.tv)
   - Open any media item → ⋮ → **Get Info** → **View XML**
   - The URL will contain `X-Plex-Token=YOURTOKEN`
   - Alternatively: [How to find your Plex token](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/)

3. Get your Library Keys:
   - Visit `http://YOUR_PLEX:32400/library/sections?X-Plex-Token=YOURTOKEN`
   - Find the `key` attribute for Movies and TV Shows libraries

4. In Automatarr **Settings → Media Server**:
   - **Media Server**: `plex`
   - **Plex URL**: your Plex URL
   - **Plex Token**: your X-Plex-Token
   - **Plex Movies Library**: library key for movies (e.g. `1`)
   - **Plex Shows Library**: library key for shows (e.g. `2`)

### Docker Setup

When running Plex via the `--profile plex` Docker profile:
- Plex runs in `network_mode: host` (required for GDM discovery)
- Access it at `http://YOUR_HOST_IP:32400/web` (not `localhost`)
- Set your Plex URL to `http://YOUR_HOST_IP:32400`
- Add media library paths:
  - Movies → `/movies` (maps to your `MOVIES_PATH`)
  - TV Shows → `/shows` (maps to your `SHOWS_PATH`)

### How Library Refresh Works

When a download completes:
- If a library key is configured: Automatarr calls `/library/sections/{key}/refresh?path={symlink_dir}` for a targeted scan
- If no key is configured: Automatarr refreshes all libraries

---

## Jellyfin

### Setup

1. Open your Jellyfin UI (usually `http://localhost:8096`)
2. Go to **Dashboard → Advanced → API Keys**
3. Click **+** to create a new API key (name it `Automatarr`)
4. Copy the key

5. In Automatarr **Settings → Media Server**:
   - **Media Server**: `jellyfin`
   - **Jellyfin URL**: `http://jellyfin:8096` (in Docker) or `http://localhost:8096`
   - **Jellyfin API Key**: paste the key you created

### Docker Setup

When running Jellyfin via `--profile jellyfin`:
- Inside Docker, use `http://jellyfin:8096` as the URL
- Add library paths in Jellyfin setup wizard:
  - Movies → `/data/movies`
  - Shows → `/data/shows`

### How Library Refresh Works

Automatarr calls Jellyfin's `/Library/Refresh` endpoint, which triggers a full library scan.

---

## Emby

Setup is identical to Jellyfin:

1. Go to Emby Dashboard → API Keys → Create key for `Automatarr`
2. In Automatarr **Settings → Media Server**:
   - **Media Server**: `emby`
   - **Emby URL**: your Emby URL
   - **Emby API Key**: paste the key

---

## Testing Your Connection

In **Settings**, after saving media server credentials, a **Test** button verifies connectivity:
- Plex: hits `/identity` endpoint
- Jellyfin/Emby: hits `/System/Info/Public` endpoint

A green checkmark means the connection succeeded.

---

## Troubleshooting

### Library not refreshing after download

1. Check that media server settings are saved correctly
2. Use the Test button to verify connectivity
3. Check backend logs: `docker compose logs backend --tail 50`
4. For Plex: verify the library key matches your movies/shows library

### Plex "Unauthorized"

The Plex token may be incorrect or expired. Re-fetch it from Plex's web UI.

### Jellyfin/Emby "Connection refused"

- Verify the URL is reachable from the Automatarr backend container
- In Docker: use service names (`http://jellyfin:8096`), not `localhost`
- Check Jellyfin/Emby is running: `docker compose logs jellyfin --tail 20`
