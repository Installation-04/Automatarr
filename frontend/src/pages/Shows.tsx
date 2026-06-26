import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, LayoutGrid, List, Search } from "lucide-react";
import { getShows, deleteShow, searchShow, refreshShow, updateShow } from "../api";
import { ShowCard } from "../components/media/PosterCard";
import { ShowDetailModal } from "../components/media/MediaDetailModal";
import { AddMediaModal } from "../components/media/AddMediaModal";
import { Button } from "../components/ui/Button";
import { PageSpinner } from "../components/ui/Spinner";
import { QualityBadge } from "../components/ui/Badge";
import type { Show } from "../types";
import toast from "react-hot-toast";

export function Shows() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [detailShow, setDetailShow] = useState<Show | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data: shows = [], isLoading } = useQuery({
    queryKey: ["shows"],
    queryFn: getShows,
    refetchInterval: 15000,
  });

  const deleteMut = useMutation({
    mutationFn: deleteShow,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shows"] }); toast.success("Show removed"); },
  });

  const searchMut = useMutation({
    mutationFn: searchShow,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shows"] }); toast.success("Search queued"); },
  });

  const refreshMut = useMutation({
    mutationFn: refreshShow,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shows"] }); toast.success("Refreshed"); },
  });

  const toggleMonitor = useMutation({
    mutationFn: ({ id, monitor }: { id: number; monitor: boolean }) => updateShow(id, { monitor }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shows"] }),
  });

  const filtered = shows.filter(
    (s) => !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <PageSpinner />;

  return (
    <div className="p-7 space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono mb-1" style={{ fontSize: 9, color: "rgba(0,245,255,0.5)", letterSpacing: "0.2em" }}>// LIBRARY</p>
          <h1 className="font-display font-bold tracking-widest" style={{ fontSize: 28, background: "linear-gradient(90deg, #00f5ff 0%, #b14fff 50%, #ff006e 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>TV Shows</h1>
          <p className="font-mono mt-0.5" style={{ fontSize: 10, color: "rgba(212,200,240,0.35)", letterSpacing: "0.08em" }}>{shows.length} series</p>
        </div>
        <Button variant="primary" icon={<Plus style={{ width: 15, height: 15 }} />} onClick={() => setAddOpen(true)}>
          Add Show
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ width: 13, height: 13, color: "rgba(0,245,255,0.4)" }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter titles…"
            className="pl-8 pr-4 py-2 rounded-xl outline-none w-44 font-mono"
            style={{ fontSize: 12, background: "rgba(0,245,255,0.04)", border: "1px solid rgba(0,245,255,0.2)", color: "#d4c8f0" }}
          />
        </div>
        <div className="ml-auto flex gap-1 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
          {([["grid", LayoutGrid], ["list", List]] as const).map(([v, Icon]) => (
            <button key={v} onClick={() => setView(v)} className="p-1.5 rounded-md transition-all"
              style={view === v ? { background: "rgba(0,245,255,0.15)", color: "#00f5ff" } : { color: "rgba(212,200,240,0.3)" }}>
              <Icon style={{ width: 15, height: 15 }} />
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">📺</p>
          <p className="font-display font-bold mb-1" style={{ fontSize: 13, color: "#00f5ff", letterSpacing: "0.15em" }}>NO SHOWS FOUND</p>
          <Button variant="primary" className="mt-5" icon={<Plus style={{ width: 14, height: 14 }} />} onClick={() => setAddOpen(true)}>
            Add Show
          </Button>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((show) => (
            <ShowCard
              key={show.id}
              show={show}
              onClick={() => setDetailShow(show)}
              onSearch={() => searchMut.mutate(show.id)}
              onDelete={() => deleteMut.mutate(show.id)}
              onRefresh={() => refreshMut.mutate(show.id)}
              onToggleMonitor={() => toggleMonitor.mutate({ id: show.id, monitor: !show.monitor })}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#0d0025", border: "1px solid rgba(0,245,255,0.12)" }}>
          {filtered.map((show) => (
            <div
              key={show.id}
              className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors"
              style={{ borderBottom: "1px solid rgba(0,245,255,0.06)" }}
              onClick={() => setDetailShow(show)}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0,245,255,0.03)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "#d4c8f0" }}>{show.title}</p>
                <p className="font-mono mt-0.5" style={{ fontSize: 10, color: "rgba(212,200,240,0.35)" }}>{show.year} · {show.total_seasons} seasons</p>
              </div>
              <QualityBadge quality={show.quality_profile} />
            </div>
          ))}
        </div>
      )}

      <AddMediaModal open={addOpen} onClose={() => setAddOpen(false)} type="show" />
      {detailShow && (
        <ShowDetailModal
          show={detailShow}
          open
          onClose={() => setDetailShow(null)}
          onSearch={() => { searchMut.mutate(detailShow.id); setDetailShow(null); }}
          onRefresh={() => { refreshMut.mutate(detailShow.id); }}
        />
      )}
    </div>
  );
}
