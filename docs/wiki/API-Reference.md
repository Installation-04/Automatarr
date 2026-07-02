# API Reference

The Automatarr backend exposes a REST API at `http://localhost:7980/api`.

Interactive documentation (Swagger UI) is available at:
- **http://localhost:7980/docs** — Swagger UI
- **http://localhost:7980/redoc** — ReDoc

---

## Base URL

```
http://localhost:7980/api
```

All responses are JSON. All timestamps are ISO 8601 strings.

---

## Authentication

The API does not currently require authentication tokens. It is designed for local/LAN access only. When deployed behind a reverse proxy, restrict access at the proxy level.

---

## System

### Health Check

```
GET /api/system/health
```

Returns 200 if the backend is running and the database is accessible.

**Response:**
```json
{"status": "ok"}
```

### Probe URL

```
POST /api/system/probe
```

Tests connectivity to a given URL (used by the onboarding wizard).

**Request:**
```json
{"url": "http://zurg:9999"}
```

**Response:**
```json
{"reachable": true, "status_code": 200}
```

> Loopback addresses and `localhost` are blocked for security.

---

## Movies

### List Movies

```
GET /api/movies
```

Returns all movies ordered by title.

### Get Movie

```
GET /api/movies/{id}
```

### Add Movie

```
POST /api/movies
```

**Request:**
```json
{
  "tmdb_id": 27205,
  "quality_profile": "1080p",
  "monitor": true
}
```

Quality profiles: `4k`, `1080p`, `720p`, `any`

### Update Movie

```
PUT /api/movies/{id}
```

**Request (all fields optional):**
```json
{
  "quality_profile": "4k",
  "monitor": true,
  "status": "wanted"
}
```

### Delete Movie

```
DELETE /api/movies/{id}
```

### Trigger Search

```
POST /api/movies/{id}/search
```

Immediately searches for and grabs this movie.

### Get Stats

```
GET /api/movies/stats
```

**Response:**
```json
{
  "total": 142,
  "downloaded": 138,
  "wanted": 3,
  "downloading": 1
}
```

---

## Shows

### List Shows

```
GET /api/shows
```

### Get Show (with seasons and episodes)

```
GET /api/shows/{id}
```

### Add Show

```
POST /api/shows
```

**Request:**
```json
{
  "tmdb_id": 1396,
  "quality_profile": "1080p",
  "monitor": true,
  "monitor_new_seasons": true
}
```

### Update Show

```
PUT /api/shows/{id}
```

**Request (all optional):**
```json
{
  "quality_profile": "4k",
  "monitor": true,
  "monitor_new_seasons": false
}
```

### Delete Show

```
DELETE /api/shows/{id}
```

### Trigger Search (all wanted episodes)

```
POST /api/shows/{id}/search
```

Marks all `missing`/`error` episodes as `wanted` and immediately searches.

### Refresh Show Metadata

```
POST /api/shows/{id}/refresh
```

Re-fetches show metadata from TMDB.

### Toggle Season Monitor

```
PUT /api/shows/{show_id}/seasons/{season_number}/monitor?monitor=true
```

### Get Stats

```
GET /api/shows/stats
```

**Response:**
```json
{
  "total": 24,
  "episodes_total": 892,
  "episodes_downloaded": 875,
  "episodes_wanted": 12
}
```

---

## Downloads

### List Downloads

```
GET /api/downloads?limit=50&offset=0
```

- `limit`: 1–500, default 50
- `offset`: pagination offset

**Response item:**
```json
{
  "id": 1,
  "media_type": "movie",
  "media_id": 5,
  "media_title": "Inception (2010)",
  "rd_torrent_id": "ABC123",
  "torrent_name": "Inception.2010.1080p.BluRay.mkv",
  "filename": null,
  "size": 8589934592,
  "progress": 100.0,
  "speed": null,
  "status": "downloaded",
  "error_message": null,
  "added_at": "2024-01-15T02:30:00Z",
  "completed_at": "2024-01-15T02:30:45Z"
}
```

### Get RD Queue

```
GET /api/downloads/rd-queue
```

Returns active torrents directly from the Real-Debrid API.

---

## Search

### Search TMDB (Movies)

```
GET /api/search/movies?q=inception
```

**Response item:**
```json
{
  "tmdb_id": 27205,
  "title": "Inception",
  "year": 2010,
  "overview": "Cobb, a skilled thief...",
  "poster_path": "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
  "rating": 8.4,
  "already_added": false
}
```

### Search TMDB (Shows)

```
GET /api/search/shows?q=breaking+bad
```

---

## Calendar

### Get Upcoming Episodes

```
GET /api/calendar/upcoming?days=7
```

Returns episodes airing within the specified number of days.

**Response item:**
```json
{
  "show_title": "The Bear",
  "show_poster": "/poster.jpg",
  "season_number": 3,
  "episode_number": 1,
  "episode_title": "Premiere",
  "air_date": "2024-06-26",
  "status": "wanted",
  "show_id": 12
}
```

---

## Settings

### Get All Settings

```
GET /api/settings
```

Returns a flat key-value object of all settings (including defaults).

### Update Settings

```
PUT /api/settings
```

**Request:**
```json
{
  "rd_api_key": "your-key",
  "tmdb_api_key": "your-key",
  "media_server": "jellyfin",
  "jellyfin_url": "http://jellyfin:8096",
  "jellyfin_api_key": "your-key",
  "notify_on_grab": "true",
  "search_interval_minutes": "30"
}
```

All values are strings. Boolean settings use the string `"true"` or `"false"`.

### Test Media Server

```
POST /api/settings/test-media-server
```

Tests connectivity to the configured media server.

**Response:**
```json
{"ok": true, "message": "Connected to Jellyfin"}
```

---

## Dashboard

### Get Dashboard Data

```
GET /api/system/dashboard
```

**Response:**
```json
{
  "movies": {
    "total": 142,
    "downloaded": 138,
    "wanted": 3,
    "downloading": 1
  },
  "shows": {
    "total": 24,
    "episodes_total": 892,
    "episodes_downloaded": 875,
    "episodes_wanted": 12,
    "episodes_downloading": 2
  },
  "recent_activity": [...],
  "upcoming": [...]
}
```

---

## Activity Log

Activity is included in the dashboard response (`recent_activity` array):

```json
{
  "id": 1,
  "event_type": "download",
  "media_type": "movie",
  "media_title": "Inception (2010)",
  "message": "Downloaded: Inception (2010)",
  "created_at": "2024-01-15T02:30:45Z"
}
```

---

## Error Responses

All errors follow the same format:

```json
{
  "detail": "Human-readable error message"
}
```

| HTTP Status | Meaning |
|---|---|
| 400 | Bad request (validation error, already exists) |
| 404 | Resource not found |
| 502 | Upstream API error (RD, TMDB, indexer) |
| 500 | Internal server error |
