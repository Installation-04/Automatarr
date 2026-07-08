# Indexers

Automatarr uses indexers to find torrent hashes for movies and episodes. It then checks whether those hashes are cached on Real-Debrid before attempting to grab them.

---

## Supported Indexers

| Indexer | Type | Setup required |
|---|---|---|
| **Torrentio** | Hosted (public) | None — works out of the box |
| **Zilean** | Self-hosted | Docker profile + optional config |
| **Jackett** | Self-hosted | External setup + API key |

---

## Torrentio

Torrentio is a public Stremio addon that aggregates torrent results from many sources (YTS, RARGB, 1337x, etc.) and checks Real-Debrid availability in real time.

**No setup needed.** The default URL (`https://torrentio.strem.fun`) works without any account.

### Configuration

In **Settings → Indexers**:

| Setting | Default | Notes |
|---|---|---|
| **Indexer** | `torrentio` | Set to `torrentio` to use only Torrentio |
| **Torrentio URL** | `https://torrentio.strem.fun` | Change only if using a self-hosted instance |
| **Torrentio Options** | *(empty)* | Optional query parameters |

### Torrentio Options

You can filter providers or sort results by appending options:

| Option | Example | Effect |
|---|---|---|
| `providers` | `providers=yts,eztv` | Limit to specific trackers |
| `sort` | `sort=size` | Sort by: `qualitysize`, `size`, `seeders` |
| `qualityfilter` | `qualityfilter=cam,scr` | Exclude cam/screener results |

Example: `providers=yts,eztv|sort=qualitysize`

---

## Zilean

Zilean is a self-hosted indexer that queries the Debrid Media Manager (DMM) hash database. It can find more obscure content that Torrentio misses.

### Setup

Start Zilean with the Docker profile:

```bash
docker compose --profile zilean up -d
```

This starts Zilean on port `8182` (configurable via `ZILEAN_PORT` in `.env`).

### Configuration in Automatarr

In **Settings → Indexers**:
- **Indexer**: set to `zilean` or `both`
- **Zilean URL**: `http://zilean:8182` (default — works within Docker network)

If Zilean runs outside Docker, use its full URL: `http://192.168.1.100:8182`

### Using Both Torrentio and Zilean

Set **Indexer** to `both`. Automatarr will query both in parallel and take the best result based on your quality profile.

---

## Jackett

Jackett is a proxy that translates many private and public tracker APIs into a unified format. Use it when Torrentio and Zilean don't have what you need.

> Jackett is **not** included in the Automatarr Docker Compose file. You must run it separately.

### Setup

1. Run Jackett (see [Jackett GitHub](https://github.com/Jackett/Jackett) for Docker instructions)
2. Add your trackers in the Jackett UI
3. In Automatarr **Settings → Indexers**:
   - **Use Jackett**: `true`
   - **Jackett URL**: e.g. `http://192.168.1.100:9117`
   - **Jackett API Key**: found in the Jackett UI top-right

---

## How Indexer Searching Works

1. Automatarr constructs a search query from the title and year
2. It sends the query to the configured indexer(s)
3. Results are filtered by:
   - Quality profile match (4K, 1080p, 720p, any)
   - Real-Debrid cache availability (only cached results are used)
4. The best matching result is grabbed
5. If no cached result is found, the episode/movie stays in `wanted` status until the next search cycle

### Search Cycle

The scheduler runs automatically:
- **Search interval**: every 30 minutes by default (configurable)
- **Monitor interval**: every 5 minutes (checks download progress)
- **Refresh interval**: every 6 hours (marks newly aired episodes as wanted)

You can also trigger a manual search from the movie or show detail page.
