from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from app.database import get_db
from app.models.movie import Movie
from app.services.tmdb import TMDBClient
from app.services import grabber
from app.services.settings_service import get_all_settings, get_setting

router = APIRouter(prefix="/api/movies", tags=["movies"])


class AddMovieRequest(BaseModel):
    tmdb_id: int
    quality_profile: str = "1080p"
    monitor: bool = True


class UpdateMovieRequest(BaseModel):
    quality_profile: Optional[str] = None
    monitor: Optional[bool] = None
    status: Optional[str] = None


@router.get("")
async def list_movies(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Movie).order_by(Movie.title))
    movies = result.scalars().all()
    return [_movie_out(m) for m in movies]


@router.post("")
async def add_movie(req: AddMovieRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Movie).where(Movie.tmdb_id == req.tmdb_id))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Movie already added")

    tmdb_key = await get_setting(db, "tmdb_api_key")
    if not tmdb_key:
        raise HTTPException(400, "TMDB API key not configured")

    tmdb = TMDBClient(tmdb_key)
    data = await tmdb.get_movie(req.tmdb_id)
    movie_data = tmdb.movie_to_dict(data)

    movie = Movie(
        **movie_data,
        quality_profile=req.quality_profile,
        monitor=req.monitor,
        status="wanted" if req.monitor else "ignored",
    )
    db.add(movie)
    await db.commit()
    await db.refresh(movie)

    if req.monitor:
        background_tasks.add_task(_grab_movie_task, movie.id)

    return _movie_out(movie)


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    total = await db.scalar(select(func.count(Movie.id)))
    downloaded = await db.scalar(select(func.count(Movie.id)).where(Movie.status == "downloaded"))
    wanted = await db.scalar(select(func.count(Movie.id)).where(Movie.status == "wanted"))
    downloading = await db.scalar(select(func.count(Movie.id)).where(Movie.status == "downloading"))
    return {"total": total, "downloaded": downloaded, "wanted": wanted, "downloading": downloading}


@router.get("/{movie_id}")
async def get_movie(movie_id: int, db: AsyncSession = Depends(get_db)):
    movie = await _get_or_404(db, movie_id)
    return _movie_out(movie)


@router.put("/{movie_id}")
async def update_movie(movie_id: int, req: UpdateMovieRequest, db: AsyncSession = Depends(get_db)):
    movie = await _get_or_404(db, movie_id)
    if req.quality_profile is not None:
        movie.quality_profile = req.quality_profile
    if req.monitor is not None:
        movie.monitor = req.monitor
        if req.monitor and movie.status == "ignored":
            movie.status = "wanted"
    if req.status is not None:
        movie.status = req.status
    await db.commit()
    return _movie_out(movie)


@router.delete("/{movie_id}")
async def delete_movie(movie_id: int, db: AsyncSession = Depends(get_db)):
    movie = await _get_or_404(db, movie_id)
    await db.delete(movie)
    await db.commit()
    return {"ok": True}


@router.post("/{movie_id}/search")
async def search_movie(movie_id: int, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    movie = await _get_or_404(db, movie_id)
    movie.status = "wanted"
    await db.commit()
    background_tasks.add_task(_grab_movie_task, movie_id)
    return {"ok": True, "message": "Search queued"}


@router.post("/{movie_id}/refresh")
async def refresh_movie(movie_id: int, db: AsyncSession = Depends(get_db)):
    movie = await _get_or_404(db, movie_id)
    tmdb_key = await get_setting(db, "tmdb_api_key")
    if not tmdb_key:
        raise HTTPException(400, "TMDB API key not configured")
    tmdb = TMDBClient(tmdb_key)
    data = await tmdb.get_movie(movie.tmdb_id)
    movie_data = tmdb.movie_to_dict(data)
    for k, v in movie_data.items():
        setattr(movie, k, v)
    await db.commit()
    return _movie_out(movie)


async def _get_or_404(db: AsyncSession, movie_id: int) -> Movie:
    result = await db.execute(select(Movie).where(Movie.id == movie_id))
    movie = result.scalar_one_or_none()
    if not movie:
        raise HTTPException(404, "Movie not found")
    return movie


async def _grab_movie_task(movie_id: int):
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Movie).where(Movie.id == movie_id))
        movie = result.scalar_one_or_none()
        if movie:
            await grabber.grab_movie(db, movie)


def _movie_out(m: Movie) -> dict:
    return {
        "id": m.id,
        "tmdb_id": m.tmdb_id,
        "imdb_id": m.imdb_id,
        "title": m.title,
        "year": m.year,
        "overview": m.overview,
        "poster_path": m.poster_path,
        "backdrop_path": m.backdrop_path,
        "genres": m.genres,
        "runtime": m.runtime,
        "rating": m.rating,
        "status": m.status,
        "quality_profile": m.quality_profile,
        "monitor": m.monitor,
        "rd_torrent_id": m.rd_torrent_id,
        "symlink_path": m.symlink_path,
        "file_size": m.file_size,
        "last_error": m.last_error,
        "search_attempts": m.search_attempts,
        "added_at": m.added_at.isoformat() if m.added_at else None,
        "downloaded_at": m.downloaded_at.isoformat() if m.downloaded_at else None,
    }
