from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.settings import Setting
from typing import Optional

DEFAULTS = {
    # Real-Debrid
    "rd_api_key": "",
    "rd_mount_path": "/mnt/zurg/torrents",
    "rd_download_mode": "symlink",  # symlink | download

    # TMDB
    "tmdb_api_key": "",

    # Library paths
    "movies_path": "/media/movies",
    "shows_path": "/media/shows",

    # Quality
    "default_quality": "1080p",
    "quality_order": "4k,1080p,720p,any",

    # Media servers
    "plex_url": "",
    "plex_token": "",
    "plex_movies_library": "",
    "plex_shows_library": "",
    "jellyfin_url": "",
    "jellyfin_api_key": "",
    "emby_url": "",
    "emby_api_key": "",
    "media_server": "none",  # none | plex | jellyfin | emby

    # Indexers
    "indexer": "torrentio",  # torrentio | zilean | both
    "torrentio_url": "https://torrentio.strem.fun",
    "torrentio_opts": "",
    "zilean_url": "http://zilean:8182",
    "jackett_url": "",
    "jackett_api_key": "",
    "use_jackett": "false",

    # ── Debrid Stack ─────────────────────────────────────────────────────────────
    "app_zurg_url": "http://zurg:9999",
    "app_zurg_enabled": "false",
    "app_rclone_url": "http://rclone:5572",
    "app_rclone_enabled": "false",
    "app_decypharr_url": "http://decypharr:8282",
    "app_decypharr_enabled": "false",
    "app_nzbdav_url": "http://nzbdav:8080",
    "app_nzbdav_enabled": "false",
    "app_altmount_url": "http://altmount:8088",
    "app_altmount_enabled": "false",
    "app_cli_debrid_url": "http://cli-debrid:3000",
    "app_cli_debrid_enabled": "false",

    # ── Content Orchestrators ─────────────────────────────────────────────────────
    "app_riven_url": "http://riven:8080",
    "app_riven_enabled": "false",
    "app_pulsarr_url": "http://pulsarr:3003",
    "app_pulsarr_enabled": "false",
    "app_neutarr_url": "http://neutarr:8191",
    "app_neutarr_enabled": "false",

    # ── Arr Suite ────────────────────────────────────────────────────────────────
    "app_radarr_url": "http://radarr:7878",
    "app_radarr_enabled": "false",
    "app_radarr_api_key": "",
    "app_sonarr_url": "http://sonarr:8989",
    "app_sonarr_enabled": "false",
    "app_sonarr_api_key": "",
    "app_prowlarr_url": "http://prowlarr:9696",
    "app_prowlarr_enabled": "false",
    "app_lidarr_url": "http://lidarr:8686",
    "app_lidarr_enabled": "false",
    "app_readarr_url": "http://readarr:8787",
    "app_readarr_enabled": "false",
    "app_bazarr_url": "http://bazarr:6767",
    "app_bazarr_enabled": "false",
    "app_whisparr_url": "http://whisparr:6969",
    "app_whisparr_enabled": "false",
    "app_profilarr_url": "http://profilarr:6868",
    "app_profilarr_enabled": "false",

    # ── Request & Discovery ───────────────────────────────────────────────────────
    "app_overseerr_url": "http://overseerr:5055",
    "app_overseerr_enabled": "false",
    "app_jellyseerr_url": "http://jellyseerr:5055",
    "app_jellyseerr_enabled": "false",

    # ── Analytics & Monitoring ────────────────────────────────────────────────────
    "app_tautulli_url": "http://tautulli:8181",
    "app_tautulli_enabled": "false",

    # ── Infrastructure ────────────────────────────────────────────────────────────
    "app_traefik_url": "http://traefik:8080",
    "app_traefik_enabled": "false",
    "app_pgadmin_url": "http://pgadmin:5050",
    "app_pgadmin_enabled": "false",
    "app_cloudflared_url": "http://localhost:14333",
    "app_cloudflared_enabled": "false",

    # Notifications
    "discord_webhook": "",
    "telegram_bot_token": "",
    "telegram_chat_id": "",
    "notify_on_grab": "true",
    "notify_on_download": "true",
    "notify_on_error": "true",
    "webhook_url": "",

    # Scheduler
    "search_interval_minutes": "30",
    "monitor_interval_minutes": "5",
    "refresh_interval_hours": "6",

    # Setup
    "onboarding_complete": "false",
    "music_path": "/media/music",
    "books_path": "/media/books",
}


async def get_setting(db: AsyncSession, key: str) -> Optional[str]:
    result = await db.execute(select(Setting).where(Setting.key == key))
    setting = result.scalar_one_or_none()
    if setting is None:
        return DEFAULTS.get(key)
    return setting.value


async def set_setting(db: AsyncSession, key: str, value: str):
    """Upsert a single setting. Does NOT commit — caller is responsible."""
    result = await db.execute(select(Setting).where(Setting.key == key))
    setting = result.scalar_one_or_none()
    if setting:
        setting.value = value
    else:
        setting = Setting(key=key, value=value)
        db.add(setting)


async def bulk_set_settings(db: AsyncSession, updates: dict):
    """Upsert multiple settings in a single transaction."""
    if not updates:
        return
    result = await db.execute(select(Setting).where(Setting.key.in_(updates.keys())))
    existing = {row.key: row for row in result.scalars().all()}
    for key, value in updates.items():
        if key in existing:
            existing[key].value = value
        else:
            db.add(Setting(key=key, value=value))
    await db.commit()


async def get_all_settings(db: AsyncSession) -> dict:
    result = await db.execute(select(Setting))
    rows = result.scalars().all()
    data = dict(DEFAULTS)
    for row in rows:
        data[row.key] = row.value
    return data
