"""Core grab logic: search → pick → add to RD → symlink."""
import os
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.movie import Movie
from app.models.show import Episode, Show
from app.models.download import Download, ActivityLog
from app.services.real_debrid import RealDebridClient, RealDebridError
from app.services.torrentio import TorrentioClient
from app.services.zilean import ZileanClient
from app.services import symlink as sym
from app.services import media_server, notifications
from app.services.settings_service import get_all_settings


async def _get_streams(settings: dict, imdb_id: str, media_type: str,
                       title: str = "", year: int = None,
                       season: int = None, episode: int = None) -> list[dict]:
    """Fetch streams from configured indexer(s) and merge results."""
    indexer = settings.get("indexer", "torrentio")
    streams: list[dict] = []

    if indexer in ("torrentio", "both"):
        torrentio = TorrentioClient(
            settings.get("torrentio_url", "https://torrentio.strem.fun"),
            settings.get("torrentio_opts", ""),
        )
        if media_type == "movie":
            streams += await torrentio.search_movie(imdb_id)
        else:
            streams += await torrentio.search_episode(imdb_id, season, episode)

    if indexer in ("zilean", "both"):
        zilean_url = settings.get("zilean_url", "http://zilean:8182")
        zilean = ZileanClient(zilean_url)
        if media_type == "movie":
            raw = await zilean.search_movie(title, year, imdb_id)
        else:
            raw = await zilean.search_episode(title, season, episode, year, imdb_id)
        streams += zilean.to_streams(raw)

    return streams


async def _log(db: AsyncSession, event_type: str, media_type: str, media_title: str, message: str):
    entry = ActivityLog(
        event_type=event_type,
        media_type=media_type,
        media_title=media_title,
        message=message,
    )
    db.add(entry)
    await db.commit()


async def grab_movie(db: AsyncSession, movie: Movie):
    settings = await get_all_settings(db)
    rd_key = settings.get("rd_api_key", "")
    if not rd_key:
        return

    imdb_id = movie.imdb_id
    if not imdb_id:
        await _log(db, "error", "movie", movie.title, "No IMDB ID — cannot search")
        return

    rd = RealDebridClient(rd_key)

    movie.status = "searching"
    movie.search_attempts = (movie.search_attempts or 0) + 1
    await db.commit()

    streams = await _get_streams(settings, imdb_id, "movie", title=movie.title, year=movie.year)
    if not streams:
        movie.status = "wanted"
        movie.last_error = "No streams found"
        await db.commit()
        await _log(db, "search", "movie", movie.title, "No streams found on Torrentio")
        return

    torrentio = TorrentioClient()
    stream = torrentio.pick_best_stream(streams, movie.quality_profile or "1080p")
    if not stream:
        movie.status = "wanted"
        movie.last_error = "No matching stream for quality profile"
        await db.commit()
        return

    magnet = torrentio.get_magnet(stream)
    if not magnet:
        movie.status = "wanted"
        movie.last_error = "Could not build magnet"
        await db.commit()
        return

    info_hash = stream.get("infoHash", "").lower()

    await _log(db, "grab", "movie", movie.title, f"Grabbing {stream.get('title', info_hash)[:80]}")
    await notifications.notify(settings, "grab", movie.title, f"Grabbing {stream.get('title', '')[:60]}")

    try:
        # Check instant availability first
        avail = await rd.check_instant_availability([info_hash])
        is_instant = bool(avail.get(info_hash, {}).get("rd"))

        torrent_info = await rd.add_and_select(magnet)
        torrent_id = torrent_info["id"]
        torrent_name = torrent_info.get("filename", "")

        movie.status = "downloading"
        movie.rd_torrent_id = torrent_id
        movie.rd_torrent_hash = info_hash
        movie.rd_filename = torrent_name
        await db.commit()

        dl = Download(
            media_type="movie",
            media_id=movie.id,
            media_title=movie.title,
            rd_torrent_id=torrent_id,
            rd_torrent_hash=info_hash,
            torrent_name=torrent_name,
            status="downloading",
        )
        db.add(dl)
        await db.commit()

        if not is_instant:
            # Will be finalized by monitor loop
            return

        # Instant — finalize now
        await _finalize_movie(db, movie, rd, settings, torrent_info)

    except RealDebridError as e:
        movie.status = "error"
        movie.last_error = str(e)
        await db.commit()
        await _log(db, "error", "movie", movie.title, str(e))
        await notifications.notify(settings, "error", movie.title, str(e))


async def _finalize_movie(db: AsyncSession, movie: Movie, rd: RealDebridClient, settings: dict, torrent_info: dict):
    torrent_name = torrent_info.get("filename", "")
    mount_path = settings.get("rd_mount_path", "/mnt/zurg/torrents")
    movies_path = settings.get("movies_path", "/media/movies")
    download_mode = settings.get("rd_download_mode", "symlink")

    if download_mode == "symlink":
        source = sym.find_in_mount(mount_path, torrent_name)
        if not source:
            movie.last_error = f"Could not find '{torrent_name}' in mount at {mount_path}"
            movie.status = "error"
            await db.commit()
            await _log(db, "error", "movie", movie.title, movie.last_error)
            return

        link = sym.create_movie_symlink(movies_path, movie.title, movie.year, source)
        if link:
            movie.symlink_path = link
            movie.file_path = source
            movie.status = "downloaded"
            movie.downloaded_at = datetime.now(timezone.utc)
            await db.commit()
            await _log(db, "download", "movie", movie.title, f"Symlinked to {link}")
            await notifications.notify(settings, "download", movie.title, f"Downloaded and symlinked!")
            await media_server.refresh_media_server(settings, link, "movie")
        else:
            movie.status = "error"
            movie.last_error = "No video file found in torrent"
            await db.commit()
    else:
        # Direct download via RD link
        links = torrent_info.get("links", [])
        if links:
            unrestricted = await rd.unrestrict_link(links[0])
            download_url = unrestricted.get("download", "")
            movie.file_path = download_url
            movie.status = "downloaded"
            movie.downloaded_at = datetime.now(timezone.utc)
            await db.commit()
            await notifications.notify(settings, "download", movie.title, "Download link ready")


async def grab_episode(db: AsyncSession, episode: Episode, show: Show):
    settings = await get_all_settings(db)
    rd_key = settings.get("rd_api_key", "")
    if not rd_key:
        return

    imdb_id = show.imdb_id
    if not imdb_id:
        await _log(db, "error", "episode", f"{show.title} S{episode.season_number:02d}E{episode.episode_number:02d}", "No IMDB ID")
        return

    rd = RealDebridClient(rd_key)

    title_tag = f"{show.title} S{episode.season_number:02d}E{episode.episode_number:02d}"
    episode.status = "searching"
    episode.search_attempts = (episode.search_attempts or 0) + 1
    await db.commit()

    streams = await _get_streams(
        settings, imdb_id, "show",
        title=show.title, year=show.year,
        season=episode.season_number, episode=episode.episode_number,
    )
    if not streams:
        episode.status = "wanted"
        episode.last_error = "No streams found"
        await db.commit()
        return

    torrentio = TorrentioClient()
    stream = torrentio.pick_best_stream(streams, episode.quality_profile or show.quality_profile or "1080p")
    if not stream:
        episode.status = "wanted"
        episode.last_error = "No matching stream for quality profile"
        await db.commit()
        return

    magnet = torrentio.get_magnet(stream)
    if not magnet:
        episode.status = "wanted"
        await db.commit()
        return

    info_hash = stream.get("infoHash", "").lower()
    await _log(db, "grab", "episode", title_tag, f"Grabbing {stream.get('title', info_hash)[:80]}")
    await notifications.notify(settings, "grab", title_tag, f"Grabbing {stream.get('title', '')[:60]}")

    try:
        avail = await rd.check_instant_availability([info_hash])
        is_instant = bool(avail.get(info_hash, {}).get("rd"))

        torrent_info = await rd.add_and_select(magnet)
        torrent_id = torrent_info["id"]
        torrent_name = torrent_info.get("filename", "")

        episode.status = "downloading"
        episode.rd_torrent_id = torrent_id
        episode.rd_torrent_hash = info_hash
        episode.rd_filename = torrent_name
        await db.commit()

        dl = Download(
            media_type="episode",
            media_id=episode.id,
            media_title=title_tag,
            rd_torrent_id=torrent_id,
            rd_torrent_hash=info_hash,
            torrent_name=torrent_name,
            status="downloading",
        )
        db.add(dl)
        await db.commit()

        if not is_instant:
            return

        await _finalize_episode(db, episode, show, rd, settings, torrent_info)

    except RealDebridError as e:
        episode.status = "error"
        episode.last_error = str(e)
        await db.commit()


async def _finalize_episode(
    db: AsyncSession,
    episode: Episode,
    show: Show,
    rd: RealDebridClient,
    settings: dict,
    torrent_info: dict,
):
    torrent_name = torrent_info.get("filename", "")
    mount_path = settings.get("rd_mount_path", "/mnt/zurg/torrents")
    shows_path = settings.get("shows_path", "/media/shows")
    download_mode = settings.get("rd_download_mode", "symlink")
    title_tag = f"{show.title} S{episode.season_number:02d}E{episode.episode_number:02d}"

    if download_mode == "symlink":
        source = sym.find_in_mount(mount_path, torrent_name)
        if not source:
            episode.status = "error"
            episode.last_error = f"Could not find '{torrent_name}' in mount"
            await db.commit()
            return

        link = sym.create_episode_symlink(
            shows_path,
            show.title,
            show.year,
            episode.season_number,
            episode.episode_number,
            episode.title,
            source,
        )
        if link:
            episode.symlink_path = link
            episode.file_path = source
            episode.status = "downloaded"
            episode.downloaded_at = datetime.now(timezone.utc)
            await db.commit()
            await _log(db, "download", "episode", title_tag, f"Symlinked to {link}")
            await notifications.notify(settings, "download", title_tag, "Downloaded and symlinked!")
            await media_server.refresh_media_server(settings, link, "show")
        else:
            episode.status = "error"
            episode.last_error = "No video file found in torrent"
            await db.commit()
    else:
        links = torrent_info.get("links", [])
        if links:
            unrestricted = await rd.unrestrict_link(links[0])
            episode.file_path = unrestricted.get("download", "")
            episode.status = "downloaded"
            episode.downloaded_at = datetime.now(timezone.utc)
            await db.commit()


async def monitor_downloading(db: AsyncSession):
    """Check all in-progress downloads and finalize when ready."""
    settings = await get_all_settings(db)
    rd_key = settings.get("rd_api_key", "")
    if not rd_key:
        return
    rd = RealDebridClient(rd_key)

    # Monitor movies
    result = await db.execute(select(Movie).where(Movie.status == "downloading"))
    movies = result.scalars().all()
    for movie in movies:
        if not movie.rd_torrent_id:
            continue
        try:
            info = await rd.get_torrent_info(movie.rd_torrent_id)
            if info.get("status") == "downloaded":
                await _finalize_movie(db, movie, rd, settings, info)
            elif info.get("status") in ("error", "dead", "magnet_error"):
                movie.status = "error"
                movie.last_error = f"RD status: {info.get('status')}"
                await db.commit()
        except Exception as e:
            movie.last_error = str(e)
            await db.commit()

    # Monitor episodes
    result = await db.execute(select(Episode).where(Episode.status == "downloading"))
    episodes = result.scalars().all()
    for episode in episodes:
        if not episode.rd_torrent_id:
            continue
        try:
            info = await rd.get_torrent_info(episode.rd_torrent_id)
            if info.get("status") == "downloaded":
                show_result = await db.execute(select(Show).where(Show.id == episode.show_id))
                show = show_result.scalar_one_or_none()
                if show:
                    await _finalize_episode(db, episode, show, rd, settings, info)
            elif info.get("status") in ("error", "dead", "magnet_error"):
                episode.status = "error"
                episode.last_error = f"RD status: {info.get('status')}"
                await db.commit()
        except Exception as e:
            episode.last_error = str(e)
            await db.commit()
