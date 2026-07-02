# TMDB Setup

The Movie Database (TMDB) provides all metadata used by Automatarr: titles, posters, overviews, ratings, episode lists, air dates, and cast. A free API key is required.

---

## Getting a Free API Key

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/signup)
2. Go to **Profile → Settings → API**
3. Click **Create** under "API Key (v3 auth)"
4. Fill out the form (app name: `Automatarr`, usage: Personal)
5. Copy the **API Key (v3 auth)** — it looks like a 32-character hex string

---

## Adding the Key to Automatarr

1. Open **Settings → TMDB**
2. Paste your key in the **TMDB API Key** field
3. Click **Save**

The key is used for:
- Searching for movies/shows
- Fetching metadata (poster, overview, rating, year)
- Fetching season and episode lists for TV shows
- Refreshing metadata when you click the refresh button

---

## What TMDB IDs Are

Every movie and show on TMDB has a numeric ID. When you search and add media, Automatarr stores the TMDB ID alongside the title. This ID is used for:
- Deduplication (prevents adding the same movie twice)
- Metadata refresh (fetches the latest info from TMDB)
- Matching search results

---

## API Rate Limits

TMDB's free tier allows approximately 40 requests per 10 seconds. Automatarr respects these limits by fetching metadata at add-time and caching it in the database. Normal usage will not hit the limit.

---

## Troubleshooting

### "TMDB API key not configured"

The TMDB key is missing or blank. Go to **Settings → TMDB** and enter your key.

### Search returns no results

- Check that your API key is valid by visiting:
  `https://api.themoviedb.org/3/movie/550?api_key=YOUR_KEY`
  You should see JSON for *Fight Club*.
- Make sure the key is saved (Settings → Save)

### Posters not loading

Poster images are fetched from `image.tmdb.org`. If images don't load, check your network connectivity. Automatarr stores the poster path (`/abc123.jpg`) but constructs the full URL with TMDB's CDN base at render time.
