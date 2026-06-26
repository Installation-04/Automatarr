import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Search, RefreshCw, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { StatusBadge, QualityBadge } from "../ui/Badge";
import { getShow, searchShow, toggleSeasonMonitor } from "../../api";
import type { Movie, Show, Season, Episode } from "../../types";
import toast from "react-hot-toast";

const TMDB_IMG_BACK   = "https://image.tmdb.org/t/p/w1280";
const TMDB_IMG_POSTER = "https://image.tmdb.org/t/p/w500";

// ── Movie Detail ───────────────────────────────────────────────────────────────

interface MovieDetailProps {
  movie: Movie;
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
  onRefresh: () => void;
}

export function MovieDetailModal({ movie, open, onClose, onSearch, onRefresh }: MovieDetailProps) {
  return (
    <Modal open={open} onClose={onClose} size="xl">
      <div>
        {/* Backdrop */}
        {movie.backdrop_path && (
          <div className="relative h-48 overflow-hidden" style={{ borderRadius: "20px 20px 0 0" }}>
            <img src={`${TMDB_IMG_BACK}${movie.backdrop_path}`} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0c0e1a 0%, rgba(12,14,26,0.6) 60%, transparent 100%)" }} />
          </div>
        )}

        <div className={`flex gap-6 p-6 ${movie.backdrop_path ? "-mt-20 relative" : ""}`}>
          {movie.poster_path && (
            <img
              src={`${TMDB_IMG_POSTER}${movie.poster_path}`}
              alt={movie.title}
              className="w-32 h-48 object-cover flex-shrink-0"
              style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
            />
          )}

          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-slate-100 leading-tight mb-0.5">{movie.title}</h2>
            <p className="text-sm text-slate-500 mb-3">
              {movie.year}
              {movie.runtime && ` · ${movie.runtime} min`}
              {movie.genres && ` · ${movie.genres.split(",").slice(0, 3).join(", ")}`}
            </p>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <StatusBadge status={movie.status} />
              <QualityBadge quality={movie.quality_profile} />
              {movie.rating != null && (
                <span className="flex items-center gap-1 text-xs font-bold" style={{ color: "#fbbf24" }}>
                  <Star style={{ width: 11, height: 11, fill: "currentColor" }} /> {movie.rating.toFixed(1)}
                </span>
              )}
            </div>

            {movie.overview && (
              <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed mb-4">{movie.overview}</p>
            )}

            {movie.last_error && (
              <div className="mb-4 p-3 rounded-xl text-xs text-red-400" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)" }}>
                {movie.last_error}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="primary" size="sm" icon={<Search style={{ width: 13, height: 13 }} />} onClick={onSearch}>Search</Button>
              <Button size="sm" icon={<RefreshCw style={{ width: 13, height: 13 }} />} onClick={onRefresh}>Refresh</Button>
            </div>
          </div>
        </div>

        {/* Meta grid */}
        <div className="px-6 pb-6">
          <div
            className="grid grid-cols-2 gap-3 p-4 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            {movie.symlink_path && <MetaItem label="Symlink" value={movie.symlink_path} mono />}
            {movie.imdb_id && <MetaItem label="IMDB" value={movie.imdb_id} />}
            <MetaItem label="Added" value={movie.added_at ? new Date(movie.added_at).toLocaleDateString() : "—"} />
            {movie.downloaded_at && <MetaItem label="Downloaded" value={new Date(movie.downloaded_at).toLocaleDateString()} />}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Show Detail ────────────────────────────────────────────────────────────────

interface ShowDetailProps {
  show: Show;
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
  onRefresh: () => void;
}

export function ShowDetailModal({ show, open, onClose, onSearch, onRefresh }: ShowDetailProps) {
  const qc = useQueryClient();
  const { data: full } = useQuery({
    queryKey: ["show", show.id],
    queryFn: () => getShow(show.id),
    enabled: open,
  });

  const toggleMonitor = useMutation({
    mutationFn: ({ seasonNum, monitor }: { seasonNum: number; monitor: boolean }) =>
      toggleSeasonMonitor(show.id, seasonNum, monitor),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["show", show.id] });
      toast.success("Season updated");
    },
  });

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <div>
        {show.backdrop_path && (
          <div className="relative h-48 overflow-hidden" style={{ borderRadius: "20px 20px 0 0" }}>
            <img src={`${TMDB_IMG_BACK}${show.backdrop_path}`} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0c0e1a 0%, rgba(12,14,26,0.6) 60%, transparent 100%)" }} />
          </div>
        )}

        <div className={`flex gap-6 p-6 ${show.backdrop_path ? "-mt-20 relative" : ""}`}>
          {show.poster_path && (
            <img
              src={`${TMDB_IMG_POSTER}${show.poster_path}`}
              alt={show.title}
              className="w-32 h-48 object-cover flex-shrink-0"
              style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-slate-100 leading-tight mb-0.5">{show.title}</h2>
            <p className="text-sm text-slate-500 mb-3">
              {show.year}
              {show.network && ` · ${show.network}`}
              {show.status && ` · ${show.status}`}
            </p>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <QualityBadge quality={show.quality_profile} />
              {show.rating != null && (
                <span className="flex items-center gap-1 text-xs font-bold" style={{ color: "#fbbf24" }}>
                  <Star style={{ width: 11, height: 11, fill: "currentColor" }} /> {show.rating.toFixed(1)}
                </span>
              )}
            </div>

            {show.overview && (
              <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed mb-4">{show.overview}</p>
            )}

            <div className="flex gap-2">
              <Button variant="primary" size="sm" icon={<Search style={{ width: 13, height: 13 }} />} onClick={onSearch}>Search All</Button>
              <Button size="sm" icon={<RefreshCw style={{ width: 13, height: 13 }} />} onClick={onRefresh}>Refresh</Button>
            </div>
          </div>
        </div>

        {/* Seasons */}
        <div className="px-6 pb-6 space-y-2">
          <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Seasons</p>
          {(full?.seasons ?? show.seasons ?? []).map((season: Season) => (
            <SeasonRow
              key={season.id}
              season={season}
              onToggleMonitor={(m) => toggleMonitor.mutate({ seasonNum: season.season_number, monitor: m })}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ── Season Row ─────────────────────────────────────────────────────────────────

function SeasonRow({ season, onToggleMonitor }: { season: Season; onToggleMonitor: (m: boolean) => void }) {
  const [expanded, setExpanded] = useState(false);
  const episodes = season.episodes ?? [];
  const downloaded = episodes.filter((e) => e.status === "downloaded").length;
  const pct = episodes.length > 0 ? (downloaded / episodes.length) * 100 : 0;

  return (
    <div className="rounded-2xl overflow-hidden transition-all" style={{ background: "#111422", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0"
          >
            {expanded
              ? <ChevronUp style={{ width: 15, height: 15 }} />
              : <ChevronDown style={{ width: 15, height: 15 }} />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-slate-300">{season.name || `Season ${season.season_number}`}</span>
              <span className="text-[10px] font-mono text-slate-600">{downloaded}/{episodes.length}</span>
            </div>
            {episodes.length > 0 && (
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: "linear-gradient(90deg, #6d28d9, #818cf8)",
                    boxShadow: pct > 0 ? "0 0 6px rgba(109,40,217,0.4)" : "none",
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => onToggleMonitor(!season.monitor)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ml-3"
          style={{
            background: season.monitor ? "rgba(124,58,237,0.1)" : "rgba(255,255,255,0.04)",
            color: season.monitor ? "#a78bfa" : "#64748b",
            border: season.monitor ? "1px solid rgba(124,58,237,0.2)" : "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {season.monitor
            ? <Eye style={{ width: 12, height: 12 }} />
            : <EyeOff style={{ width: 12, height: 12 }} />}
          {season.monitor ? "Monitored" : "Unmonitored"}
        </button>
      </div>

      {expanded && episodes.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {episodes.map((ep: Episode) => (
            <div
              key={ep.id}
              className="flex items-center justify-between px-4 py-2.5 transition-colors"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-mono font-bold text-slate-600 flex-shrink-0">
                  S{ep.season_number.toString().padStart(2, "0")}E{ep.episode_number.toString().padStart(2, "0")}
                </span>
                <span className="text-xs text-slate-400 truncate">{ep.title || "TBA"}</span>
                {ep.air_date && (
                  <span className="text-[10px] text-slate-700 flex-shrink-0">{ep.air_date}</span>
                )}
              </div>
              <StatusBadge status={ep.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function MetaItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-0.5">{label}</p>
      <p className={`text-xs text-slate-400 break-all ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
