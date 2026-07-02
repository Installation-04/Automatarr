import os
import re
from pathlib import Path
from typing import Optional


def sanitize_name(name: str) -> str:
    # Strip filesystem-unsafe chars AND path separators to prevent traversal
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", name)
    name = name.replace("..", "")
    return name.strip().strip(".")


def find_video_file(directory: str) -> Optional[str]:
    """Find the largest video file in a directory tree."""
    video_exts = {".mkv", ".mp4", ".avi", ".m4v", ".mov", ".wmv", ".ts", ".m2ts"}
    best = None
    best_size = 0
    for root, _, files in os.walk(directory):
        for f in files:
            if Path(f).suffix.lower() in video_exts:
                path = os.path.join(root, f)
                size = os.path.getsize(path)
                if size > best_size:
                    best_size = size
                    best = path
    return best


def find_in_mount(mount_path: str, torrent_name: str) -> Optional[str]:
    """Locate the torrent folder or file in an rclone/Zurg mount."""
    safe_name = sanitize_name(torrent_name)
    candidate = os.path.join(mount_path, safe_name)
    # Ensure we never escape the mount root
    if not os.path.abspath(candidate).startswith(os.path.abspath(mount_path)):
        return None
    if os.path.isdir(candidate):
        return candidate
    if os.path.isfile(candidate):
        return candidate
    # Fuzzy match: first directory that starts with torrent name (truncated)
    prefix = safe_name[:20].lower()
    try:
        for entry in os.scandir(mount_path):
            if entry.name.lower().startswith(prefix):
                return entry.path
    except PermissionError:
        pass
    return None


def create_movie_symlink(
    movies_path: str,
    title: str,
    year: Optional[int],
    source_path: str,
) -> Optional[str]:
    """Create a symlink for a movie in the library directory."""
    folder_name = sanitize_name(f"{title} ({year})" if year else title)
    dest_dir = os.path.join(movies_path, folder_name)
    os.makedirs(dest_dir, exist_ok=True)

    if os.path.isdir(source_path):
        video = find_video_file(source_path)
    else:
        video = source_path if Path(source_path).suffix.lower() in {
            ".mkv", ".mp4", ".avi", ".m4v", ".mov", ".wmv"
        } else None

    if not video:
        return None

    ext = Path(video).suffix
    link_name = sanitize_name(f"{title} ({year})" if year else title) + ext
    link_path = os.path.join(dest_dir, link_name)

    if os.path.islink(link_path):
        os.remove(link_path)

    try:
        os.symlink(video, link_path)
    except OSError:
        return None
    return link_path


def create_episode_symlink(
    shows_path: str,
    show_title: str,
    year: Optional[int],
    season_number: int,
    episode_number: int,
    episode_title: Optional[str],
    source_path: str,
) -> Optional[str]:
    """Create a symlink for an episode in the library directory."""
    show_folder = sanitize_name(f"{show_title} ({year})" if year else show_title)
    season_folder = f"Season {season_number:02d}"
    dest_dir = os.path.join(shows_path, show_folder, season_folder)
    os.makedirs(dest_dir, exist_ok=True)

    if os.path.isdir(source_path):
        video = find_video_file(source_path)
    else:
        video = source_path if Path(source_path).suffix.lower() in {
            ".mkv", ".mp4", ".avi", ".m4v", ".mov", ".wmv"
        } else None

    if not video:
        return None

    ext = Path(video).suffix
    ep_tag = f"S{season_number:02d}E{episode_number:02d}"
    ep_name = f"{show_title} - {ep_tag}"
    if episode_title:
        ep_name += f" - {sanitize_name(episode_title)}"
    link_name = ep_name + ext
    link_path = os.path.join(dest_dir, link_name)

    if os.path.islink(link_path):
        os.remove(link_path)

    try:
        os.symlink(video, link_path)
    except OSError:
        return None
    return link_path


def remove_symlink(path: str) -> bool:
    if os.path.islink(path):
        os.remove(path)
        return True
    return False
