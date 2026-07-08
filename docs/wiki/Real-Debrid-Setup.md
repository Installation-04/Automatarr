# Real-Debrid Setup

Real-Debrid is a premium link-hosting service that caches torrents on its servers. Automatarr uses it to deliver instant, zero-wait media — no actual torrenting happens on your machine.

---

## How It Works

1. Automatarr searches Torrentio (or Zilean) for a matching torrent
2. It checks if Real-Debrid has already cached that torrent hash
3. If cached → it's instantly available; RD "downloads" it in seconds
4. Automatarr either creates a **symlink** pointing into your rclone/Zurg mount, or **downloads** the file directly
5. Your media server reads the file (or follows the symlink to RD's CDN)

---

## Getting Your API Key

1. Log in at [real-debrid.com](https://real-debrid.com)
2. Go to **Account → API** or visit [real-debrid.com/apitoken](https://real-debrid.com/apitoken) directly
3. Copy the token
4. Paste it into **Settings → Real-Debrid → API Key** in Automatarr

---

## Download Modes

### Symlink Mode (Recommended)

Automatarr creates a symbolic link from your media library (`/media/movies/...`) to the corresponding file in your rclone/Zurg mount (`/mnt/zurg/torrents/...`).

**Advantages:**
- Zero disk usage — the file lives on Real-Debrid's CDN
- Instant: no waiting for a download to complete
- Plex/Jellyfin stream directly from RD via the FUSE mount

**Requirements:**
- Zurg running and mounted via rclone (`--profile zurg`)
- Mount path set correctly (see below)

**How symlinks look on disk:**
```
/media/movies/
  Inception (2010)/
    Inception (2010) [1080p].mkv -> /mnt/zurg/torrents/Inception.2010.1080p.BluRay.mkv
```

### Direct Download Mode

Automatarr unrestricts the RD link and downloads the actual file to your media library path.

**Use when:**
- You don't want to run Zurg/rclone
- You prefer local copies

**Note:** Files count against your local disk space. Downloads can take time depending on file size.

---

## Zurg Setup

Zurg exposes your Real-Debrid library as a WebDAV server, which rclone mounts as a filesystem.

### 1. Edit `zurg/config.yml`

```yaml
# zurg/config.yml
token: YOUR_RD_API_KEY_HERE    # ← replace this
```

The rest of the config works out of the box.

### 2. Start with the zurg profile

```bash
docker compose --profile zurg up -d
```

### 3. Verify the mount

```bash
# Check that the WebDAV is accessible
curl -s http://localhost:9999/dav | head -5

# Check that rclone has mounted it
ls /mnt/zurg/torrents/
```

### 4. Set the mount path in Automatarr

In **Settings → Real-Debrid**:
- **Mount Path**: `/mnt/zurg/torrents`

---

## Troubleshooting Symlinks

### "Symlink target not found"

The rclone mount may not yet have the torrent listed. RD takes 1–5 minutes after adding a torrent to expose it via WebDAV.

Check:
```bash
docker logs rclone-zurg --tail 50
docker logs zurg --tail 50
```

### Plex/Jellyfin shows "Media not found" after symlink

The media server needs to rescan. Automatarr triggers this automatically after creating a symlink; if it didn't, manually trigger a library scan in your media server.

### Symlinks appear broken after reboot

The rclone FUSE mount may not have started before Plex/Jellyfin tried to read. Ensure the `zurg` service is healthy before your media server starts:

```yaml
# docker-compose.yml — add to your plex/jellyfin service
depends_on:
  rclone:
    condition: service_started
```

---

## RD Torrent Statuses

| Status | Meaning |
|---|---|
| `magnet_error` | Magnet couldn't be resolved |
| `waiting_files_selection` | RD needs file selection (handled automatically) |
| `queued` | In RD's queue |
| `downloading` | RD is downloading the torrent |
| `downloaded` | Ready — file is accessible |
| `error` | RD reported an error |
| `dead` | Torrent has no seeders |

Automatarr polls RD every few minutes and updates the download status accordingly.
