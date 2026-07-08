# Movies

Automatarr's Movies section lets you add, monitor, and automatically download your movie library.

---

## Adding a Movie

1. Click **Movies** in the navigation
2. Click the **+** (Add Movie) button
3. Type the movie title in the search box
4. Select the correct result from the list
5. Choose options:
   - **Quality Profile**: `4K`, `1080p`, `720p`, or `any`
   - **Monitor**: If enabled, Automatarr will automatically search for and download this movie
6. Click **Add Movie**

If the movie is already monitored, Automatarr immediately tries to grab it in the background.

---

## Movie Statuses

| Status | Meaning |
|---|---|
| `wanted` | Monitored and waiting for a download to be found |
| `searching` | Actively querying indexers right now |
| `downloading` | Torrent added to RD — waiting for it to be ready |
| `downloaded` | File is available (symlink created or file downloaded) |
| `error` | Last grab attempt failed |
| `ignored` | Not monitored — will not be searched |
| `missing` | Added but not yet monitored, or no results ever found |

---

## Quality Profiles

Automatarr searches for the best available version matching your quality profile:

| Profile | Matches |
|---|---|
| `4k` | 2160p, 4K, UHD results |
| `1080p` | 1080p results |
| `720p` | 720p results |
| `any` | Takes the first available result regardless of quality |

The **Quality Order** setting (`4k,1080p,720p,any`) determines the preference when a profile of `any` is used or when multiple qualities are found.

---

## Monitoring

When **Monitor** is enabled, Automatarr will:
1. Search for the movie on the next scheduler cycle (default: every 30 minutes)
2. Retry after errors — up to the configured search attempt limit
3. Resume searching after a restart

When **Monitor** is disabled (status becomes `ignored`), the movie stays in your library but is never searched.

---

## Manual Search

On the movie detail page, click **Search Now** to immediately queue a grab attempt. This overrides the scheduler and runs right away. If the movie was in `error` or `missing` state, the error is cleared and it's re-queued.

---

## Movie Detail Page

Click any movie to open its detail view, which shows:
- Poster, title, year, rating, overview
- Genres and runtime
- Current status and last error (if any)
- Symlink path (in symlink mode) or file path
- File size
- Download history

---

## Removing a Movie

On the movie detail page, click **Delete** (or the trash icon on the movie card). This removes the movie from Automatarr's database.

> Automatarr does not delete the actual media file or symlink — you must remove those manually if desired.

---

## Bulk Operations

From the Movies list view:
- Use the filter bar to find movies by status
- Click **Search All Wanted** to trigger a manual search cycle for all `wanted` movies

---

## Troubleshooting Movies

### Movie stuck in `wanted`

- No cached RD torrent found yet. Wait for the next search cycle or click **Search Now**.
- Check your indexer is reachable: **Settings → Test** buttons in the indexer section.
- Verify your RD API key is valid.

### Movie shows `error`

Click the movie to see **Last Error** for the specific failure reason. Common causes:
- RD API key invalid or expired
- No cache hits from any indexer
- RD torrent failed on their end (status: `dead`, `error`)

Click **Search Now** to retry after fixing the root cause.

### Movie downloaded but not appearing in Plex/Jellyfin

The media server library scan may not have triggered. Manually scan your library in Plex/Jellyfin, or check that the media server is configured correctly in **Settings → Media Server**.
