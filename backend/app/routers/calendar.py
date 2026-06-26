from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.show import Episode, Show
from app.models.movie import Movie

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("")
async def get_calendar(
    start: str = Query(..., description="YYYY-MM-DD"),
    end: str = Query(..., description="YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db),
):
    # Episodes in range
    ep_result = await db.execute(
        select(Episode, Show)
        .join(Show, Show.id == Episode.show_id)
        .where(Episode.air_date >= start, Episode.air_date <= end)
        .order_by(Episode.air_date)
    )
    items = []
    for ep, show in ep_result.all():
        items.append({
            "type": "episode",
            "date": ep.air_date,
            "title": show.title,
            "subtitle": f"S{ep.season_number:02d}E{ep.episode_number:02d} - {ep.title or ''}",
            "poster_path": show.poster_path,
            "status": ep.status,
            "id": ep.id,
            "show_id": show.id,
        })

    return sorted(items, key=lambda x: x["date"] or "")
