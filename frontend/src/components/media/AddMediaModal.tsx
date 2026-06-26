import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Check } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Select } from "../ui/Input";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { searchMovies, searchShows, addMovie, addShow } from "../../api";
import type { SearchResult } from "../../types";
import toast from "react-hot-toast";

const TMDB_IMG = "https://image.tmdb.org/t/p/w200";

interface Props {
  open: boolean;
  onClose: () => void;
  type: "movie" | "show";
}

export function AddMediaModal({ open, onClose, type }: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [quality, setQuality] = useState("1080p");
  const [monitor, setMonitor] = useState(true);
  const [focused, setFocused] = useState(false);
  const qc = useQueryClient();

  const debounce = useCallback((val: string) => {
    setQuery(val);
    const t = setTimeout(() => setDebouncedQ(val), 400);
    return () => clearTimeout(t);
  }, []);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["search", type, debouncedQ],
    queryFn: () => (type === "movie" ? searchMovies(debouncedQ) : searchShows(debouncedQ)),
    enabled: debouncedQ.length >= 2,
  });

  const addMutation = useMutation<unknown, Error, SearchResult>({
    mutationFn: (r: SearchResult) =>
      type === "movie"
        ? addMovie(r.tmdb_id, quality, monitor)
        : addShow(r.tmdb_id, quality, monitor, true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [type === "movie" ? "movies" : "shows"] });
      toast.success(`${type === "movie" ? "Movie" : "Show"} added!`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to add");
    },
  });

  const handleClose = () => {
    setQuery("");
    setDebouncedQ("");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={`Add ${type === "movie" ? "Movie" : "TV Show"}`} size="lg">
      <div className="p-6 space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" style={{ width: 15, height: 15 }} />
          <input
            autoFocus
            value={query}
            onChange={(e) => debounce(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={`Search for a ${type === "movie" ? "movie" : "TV show"}…`}
            className="w-full rounded-xl pl-9 pr-10 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: focused ? "1px solid rgba(124,58,237,0.5)" : "1px solid rgba(255,255,255,0.08)",
              boxShadow: focused ? "0 0 0 3px rgba(124,58,237,0.12)" : "none",
            }}
          />
          {isFetching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Spinner size={16} />
            </div>
          )}
        </div>

        {/* Options */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Select label="Quality" value={quality} onChange={(e) => setQuality(e.target.value)}>
              <option value="4k">4K</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="any">Any</option>
            </Select>
          </div>
          <button
            onClick={() => setMonitor((m) => !m)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all mb-0.5"
            style={{
              background: monitor ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)",
              border: monitor ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.08)",
              color: monitor ? "#a78bfa" : "#64748b",
            }}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: monitor ? "#7c3aed" : "rgba(255,255,255,0.15)", boxShadow: monitor ? "0 0 6px rgba(124,58,237,0.6)" : "none" }}
            />
            Monitor
          </button>
        </div>

        {/* Results */}
        {debouncedQ.length >= 2 && (
          <div className="space-y-2 max-h-[400px] overflow-y-auto -mx-6 px-6">
            {results.length === 0 && !isFetching && (
              <p className="text-center text-slate-600 py-8 text-sm">No results found</p>
            )}
            {results.map((r: SearchResult) => (
              <div
                key={r.tmdb_id}
                className="flex gap-3 p-3 rounded-2xl transition-all"
                style={{ background: "#111422", border: "1px solid rgba(255,255,255,0.06)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.06)"; }}
              >
                {r.poster_path ? (
                  <img
                    src={`${TMDB_IMG}${r.poster_path}`}
                    alt={r.title}
                    className="w-12 h-[72px] object-cover rounded-lg flex-shrink-0"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                ) : (
                  <div className="w-12 h-[72px] rounded-lg flex-shrink-0" style={{ background: "rgba(255,255,255,0.04)" }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{r.title}</p>
                      <p className="text-[11px] text-slate-600 font-mono mt-0.5">{r.year}</p>
                    </div>
                    {r.rating != null && (
                      <span className="text-xs font-bold flex-shrink-0" style={{ color: "#fbbf24" }}>
                        ★ {r.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">{r.overview}</p>
                </div>
                <div className="flex items-center flex-shrink-0">
                  {r.already_added ? (
                    <span className="flex items-center gap-1 text-xs font-bold" style={{ color: "#34d399" }}>
                      <Check style={{ width: 13, height: 13 }} /> Added
                    </span>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus style={{ width: 12, height: 12 }} />}
                      loading={addMutation.isPending}
                      onClick={() => addMutation.mutate(r)}
                    >
                      Add
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {debouncedQ.length < 2 && (
          <div className="py-10 text-center text-slate-700 text-sm">
            Type at least 2 characters to search
          </div>
        )}
      </div>
    </Modal>
  );
}
