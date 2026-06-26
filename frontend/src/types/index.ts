export type MediaStatus =
  | "wanted"
  | "searching"
  | "downloading"
  | "downloaded"
  | "error"
  | "ignored"
  | "missing";

export type QualityProfile = "4k" | "1080p" | "720p" | "any";

export interface Movie {
  id: number;
  tmdb_id: number;
  imdb_id: string | null;
  title: string;
  year: number | null;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: string | null;
  runtime: number | null;
  rating: number | null;
  status: MediaStatus;
  quality_profile: QualityProfile;
  monitor: boolean;
  rd_torrent_id: string | null;
  symlink_path: string | null;
  file_size: number | null;
  last_error: string | null;
  search_attempts: number;
  added_at: string | null;
  downloaded_at: string | null;
}

export interface Show {
  id: number;
  tmdb_id: number;
  imdb_id: string | null;
  title: string;
  year: number | null;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: string | null;
  status: string | null;
  network: string | null;
  rating: number | null;
  monitor: boolean;
  quality_profile: QualityProfile;
  monitor_new_seasons: boolean;
  total_seasons: number | null;
  total_episodes: number | null;
  added_at: string | null;
  seasons?: Season[];
}

export interface Season {
  id: number;
  show_id: number;
  season_number: number;
  name: string | null;
  overview: string | null;
  poster_path: string | null;
  episode_count: number | null;
  monitor: boolean;
  episodes?: Episode[];
}

export interface Episode {
  id: number;
  show_id: number;
  season_id: number;
  season_number: number;
  episode_number: number;
  title: string | null;
  overview: string | null;
  still_path: string | null;
  air_date: string | null;
  runtime: number | null;
  rating: number | null;
  status: MediaStatus;
  monitor: boolean;
  quality_profile: QualityProfile;
  symlink_path: string | null;
  last_error: string | null;
  downloaded_at: string | null;
}

export interface Download {
  id: number;
  media_type: string;
  media_id: number;
  media_title: string | null;
  rd_torrent_id: string | null;
  torrent_name: string | null;
  filename: string | null;
  size: number | null;
  progress: number;
  speed: number | null;
  status: string;
  error_message: string | null;
  added_at: string | null;
  completed_at: string | null;
}

export interface ActivityLog {
  id: number;
  event_type: string;
  media_type: string | null;
  media_title: string | null;
  message: string;
  created_at: string | null;
}

export interface DashboardData {
  movies: {
    total: number;
    downloaded: number;
    wanted: number;
    downloading: number;
  };
  shows: {
    total: number;
    episodes_total: number;
    episodes_downloaded: number;
    episodes_wanted: number;
    episodes_downloading: number;
  };
  recent_activity: ActivityLog[];
  upcoming: UpcomingEpisode[];
}

export interface UpcomingEpisode {
  show_title: string;
  show_poster: string | null;
  season_number: number;
  episode_number: number;
  episode_title: string | null;
  air_date: string;
  status: string;
  show_id: number;
}

export interface SearchResult {
  tmdb_id: number;
  title: string;
  year: number | null;
  overview: string | null;
  poster_path: string | null;
  rating: number | null;
  already_added: boolean;
}

export interface Settings {
  [key: string]: string;
}
