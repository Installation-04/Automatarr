import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, LayoutGrid, Settings2 } from "lucide-react";
import { getSettings } from "../api";
import { PageSpinner } from "../components/ui/Spinner";
import { useNavigate } from "react-router-dom";

interface AppDef {
  key: string;
  label: string;
  description: string;
  color: string;
  icon: string;
  proxyPath: string;
}

interface AppGroup {
  label: string;
  subtitle: string;
  color: string;
  apps: AppDef[];
}

const APP_GROUPS: AppGroup[] = [
  {
    label: "Debrid Stack",
    subtitle: "Core download and mount infrastructure",
    color: "#f59e0b",
    apps: [
      { key: "zurg",       label: "Zurg",       description: "WebDAV Real-Debrid mount",       color: "#f59e0b", icon: "🌐", proxyPath: "/apps/zurg/" },
      { key: "rclone",     label: "rclone",     description: "Mount manager / RC API",          color: "#f59e0b", icon: "☁️", proxyPath: "/apps/rclone/" },
      { key: "decypharr",  label: "Decypharr",  description: "Debrid downloader",               color: "#f59e0b", icon: "⬇️", proxyPath: "/apps/decypharr/" },
      { key: "nzbdav",     label: "NzbDAV",     description: "NZB over WebDAV",                 color: "#f59e0b", icon: "📡", proxyPath: "/apps/nzbdav/" },
      { key: "altmount",   label: "AltMount",   description: "Alternative mount handler",       color: "#f59e0b", icon: "🔌", proxyPath: "/apps/altmount/" },
      { key: "cli_debrid", label: "CLI Debrid", description: "plex_debrid CLI",                 color: "#f59e0b", icon: "⌨️", proxyPath: "/apps/cli-debrid/" },
    ],
  },
  {
    label: "Orchestrators & Requests",
    subtitle: "Content discovery, watchlists and request managers",
    color: "#22d3ee",
    apps: [
      { key: "riven",      label: "Riven",      description: "All-in-one media manager",        color: "#22d3ee", icon: "🌊", proxyPath: "/apps/riven/" },
      { key: "pulsarr",   label: "Pulsarr",    description: "Watchlist → Sonarr/Radarr",       color: "#22d3ee", icon: "💫", proxyPath: "/apps/pulsarr/" },
      { key: "neutarr",   label: "NeutArr",    description: "Content discovery",               color: "#22d3ee", icon: "🧲", proxyPath: "/apps/neutarr/" },
      { key: "overseerr",  label: "Overseerr",  description: "Plex request manager",            color: "#22d3ee", icon: "🙋", proxyPath: "/apps/overseerr/" },
      { key: "jellyseerr", label: "Jellyseerr", description: "Jellyfin request manager",        color: "#22d3ee", icon: "🎯", proxyPath: "/apps/jellyseerr/" },
    ],
  },
  {
    label: "Arr Suite",
    subtitle: "The *arr automation stack",
    color: "#a78bfa",
    apps: [
      { key: "radarr",    label: "Radarr",    description: "Movie automation",                 color: "#a78bfa", icon: "🎬", proxyPath: "/apps/radarr/" },
      { key: "sonarr",    label: "Sonarr",    description: "TV show automation",              color: "#a78bfa", icon: "📺", proxyPath: "/apps/sonarr/" },
      { key: "prowlarr",  label: "Prowlarr",  description: "Indexer manager",                 color: "#a78bfa", icon: "🔍", proxyPath: "/apps/prowlarr/" },
      { key: "lidarr",    label: "Lidarr",    description: "Music automation",                color: "#a78bfa", icon: "🎵", proxyPath: "/apps/lidarr/" },
      { key: "readarr",   label: "Readarr",   description: "Book automation",                 color: "#a78bfa", icon: "📚", proxyPath: "/apps/readarr/" },
      { key: "bazarr",    label: "Bazarr",    description: "Subtitle management",             color: "#a78bfa", icon: "💬", proxyPath: "/apps/bazarr/" },
      { key: "whisparr",  label: "Whisparr",  description: "Adult content",                   color: "#a78bfa", icon: "🔞", proxyPath: "/apps/whisparr/" },
      { key: "profilarr", label: "Profilarr", description: "Quality profiles sync",           color: "#a78bfa", icon: "⚙️", proxyPath: "/apps/profilarr/" },
    ],
  },
  {
    label: "Analytics & Infrastructure",
    subtitle: "Monitoring, reverse proxy and database tooling",
    color: "#34d399",
    apps: [
      { key: "tautulli",   label: "Tautulli",   description: "Plex analytics & stats",         color: "#34d399", icon: "📊", proxyPath: "/apps/tautulli/" },
      { key: "traefik",    label: "Traefik",    description: "Reverse proxy dashboard",         color: "#34d399", icon: "🔀", proxyPath: "/apps/traefik/" },
      { key: "pgadmin",    label: "pgAdmin 4",  description: "PostgreSQL admin panel",          color: "#34d399", icon: "🗄️", proxyPath: "/apps/pgadmin/" },
      { key: "cloudflared",label: "Cloudflared",description: "Cloudflare Tunnel",              color: "#34d399", icon: "🌩️", proxyPath: "/apps/cloudflared/" },
    ],
  },
];

const ALL_APPS = APP_GROUPS.flatMap((g) => g.apps);

function hexRgb(hex: string) {
  const h = hex.replace("#", "");
  return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`;
}

export function Apps() {
  const navigate = useNavigate();
  const [activeApp, setActiveApp] = useState<AppDef | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  if (isLoading) return <PageSpinner />;

  const enabledApps = ALL_APPS.filter(
    (a) => settings?.[`app_${a.key}_enabled`] === "true"
  );

  if (activeApp) {
    return (
      <div className="flex flex-col h-full">
        <div
          className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
          style={{ background: "#0d0025", borderBottom: "1px solid rgba(255,0,110,0.15)" }}
        >
          <button
            onClick={() => setActiveApp(null)}
            className="font-mono flex items-center gap-1.5 transition-colors"
            style={{ fontSize: 11, color: "rgba(212,200,240,0.5)", letterSpacing: "0.1em" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#ff006e")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "rgba(212,200,240,0.5)")}
          >
            <LayoutGrid style={{ width: 13, height: 13 }} /> ALL APPS
          </button>
          <span style={{ color: "rgba(255,0,110,0.3)" }}>/</span>
          <span className="font-mono" style={{ fontSize: 11, color: "#d4c8f0", letterSpacing: "0.1em" }}>
            {activeApp.icon} {activeApp.label.toUpperCase()}
          </span>
          <div className="ml-auto">
            <a
              href={activeApp.proxyPath}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "rgba(212,200,240,0.3)" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#ff006e")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(212,200,240,0.3)")}
            >
              <ExternalLink style={{ width: 14, height: 14 }} />
            </a>
          </div>
        </div>
        <iframe
          src={activeApp.proxyPath}
          className="flex-1 w-full border-0"
          title={activeApp.label}
          allow="fullscreen"
        />
      </div>
    );
  }

  return (
    <div className="p-7 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono mb-1" style={{ fontSize: 9, color: "rgba(255,0,110,0.5)", letterSpacing: "0.2em" }}>
            // INTEGRATIONS
          </p>
          <h1
            className="font-display font-bold tracking-widest"
            style={{
              fontSize: 28,
              background: "linear-gradient(90deg, #ff006e 0%, #b14fff 50%, #00f5ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            APPS
          </h1>
        </div>
        <button
          onClick={() => navigate("/settings")}
          className="font-mono flex items-center gap-2 transition-colors"
          style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(212,200,240,0.4)", padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(255,0,110,0.15)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ff006e"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,0,110,0.4)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(212,200,240,0.4)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,0,110,0.15)"; }}
        >
          <Settings2 style={{ width: 13, height: 13 }} /> CONFIGURE
        </button>
      </div>

      {/* Enabled apps */}
      {enabledApps.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enabledApps.map((app) => (
            <AppCard
              key={app.key}
              app={app}
              url={settings?.[`app_${app.key}_url`] || app.proxyPath}
              onOpen={() => setActiveApp(app)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {enabledApps.length === 0 && (
        <div
          className="rounded-xl text-center py-16"
          style={{ background: "#0d0025", border: "1px solid rgba(255,0,110,0.12)" }}
        >
          <p className="text-4xl mb-4">📦</p>
          <p className="font-display font-bold mb-1" style={{ fontSize: 13, color: "#ff006e", letterSpacing: "0.15em" }}>
            NO APPS ENABLED
          </p>
          <p className="font-mono mb-6" style={{ fontSize: 10, color: "rgba(212,200,240,0.35)", letterSpacing: "0.05em" }}>
            Enable apps in Settings → Apps to embed them here
          </p>
          <button
            onClick={() => navigate("/settings")}
            className="font-display font-bold"
            style={{
              fontSize: 10, letterSpacing: "0.12em", padding: "9px 18px", borderRadius: 8,
              background: "linear-gradient(135deg, #ff006e 0%, #b14fff 100%)",
              boxShadow: "0 0 16px rgba(255,0,110,0.4)", color: "#fff", border: "none", cursor: "pointer",
            }}
          >
            OPEN SETTINGS
          </button>
        </div>
      )}

      {/* Available apps by group */}
      <div className="space-y-6">
        {APP_GROUPS.map((group) => {
          const available = group.apps.filter((a) => !enabledApps.find((e) => e.key === a.key));
          if (available.length === 0) return null;
          const rgb = hexRgb(group.color);
          return (
            <section key={group.label}>
              <div className="flex items-center gap-3 mb-3">
                <h2
                  className="font-display font-bold"
                  style={{ fontSize: 10, letterSpacing: "0.2em", color: group.color, textShadow: `0 0 8px ${group.color}` }}
                >
                  {group.label.toUpperCase()}
                </h2>
                <span className="font-mono" style={{ fontSize: 9, color: "rgba(212,200,240,0.3)", letterSpacing: "0.08em" }}>
                  // {group.subtitle}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {available.map((app) => (
                  <button
                    key={app.key}
                    onClick={() => navigate("/settings")}
                    className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                    style={{
                      background: `rgba(${rgb},0.04)`,
                      border: `1px solid rgba(${rgb},0.15)`,
                      opacity: 0.6,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = `rgba(${rgb},0.4)`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.opacity = "0.6";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = `rgba(${rgb},0.15)`;
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{app.icon}</span>
                    <div>
                      <p className="font-mono font-bold" style={{ fontSize: 10, color: group.color, letterSpacing: "0.08em" }}>{app.label}</p>
                      <p className="font-mono mt-0.5" style={{ fontSize: 9, color: "rgba(212,200,240,0.3)" }}>Enable in settings</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function AppCard({ app, url, onOpen }: { app: AppDef; url: string; onOpen: () => void }) {
  const rgb = hexRgb(app.color);
  return (
    <div
      className="group relative overflow-hidden cursor-pointer rounded-xl transition-all"
      style={{
        background: `linear-gradient(135deg, rgba(${rgb},0.08) 0%, rgba(${rgb},0.03) 100%)`,
        border: `1px solid rgba(${rgb},0.25)`,
        boxShadow: `0 0 20px rgba(${rgb},0.1)`,
      }}
      onClick={onOpen}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${rgb},0.5)`;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 30px rgba(${rgb},0.25)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${rgb},0.25)`;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px rgba(${rgb},0.1)`;
      }}
    >
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${app.color}, transparent)` }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span style={{ fontSize: 28 }}>{app.icon}</span>
          <ExternalLink style={{ width: 13, height: 13, color: `rgba(${rgb},0.4)` }} className="group-hover:opacity-80 transition-opacity" />
        </div>
        <h3 className="font-display font-bold" style={{ fontSize: 11, color: app.color, letterSpacing: "0.12em" }}>{app.label.toUpperCase()}</h3>
        <p className="font-mono mt-1" style={{ fontSize: 9, color: "rgba(212,200,240,0.4)" }}>{app.description}</p>
        <p className="font-mono mt-3 truncate" style={{ fontSize: 8, color: `rgba(${rgb},0.35)`, letterSpacing: "0.05em" }}>{url}</p>
      </div>
      <div
        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "rgba(7,0,26,0.7)" }}
      >
        <span
          className="font-display font-bold"
          style={{ fontSize: 10, letterSpacing: "0.15em", color: app.color, padding: "8px 16px", borderRadius: 6, border: `1px solid rgba(${rgb},0.4)`, background: `rgba(${rgb},0.1)` }}
        >
          OPEN APP →
        </span>
      </div>
    </div>
  );
}
