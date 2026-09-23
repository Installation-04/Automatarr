from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, delete
from typing import Optional

from app.database import get_db
from app.models.download import Download, ActivityLog
from app.services.real_debrid import RealDebridClient
from app.services.settings_service import get_setting

router = APIRouter(prefix="/api/downloads", tags=["downloads"])


@router.get("")
async def list_downloads(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    status: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Download).order_by(desc(Download.added_at))
    if status:
        query = query.where(Download.status == status)
    result = await db.execute(query.offset(offset).limit(limit))
    return [_dl_out(d) for d in result.scalars().all()]


@router.get("/activity")
async def get_activity(
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    event_type: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    query = select(ActivityLog).order_by(desc(ActivityLog.created_at))
    if event_type:
        query = query.where(ActivityLog.event_type == event_type)
    result = await db.execute(query.offset(offset).limit(limit))
    return [_log_out(l) for l in result.scalars().all()]


@router.delete("/history")
async def clear_history(db: AsyncSession = Depends(get_db)):
    """Remove finished (downloaded/failed) download records. Active downloads are kept."""
    result = await db.execute(
        delete(Download).where(Download.status.in_(["downloaded", "failed"]))
    )
    await db.commit()
    return {"ok": True, "deleted": result.rowcount}


@router.get("/rd/queue")
async def rd_queue(db: AsyncSession = Depends(get_db)):
    """Return current Real-Debrid torrent queue."""
    rd_key = await get_setting(db, "rd_api_key")
    if not rd_key:
        return []
    rd = RealDebridClient(rd_key)
    try:
        torrents = await rd.list_torrents()
        return torrents[:50]
    except Exception as e:
        raise HTTPException(502, f"Real-Debrid error: {e}")


@router.delete("/{download_id}")
async def delete_download(download_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Download).where(Download.id == download_id))
    dl = result.scalar_one_or_none()
    if dl:
        await db.delete(dl)
        await db.commit()
    return {"ok": True}


def _dl_out(d: Download) -> dict:
    return {
        "id": d.id, "media_type": d.media_type, "media_id": d.media_id,
        "media_title": d.media_title, "rd_torrent_id": d.rd_torrent_id,
        "torrent_name": d.torrent_name, "filename": d.filename,
        "size": d.size, "progress": d.progress, "speed": d.speed,
        "status": d.status, "error_message": d.error_message,
        "added_at": d.added_at.isoformat() if d.added_at else None,
        "completed_at": d.completed_at.isoformat() if d.completed_at else None,
    }


def _log_out(l: ActivityLog) -> dict:
    return {
        "id": l.id, "event_type": l.event_type, "media_type": l.media_type,
        "media_title": l.media_title, "message": l.message,
        "created_at": l.created_at.isoformat() if l.created_at else None,
    }
