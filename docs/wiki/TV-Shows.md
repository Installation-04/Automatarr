# TV Shows

Automatarr tracks TV shows at the show, season, and episode level, automatically downloading episodes as they air.

---

## Adding a Show

1. Click **Shows** in the navigation
2. Click **+ Add Show**
3. Search for the show title
4. Configure:
   - **Quality Profile**: `4K`, `1080p`, `720p`, or `any`
   - **Monitor**: Monitor all existing aired episodes
   - **Monitor New Seasons**: Automatically monitor and download new seasons when they air
5. Click **Add Show**

On add, Automatarr fetches all seasons and episodes from TMDB and immediately starts grabbing any aired, monitored episodes.

---

## Show Statuses

A show itself doesn't have a download status — only individual episodes do. The show card displays aggregate counts:

- Episodes downloaded
- Episodes wanted (searching)
- Episodes with errors

---

## Episode Statuses

| Status | Meaning |
|---|---|
| `wanted` | Monitored, has aired, searching for a download |
| `searching` | Actively querying indexers right now |
| `downloading` | Torrent added to RD — waiting for it to be ready |
| `downloaded` | File available in your library |
| `error` | Last grab attempt failed |
| `ignored` | Not monitored |
| `missing` | Has not aired yet, or aired but not monitored |

---

## Seasons

Automatarr imports all non-special seasons (season numbers > 0) when you add a show.

### Season Monitoring

Each season can be individually monitored or ignored. Toggle monitoring per season in the show detail page.

When you **monitor a season**, all its episodes are also monitored. When you **unmonitor a season**, all its episodes are ignored.

### Specials (Season 0)

Special episodes (Season 0) are not imported by default. This is intentional — specials are often poorly structured in TMDB and rarely available on Real-Debrid.

---

## Episode Monitoring

Each episode has its own monitor toggle. An episode is only searched when:
1. The episode's `monitor` flag is `true`
2. The parent season's `monitor` flag is `true`
3. The parent show's `monitor` flag is `true`
4. The episode's air date has passed

Episodes that haven't aired yet are marked `missing` until their air date passes. The scheduler's **Refresh Interval** (default: every 6 hours) checks for newly aired episodes and marks them `wanted`.

---

## Monitor New Seasons

When **Monitor New Seasons** is enabled on a show, Automatarr will automatically monitor new seasons when TMDB adds them. This is triggered by the show's **Refresh** function (run manually or on a schedule).

---

## Searching for Episodes

### Automatic

The scheduler runs every 30 minutes (default) and searches for all `wanted` episodes across all monitored shows.

### Manual — All Episodes of a Show

On the show detail page, click **Search All** to:
1. Mark all `missing` and `error` monitored episodes as `wanted`
2. Clear any previous errors
3. Queue them for immediate searching

### Manual — Single Episode

On any episode row, click the search icon to trigger a grab attempt for that specific episode.

---

## Show Refresh

Click **Refresh** on a show to re-fetch its metadata from TMDB:
- Updated title, overview, poster, rating
- New seasons/episodes added since the last refresh
- Air date changes

This does **not** re-download already-downloaded episodes.

---

## Show Detail View

The show page shows:
- Show poster, overview, year, network, rating
- Season list with episode counts and download progress
- Per-season episode table with:
  - Episode number and title
  - Air date
  - Status badge
  - Quality profile
  - Symlink path
  - Last error

---

## Deleting a Show

Delete from the show detail page. This removes:
- The show from the database
- All seasons and episodes from the database

It does **not** delete media files or symlinks from disk.

---

## Troubleshooting Shows

### Episodes stuck in `wanted` indefinitely

Torrentio/Zilean may not have results for this episode yet — especially for recent or obscure content.
- For recent episodes, RD cache may need 24–48 hours to populate.
- Try adding Zilean as a second indexer (`Settings → Indexer: both`).

### New season not picked up automatically

Make sure **Monitor New Seasons** is enabled on the show. Then click **Refresh** to pull the latest season data from TMDB.

### Episodes show wrong air date / missing

Click **Refresh** on the show to re-sync episode data from TMDB. Air dates do change, especially for shows in production.
