import { useState } from "react";
import { MoreVertical, Search, RefreshCw, Trash2, Eye, EyeOff } from "lucide-react";
import { StatusBadge, QualityBadge } from "../ui/Badge";
import type { Movie, Show } from "../../types";

const TMDB_IMG = "https://image.tmdb.org/t/p/w300";

interface MovieCardProps {
  movie: Movie;
  onSearch: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  onToggleMonitor: () => void;
  onClick: () => void;
}

export function MovieCard({ movie, onSearch, onDelete, onRefresh, onToggleMonitor, onClick }: MovieCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const posterUrl = movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : null;

  return (
    <div
      className="group relative overflow-hidden cursor-pointer transition-all duration-200"
      style={{
        borderRadius: 14,
        background: "#0c0e1a",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.12)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.5)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.06)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)"; }}
    >
      {/* Poster */}
      <div className="aspect-[2/3] relative" onClick={onClick}>
        {posterUrl ? (
          <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
            <span className="text-slate-600 text-xs text-center leading-relaxed">{movie.title}</span>
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, transparent 70%)" }}
        />

        {/* Badges — slide up on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <StatusBadge status={movie.status} />
            <QualityBadge quality={movie.quality_profile} />
          </div>
        </div>

        {/* Unmonitored pill */}
        {!movie.monitor && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
            style={{ background: "rgba(0,0,0,0.7)", color: "#64748b", backdropFilter: "blur(4px)" }}>
            Unmonitored
          </div>
        )}
      </div>

      {/* Info strip */}
      <div className="px-2.5 py-2">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0" onClick={onClick}>
            <p className="text-xs font-semibold text-slate-200 truncate leading-tight">{movie.title}</p>
            <p className="text-[10px] text-slate-600 font-mono mt-0.5">{movie.year}</p>
          </div>
          {/* Context menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
              className="w-6 h-6 rounded-md flex items-center justify-center text-slate-600 hover:text-slate-300 transition-colors"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <MoreVertical style={{ width: 12, height: 12 }} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-36 py-1 z-20"
                style={{ background: "#111422", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}
              >
                <MenuItem icon={<Search style={{ width: 12, height: 12 }} />} label="Search"  onClick={() => { setMenuOpen(false); onSearch(); }} />
                <MenuItem icon={<RefreshCw style={{ width: 12, height: 12 }} />} label="Refresh" onClick={() => { setMenuOpen(false); onRefresh(); }} />
                <MenuItem
                  icon={movie.monitor ? <EyeOff style={{ width: 12, height: 12 }} /> : <Eye style={{ width: 12, height: 12 }} />}
                  label={movie.monitor ? "Unmonitor" : "Monitor"}
                  onClick={() => { setMenuOpen(false); onToggleMonitor(); }}
                />
                <div className="my-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />
                <MenuItem icon={<Trash2 style={{ width: 12, height: 12 }} />} label="Remove" danger onClick={() => { setMenuOpen(false); onDelete(); }} />
              </div>
            )}
          </div>
        </div>
      </div>
      {menuOpen && <div className="fixed inset-0 z-[9]" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface ShowCardProps {
  show: Show;
  onSearch: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  onToggleMonitor: () => void;
  onClick: () => void;
}

export function ShowCard({ show, onSearch, onDelete, onRefresh, onToggleMonitor, onClick }: ShowCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const posterUrl = show.poster_path ? `${TMDB_IMG}${show.poster_path}` : null;

  return (
    <div
      className="group relative overflow-hidden cursor-pointer transition-all duration-200"
      style={{ borderRadius: 14, background: "#0c0e1a", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.12)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.5)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.06)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)"; }}
    >
      <div className="aspect-[2/3] relative" onClick={onClick}>
        {posterUrl ? (
          <img src={posterUrl} alt={show.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
            <span className="text-slate-600 text-xs text-center leading-relaxed">{show.title}</span>
          </div>
        )}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, transparent 70%)" }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
          <QualityBadge quality={show.quality_profile} />
        </div>
        {!show.monitor && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
            style={{ background: "rgba(0,0,0,0.7)", color: "#64748b", backdropFilter: "blur(4px)" }}>
            Unmonitored
          </div>
        )}
      </div>

      <div className="px-2.5 py-2">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0" onClick={onClick}>
            <p className="text-xs font-semibold text-slate-200 truncate leading-tight">{show.title}</p>
            <p className="text-[10px] text-slate-600 font-mono mt-0.5">{show.year} · {show.total_seasons}s</p>
          </div>
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
              className="w-6 h-6 rounded-md flex items-center justify-center text-slate-600 hover:text-slate-300 transition-colors"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <MoreVertical style={{ width: 12, height: 12 }} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 py-1 z-20"
                style={{ background: "#111422", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
                <MenuItem icon={<Search style={{ width: 12, height: 12 }} />} label="Search"  onClick={() => { setMenuOpen(false); onSearch(); }} />
                <MenuItem icon={<RefreshCw style={{ width: 12, height: 12 }} />} label="Refresh" onClick={() => { setMenuOpen(false); onRefresh(); }} />
                <MenuItem icon={show.monitor ? <EyeOff style={{ width: 12, height: 12 }} /> : <Eye style={{ width: 12, height: 12 }} />}
                  label={show.monitor ? "Unmonitor" : "Monitor"}
                  onClick={() => { setMenuOpen(false); onToggleMonitor(); }} />
                <div className="my-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />
                <MenuItem icon={<Trash2 style={{ width: 12, height: 12 }} />} label="Remove" danger onClick={() => { setMenuOpen(false); onDelete(); }} />
              </div>
            )}
          </div>
        </div>
      </div>
      {menuOpen && <div className="fixed inset-0 z-[9]" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}

function MenuItem({ icon, label, danger, onClick }: { icon: React.ReactNode; label: string; danger?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors"
      style={{ color: danger ? "#f87171" : "#94a3b8" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = danger ? "rgba(248,113,113,0.08)" : "rgba(255,255,255,0.04)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >
      {icon} {label}
    </button>
  );
}
