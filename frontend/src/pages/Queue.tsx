import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDownloads, getActivity, getRDQueue } from "../api";
import { PageSpinner } from "../components/ui/Spinner";
import { format } from "date-fns";
import { ArrowDownToLine, Clock, Activity } from "lucide-react";

const EVENT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  grab:     { label: "Grab",    color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  download: { label: "Done",    color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  error:    { label: "Error",   color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  info:     { label: "Info",    color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  search:   { label: "Search",  color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  symlink:  { label: "Link",    color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
};

const STATUS_CFG: Record<string, { color: string; label: string }> = {
  queued:      { color: "#94a3b8", label: "Queued"      },
  downloading: { color: "#a78bfa", label: "Downloading" },
  downloaded:  { color: "#34d399", label: "Done"        },
  failed:      { color: "#f87171", label: "Failed"      },
  symlinked:   { color: "#34d399", label: "Symlinked"   },
};

const ALL_EVENT_TYPES = ["all", "grab", "download", "symlink", "error", "info", "search"] as const;

export function Queue() {
  const [activityFilter, setActivityFilter] = useState("all");

  const { data: downloads = [], isLoading: dlLoading } = useQuery({
    queryKey: ["downloads"],
    queryFn: getDownloads,
    refetchInterval: 10000,
  });

  const { data: activity = [], isLoading: actLoading } = useQuery({
    queryKey: ["activity"],
    queryFn: () => getActivity(100),
    refetchInterval: 15000,
  });

  const { data: rdQueue } = useQuery({
    queryKey: ["rd-queue"],
    queryFn: getRDQueue,
    refetchInterval: 30000,
  });

  if (dlLoading || actLoading) return <PageSpinner />;

  const active    = downloads.filter((d: any) => ["queued", "downloading"].includes(d.status));
  const completed = downloads.filter((d: any) => !["queued", "downloading"].includes(d.status));
  const filteredActivity = activityFilter === "all"
    ? activity
    : (activity as any[]).filter((log: any) => log.event_type === activityFilter);

  return (
    <div className="p-7 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="font-mono mb-1" style={{ fontSize: 9, color: "rgba(177,79,255,0.5)", letterSpacing: "0.2em" }}>// LIVE</p>
        <h1 className="font-display font-bold tracking-widest" style={{ fontSize: 28, background: "linear-gradient(90deg, #b14fff 0%, #ff006e 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Queue & Activity</h1>
      </div>

      {/* Active downloads */}
      <section className="space-y-3">
        <SectionHeader icon={<ArrowDownToLine style={{ width: 14, height: 14 }} />} title="Active" count={active.length} color="#a78bfa" />
        {active.length === 0 ? (
          <EmptyCard icon="💤" message="No active downloads right now" />
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: "#0d0025", border: "1px solid rgba(177,79,255,0.15)" }}>
            {active.map((dl: any) => {
              const st = STATUS_CFG[dl.status] ?? { color: "#94a3b8", label: dl.status };
              return (
                <div key={dl.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-semibold" style={{ color: "#d4c8f0" }}>{dl.media_title}</span>
                      <span className="ml-2 font-mono capitalize" style={{ fontSize: 10, color: "rgba(212,200,240,0.35)" }}>{dl.media_type}</span>
                    </div>
                    <span className="text-xs font-bold tracking-wide px-2 py-0.5 rounded-md"
                      style={{ color: st.color, background: `${st.color}18` }}>
                      {st.label}
                    </span>
                  </div>
                  {dl.torrent_name && (
                    <p className="font-mono truncate mb-3" style={{ fontSize: 10, color: "rgba(212,200,240,0.3)" }}>{dl.torrent_name}</p>
                  )}
                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${dl.progress ?? 0}%`,
                        background: "linear-gradient(90deg, #6d28d9, #818cf8)",
                        boxShadow: "0 0 8px rgba(109,40,217,0.4)",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="font-mono" style={{ fontSize: 9, color: "rgba(212,200,240,0.25)" }}>
                      {dl.added_at ? format(new Date(dl.added_at), "MMM d, HH:mm") : ""}
                    </span>
                    <span className="text-[11px] font-mono font-bold" style={{ color: "#a78bfa" }}>
                      {dl.progress?.toFixed(0) ?? 0}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Real-Debrid queue */}
      {Array.isArray(rdQueue) && rdQueue.length > 0 && (
        <section className="space-y-3">
          <SectionHeader icon={<Clock style={{ width: 14, height: 14 }} />} title="Real-Debrid" count={rdQueue.length} color="#60a5fa" />
          <div className="rounded-2xl overflow-hidden" style={{ background: "#0d0025", border: "1px solid rgba(0,245,255,0.12)" }}>
            {rdQueue.slice(0, 20).map((t: any, i: number) => {
              const pct = t.progress ?? 0;
              const isActive = t.status === "downloading";
              return (
                <div key={i} className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,245,255,0.06)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm truncate font-medium flex-1 min-w-0 mr-4" style={{ color: "#d4c8f0" }}>{t.filename || t.id}</p>
                    <div className="text-right flex-shrink-0 space-y-0.5">
                      <p className="font-mono capitalize" style={{ fontSize: 10, color: "#00f5ff" }}>{t.status}</p>
                      {t.bytes > 0 && (
                        <p className="font-mono" style={{ fontSize: 9, color: "rgba(0,245,255,0.4)" }}>{(t.bytes / 1e9).toFixed(2)} GB</p>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="relative h-1 rounded-full overflow-hidden" style={{ background: "rgba(0,245,255,0.08)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, #00f5ff, #b14fff)",
                        boxShadow: isActive ? "0 0 8px rgba(0,245,255,0.5)" : "none",
                      }}
                    />
                    {isActive && pct < 100 && (
                      <div
                        className="absolute inset-y-0 w-1/4 animate-download-scan rounded-full"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(0,245,255,0.4), transparent)" }}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono" style={{ fontSize: 9, color: "rgba(0,245,255,0.3)" }}>
                      {t.added ? format(new Date(t.added), "MMM d, HH:mm") : ""}
                    </span>
                    <span className="font-mono font-bold" style={{ fontSize: 9, color: "#00f5ff" }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Activity log */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <SectionHeader icon={<Activity style={{ width: 14, height: 14 }} />} title="Activity Log" color="#94a3b8" />
          {/* Event type filter pills */}
          <div className="flex gap-1.5 flex-wrap">
            {ALL_EVENT_TYPES.map((type) => {
              const cfg = EVENT_CONFIG[type] ?? { label: type, color: "#94a3b8", bg: "rgba(148,163,184,0.12)" };
              const active = activityFilter === type;
              return (
                <button
                  key={type}
                  onClick={() => setActivityFilter(type)}
                  className="px-2.5 py-1 rounded-lg font-mono font-bold capitalize transition-all duration-150"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    color: active ? cfg.color : "rgba(148,163,184,0.4)",
                    background: active ? cfg.bg : "transparent",
                    border: active ? `1px solid ${cfg.color}33` : "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {type === "all" ? "ALL" : cfg.label.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
        {filteredActivity.length === 0 ? (
          <EmptyCard icon="📋" message={activity.length === 0 ? "No activity recorded yet" : "No matching events"} />
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: "#0d0025", border: "1px solid rgba(255,0,110,0.12)" }}>
            {(filteredActivity as any[]).map((log: any) => {
              const cfg = EVENT_CONFIG[log.event_type] ?? { label: log.event_type, color: "#64748b", bg: "rgba(100,116,139,0.12)" };
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3.5 px-5 py-3.5 transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,0,110,0.06)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,0,110,0.03)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  <span
                    className="mt-0.5 flex-shrink-0 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase"
                    style={{ fontSize: 8, color: cfg.color, background: cfg.bg, minWidth: 44, textAlign: "center", border: `1px solid ${cfg.color}33` }}
                  >
                    {cfg.label}
                  </span>
                  <div className="flex-1 min-w-0 pt-0.5">
                    {log.media_title && (
                      <p className="text-sm font-semibold truncate" style={{ color: "#d4c8f0" }}>{log.media_title}</p>
                    )}
                    <p className="font-mono truncate mt-0.5" style={{ fontSize: 10, color: "rgba(212,200,240,0.3)" }}>{log.message}</p>
                  </div>
                  <p className="font-mono flex-shrink-0 pt-0.5" style={{ fontSize: 9, color: "rgba(212,200,240,0.25)" }}>
                    {log.created_at ? format(new Date(log.created_at), "MMM d, HH:mm") : ""}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionHeader({ icon, title, count, color }: { icon: React.ReactNode; title: string; count?: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color }}>{icon}</span>
      <h2 className="font-display font-bold" style={{ fontSize: 10, letterSpacing: "0.15em", color }}>{title.toUpperCase()}</h2>
      {count !== undefined && (
        <span className="text-xs font-bold px-1.5 py-0.5 rounded-md font-mono"
          style={{ color, background: `${color}18` }}>
          {count}
        </span>
      )}
    </div>
  );
}

function EmptyCard({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="py-10 text-center rounded-2xl" style={{ background: "#0d0025", border: "1px solid rgba(255,0,110,0.08)" }}>
      <p className="text-3xl mb-2">{icon}</p>
      <p className="font-mono" style={{ fontSize: 10, color: "rgba(212,200,240,0.3)", letterSpacing: "0.08em" }}>{message.toUpperCase()}</p>
    </div>
  );
}
