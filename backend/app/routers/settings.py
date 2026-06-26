from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.database import get_db
from app.services.settings_service import get_all_settings, set_setting
from app.services.real_debrid import RealDebridClient, RealDebridError
from app.services.media_server import PlexClient, JellyfinClient
from app.services.zilean import ZileanClient

router = APIRouter(prefix="/api/settings", tags=["settings"])

SENSITIVE_KEYS = {"rd_api_key", "tmdb_api_key", "plex_token", "jellyfin_api_key", "emby_api_key",
                  "discord_webhook", "telegram_bot_token", "jackett_api_key"}


@router.get("")
async def get_settings(db: AsyncSession = Depends(get_db)):
    all_settings = await get_all_settings(db)
    # Mask sensitive values in output
    out = {}
    for k, v in all_settings.items():
        if k in SENSITIVE_KEYS and v:
            out[k] = "••••••••"
        else:
            out[k] = v
    return out


@router.get("/raw")
async def get_settings_raw(db: AsyncSession = Depends(get_db)):
    """Return full settings without masking (for form pre-fill)."""
    return await get_all_settings(db)


@router.put("")
async def update_settings(body: dict[str, Any], db: AsyncSession = Depends(get_db)):
    for key, value in body.items():
        str_value = str(value) if value is not None else ""
        # Don't overwrite masked values
        if str_value == "••••••••":
            continue
        await set_setting(db, key, str_value)

    # Update scheduler if intervals changed
    if any(k in body for k in ("search_interval_minutes", "monitor_interval_minutes", "refresh_interval_hours")):
        from app.services.settings_service import get_setting
        from app.services import scheduler as sched
        search_interval = int(await get_setting(db, "search_interval_minutes") or 30)
        monitor_interval = int(await get_setting(db, "monitor_interval_minutes") or 5)
        refresh_interval = int(await get_setting(db, "refresh_interval_hours") or 6) * 60
        sched.update_scheduler_intervals(search_interval, monitor_interval, refresh_interval)

    return {"ok": True}


@router.post("/test/realdebrid")
async def test_realdebrid(db: AsyncSession = Depends(get_db)):
    settings = await get_all_settings(db)
    key = settings.get("rd_api_key", "")
    if not key:
        raise HTTPException(400, "Real-Debrid API key not configured")
    rd = RealDebridClient(key)
    try:
        user = await rd.get_user()
        return {
            "ok": True,
            "username": user.get("username"),
            "expiration": user.get("expiration"),
            "premium": user.get("premium", 0),
        }
    except RealDebridError as e:
        raise HTTPException(400, str(e))


@router.post("/test/plex")
async def test_plex(db: AsyncSession = Depends(get_db)):
    settings = await get_all_settings(db)
    url = settings.get("plex_url", "")
    token = settings.get("plex_token", "")
    if not url or not token:
        raise HTTPException(400, "Plex URL and token required")
    client = PlexClient(url, token)
    ok = await client.test()
    if ok:
        libs = await client.get_libraries()
        return {"ok": True, "libraries": [{"key": l["key"], "title": l["title"], "type": l["type"]} for l in libs]}
    raise HTTPException(400, "Could not connect to Plex")


@router.post("/test/jellyfin")
async def test_jellyfin(db: AsyncSession = Depends(get_db)):
    settings = await get_all_settings(db)
    url = settings.get("jellyfin_url", "")
    key = settings.get("jellyfin_api_key", "")
    if not url or not key:
        raise HTTPException(400, "Jellyfin URL and API key required")
    client = JellyfinClient(url, key)
    ok = await client.test()
    if ok:
        return {"ok": True}
    raise HTTPException(400, "Could not connect to Jellyfin")


@router.post("/test/zilean")
async def test_zilean(db: AsyncSession = Depends(get_db)):
    settings = await get_all_settings(db)
    url = settings.get("zilean_url", "http://zilean:8182")
    client = ZileanClient(url)
    ok = await client.ping()
    if ok:
        return {"ok": True, "url": url}
    raise HTTPException(400, f"Could not connect to Zilean at {url}")


@router.post("/test/emby")
async def test_emby(db: AsyncSession = Depends(get_db)):
    settings = await get_all_settings(db)
    url = settings.get("emby_url", "")
    key = settings.get("emby_api_key", "")
    if not url or not key:
        raise HTTPException(400, "Emby URL and API key required")
    from app.services.media_server import EmbyClient
    client = EmbyClient(url, key)
    ok = await client.test()
    if ok:
        return {"ok": True}
    raise HTTPException(400, "Could not connect to Emby")
