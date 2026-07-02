import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, FlaskConical, Check, X, ExternalLink } from "lucide-react";
import { getSettings, updateSettings, testRealDebrid, testPlex, testJellyfin, testEmby } from "../api";
import client from "../api/client";
import { Input, Select, Toggle } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { PageSpinner } from "../components/ui/Spinner";
import toast from "react-hot-toast";

function settingsHexRgb(hex: string) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}

const SETTINGS_APP_GROUPS = [
  {
    label: "Debrid Stack",
    subtitle: "The core download and mount infrastructure",
    color: "#f59e0b",
    apps: [
      { key: "zurg",       label: "Zurg",       icon: "🌐", desc: "WebDAV Real-Debrid mount",  defaultUrl: "http://zurg:9999",        hint: "--profile zurg" },
      { key: "rclone",     label: "rclone",     icon: "☁️",  desc: "Mount manager / RC API",   defaultUrl: "http://rclone:5572",      hint: "--profile rclone" },
      { key: "decypharr",  label: "Decypharr",  icon: "⬇️",  desc: "Debrid downloader",        defaultUrl: "http://decypharr:8282",   hint: "--profile decypharr" },
      { key: "nzbdav",     label: "NzbDAV",     icon: "📡", desc: "NZB over WebDAV",           defaultUrl: "http://nzbdav:8080",      hint: "--profile nzbdav" },
      { key: "altmount",   label: "AltMount",   icon: "🔌", desc: "Alternative mount handler", defaultUrl: "http://altmount:8088",    hint: "--profile altmount" },
      { key: "cli_debrid", label: "CLI Debrid", icon: "⌨️",  desc: "plex_debrid CLI",          defaultUrl: "http://cli-debrid:3000",  hint: "--profile cli-debrid" },
    ],
  },
  {
    label: "Orchestrators & Requests",
    subtitle: "Content discovery, watchlists and request managers",
    color: "#22d3ee",
    apps: [
      { key: "riven",      label: "Riven",      icon: "🌊", desc: "All-in-one media manager",  defaultUrl: "http://riven:8080",      hint: "--profile riven" },
      { key: "pulsarr",   label: "Pulsarr",    icon: "💫", desc: "Watchlist → Sonarr/Radarr", defaultUrl: "http://pulsarr:3003",    hint: "--profile pulsarr" },
      { key: "neutarr",   label: "NeutArr",    icon: "🧲", desc: "Content discovery",         defaultUrl: "http://neutarr:8191",    hint: "--profile neutarr" },
      { key: "overseerr", label: "Overseerr",  icon: "🙋", desc: "Plex request manager",       defaultUrl: "http://overseerr:5055",  hint: "--profile overseerr" },
      { key: "jellyseerr",label: "Jellyseerr", icon: "🎯", desc: "Jellyfin request manager",   defaultUrl: "http://jellyseerr:5055", hint: "--profile jellyseerr" },
    ],
  },
  {
    label: "Arr Suite",
    subtitle: "The *arr automation stack",
    color: "#a78bfa",
    apps: [
      { key: "radarr",    label: "Radarr",    icon: "🎬", desc: "Movie automation",      defaultUrl: "http://radarr:7878",    hint: "--profile radarr" },
      { key: "sonarr",    label: "Sonarr",    icon: "📺", desc: "TV show automation",    defaultUrl: "http://sonarr:8989",    hint: "--profile sonarr" },
      { key: "prowlarr",  label: "Prowlarr",  icon: "🔍", desc: "Indexer manager",       defaultUrl: "http://prowlarr:9696",  hint: "--profile prowlarr" },
      { key: "lidarr",    label: "Lidarr",    icon: "🎵", desc: "Music automation",      defaultUrl: "http://lidarr:8686",    hint: "--profile lidarr" },
      { key: "readarr",   label: "Readarr",   icon: "📚", desc: "Book automation",       defaultUrl: "http://readarr:8787",   hint: "--profile readarr" },
      { key: "bazarr",    label: "Bazarr",    icon: "💬", desc: "Subtitle management",   defaultUrl: "http://bazarr:6767",    hint: "--profile bazarr" },
      { key: "whisparr",  label: "Whisparr",  icon: "🔞", desc: "Adult content",         defaultUrl: "http://whisparr:6969",  hint: "--profile whisparr" },
      { key: "profilarr", label: "Profilarr", icon: "⚙️",  desc: "Quality profiles sync", defaultUrl: "http://profilarr:6868", hint: "--profile profilarr" },
    ],
  },
  {
    label: "Analytics & Infrastructure",
    subtitle: "Monitoring, reverse proxy and database tooling",
    color: "#34d399",
    apps: [
      { key: "tautulli",   label: "Tautulli",   icon: "📊", desc: "Plex analytics & stats", defaultUrl: "http://tautulli:8181",   hint: "--profile tautulli" },
      { key: "traefik",    label: "Traefik",    icon: "🔀", desc: "Reverse proxy dashboard", defaultUrl: "http://traefik:8080",    hint: "--profile traefik" },
      { key: "pgadmin",    label: "pgAdmin 4",  icon: "🗄️",  desc: "PostgreSQL admin panel",  defaultUrl: "http://pgadmin:5050",    hint: "--profile pgadmin" },
      { key: "cloudflared",label: "Cloudflared",icon: "🌩️",  desc: "Cloudflare Tunnel",      defaultUrl: "http://localhost:14333", hint: "--profile cloudflared" },
    ],
  },
] as const;

const TABS = [
  { id: "General",      icon: "⚙️" },
  { id: "Real-Debrid",  icon: "⚡" },
  { id: "Media Server", icon: "🖥️" },
  { id: "Indexers",     icon: "🔍" },
  { id: "Apps",         icon: "📦" },
  { id: "Notifications",icon: "🔔" },
  { id: "Schedule",     icon: "🕒" },
];

export function Settings() {
  const [tab, setTab] = useState("General");
  const [form, setForm] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<Record<string, boolean | null>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  const qc = useQueryClient();

  const saveMut = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved");
    },
    onError: () => toast.error("Failed to save"),
  });

  const testRD = useMutation({
    mutationFn: testRealDebrid,
    onSuccess: (data: any) => {
      setTestResult((p) => ({ ...p, rd: true }));
      toast.success(`Connected as ${data.username} (${Math.floor(data.premium / 86400)}d premium)`);
    },
    onError: (err: any) => {
      setTestResult((p) => ({ ...p, rd: false }));
      toast.error(err.response?.data?.detail || "Connection failed");
    },
  });

  const testZilean = useMutation({
    mutationFn: () => client.post("/settings/test/zilean").then((r: any) => r.data),
    onSuccess: () => { setTestResult((p) => ({ ...p, zilean: true })); toast.success("Zilean connected"); },
    onError: (err: any) => { setTestResult((p) => ({ ...p, zilean: false })); toast.error(err.response?.data?.detail || "Connection failed"); },
  });

  const testServer = useMutation({
    mutationFn: async () => {
      const server = form.media_server;
      if (server === "plex")     return testPlex();
      if (server === "jellyfin") return testJellyfin();
      if (server === "emby")     return testEmby();
      throw new Error("No server selected");
    },
    onSuccess: () => { setTestResult((p) => ({ ...p, server: true })); toast.success(`Connected to ${form.media_server}`); },
    onError: (err: any) => { setTestResult((p) => ({ ...p, server: false })); toast.error(err.response?.data?.detail || "Connection failed"); },
  });

  const set    = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));
  const toggle = (key: string) => setForm((p) => ({ ...p, [key]: p[key] === "true" ? "false" : "true" }));

  if (isLoading) return <PageSpinner />;

  return (
    <div className="p-7 max-w-3xl space-y-7 animate-fade-in">
      {/* Header */}
      <div>
        <p className="font-mono mb-1" style={{ fontSize: 9, color: "rgba(255,0,110,0.5)", letterSpacing: "0.2em" }}>// CONFIGURATION</p>
        <h1 className="font-display font-bold tracking-widest" style={{
          fontSize: 28,
          background: "linear-gradient(90deg, #ff006e 0%, #b14fff 50%, #00f5ff 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>SETTINGS</h1>
      </div>

      {/* Tab pills */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(({ id, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded font-mono transition-all duration-150"
            style={tab === id ? {
              background: "rgba(255,0,110,0.12)",
              color: "#ff006e",
              border: "1px solid rgba(255,0,110,0.4)",
              boxShadow: "0 0 12px rgba(255,0,110,0.2)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
            } : {
              color: "rgba(212,200,240,0.35)",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              fontSize: 10,
              letterSpacing: "0.08em",
            }}
          >
            <span>{icon}</span> {id}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-5">

        {/* GENERAL */}
        {tab === "General" && (
          <Card title="General" subtitle="Library paths and metadata">
            <Input label="TMDB API Key" value={form.tmdb_api_key ?? ""} onChange={(e) => set("tmdb_api_key", e.target.value)}
              hint="Required for searching metadata. Get yours at themoviedb.org/settings/api" type="password" placeholder="Enter TMDB API key…" />
            <Input label="Movies Library Path" value={form.movies_path ?? ""} onChange={(e) => set("movies_path", e.target.value)}
              hint="Where movies will be organized (symlinks or downloads)" placeholder="/media/movies" />
            <Input label="TV Shows Library Path" value={form.shows_path ?? ""} onChange={(e) => set("shows_path", e.target.value)}
              hint="Where TV shows will be organized" placeholder="/media/shows" />
            <Select label="Default Quality Profile" value={form.default_quality ?? "1080p"} onChange={(e) => set("default_quality", e.target.value)}>
              <option value="4k">4K (2160p)</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="any">Any Quality</option>
            </Select>
          </Card>
        )}

        {/* REAL-DEBRID */}
        {tab === "Real-Debrid" && (
          <Card title="Real-Debrid" subtitle="Your premium debrid account">
            <div className="space-y-2">
              <Input label="API Key" value={form.rd_api_key ?? ""} onChange={(e) => set("rd_api_key", e.target.value)}
                type="password" placeholder="Enter Real-Debrid API key…"
                hint="Found at real-debrid.com/apitoken" />
              <div className="flex items-center gap-3 pt-1">
                <Button size="sm" icon={<FlaskConical style={{ width: 13, height: 13 }} />} loading={testRD.isPending} onClick={() => testRD.mutate()}>
                  Test Connection
                </Button>
                <TestStatus ok={testResult.rd} />
              </div>
            </div>

            <Select label="Download Mode" value={form.rd_download_mode ?? "symlink"} onChange={(e) => set("rd_download_mode", e.target.value)}>
              <option value="symlink">Symlink (requires rclone/Zurg mount)</option>
              <option value="download">Direct Download Link</option>
            </Select>

            {form.rd_download_mode === "symlink" && (
              <Input label="rclone / Zurg Mount Path" value={form.rd_mount_path ?? ""} onChange={(e) => set("rd_mount_path", e.target.value)}
                placeholder="/mnt/zurg/torrents"
                hint="Path where your rclone/Zurg mount exposes Real-Debrid files" />
            )}

            <InfoBox>
              <p className="font-semibold text-violet-400 mb-1">Symlink mode setup</p>
              <p>1. Run Zurg to expose your RD files as WebDAV</p>
              <p>2. Mount it with rclone at a local path (e.g. <code className="text-violet-300">/mnt/zurg</code>)</p>
              <p>3. Point the mount path above to <code className="text-violet-300">/mnt/zurg/torrents</code></p>
              <p>4. Automatarr creates symlinks in your library pointing to the mount</p>
            </InfoBox>
          </Card>
        )}

        {/* MEDIA SERVER */}
        {tab === "Media Server" && (
          <Card title="Media Server" subtitle="Automatarr will trigger a library scan after each download">
            <Select label="Server Type" value={form.media_server ?? "none"} onChange={(e) => set("media_server", e.target.value)}>
              <option value="none">None</option>
              <option value="plex">Plex</option>
              <option value="jellyfin">Jellyfin</option>
              <option value="emby">Emby</option>
            </Select>

            {form.media_server === "plex" && (
              <>
                <Input label="Plex URL" value={form.plex_url ?? ""} onChange={(e) => set("plex_url", e.target.value)} placeholder="http://localhost:32400" />
                <Input label="Plex Token" value={form.plex_token ?? ""} onChange={(e) => set("plex_token", e.target.value)} type="password" placeholder="Your X-Plex-Token" />
                <Input label="Movies Library Key" value={form.plex_movies_library ?? ""} onChange={(e) => set("plex_movies_library", e.target.value)} hint="Numeric key of your movies library (test connection to discover)" placeholder="1" />
                <Input label="Shows Library Key" value={form.plex_shows_library ?? ""} onChange={(e) => set("plex_shows_library", e.target.value)} placeholder="2" />
              </>
            )}

            {form.media_server === "jellyfin" && (
              <>
                <Input label="Jellyfin URL" value={form.jellyfin_url ?? ""} onChange={(e) => set("jellyfin_url", e.target.value)} placeholder="http://localhost:8096" />
                <Input label="API Key" value={form.jellyfin_api_key ?? ""} onChange={(e) => set("jellyfin_api_key", e.target.value)} type="password" placeholder="Dashboard → Advanced → API Keys" />
              </>
            )}

            {form.media_server === "emby" && (
              <>
                <Input label="Emby URL" value={form.emby_url ?? ""} onChange={(e) => set("emby_url", e.target.value)} placeholder="http://localhost:8096" />
                <Input label="API Key" value={form.emby_api_key ?? ""} onChange={(e) => set("emby_api_key", e.target.value)} type="password" placeholder="API key" />
              </>
            )}

            {form.media_server !== "none" && (
              <div className="flex items-center gap-3">
                <Button size="sm" icon={<FlaskConical style={{ width: 13, height: 13 }} />} loading={testServer.isPending} onClick={() => testServer.mutate()}>
                  Test Connection
                </Button>
                <TestStatus ok={testResult.server} />
              </div>
            )}
          </Card>
        )}

        {/* INDEXERS */}
        {tab === "Indexers" && (
          <Card title="Indexers" subtitle="Where Automatarr searches for torrents">
            <Select label="Active Indexer" value={form.indexer ?? "torrentio"} onChange={(e) => set("indexer", e.target.value)}
              hint="Which indexer(s) Automatarr uses to find torrents">
              <option value="torrentio">Torrentio only (hosted, no setup)</option>
              <option value="zilean">Zilean only (self-hosted, private)</option>
              <option value="both">Both — merge results</option>
            </Select>

            {(form.indexer === "torrentio" || form.indexer === "both" || !form.indexer) && (
              <SubCard title="🌐 Torrentio">
                <Input label="URL" value={form.torrentio_url ?? ""} onChange={(e) => set("torrentio_url", e.target.value)} placeholder="https://torrentio.strem.fun" />
                <Input label="Options" value={form.torrentio_opts ?? ""} onChange={(e) => set("torrentio_opts", e.target.value)}
                  placeholder="sort=qualitysize|qualityfilter=480p,scr,cam"
                  hint="Pipe-separated options: sort=qualitysize · qualityfilter=480p,scr,cam · limit=5" />
              </SubCard>
            )}

            {(form.indexer === "zilean" || form.indexer === "both") && (
              <SubCard title="🏠 Zilean">
                <Input label="URL" value={form.zilean_url ?? ""} onChange={(e) => set("zilean_url", e.target.value)}
                  placeholder="http://zilean:8182" hint="Start with: docker-compose --profile zilean up -d" />
                <div className="flex items-center gap-3">
                  <Button size="sm" icon={<FlaskConical style={{ width: 13, height: 13 }} />} loading={testZilean.isPending} onClick={() => testZilean.mutate()}>
                    Test Zilean
                  </Button>
                  <TestStatus ok={testResult.zilean} />
                </div>
              </SubCard>
            )}
          </Card>
        )}

        {/* APPS */}
        {tab === "Apps" && (
          <div className="space-y-5">
            {SETTINGS_APP_GROUPS.map((group) => (
              <Card key={group.label} title={group.label} subtitle={group.subtitle}>
                {group.apps.map((app) => {
                  const enabled = form[`app_${app.key}_enabled`] === "true";
                  return (
                    <div key={app.key} className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center justify-between px-4 py-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{app.icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-slate-200 leading-tight">{app.label}</p>
                            <p className="text-[10px] text-slate-600">{app.desc}</p>
                          </div>
                          {enabled && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                              style={{ color: group.color, background: `rgba(${settingsHexRgb(group.color)},0.12)` }}>
                              ON
                            </span>
                          )}
                        </div>
                        <Toggle
                          label=""
                          checked={enabled}
                          onChange={(v) => set(`app_${app.key}_enabled`, v ? "true" : "false")}
                        />
                      </div>
                      {enabled && (
                        <div className="px-4 pb-4 pt-3" style={{ background: "rgba(255,255,255,0.01)" }}>
                          <Input
                            label="URL"
                            value={form[`app_${app.key}_url`] ?? app.defaultUrl}
                            onChange={(e) => set(`app_${app.key}_url`, e.target.value)}
                            placeholder={app.defaultUrl}
                            hint={app.hint}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </Card>
            ))}
          </div>
        )}

        {/* NOTIFICATIONS */}
        {tab === "Notifications" && (
          <Card title="Notifications" subtitle="Get alerted when things happen">
            <div className="space-y-3">
              <Toggle label="On Grab" hint="When a torrent is sent to Real-Debrid"
                checked={form.notify_on_grab === "true"} onChange={(v) => set("notify_on_grab", v ? "true" : "false")} />
              <Toggle label="On Download" hint="When a file is downloaded or symlinked"
                checked={form.notify_on_download === "true"} onChange={(v) => set("notify_on_download", v ? "true" : "false")} />
              <Toggle label="On Error" hint="When something goes wrong"
                checked={form.notify_on_error === "true"} onChange={(v) => set("notify_on_error", v ? "true" : "false")} />
            </div>

            <div className="pt-2 border-t border-white/[0.06]" />

            <SubCard title="🎮 Discord">
              <Input label="Webhook URL" value={form.discord_webhook ?? ""} onChange={(e) => set("discord_webhook", e.target.value)}
                type="password" placeholder="https://discord.com/api/webhooks/…" />
            </SubCard>

            <SubCard title="✈️ Telegram">
              <Input label="Bot Token" value={form.telegram_bot_token ?? ""} onChange={(e) => set("telegram_bot_token", e.target.value)} type="password" placeholder="12345:AbCdEf…" />
              <Input label="Chat ID" value={form.telegram_chat_id ?? ""} onChange={(e) => set("telegram_chat_id", e.target.value)} placeholder="-100123456" />
            </SubCard>

            <SubCard title="🪝 Custom Webhook">
              <Input label="URL" value={form.webhook_url ?? ""} onChange={(e) => set("webhook_url", e.target.value)} type="password" placeholder="https://your-webhook.example.com/notify" />
            </SubCard>
          </Card>
        )}

        {/* SCHEDULE */}
        {tab === "Schedule" && (
          <Card title="Schedule" subtitle="How often Automatarr runs background tasks">
            <Input label="Search Interval (minutes)" value={form.search_interval_minutes ?? "30"} onChange={(e) => set("search_interval_minutes", e.target.value)}
              type="number" min="5" max="1440" hint="How often to search for wanted movies and episodes" />
            <Input label="Monitor Interval (minutes)" value={form.monitor_interval_minutes ?? "5"} onChange={(e) => set("monitor_interval_minutes", e.target.value)}
              type="number" min="1" max="60" hint="How often to check in-progress downloads for completion" />
            <Input label="Library Refresh Interval (hours)" value={form.refresh_interval_hours ?? "6"} onChange={(e) => set("refresh_interval_hours", e.target.value)}
              type="number" min="1" max="168" hint="How often to check for newly aired episodes" />
          </Card>
        )}

        {/* Save */}
        <div className="pt-2 flex items-center gap-3">
          <Button variant="primary" icon={<Save style={{ width: 14, height: 14 }} />} loading={saveMut.isPending} onClick={() => saveMut.mutate(form)}>
            Save Settings
          </Button>
          {saveMut.isSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Check style={{ width: 13, height: 13 }} strokeWidth={2.5} /> Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,0,110,0.18)", boxShadow: "0 0 20px rgba(255,0,110,0.04)" }}>
      <div className="px-5 py-3.5 flex-shrink-0" style={{ background: "rgba(255,0,110,0.06)", borderBottom: "1px solid rgba(255,0,110,0.12)" }}>
        <h2 className="font-display font-bold" style={{ fontSize: 10, letterSpacing: "0.18em", color: "#ff006e", textShadow: "0 0 10px rgba(255,0,110,0.5)" }}>{title.toUpperCase()}</h2>
        {subtitle && <p className="font-mono mt-0.5" style={{ fontSize: 9, color: "rgba(212,200,240,0.3)", letterSpacing: "0.08em" }}>{subtitle}</p>}
      </div>
      <div className="p-5 space-y-5" style={{ background: "#0d0025" }}>
        {children}
      </div>
    </div>
  );
}

function SubCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg p-4 space-y-3" style={{ background: "rgba(255,0,110,0.03)", border: "1px solid rgba(255,0,110,0.1)" }}>
      <p className="font-mono font-bold" style={{ fontSize: 9, color: "rgba(255,0,110,0.6)", letterSpacing: "0.15em" }}>{title.toUpperCase()}</p>
      {children}
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-lg space-y-1 leading-relaxed"
      style={{ background: "rgba(177,79,255,0.06)", border: "1px solid rgba(177,79,255,0.2)", fontSize: 11, color: "rgba(212,200,240,0.5)" }}>
      {children}
    </div>
  );
}

function TestStatus({ ok }: { ok?: boolean | null }) {
  if (ok === true)  return <span className="font-mono font-bold flex items-center gap-1" style={{ fontSize: 10, color: "#00ff88", textShadow: "0 0 8px rgba(0,255,136,0.6)" }}><Check style={{ width: 12, height: 12 }} strokeWidth={3} /> CONNECTED</span>;
  if (ok === false) return <span className="font-mono font-bold flex items-center gap-1" style={{ fontSize: 10, color: "#ff006e", textShadow: "0 0 8px rgba(255,0,110,0.6)" }}><X style={{ width: 12, height: 12 }} strokeWidth={3} /> FAILED</span>;
  return null;
}
