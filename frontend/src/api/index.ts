import client from "./client";
import type { Movie, Show, Download, ActivityLog, DashboardData, SearchResult, Settings } from "../types";

// ── Movies ──────────────────────────────────────────────────
export const getMovies = () => client.get<Movie[]>("/movies").then((r) => r.data);

export const addMovie = (tmdb_id: number, quality_profile: string, monitor: boolean) =>
  client.post<Movie>("/movies", { tmdb_id, quality_profile, monitor }).then((r) => r.data);

export const updateMovie = (id: number, data: Partial<Movie>) =>
  client.put<Movie>(`/movies/${id}`, data).then((r) => r.data);

export const deleteMovie = (id: number) =>
  client.delete(`/movies/${id}`).then((r) => r.data);

export const searchMovie = (id: number) =>
  client.post(`/movies/${id}/search`).then((r) => r.data);

export const refreshMovie = (id: number) =>
  client.post(`/movies/${id}/refresh`).then((r) => r.data);

export const getMovieStats = () =>
  client.get("/movies/stats").then((r) => r.data);

// ── Shows ───────────────────────────────────────────────────
export const getShows = () => client.get<Show[]>("/shows").then((r) => r.data);

export const getShow = (id: number) => client.get<Show>(`/shows/${id}`).then((r) => r.data);

export const addShow = (tmdb_id: number, quality_profile: string, monitor: boolean, monitor_new_seasons: boolean) =>
  client.post<Show>("/shows", { tmdb_id, quality_profile, monitor, monitor_new_seasons }).then((r) => r.data);

export const updateShow = (id: number, data: Partial<Show>) =>
  client.put<Show>(`/shows/${id}`, data).then((r) => r.data);

export const deleteShow = (id: number) =>
  client.delete(`/shows/${id}`).then((r) => r.data);

export const searchShow = (id: number) =>
  client.post(`/shows/${id}/search`).then((r) => r.data);

export const refreshShow = (id: number) =>
  client.post(`/shows/${id}/refresh`).then((r) => r.data);

export const toggleSeasonMonitor = (showId: number, seasonNumber: number, monitor: boolean) =>
  client.put(`/shows/${showId}/seasons/${seasonNumber}/monitor`, null, { params: { monitor } }).then((r) => r.data);

// ── Search ──────────────────────────────────────────────────
export const searchMovies = (q: string) =>
  client.get<SearchResult[]>("/search/movies", { params: { q } }).then((r) => r.data);

export const searchShows = (q: string) =>
  client.get<SearchResult[]>("/search/shows", { params: { q } }).then((r) => r.data);

// ── Downloads ───────────────────────────────────────────────
export const getDownloads = () =>
  client.get<Download[]>("/downloads").then((r) => r.data);

export const getActivity = (limit?: number) =>
  client.get<ActivityLog[]>("/downloads/activity", { params: { limit } }).then((r) => r.data);

export const getRDQueue = () =>
  client.get("/downloads/rd/queue").then((r) => r.data);

// ── Dashboard ────────────────────────────────────────────────
export const getDashboard = () =>
  client.get<DashboardData>("/system/dashboard").then((r) => r.data);

export const triggerSearchAll = () =>
  client.post("/system/search/all").then((r) => r.data);

// ── Calendar ────────────────────────────────────────────────
export const getCalendar = (start: string, end: string) =>
  client.get("/calendar", { params: { start, end } }).then((r) => r.data);

// ── Settings ─────────────────────────────────────────────────
export const getSettings = () =>
  client.get<Settings>("/settings/raw").then((r) => r.data);

export const updateSettings = (data: Partial<Settings>) =>
  client.put("/settings", data).then((r) => r.data);

export const testRealDebrid = () =>
  client.post("/settings/test/realdebrid").then((r) => r.data);

export const testPlex = () =>
  client.post("/settings/test/plex").then((r) => r.data);

export const testJellyfin = () =>
  client.post("/settings/test/jellyfin").then((r) => r.data);

export const testEmby = () =>
  client.post("/settings/test/emby").then((r) => r.data);
