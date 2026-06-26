import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, LayoutGrid, List, Search } from "lucide-react";
import { getMovies, deleteMovie, searchMovie, refreshMovie, updateMovie } from "../api";
import { MovieCard } from "../components/media/PosterCard";
import { MovieDetailModal } from "../components/media/MediaDetailModal";
import { AddMediaModal } from "../components/media/AddMediaModal";
import { Button } from "../components/ui/Button";
import { PageSpinner } from "../components/ui/Spinner";
import { StatusBadge, QualityBadge } from "../components/ui/Badge";
import type { Movie } from "../types";
import toast from "react-hot-toast";

const STATUS_FILTERS = ["all", "wanted", "downloading", "downloaded", "error"] as const;

const FILTER_COLORS: Record<string, { color: string; bg: string }> = {
  all:         { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  wanted:      { color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  downloading: { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  downloaded:  { color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  error:       { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

export function Movies() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [detailMovie, setDetailMovie] = useState<Movie | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data: movies = [], isLoading } = useQuery({
    queryKey: ["movies"],
    queryFn: getMovies,
    refetchInterval: 15000,
  });

  const deleteMut  = useMutation({ mutationFn: deleteMovie,  onSuccess: () => { qc.invalidateQueries({ queryKey: ["movies"] }); toast.success("Removed"); } });
  const searchMut  = useMutation({ mutationFn: searchMovie,  onSuccess: () => { qc.invalidateQueries({ queryKey: ["movies"] }); toast.success("Search queued"); } });
  const refreshMut = useMutation({ mutationFn: refreshMovie, onSuccess: () => { qc.invalidateQueries({ queryKey: ["movies"] }); toast.success("Refreshed"); } });
  const toggleMut  = useMutation({
    mutationFn: ({ id, monitor }: { id: number; monitor: boolean }) => updateMovie(id, { monitor }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["movies"] }),
  });

  const filtered = movies
    .filter((m) => statusFilter === "all" || m.status === statusFilter)
    .filter((m) => !searchQuery || m.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isLoading) return <PageSpinner />;

  return (
    <div className="p-7 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono mb-1" style={{ fontSize: 9, color: "rgba(255,0,110,0.5)", letterSpacing: "0.2em" }}>// LIBRARY</p>
          <h1 className="font-display font-bold tracking-widest" style={{ fontSize: 28, background: "linear-gradient(90deg, #ff006e 0%, #b14fff 50%, #00f5ff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Movies</h1>
          <p className="font-mono mt-0.5" style={{ fontSize: 10, color: "rgba(212,200,240,0.35)", letterSpacing: "0.08em" }}>{movies.length} titles</p>
        </div>
        <Button variant="primary" icon={<Plus style={{ width: 15, height: 15 }} />} onClick={() => setAddOpen(true)}>
          Add Movie
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ width: 13, height: 13, color: "rgba(255,0,110,0.4)" }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter titles…"
            className="pl-8 pr-4 py-2 rounded-xl outline-none w-44 font-mono"
            style={{ fontSize: 12, background: "rgba(255,0,110,0.04)", border: "1px solid rgba(255,0,110,0.2)", color: "#d4c8f0" }}
          />
        </div>

        {/* Status pills */}
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((s) => {
            const active = statusFilter === s;
            const c = FILTER_COLORS[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-150"
                style={active ? { color: c.color, background: c.bg, border: `1px solid ${c.color}33` }
                              : { color: "#475569", background: "transparent", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                {s}
              </button>
            );
          })}
        </div>

        {/* View toggle */}
        <div className="ml-auto flex gap-1 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
          {([["grid", LayoutGrid], ["list", List]] as const).map(([v, Icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="p-1.5 rounded-md transition-all"
              style={view === v
                ? { background: "rgba(177,79,255,0.2)", color: "#b14fff" }
                : { color: "rgba(212,200,240,0.3)" }}
            >
              <Icon style={{ width: 15, height: 15 }} />
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🎬</p>
          <p className="font-display font-bold mb-1" style={{ fontSize: 13, color: "#ff006e", letterSpacing: "0.15em" }}>NO MOVIES FOUND</p>
          <p className="font-mono" style={{ fontSize: 10, color: "rgba(212,200,240,0.35)" }}>Add your first movie to get started</p>
          <Button variant="primary" className="mt-5" icon={<Plus style={{ width: 14, height: 14 }} />} onClick={() => setAddOpen(true)}>
            Add Movie
          </Button>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onClick={() => setDetailMovie(movie)}
              onSearch={() => searchMut.mutate(movie.id)}
              onDelete={() => deleteMut.mutate(movie.id)}
              onRefresh={() => refreshMut.mutate(movie.id)}
              onToggleMonitor={() => toggleMut.mutate({ id: movie.id, monitor: !movie.monitor })}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#0d0025", border: "1px solid rgba(255,0,110,0.12)" }}>
          {filtered.map((movie) => (
            <div
              key={movie.id}
              className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors"
              style={{ borderBottom: "1px solid rgba(255,0,110,0.06)" }}
              onClick={() => setDetailMovie(movie)}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,0,110,0.03)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#d4c8f0" }}>{movie.title}</p>
                <p className="font-mono mt-0.5" style={{ fontSize: 10, color: "rgba(212,200,240,0.35)" }}>{movie.year}</p>
              </div>
              <StatusBadge status={movie.status} />
              <QualityBadge quality={movie.quality_profile} />
              <button
                onClick={(e) => { e.stopPropagation(); searchMut.mutate(movie.id); }}
                className="font-mono transition-colors px-2 py-1 rounded"
                style={{ fontSize: 9, letterSpacing: "0.1em", color: "rgba(177,79,255,0.7)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#b14fff"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(177,79,255,0.7)"; }}
              >
                Search
              </button>
            </div>
          ))}
        </div>
      )}

      <AddMediaModal open={addOpen} onClose={() => setAddOpen(false)} type="movie" />
      {detailMovie && (
        <MovieDetailModal
          movie={detailMovie}
          open
          onClose={() => setDetailMovie(null)}
          onSearch={() => { searchMut.mutate(detailMovie.id); setDetailMovie(null); }}
          onRefresh={() => refreshMut.mutate(detailMovie.id)}
        />
      )}
    </div>
  );
}
