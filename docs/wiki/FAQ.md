# FAQ

Frequently asked questions about Automatarr.

---

## General

### What is Automatarr?

Automatarr is a self-hosted media automation tool that integrates with Real-Debrid to automatically find, download, and organize your movies and TV shows. It's like Radarr/Sonarr but purpose-built for the Real-Debrid + Zurg + rclone symlink stack.

### Do I need a Real-Debrid subscription?

Yes. Automatarr is built around Real-Debrid's API. Without a valid RD account and API key, searches and downloads will not work.

### Is Automatarr a replacement for Radarr/Sonarr?

For the Real-Debrid workflow, yes. Automatarr handles the full cycle: metadata (via TMDB), searching (via Torrentio/Zilean), grabbing (via RD), and library management (via symlinks or direct download). If you need advanced quality management, Usenet support, or integration with many indexers, Radarr/Sonarr may be better suited — and they can run alongside Automatarr.

### Can I use Automatarr without Zurg/rclone?

Yes, in **direct download mode**. Set **Download Mode** to `download` in Settings. Automatarr will download files directly from RD without needing a rclone mount.

### Is torrent traffic going through my machine?

No. Real-Debrid downloads the torrent on their servers. Your machine only makes HTTPS API calls and (in symlink mode) streams files over the rclone/Zurg FUSE mount — no P2P traffic.

---

## Setup

### What ports does Automatarr use?

| Service | Default Port |
|---|---|
| Automatarr UI | **7979** |
| Automatarr API | **7980** |

These can be changed in `.env` (`PORT` and `BACKEND_PORT`).

### Can I run Automatarr on a NAS (Synology, TrueNAS, Unraid)?

Automatarr has been used on these platforms, but the FUSE mount (rclone) may require additional setup:
- **Synology DSM**: Requires enabling FUSE in Docker settings
- **Unraid**: The community app template handles FUSE configuration
- **TrueNAS**: Use jails/VMs for best FUSE support

### Can I change the port after install?

Yes. Edit `.env` and change `PORT` and/or `BACKEND_PORT`, then restart:
```bash
docker compose up -d
```

### Do I need to run the installer again after updating?

No. `update.sh` handles rebuilding and restarting containers. The `.env` file is never modified by updates.

---

## Movies & Shows

### How long until a movie appears in my library after adding it?

For cached RD content (most popular titles):
- Indexer query: < 5 seconds
- RD grab: < 10 seconds
- Symlink creation: < 10 seconds
- Media server scan: < 30 seconds

**Total: typically under 1 minute** for cached content.

For uncached content (rare titles), RD must download the torrent first, which can take minutes to hours.

### Why is a movie/episode stuck in `wanted`?

No cached Real-Debrid result was found by the indexer. The scheduler retries every 30 minutes automatically. Common reasons:
- The content is obscure — try adding Zilean as a second indexer
- The content is very new — RD cache may take 24–48 hours to be populated
- The torrent quality filter is too strict — try `any` quality profile

### Can Automatarr download 4K HDR content?

Yes. Set the quality profile to `4k` when adding the movie/show. Results from Torrentio will include 4K/2160p/UHD content. Note that 4K files are much larger (40–80 GB) and require more cache space in rclone.

### Can I have different quality profiles for different shows?

Yes. Each show (and each episode) has its own quality profile. Set the default in **Settings → Quality → Default Quality**, then override per-item when adding.

### Does Automatarr replace already-downloaded content with better quality?

Not automatically. Once a movie/episode is in `downloaded` state, it won't be re-searched. To force a quality upgrade, change the quality profile and click **Search Now** — but note this will create a new entry, not replace the existing file.

---

## Media Servers

### Plex vs Jellyfin vs Emby — which is best for Automatarr?

All three integrate equally well. The choice depends on your preference:
- **Plex**: Mature, great apps, requires subscription for some features
- **Jellyfin**: Free and open-source, good feature parity
- **Emby**: Similar to Jellyfin with a premium tier

### Do I need a media server at all?

No. Automatarr works without a media server — it just won't automatically trigger library scans. You can manage files directly or set up media server integration later.

---

## Notifications

### Can I get notifications on my phone?

Yes, via:
- **Telegram** — official app on all platforms
- **Discord** — Discord app notifications
- **Custom webhook** → **ntfy.sh** or **Gotify** (both have mobile apps)

### Can I send notifications to multiple channels?

Currently Automatarr supports one Discord webhook, one Telegram bot, and one custom webhook at a time. For multiple channels, use your custom webhook endpoint to fan out to multiple services (e.g. via n8n, Zapier, or a simple script).

---

## Technical

### What database does Automatarr use?

SQLite via SQLAlchemy (async). The database is stored at `./data/automatarr.db`. It's automatically created on first startup.

### Can I use PostgreSQL instead of SQLite?

Not through the UI, but technically possible by changing the `DATABASE_URL` environment variable. PostgreSQL support is not officially tested.

### Can I access the database directly?

Yes:
```bash
sqlite3 data/automatarr.db
.tables
SELECT title, status FROM movies ORDER BY title;
.quit
```

### How do I reset Automatarr completely?

Stop containers, delete the database, and restart:
```bash
docker compose down
rm data/automatarr.db
docker compose up -d
```

This clears all movies, shows, settings, and history. Your `.env` file and media files are not affected.
