from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.movie import Movie
from app.models.show import Show
from app.services.tmdb import TMDBClient
from app.services.settings_service import get_setting

router = APIRouter(prefix="/api/search", tags=["search"])

TMDB_IMAGE = "https://image.tmdb.org/t/p/w300"


@router.get("/movies")
async def search_movies(q: str = Query(..., min_length=1), db: AsyncSession = Depends(get_db)):
    tmdb_key = await get_setting(db, "tmdb_api_key")
    if not tmdb_key:
        raise HTTPException(400, "TMDB API key not configured. Go to Settings → General.")

    tmdb = TMDBClient(tmdb_key)
    data = await tmdb.search_movies(q)
    results = data.get("results", [])

    existing_ids = set()
    ex = await db.execute(select(Movie.tmdb_id))
    for row in ex.scalars():
        existing_ids.add(row)

    out = []
    for r in results[:20]:
        release = r.get("release_date", "")
        year = int(release[:4]) if release and len(release) >= 4 else None
        out.append({
            "tmdb_id": r["id"],
            "title": r.get("title", ""),
            "year": year,
            "overview": r.get("overview"),
            "poster_path": r.get("poster_path"),
            "rating": r.get("vote_average"),
            "already_added": r["id"] in existing_ids,
        })
    return out


@router.get("/shows")
async def search_shows(q: str = Query(..., min_length=1), db: AsyncSession = Depends(get_db)):
    tmdb_key = await get_setting(db, "tmdb_api_key")
    if not tmdb_key:
        raise HTTPException(400, "TMDB API key not configured. Go to Settings → General.")

    tmdb = TMDBClient(tmdb_key)
    data = await tmdb.search_shows(q)
    results = data.get("results", [])

    existing_ids = set()
    ex = await db.execute(select(Show.tmdb_id))
    for row in ex.scalars():
        existing_ids.add(row)

    out = []
    for r in results[:20]:
        first_air = r.get("first_air_date", "")
        year = int(first_air[:4]) if first_air and len(first_air) >= 4 else None
        out.append({
            "tmdb_id": r["id"],
            "title": r.get("name", ""),
            "year": year,
            "overview": r.get("overview"),
            "poster_path": r.get("poster_path"),
            "rating": r.get("vote_average"),
            "already_added": r["id"] in existing_ids,
        })
    return out
