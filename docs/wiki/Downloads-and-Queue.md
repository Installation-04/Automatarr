# Downloads & Queue

The Downloads page shows all active and recent downloads managed by Automatarr through Real-Debrid.

---

## How Downloads Work

```
Automatarr grabs a torrent hash
        ↓
Adds it to Real-Debrid via the API
        ↓
RD checks if the hash is cached (instant) or downloads it
        ↓
Automatarr polls RD every 5 minutes for status updates
        ↓
When RD reports "downloaded" → Automatarr creates a symlink or saves the file
        ↓
Media server is notified to refresh
```

---

## Download Statuses

| Status | Meaning |
|---|---|
| `pending` | Submitted to RD, waiting for first status update |
| `downloading` | RD is actively downloading the torrent |
| `downloaded` | Complete — symlink created or file saved |
| `failed` | RD reported an error (`error`, `dead`, `magnet_error`) |

---

## Download List

The Downloads page shows:
- **Media title** — the movie or episode this download is for
- **Torrent name** — raw filename from the indexer
- **Progress** — percentage complete (from RD)
- **Speed** — current download speed in bytes/second (from RD)
- **Size** — total file size
- **Status** — current state
- **Added** — when Automatarr queued this grab
- **Completed** — when it finished (if applicable)

---

## Progress and Speed

Progress and speed data comes directly from the Real-Debrid API. For **cached** torrents (the vast majority), progress goes from 0% to 100% almost instantly. Non-cached content actually downloads on RD's servers, which may take minutes to hours.

---

## Download Modes

### Symlink Mode

When download completes, Automatarr:
1. Locates the torrent directory in the rclone/Zurg mount (`/mnt/zurg/torrents/`)
2. Creates a directory in your library (`/media/movies/Title (Year)/`)
3. Creates a `.mkv` symlink pointing to the file in the mount
4. Notifies your media server

### Direct Download Mode

When download completes, Automatarr:
1. Gets the unrestricted download links from RD
2. Downloads each file directly to your library path
3. Notifies your media server

---

## Manual Retry

If a download fails, the associated movie/episode is set back to `wanted` state. The next scheduler cycle will re-attempt the search and grab. You can also trigger an immediate retry with **Search Now** on the movie or show.

---

## Clearing Downloads

Completed and failed download records are kept indefinitely for history. They don't affect performance, but if you want to clean them up, there is currently no UI button — this can be done via the API:

```bash
# List downloads
curl http://localhost:7980/api/downloads

# The response includes the download ID for reference
```

---

## Activity Log

The Activity Log (visible on the Dashboard) shows a chronological feed of all grab and download events:

- **grab** — a torrent was submitted to RD
- **download** — a file was successfully saved/symlinked
- **error** — a grab or download failed
- **info** — general status messages

Events are stored indefinitely in the database.
