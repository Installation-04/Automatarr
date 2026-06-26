import { useQuery, useMutation } from "@tanstack/react-query";
import { Film, Tv, ArrowDownToLine, Sparkles, Search, RefreshCw } from "lucide-react";
import { getDashboard, triggerSearchAll } from "../api";
import { PageSpinner } from "../components/ui/Spinner";
import { StatusBadge } from "../components/ui/Badge";
import type { DashboardData } from "../types";
import toast from "react-hot-toast";
import { format } from "date-fns";

const TMDB_IMG = "https://image.tmdb.org/t/p/w92";

const STAT_CARDS = [
  { key: "movies",      label: "MOVIES",      icon: Film,            color: "#ff006e", glow: "rgba(255,0,110,0.4)"   },
  { key: "shows",       label: "TV SHOWS",    icon: Tv,              color: "#00f5ff", glow: "rgba(0,245,255,0.4)"   },
  { key: "downloading", label: "ACTIVE",      icon: ArrowDownToLine, color: "#ffe600", glow: "rgba(255,230,0,0.4)"   },
  { key: "wanted",      label: "WANTED",      icon: Sparkles,        color: "#b14fff", glow: "rgba(177,79,255,0.4)"  },
];

function hexRgb(hex: string) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}

export function Dashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    refetchInterval: 30000,
  });

  const searchAll = useMutation({
    mutationFn: triggerSearchAll,
    onSuccess: () => toast.success("Search triggered for all wanted items"),
    onError: () => toast.error("Failed to trigger search"),
  });

  if (isLoading) return <PageSpinner />;
  if (!data) return null;

  const { movies, shows, recent_activity, upcoming } = data;

  const statValues: Record<string, { value: number; sub: string }> = {
    movies:      { value: movies.total,                                    sub: `${movies.downloaded} downloaded` },
    shows:       { value: shows.total,                                     sub: `${shows.episodes_downloaded} eps` },
    downloading: { value: movies.downloading + shows.episodes_downloading, sub: "active now" },
    wanted:      { value: movies.wanted + shows.episodes_wanted,           sub: "awaiting grab" },
  };

  return (
    <div className="p-7 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono mb-1" style={{ fontSize: 9, color: "rgba(255,0,110,0.5)", letterSpacing: "0.2em" }}>
            // SYSTEM OVERVIEW
          </p>
          <h1
            className="font-display font-bold tracking-widest"
            style={{
              fontSize: 28,
              background: "linear-gradient(90deg, #ff006e 0%, #b14fff 50%, #00f5ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "none",
            }}
          >
            DASHBOARD
          </h1>
        </div>
        <button
          onClick={() => searchAll.mutate()}
          disabled={searchAll.isPending}
          className="flex items-center gap-2 font-display font-bold"
          style={{
            padding: "9px 18px",
            borderRadius: 8,
            fontSize: 10,
            letterSpacing: "0.12em",
            background: "linear-gradient(135deg, #ff006e 0%, #b14fff 100%)",
            boxShadow: "0 0 16px rgba(255,0,110,0.5), 0 0 32px rgba(255,0,110,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
            color: "#fff",
            border: "none",
            cursor: searchAll.isPending ? "not-allowed" : "pointer",
            opacity: searchAll.isPending ? 0.6 : 1,
          }}
        >
          {searchAll.isPending
            ? <RefreshCw style={{ width: 13, height: 13 }} className="animate-spin" />
            : <Search style={{ width: 13, height: 13 }} />}
          SEARCH ALL
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          const { value, sub } = statValues[card.key];
          return (
            <div
              key={card.key}
              className="relative overflow-hidden p-5"
              style={{
                borderRadius: 10,
                background: `linear-gradient(135deg, rgba(${hexRgb(card.color)},0.1) 0%, rgba(${hexRgb(card.color)},0.03) 100%)`,
                border: `1px solid rgba(${hexRgb(card.color)},0.3)`,
                boxShadow: `0 0 20px rgba(${hexRgb(card.color)},0.15)`,
              }}
            >
              {/* Ghost icon */}
              <Icon
                className="absolute -right-2 -bottom-2"
                style={{ width: 72, height: 72, color: card.color, opacity: 0.07 }}
                strokeWidth={1}
              />
              {/* Icon chip */}
              <div
                className="w-8 h-8 rounded flex items-center justify-center mb-4"
                style={{ background: `rgba(${hexRgb(card.color)},0.15)`, border: `1px solid rgba(${hexRgb(card.color)},0.3)` }}
              >
                <Icon style={{ width: 15, height: 15, color: card.color }} strokeWidth={2} />
              </div>
              {/* Value */}
              <p
                className="font-display font-bold"
                style={{ fontSize: 36, color: card.color, textShadow: `0 0 16px ${card.glow}, 0 0 32px rgba(${hexRgb(card.color)},0.2)`, lineHeight: 1 }}
              >
                {value}
              </p>
              <p className="font-display font-bold mt-2" style={{ fontSize: 9, color: card.color, letterSpacing: "0.2em", opacity: 0.8 }}>
                {card.label}
              </p>
              <p className="font-mono mt-0.5" style={{ fontSize: 9, color: "rgba(212,200,240,0.35)", letterSpacing: "0.05em" }}>{sub}</p>
            </div>
          );
        })}
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming */}
        <section>
          <SectionHeader title="UPCOMING" sub="next 14 days" color="#00f5ff" />
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "#0d0025", border: "1px solid rgba(0,245,255,0.15)", boxShadow: "0 0 20px rgba(0,245,255,0.04)" }}
          >
            {upcoming.length === 0 ? (
              <EmptyState icon="📅" message="No upcoming episodes" />
            ) : (
              upcoming.slice(0, 8).map((ep, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3.5 px-4 py-3 transition-colors"
                  style={{ borderBottom: "1px solid rgba(0,245,255,0.06)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0,245,255,0.04)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  {ep.show_poster ? (
                    <img src={`${TMDB_IMG}${ep.show_poster}`} alt="" className="w-8 h-12 object-cover rounded flex-shrink-0" style={{ border: "1px solid rgba(0,245,255,0.15)" }} />
                  ) : (
                    <div className="w-8 h-12 rounded flex-shrink-0" style={{ background: "rgba(0,245,255,0.05)" }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#d4c8f0" }}>{ep.show_title}</p>
                    <p className="font-mono mt-0.5" style={{ fontSize: 9, color: "rgba(0,245,255,0.5)", letterSpacing: "0.1em" }}>
                      S{ep.season_number.toString().padStart(2,"0")}E{ep.episode_number.toString().padStart(2,"0")}
                      {ep.episode_title ? ` · ${ep.episode_title}` : ""}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    <p className="font-mono" style={{ fontSize: 9, color: "rgba(212,200,240,0.3)", letterSpacing: "0.06em" }}>{ep.air_date}</p>
                    <StatusBadge status={ep.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Activity */}
        <section>
          <SectionHeader title="ACTIVITY" sub="recent events" color="#ff006e" />
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "#0d0025", border: "1px solid rgba(255,0,110,0.15)", boxShadow: "0 0 20px rgba(255,0,110,0.04)" }}
          >
            {recent_activity.length === 0 ? (
              <EmptyState icon="⚡" message="No recent activity" />
            ) : (
              recent_activity.map((log, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3.5 px-4 py-3 transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,0,110,0.06)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,0,110,0.03)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  <EventPill type={log.event_type} />
                  <div className="flex-1 min-w-0 pt-0.5">
                    {log.media_title && (
                      <p className="text-sm font-semibold truncate" style={{ color: "#d4c8f0" }}>{log.media_title}</p>
                    )}
                    <p className="font-mono mt-0.5 truncate" style={{ fontSize: 9, color: "rgba(212,200,240,0.35)", letterSpacing: "0.05em" }}>{log.message}</p>
                  </div>
                  <p className="font-mono flex-shrink-0 pt-0.5" style={{ fontSize: 9, color: "rgba(255,0,110,0.35)", letterSpacing: "0.06em" }}>
                    {log.created_at ? format(new Date(log.created_at), "HH:mm") : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHeader({ title, sub, color }: { title: string; sub: string; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <h2
        className="font-display font-bold"
        style={{ fontSize: 11, letterSpacing: "0.2em", color, textShadow: `0 0 10px ${color}` }}
      >
        {title}
      </h2>
      <span className="font-mono" style={{ fontSize: 9, color: "rgba(212,200,240,0.3)", letterSpacing: "0.1em" }}>// {sub}</span>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="py-12 text-center">
      <p className="text-3xl mb-2">{icon}</p>
      <p className="font-mono" style={{ fontSize: 10, color: "rgba(212,200,240,0.3)", letterSpacing: "0.1em" }}>{message.toUpperCase()}</p>
    </div>
  );
}

const EVENT_CFG: Record<string, { label: string; color: string }> = {
  grab:     { label: "GRAB",    color: "#ffe600" },
  download: { label: "DONE",    color: "#00ff88" },
  error:    { label: "ERROR",   color: "#ff006e" },
  info:     { label: "INFO",    color: "#00f5ff" },
  search:   { label: "SCAN",    color: "#b14fff" },
  symlink:  { label: "LINK",    color: "#00ff88" },
};

function EventPill({ type }: { type: string }) {
  const cfg = EVENT_CFG[type] ?? { label: type.toUpperCase().slice(0,5), color: "rgba(212,200,240,0.4)" };
  const rgb = cfg.color.startsWith("#")
    ? `${parseInt(cfg.color.slice(1,3),16)},${parseInt(cfg.color.slice(3,5),16)},${parseInt(cfg.color.slice(5,7),16)}`
    : "212,200,240";
  return (
    <div
      className="mt-0.5 flex-shrink-0 font-mono font-bold text-center"
      style={{
        fontSize: 8,
        letterSpacing: "0.15em",
        padding: "3px 7px",
        borderRadius: 4,
        minWidth: 42,
        color: cfg.color,
        background: `rgba(${rgb},0.1)`,
        border: `1px solid rgba(${rgb},0.3)`,
        textShadow: `0 0 6px ${cfg.color}`,
      }}
    >
      {cfg.label}
    </div>
  );
}
