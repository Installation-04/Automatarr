import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Zap, ChevronRight, ChevronLeft, Check, X, Loader2,
  Shield, Database, FolderOpen, Server, Search,
  Star, Bell, Rocket, ExternalLink, RefreshCw,
} from "lucide-react";
import client from "../api/client";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardState {
  rd_api_key: string;
  tmdb_api_key: string;
  rd_download_mode: string;
  rd_mount_path: string;
  movies_path: string;
  shows_path: string;
  music_path: string;
  books_path: string;
  media_server: string;
  plex_url: string;
  plex_token: string;
  plex_movies_library: string;
  plex_shows_library: string;
  jellyfin_url: string;
  jellyfin_api_key: string;
  emby_url: string;
  emby_api_key: string;
  indexer: string;
  torrentio_url: string;
  torrentio_opts: string;
  zilean_url: string;
  default_quality: string;
  notify_on_grab: string;
  notify_on_download: string;
  notify_on_error: string;
  discord_webhook: string;
  telegram_bot_token: string;
  telegram_chat_id: string;
  // debrid stack
  app_zurg_enabled: string;        app_zurg_url: string;
  app_rclone_enabled: string;      app_rclone_url: string;
  app_decypharr_enabled: string;   app_decypharr_url: string;
  app_nzbdav_enabled: string;      app_nzbdav_url: string;
  app_altmount_enabled: string;    app_altmount_url: string;
  app_cli_debrid_enabled: string;  app_cli_debrid_url: string;
  // orchestrators
  app_riven_enabled: string;       app_riven_url: string;
  app_pulsarr_enabled: string;     app_pulsarr_url: string;
  app_neutarr_enabled: string;     app_neutarr_url: string;
  // arr suite
  app_radarr_enabled: string;      app_radarr_url: string;
  app_sonarr_enabled: string;      app_sonarr_url: string;
  app_prowlarr_enabled: string;    app_prowlarr_url: string;
  app_lidarr_enabled: string;      app_lidarr_url: string;
  app_readarr_enabled: string;     app_readarr_url: string;
  app_bazarr_enabled: string;      app_bazarr_url: string;
  app_whisparr_enabled: string;    app_whisparr_url: string;
  app_profilarr_enabled: string;   app_profilarr_url: string;
  // request
  app_overseerr_enabled: string;   app_overseerr_url: string;
  app_jellyseerr_enabled: string;  app_jellyseerr_url: string;
  // analytics
  app_tautulli_enabled: string;    app_tautulli_url: string;
  // infrastructure
  app_traefik_enabled: string;     app_traefik_url: string;
  app_pgadmin_enabled: string;     app_pgadmin_url: string;
  app_cloudflared_enabled: string; app_cloudflared_url: string;
}

const DEFAULT_STATE: WizardState = {
  rd_api_key: "",
  tmdb_api_key: "",
  rd_download_mode: "symlink",
  rd_mount_path: "/mnt/zurg/torrents",
  movies_path: "/media/movies",
  shows_path: "/media/shows",
  music_path: "/media/music",
  books_path: "/media/books",
  media_server: "none",
  plex_url: "", plex_token: "", plex_movies_library: "", plex_shows_library: "",
  jellyfin_url: "", jellyfin_api_key: "",
  emby_url: "", emby_api_key: "",
  indexer: "torrentio",
  torrentio_url: "https://torrentio.strem.fun",
  torrentio_opts: "sort=qualitysize|qualityfilter=480p,scr,cam",
  zilean_url: "http://zilean:8182",
  default_quality: "1080p",
  notify_on_grab: "true",
  notify_on_download: "true",
  notify_on_error: "true",
  discord_webhook: "", telegram_bot_token: "", telegram_chat_id: "",
  app_radarr_enabled: "false",    app_radarr_url: "http://radarr:7878",
  app_sonarr_enabled: "false",    app_sonarr_url: "http://sonarr:8989",
  app_prowlarr_enabled: "false",  app_prowlarr_url: "http://prowlarr:9696",
  app_lidarr_enabled: "false",    app_lidarr_url: "http://lidarr:8686",
  app_readarr_enabled: "false",    app_readarr_url: "http://readarr:8787",
  app_bazarr_enabled: "false",     app_bazarr_url: "http://bazarr:6767",
  app_whisparr_enabled: "false",   app_whisparr_url: "http://whisparr:6969",
  app_profilarr_enabled: "false",  app_profilarr_url: "http://profilarr:6868",
  // debrid stack
  app_zurg_enabled: "false",       app_zurg_url: "http://zurg:9999",
  app_rclone_enabled: "false",     app_rclone_url: "http://rclone:5572",
  app_decypharr_enabled: "false",  app_decypharr_url: "http://decypharr:8282",
  app_nzbdav_enabled: "false",     app_nzbdav_url: "http://nzbdav:8080",
  app_altmount_enabled: "false",   app_altmount_url: "http://altmount:8088",
  app_cli_debrid_enabled: "false", app_cli_debrid_url: "http://cli-debrid:3000",
  // orchestrators
  app_riven_enabled: "false",      app_riven_url: "http://riven:8080",
  app_pulsarr_enabled: "false",    app_pulsarr_url: "http://pulsarr:3003",
  app_neutarr_enabled: "false",    app_neutarr_url: "http://neutarr:8191",
  // request
  app_overseerr_enabled: "false",  app_overseerr_url: "http://overseerr:5055",
  app_jellyseerr_enabled: "false", app_jellyseerr_url: "http://jellyseerr:5055",
  // analytics
  app_tautulli_enabled: "false",   app_tautulli_url: "http://tautulli:8181",
  // infrastructure
  app_traefik_enabled: "false",    app_traefik_url: "http://traefik:8080",
  app_pgadmin_enabled: "false",    app_pgadmin_url: "http://pgadmin:5050",
  app_cloudflared_enabled: "false",app_cloudflared_url: "http://localhost:14333",
};

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  "welcome", "realdebrid", "tmdb", "download", "paths",
  "mediaserver", "indexer", "quality", "apps", "notifications", "done",
] as const;
type Step = typeof STEPS[number];

// ─── Main component ───────────────────────────────────────────────────────────

export function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>("welcome");
  const [form, setForm] = useState<WizardState>(DEFAULT_STATE);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const stepIndex = STEPS.indexOf(step);
  const progress = Math.max(0, (stepIndex - 1) / (STEPS.length - 3)) * 100;

  const set = (key: keyof WizardState, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const go = (target: Step, dir: "forward" | "back" = "forward") => {
    setDirection(dir);
    setStep(target);
  };

  const next = () => {
    const nextStep = STEPS[stepIndex + 1];
    if (nextStep) go(nextStep, "forward");
  };

  const back = () => {
    const prevStep = STEPS[stepIndex - 1];
    if (prevStep) go(prevStep, "back");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, onboarding_complete: "true" };
      await client.put("/settings", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      navigate("/");
      toast.success("Automatarr is ready to go!");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "radial-gradient(ellipse at 20% 0%, rgba(109,40,217,0.08) 0%, transparent 60%), #070810" }}>
      {/* Top progress bar */}
      {step !== "welcome" && step !== "done" && (
        <div className="h-px fixed top-0 left-0 right-0 z-50" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #6d28d9, #818cf8, #6d28d9)",
              boxShadow: "0 0 8px rgba(109,40,217,0.6)",
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6 pt-10">
        <div className="w-full max-w-xl">
          {step === "welcome"       && <StepWelcome onNext={next} />}
          {step === "realdebrid"    && <StepRealDebrid form={form} set={set} onNext={next} onBack={back} />}
          {step === "tmdb"          && <StepTMDB form={form} set={set} onNext={next} onBack={back} />}
          {step === "download"      && <StepDownload form={form} set={set} onNext={next} onBack={back} />}
          {step === "paths"         && <StepPaths form={form} set={set} onNext={next} onBack={back} />}
          {step === "mediaserver"   && <StepMediaServer form={form} set={set} onNext={next} onBack={back} />}
          {step === "indexer"       && <StepIndexer form={form} set={set} onNext={next} onBack={back} />}
          {step === "quality"       && <StepQuality form={form} set={set} onNext={next} onBack={back} />}
          {step === "apps"          && <StepApps form={form} set={set} onNext={next} onBack={back} />}
          {step === "notifications" && <StepNotifications form={form} set={set} onNext={next} onBack={back} />}
          {step === "done"          && <StepDone form={form} saving={saveMutation.isPending} onSave={() => saveMutation.mutate()} />}
        </div>
      </div>

      {/* Step dots */}
      {step !== "welcome" && step !== "done" && (
        <div className="flex justify-center gap-1.5 pb-8">
          {STEPS.slice(1, -1).map((s) => {
            const isActive = s === step;
            const isDone = stepIndex > STEPS.indexOf(s);
            return (
              <div
                key={s}
                className="rounded-full transition-all duration-300"
                style={{
                  width: isActive ? 20 : 6,
                  height: 6,
                  background: isActive ? "#7c3aed" : isDone ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.08)",
                  boxShadow: isActive ? "0 0 8px rgba(124,58,237,0.6)" : "none",
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Step: Welcome ────────────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-10 animate-fade-in">
      {/* Logo mark */}
      <div className="flex justify-center">
        <div className="relative">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)",
              boxShadow: "0 0 60px rgba(109,40,217,0.5), 0 0 120px rgba(109,40,217,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            <Zap style={{ width: 36, height: 36, color: "#fff" }} strokeWidth={2.5} />
          </div>
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: "0 0 0 1px rgba(124,58,237,0.4)" }} />
        </div>
      </div>

      <div className="space-y-3">
        <h1
          className="text-5xl font-bold tracking-tight"
          style={{
            background: "linear-gradient(135deg, #f1f5f9 0%, #c4b5fd 60%, #818cf8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Automatarr
        </h1>
        <p className="text-base text-slate-500 max-w-sm mx-auto leading-relaxed">
          Automated media management powered by Real-Debrid.<br />
          Zero disk. Instant downloads. Fully self-hosted.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "⚡", title: "Instant", desc: "Cached torrents — no seeding, no waiting" },
          { icon: "🔗", title: "Symlinks", desc: "Zero disk usage via rclone mount" },
          { icon: "🤖", title: "Automated", desc: "Searches and grabs while you sleep" },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-xl p-4 text-left"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-xl mb-2">{f.icon}</p>
            <p className="text-sm font-semibold text-slate-200">{f.title}</p>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="inline-flex items-center gap-2.5 px-8 py-3.5 text-white font-semibold rounded-xl text-sm"
        style={{
          background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)",
          boxShadow: "0 0 24px rgba(109,40,217,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
      >
        Get Started <ChevronRight style={{ width: 16, height: 16 }} />
      </button>
    </div>
  );
}

// ─── Step: Real-Debrid ────────────────────────────────────────────────────────

function StepRealDebrid({ form, set, onNext, onBack }: StepProps) {
  const [status, setStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [userInfo, setUserInfo] = useState<any>(null);

  const test = async () => {
    if (!form.rd_api_key) return;
    setStatus("testing");
    try {
      const r = await client.post("/settings/test/realdebrid", null, {
        headers: { "X-RD-Key": form.rd_api_key },
      });
      // Temporarily save key so backend can test it
      await client.put("/settings", { rd_api_key: form.rd_api_key });
      const res = await client.post("/settings/test/realdebrid");
      setUserInfo(res.data);
      setStatus("ok");
    } catch {
      setStatus("fail");
    }
  };

  // auto-test when key reaches 40+ chars
  useEffect(() => {
    if (form.rd_api_key.length >= 40) {
      const t = setTimeout(test, 600);
      return () => clearTimeout(t);
    } else {
      setStatus("idle");
    }
  }, [form.rd_api_key]);

  const premiumDays = userInfo ? Math.floor(userInfo.premium / 86400) : 0;

  return (
    <StepShell
      icon={<Shield className="w-6 h-6" />}
      title="Real-Debrid"
      subtitle="Your premium debrid account — the engine that makes everything instant."
      step="1 of 9"
      onBack={onBack}
      onSkip={onNext}
      onNext={onNext}
      nextDisabled={status !== "ok"}
      nextLabel={status === "ok" ? "Continue" : "Test to continue"}
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">API Key</label>
          <div className="relative">
            <input
              type="password"
              value={form.rd_api_key}
              onChange={(e) => set("rd_api_key", e.target.value)}
              placeholder="Paste your Real-Debrid API key…"
              className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-3 pr-12 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
              autoFocus
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {status === "testing" && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
              {status === "ok"      && <Check className="w-4 h-4 text-green-400" />}
              {status === "fail"    && <X className="w-4 h-4 text-red-400" />}
            </div>
          </div>
        </div>

        {status === "ok" && userInfo && (
          <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-400">Connected!</p>
              <p className="text-xs text-gray-400">
                {userInfo.username} · <span className="text-green-300">{premiumDays} days premium remaining</span>
              </p>
            </div>
          </div>
        )}

        {status === "fail" && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
            Invalid API key. Check your key at real-debrid.com/apitoken
          </div>
        )}

        <a
          href="https://real-debrid.com/apitoken"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Get your API key at real-debrid.com <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </StepShell>
  );
}

// ─── Step: TMDB ──────────────────────────────────────────────────────────────

function StepTMDB({ form, set, onNext, onBack }: StepProps) {
  const [status, setStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");

  const test = async () => {
    if (!form.tmdb_api_key) return;
    setStatus("testing");
    try {
      await client.put("/settings", { tmdb_api_key: form.tmdb_api_key });
      const r = await client.get("/search/movies?q=test");
      setStatus("ok");
    } catch {
      setStatus("fail");
    }
  };

  useEffect(() => {
    if (form.tmdb_api_key.length >= 30) {
      const t = setTimeout(test, 600);
      return () => clearTimeout(t);
    } else {
      setStatus("idle");
    }
  }, [form.tmdb_api_key]);

  return (
    <StepShell
      icon={<Database className="w-6 h-6" />}
      title="TMDB Metadata"
      subtitle="Used to search movies and shows, fetch posters, ratings, and episode guides."
      step="2 of 9"
      onBack={onBack}
      onSkip={onNext}
      onNext={onNext}
      nextDisabled={status !== "ok"}
      nextLabel={status === "ok" ? "Continue" : "Test to continue"}
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-300 mb-1.5 block">TMDB API Key (v3)</label>
          <div className="relative">
            <input
              type="password"
              value={form.tmdb_api_key}
              onChange={(e) => set("tmdb_api_key", e.target.value)}
              placeholder="Paste your TMDB API key…"
              className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-3 pr-12 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
              autoFocus
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {status === "testing" && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
              {status === "ok"      && <Check className="w-4 h-4 text-green-400" />}
              {status === "fail"    && <X className="w-4 h-4 text-red-400" />}
            </div>
          </div>
        </div>

        {status === "ok" && (
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-400 font-medium">TMDB connected — metadata is ready</p>
          </div>
        )}

        <div className="p-4 bg-surface-2 rounded-xl border border-white/5 text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-400">How to get a free TMDB API key:</p>
          <p>1. Create a free account at themoviedb.org</p>
          <p>2. Go to Settings → API → Create → Developer</p>
          <p>3. Copy the <strong className="text-gray-300">API Key (v3 auth)</strong></p>
        </div>

        <a
          href="https://www.themoviedb.org/settings/api"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Open TMDB settings <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </StepShell>
  );
}

// ─── Step: Download Mode ──────────────────────────────────────────────────────

function StepDownload({ form, set, onNext, onBack }: StepProps) {
  return (
    <StepShell
      icon={<FolderOpen className="w-6 h-6" />}
      title="Download Mode"
      subtitle="How should Automatarr deliver files to your media server?"
      step="3 of 9"
      onBack={onBack}
      onSkip={onNext}
      onNext={onNext}
    >
      <div className="space-y-3">
        <OptionCard
          selected={form.rd_download_mode === "symlink"}
          onClick={() => set("rd_download_mode", "symlink")}
          badge="Recommended"
          title="🔗 Symlink Mode"
          description="Creates symlinks from your library to your rclone/Zurg mount. Zero disk usage — your media server streams directly from Real-Debrid via the mount."
          pros={["No disk space used", "Instant — available as soon as RD caches it", "Files always stay up to date"]}
        />
        <OptionCard
          selected={form.rd_download_mode === "download"}
          onClick={() => set("rd_download_mode", "download")}
          title="⬇️ Direct Download Link"
          description="Gets an unrestricted download URL from Real-Debrid. Useful if you don't have rclone set up."
          pros={["No rclone required", "Works anywhere", "Simple setup"]}
        />

        {form.rd_download_mode === "symlink" && (
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium text-gray-300 block">rclone / Zurg Mount Path</label>
            <input
              type="text"
              value={form.rd_mount_path}
              onChange={(e) => set("rd_mount_path", e.target.value)}
              className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
              placeholder="/mnt/zurg/torrents"
            />
            <p className="text-xs text-gray-600">
              Start Zurg + rclone with <code className="text-indigo-400">--profile zurg</code>. The mount will be at <code className="text-indigo-400">/mnt/zurg/torrents</code> inside the containers.
            </p>
          </div>
        )}
      </div>
    </StepShell>
  );
}

// ─── Step: Paths ─────────────────────────────────────────────────────────────

function StepPaths({ form, set, onNext, onBack }: StepProps) {
  return (
    <StepShell
      icon={<FolderOpen className="w-6 h-6" />}
      title="Library Paths"
      subtitle="Where should your media be organized? These are paths inside the container."
      step="4 of 9"
      onBack={onBack}
      onSkip={onNext}
      onNext={onNext}
    >
      <div className="space-y-4">
        {[
          { key: "movies_path", label: "🎬 Movies", placeholder: "/media/movies", required: true },
          { key: "shows_path",  label: "📺 TV Shows", placeholder: "/media/shows", required: true },
          { key: "music_path",  label: "🎵 Music", placeholder: "/media/music", required: false },
          { key: "books_path",  label: "📚 Books", placeholder: "/media/books", required: false },
        ].map(({ key, label, placeholder, required }) => (
          <div key={key}>
            <label className="text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2">
              {label}
              {required && <span className="text-xs text-indigo-400 font-normal">Required</span>}
              {!required && <span className="text-xs text-gray-600 font-normal">Optional</span>}
            </label>
            <input
              type="text"
              value={form[key as keyof WizardState]}
              onChange={(e) => set(key as keyof WizardState, e.target.value)}
              placeholder={placeholder}
              className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>
        ))}
        <p className="text-xs text-gray-600">
          Map these to your host paths in <code className="text-indigo-400">.env</code>: <code className="text-indigo-400">MOVIES_PATH</code>, <code className="text-indigo-400">SHOWS_PATH</code>, etc.
        </p>
      </div>
    </StepShell>
  );
}

// ─── Step: Media Server ───────────────────────────────────────────────────────

function StepMediaServer({ form, set, onNext, onBack }: StepProps) {
  const [status, setStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [plexLibs, setPlexLibs] = useState<any[]>([]);

  const testServer = async () => {
    if (form.media_server === "none") { onNext(); return; }
    setStatus("testing");
    try {
      await client.put("/settings", {
        media_server: form.media_server,
        plex_url: form.plex_url, plex_token: form.plex_token,
        jellyfin_url: form.jellyfin_url, jellyfin_api_key: form.jellyfin_api_key,
        emby_url: form.emby_url, emby_api_key: form.emby_api_key,
      });
      const endpoint = `/settings/test/${form.media_server}`;
      const r = await client.post(endpoint);
      if (form.media_server === "plex" && r.data.libraries) {
        setPlexLibs(r.data.libraries);
      }
      setStatus("ok");
    } catch {
      setStatus("fail");
    }
  };

  const SERVER_OPTIONS = [
    { value: "none",     label: "None",     icon: "🚫", desc: "I'll configure my media server separately" },
    { value: "plex",     label: "Plex",     icon: "🟡", desc: "Auto-scan after each download" },
    { value: "jellyfin", label: "Jellyfin", icon: "🔵", desc: "Open-source, self-hosted" },
    { value: "emby",     label: "Emby",     icon: "🟢", desc: "Feature-rich media server" },
  ];

  return (
    <StepShell
      icon={<Server className="w-6 h-6" />}
      title="Media Server"
      subtitle="Automatarr will trigger a library scan after each download."
      step="5 of 9"
      onBack={onBack}
      onSkip={onNext}
      onNext={form.media_server === "none" ? onNext : status === "ok" ? onNext : testServer}
      nextLabel={form.media_server === "none" ? "Skip" : status === "ok" ? "Continue" : "Test & Continue"}
      nextLoading={status === "testing"}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {SERVER_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => { set("media_server", s.value); setStatus("idle"); }}
              className={`p-3 rounded-xl border text-left transition-all ${
                form.media_server === s.value
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-white/5 bg-surface-1 hover:border-white/15"
              }`}
            >
              <span className="text-xl">{s.icon}</span>
              <p className="text-sm font-medium text-gray-200 mt-1">{s.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
            </button>
          ))}
        </div>

        {form.media_server === "plex" && (
          <div className="space-y-3 pt-2">
            <Field label="Plex URL" value={form.plex_url} onChange={(v) => set("plex_url", v)} placeholder="http://localhost:32400" />
            <Field label="Plex Token" value={form.plex_token} onChange={(v) => set("plex_token", v)} placeholder="Your X-Plex-Token" type="password" />
            {plexLibs.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-400">Select your libraries:</p>
                <select value={form.plex_movies_library} onChange={(e) => set("plex_movies_library", e.target.value)}
                  className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500">
                  <option value="">Movies library…</option>
                  {plexLibs.filter((l) => l.type === "movie").map((l) => <option key={l.key} value={l.key}>{l.title}</option>)}
                </select>
                <select value={form.plex_shows_library} onChange={(e) => set("plex_shows_library", e.target.value)}
                  className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500">
                  <option value="">TV Shows library…</option>
                  {plexLibs.filter((l) => l.type === "show").map((l) => <option key={l.key} value={l.key}>{l.title}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {form.media_server === "jellyfin" && (
          <div className="space-y-3 pt-2">
            <Field label="Jellyfin URL" value={form.jellyfin_url} onChange={(v) => set("jellyfin_url", v)} placeholder="http://localhost:8096" />
            <Field label="API Key" value={form.jellyfin_api_key} onChange={(v) => set("jellyfin_api_key", v)} placeholder="From Dashboard → API Keys" type="password" />
          </div>
        )}

        {form.media_server === "emby" && (
          <div className="space-y-3 pt-2">
            <Field label="Emby URL" value={form.emby_url} onChange={(v) => set("emby_url", v)} placeholder="http://localhost:8096" />
            <Field label="API Key" value={form.emby_api_key} onChange={(v) => set("emby_api_key", v)} placeholder="API key" type="password" />
          </div>
        )}

        {status === "ok" && <StatusBanner ok message="Connected successfully!" />}
        {status === "fail" && <StatusBanner ok={false} message="Could not connect. Check the URL and credentials." />}
      </div>
    </StepShell>
  );
}

// ─── Step: Indexer ────────────────────────────────────────────────────────────

function StepIndexer({ form, set, onNext, onBack }: StepProps) {
  const [zileanStatus, setZileanStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");

  const testZilean = async () => {
    setZileanStatus("testing");
    try {
      await client.put("/settings", { zilean_url: form.zilean_url });
      await client.post("/settings/test/zilean");
      setZileanStatus("ok");
    } catch {
      setZileanStatus("fail");
    }
  };

  return (
    <StepShell
      icon={<Search className="w-6 h-6" />}
      title="Indexer"
      subtitle="Where should Automatarr search for torrents?"
      step="6 of 9"
      onBack={onBack}
      onSkip={onNext}
      onNext={onNext}
    >
      <div className="space-y-3">
        <OptionCard
          selected={form.indexer === "torrentio"}
          onClick={() => set("indexer", "torrentio")}
          badge="Easiest"
          title="🌐 Torrentio"
          description="Hosted service — no setup needed. Searches the web and returns instant-available hashes for your Real-Debrid account."
          pros={["No installation required", "Huge index", "RD availability pre-checked"]}
        />
        <OptionCard
          selected={form.indexer === "zilean"}
          onClick={() => set("indexer", "zilean")}
          badge="Private"
          title="🏠 Zilean (self-hosted)"
          description="Run your own indexer using the Debrid Media Manager dataset. No external requests, full privacy."
          pros={["Private — no external requests", "Fast local search", "No rate limits"]}
        />
        <OptionCard
          selected={form.indexer === "both"}
          onClick={() => set("indexer", "both")}
          title="🔀 Both"
          description="Search Torrentio and Zilean, merge results. Best coverage."
          pros={["Maximum results", "Fallback if one is down"]}
        />

        {(form.indexer === "zilean" || form.indexer === "both") && (
          <div className="space-y-2 pt-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={form.zilean_url}
                onChange={(e) => set("zilean_url", e.target.value)}
                className="flex-1 bg-surface-2 border border-white/10 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
                placeholder="http://zilean:8182"
              />
              <button
                onClick={testZilean}
                disabled={zileanStatus === "testing"}
                className="px-4 py-2.5 bg-surface-2 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 flex-shrink-0"
              >
                {zileanStatus === "testing" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Test
              </button>
            </div>
            {zileanStatus === "ok"   && <StatusBanner ok message="Zilean is reachable!" />}
            {zileanStatus === "fail" && <StatusBanner ok={false} message={`Can't reach Zilean at ${form.zilean_url}. Run: docker-compose --profile zilean up -d`} />}
          </div>
        )}

        {(form.indexer === "torrentio" || form.indexer === "both") && (
          <div className="pt-2 space-y-2">
            <p className="text-xs font-medium text-gray-400">Torrentio filters (optional)</p>
            <input
              type="text"
              value={form.torrentio_opts}
              onChange={(e) => set("torrentio_opts", e.target.value)}
              className="w-full bg-surface-2 border border-white/10 rounded-xl px-4 py-2.5 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
              placeholder="sort=qualitysize|qualityfilter=480p,scr,cam"
            />
            <p className="text-xs text-gray-600">Pipe-separated Torrentio options. Leave blank for defaults.</p>
          </div>
        )}
      </div>
    </StepShell>
  );
}

// ─── Step: Quality ────────────────────────────────────────────────────────────

function StepQuality({ form, set, onNext, onBack }: StepProps) {
  const QUALITIES = [
    { value: "4k",    label: "4K",    sub: "2160p · ~50–80 GB/film",  icon: "✨" },
    { value: "1080p", label: "1080p", sub: "Best balance · ~8–20 GB", icon: "🎯", badge: "Recommended" },
    { value: "720p",  label: "720p",  sub: "Smaller files · ~4–8 GB", icon: "📦" },
    { value: "any",   label: "Any",   sub: "Whatever is available",    icon: "🎲" },
  ];

  return (
    <StepShell
      icon={<Star className="w-6 h-6" />}
      title="Default Quality"
      subtitle="The preferred quality for new movies and shows. You can override per-title."
      step="7 of 9"
      onBack={onBack}
      onSkip={onNext}
      onNext={onNext}
    >
      <div className="grid grid-cols-2 gap-3">
        {QUALITIES.map((q) => (
          <button
            key={q.value}
            onClick={() => set("default_quality", q.value)}
            className={`relative p-5 rounded-xl border text-left transition-all ${
              form.default_quality === q.value
                ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                : "border-white/5 bg-surface-1 hover:border-white/15"
            }`}
          >
            {q.badge && (
              <span className="absolute top-2.5 right-2.5 text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded font-medium">
                {q.badge}
              </span>
            )}
            <div className="text-2xl mb-2">{q.icon}</div>
            <p className="text-base font-bold text-gray-100">{q.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{q.sub}</p>
            {form.default_quality === q.value && (
              <div className="absolute bottom-2.5 right-2.5 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </StepShell>
  );
}

// ─── Step: Apps ──────────────────────────────────────────────────────────────

type AppDef = { key: string; label: string; icon: string; desc: string; url: string; port: number };

const APP_GROUPS: { label: string; color: string; apps: AppDef[] }[] = [
  {
    label: "Debrid Stack",
    color: "#f59e0b",
    apps: [
      { key: "zurg",       label: "Zurg",       icon: "🌐", desc: "WebDAV RD mount",    url: "http://zurg:9999",        port: 9999 },
      { key: "rclone",     label: "rclone",     icon: "☁️",  desc: "Mount manager",     url: "http://rclone:5572",      port: 5572 },
      { key: "decypharr",  label: "Decypharr",  icon: "⬇️",  desc: "Debrid downloader", url: "http://decypharr:8282",   port: 8282 },
      { key: "nzbdav",     label: "NzbDAV",     icon: "📡", desc: "NZB via WebDAV",     url: "http://nzbdav:8080",      port: 8080 },
      { key: "altmount",   label: "AltMount",   icon: "🔌", desc: "Alternative mounter",url: "http://altmount:8088",    port: 8088 },
      { key: "cli_debrid", label: "CLI Debrid", icon: "⌨️",  desc: "Plex debrid CLI",   url: "http://cli-debrid:3000",  port: 3000 },
    ],
  },
  {
    label: "Orchestrators & Requests",
    color: "#22d3ee",
    apps: [
      { key: "riven",       label: "Riven",       icon: "🌊", desc: "All-in-one manager", url: "http://riven:8080",      port: 8080 },
      { key: "pulsarr",     label: "Pulsarr",     icon: "💫", desc: "Watchlist sync",     url: "http://pulsarr:3003",    port: 3003 },
      { key: "neutarr",     label: "NeutArr",     icon: "🧲", desc: "Content discovery",  url: "http://neutarr:8191",    port: 8191 },
      { key: "overseerr",   label: "Overseerr",   icon: "🙋", desc: "Request manager",    url: "http://overseerr:5055",  port: 5055 },
      { key: "jellyseerr",  label: "Jellyseerr",  icon: "🎯", desc: "Jellyfin requests",  url: "http://jellyseerr:5055", port: 5055 },
    ],
  },
  {
    label: "Arr Suite",
    color: "#a78bfa",
    apps: [
      { key: "radarr",    label: "Radarr",    icon: "🎬", desc: "Movies",        url: "http://radarr:7878",   port: 7878 },
      { key: "sonarr",    label: "Sonarr",    icon: "📺", desc: "TV Shows",      url: "http://sonarr:8989",   port: 8989 },
      { key: "prowlarr",  label: "Prowlarr",  icon: "🔍", desc: "Indexers",      url: "http://prowlarr:9696", port: 9696 },
      { key: "lidarr",    label: "Lidarr",    icon: "🎵", desc: "Music",         url: "http://lidarr:8686",   port: 8686 },
      { key: "readarr",   label: "Readarr",   icon: "📚", desc: "Books",         url: "http://readarr:8787",  port: 8787 },
      { key: "bazarr",    label: "Bazarr",    icon: "💬", desc: "Subtitles",     url: "http://bazarr:6767",   port: 6767 },
      { key: "whisparr",  label: "Whisparr",  icon: "🔞", desc: "Adult content", url: "http://whisparr:6969", port: 6969 },
      { key: "profilarr", label: "Profilarr", icon: "⚙️",  desc: "Quality profiles",url: "http://profilarr:6868",port: 6868 },
    ],
  },
  {
    label: "Analytics & Infrastructure",
    color: "#34d399",
    apps: [
      { key: "tautulli",    label: "Tautulli",    icon: "📊", desc: "Plex analytics",    url: "http://tautulli:8181",  port: 8181 },
      { key: "traefik",     label: "Traefik",     icon: "🔀", desc: "Reverse proxy",     url: "http://traefik:8080",   port: 8080 },
      { key: "pgadmin",     label: "pgAdmin",     icon: "🗄️",  desc: "DB admin panel",   url: "http://pgadmin:5050",   port: 5050 },
      { key: "cloudflared", label: "Cloudflared", icon: "🌩️",  desc: "Tunnel manager",   url: "http://localhost:14333",port: 14333 },
    ],
  },
];

const ALL_APPS: AppDef[] = APP_GROUPS.flatMap((g) => g.apps);

function StepApps({ form, set, onNext, onBack }: StepProps) {
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState<Record<string, boolean>>({});

  const autoDetect = async () => {
    setDetecting(true);
    const results: Record<string, boolean> = {};
    await Promise.all(
      ALL_APPS.map(async (app) => {
        try {
          await client.get(`/system/probe?url=${encodeURIComponent(app.url)}`);
          results[app.key] = true;
        } catch {
          try {
            await fetch(`http://localhost:${app.port}`, { mode: "no-cors", signal: AbortSignal.timeout(1200) });
            results[app.key] = true;
          } catch {
            results[app.key] = false;
          }
        }
      })
    );
    setDetected(results);
    ALL_APPS.forEach((app) => {
      if (results[app.key]) {
        set(`app_${app.key}_enabled` as keyof WizardState, "true");
        set(`app_${app.key}_url` as keyof WizardState, `http://localhost:${app.port}`);
      }
    });
    setDetecting(false);
  };

  const toggle = (app: AppDef) => {
    const k = `app_${app.key}_enabled` as keyof WizardState;
    const on = form[k] === "true";
    set(k, on ? "false" : "true");
    if (!on) set(`app_${app.key}_url` as keyof WizardState, app.url);
  };

  return (
    <StepShell
      icon={<Rocket className="w-6 h-6" />}
      title="Connected Apps"
      subtitle="Which services are you running? They'll appear in the Apps hub."
      step="8 of 9"
      onBack={onBack}
      onSkip={onNext}
      onNext={onNext}
      nextLabel="Continue"
      secondaryAction={
        <button
          onClick={autoDetect}
          disabled={detecting}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: detecting ? "#475569" : "#a78bfa" }}
        >
          {detecting ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <RefreshCw style={{ width: 14, height: 14 }} />}
          {detecting ? "Scanning…" : "Auto-detect running apps"}
        </button>
      }
    >
      <div className="space-y-5">
        {APP_GROUPS.map((group) => (
          <div key={group.label}>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2"
              style={{ color: group.color }}
            >
              <span className="w-4 h-px inline-block" style={{ background: group.color }} />
              {group.label}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {group.apps.map((app) => {
                const enabled = form[`app_${app.key}_enabled` as keyof WizardState] === "true";
                const live = detected[app.key];
                return (
                  <button
                    key={app.key}
                    onClick={() => toggle(app)}
                    className="relative p-3.5 rounded-xl text-left transition-all"
                    style={{
                      background: enabled ? `rgba(${hexGroupRgb(group.color)},0.08)` : "rgba(255,255,255,0.03)",
                      border: enabled ? `1px solid rgba(${hexGroupRgb(group.color)},0.3)` : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-lg leading-none">{app.icon}</span>
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          background: enabled ? group.color : "rgba(255,255,255,0.08)",
                          border: enabled ? `1px solid ${group.color}` : "1px solid rgba(255,255,255,0.12)",
                        }}
                      >
                        {enabled && <Check style={{ width: 9, height: 9, color: "#fff" }} strokeWidth={3} />}
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-200 mt-2 leading-tight">{app.label}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{app.desc}</p>
                    {live && (
                      <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>
                        ● LIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </StepShell>
  );
}

function hexGroupRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// ─── Step: Notifications ─────────────────────────────────────────────────────

function StepNotifications({ form, set, onNext, onBack }: StepProps) {
  const hasDiscord = form.discord_webhook.length > 0;
  const hasTelegram = form.telegram_bot_token.length > 0;

  return (
    <StepShell
      icon={<Bell className="w-6 h-6" />}
      title="Notifications"
      subtitle="Get notified when Automatarr grabs or downloads something. Totally optional."
      step="9 of 9"
      onBack={onBack}
      onSkip={onNext}
      onNext={onNext}
      nextLabel="Almost done!"
    >
      <div className="space-y-4">
        {/* Discord */}
        <div className="p-4 bg-surface-1 rounded-xl border border-white/5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#5865f2]/20 flex items-center justify-center text-base">
              <span>🎮</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-200">Discord</p>
              <p className="text-xs text-gray-500">Webhook notifications to any channel</p>
            </div>
            {hasDiscord && <Check className="w-4 h-4 text-green-400 ml-auto" />}
          </div>
          <input
            type="password"
            value={form.discord_webhook}
            onChange={(e) => set("discord_webhook", e.target.value)}
            placeholder="https://discord.com/api/webhooks/…"
            className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Telegram */}
        <div className="p-4 bg-surface-1 rounded-xl border border-white/5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0088cc]/20 flex items-center justify-center">
              <span>✈️</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-200">Telegram</p>
              <p className="text-xs text-gray-500">Bot messages to any chat or group</p>
            </div>
            {hasTelegram && form.telegram_chat_id && <Check className="w-4 h-4 text-green-400 ml-auto" />}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="password"
              value={form.telegram_bot_token}
              onChange={(e) => set("telegram_bot_token", e.target.value)}
              placeholder="Bot token (from @BotFather)"
              className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              value={form.telegram_chat_id}
              onChange={(e) => set("telegram_chat_id", e.target.value)}
              placeholder="Chat ID (-100…)"
              className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex gap-6 text-sm">
          {(["notify_on_grab", "notify_on_download", "notify_on_error"] as const).map((k) => (
            <label key={k} className="flex items-center gap-2 text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={form[k] === "true"}
                onChange={(e) => set(k, e.target.checked ? "true" : "false")}
                className="accent-indigo-500"
              />
              {k.replace("notify_on_", "On ")}
            </label>
          ))}
        </div>
      </div>
    </StepShell>
  );
}

// ─── Step: Done ───────────────────────────────────────────────────────────────

function StepDone({ form, saving, onSave }: { form: WizardState; saving: boolean; onSave: () => void }) {
  const enabledApps = ALL_APPS.filter((a) => form[`app_${a.key}_enabled` as keyof WizardState] === "true");

  const summaryItems = [
    { icon: "⚡", label: "Real-Debrid",  value: form.rd_api_key ? "Connected" : "Not configured",  ok: !!form.rd_api_key },
    { icon: "🎬", label: "TMDB",         value: form.tmdb_api_key ? "Connected" : "Not configured", ok: !!form.tmdb_api_key },
    { icon: "🔗", label: "Download",     value: form.rd_download_mode === "symlink" ? "Symlink mode" : "Direct download", ok: true },
    { icon: "📁", label: "Libraries",    value: `${form.movies_path} · ${form.shows_path}`,         ok: true },
    { icon: "🖥️", label: "Media Server", value: form.media_server === "none" ? "None configured" : form.media_server, ok: form.media_server !== "none" },
    { icon: "🔍", label: "Indexer",      value: form.indexer,                                        ok: true },
    { icon: "⭐", label: "Quality",      value: form.default_quality.toUpperCase(),                  ok: true },
    { icon: "📦", label: "Apps",         value: enabledApps.length > 0 ? enabledApps.map((a) => a.label).join(", ") : "None enabled", ok: enabledApps.length > 0 },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="text-5xl mb-3">🚀</div>
        <h1 className="text-3xl font-bold" style={{
          background: "linear-gradient(135deg, #f1f5f9 0%, #a78bfa 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Ready to launch
        </h1>
        <p className="text-slate-500 text-sm">Everything's configured. Here's your summary.</p>
      </div>

      <div
        className="rounded-2xl overflow-hidden divide-y"
        style={{ background: "#0c0e1a", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {summaryItems.map((item) => (
          <div key={item.label} className="flex items-center gap-4 px-5 py-3.5">
            <span className="text-base w-6 text-center flex-shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-600 uppercase tracking-wider font-semibold">{item.label}</p>
              <p className="text-sm font-medium text-slate-200 truncate mt-0.5">{item.value}</p>
            </div>
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: item.ok ? "rgba(52,211,153,0.15)" : "rgba(251,191,36,0.15)" }}
            >
              <Check style={{ width: 11, height: 11, color: item.ok ? "#34d399" : "#fbbf24" }} strokeWidth={3} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-3 px-10 py-4 font-bold rounded-xl text-white text-base disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)",
            boxShadow: "0 0 32px rgba(109,40,217,0.5), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</> : <><Rocket className="w-5 h-5" /> Launch Automatarr</>}
        </button>
      </div>
    </div>
  );
}

// ─── Shared shell ─────────────────────────────────────────────────────────────

interface StepProps {
  form: WizardState;
  set: (key: keyof WizardState, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

interface ShellProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  step: string;
  onBack: () => void;
  onNext: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  children: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

function StepShell({ icon, title, subtitle, step, onBack, onNext, onSkip, nextLabel = "Continue", nextDisabled = false, nextLoading = false, children, secondaryAction }: ShellProps) {
  return (
    <div className="space-y-7 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(124,58,237,0.12)",
              border: "1px solid rgba(124,58,237,0.25)",
              color: "#a78bfa",
            }}
          >
            {icon}
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-slate-600 mb-0.5">Step {step}</p>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">{title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
        {onSkip && (
          <button
            onClick={onSkip}
            className="flex-shrink-0 text-xs text-slate-600 hover:text-slate-400 transition-colors mt-1 flex items-center gap-1"
          >
            Skip <ChevronRight style={{ width: 12, height: 12 }} />
          </button>
        )}
      </div>

      {/* Content */}
      <div>{children}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-300 transition-colors"
        >
          <ChevronLeft style={{ width: 16, height: 16 }} /> Back
        </button>

        <div className="flex items-center gap-4">
          {secondaryAction}
          <button
            onClick={onNext}
            disabled={nextDisabled || nextLoading}
            className="flex items-center gap-2 px-6 py-2.5 text-white font-semibold rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            style={{
              background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)",
              boxShadow: "0 0 16px rgba(109,40,217,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            {nextLoading && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
            {nextLabel}
            {!nextLoading && <ChevronRight style={{ width: 14, height: 14 }} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function OptionCard({ selected, onClick, title, description, pros, badge }: {
  selected: boolean; onClick: () => void; title: string;
  description: string; pros: string[]; badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="relative w-full p-4 rounded-xl text-left transition-all duration-150"
      style={selected ? {
        background: "rgba(124,58,237,0.1)",
        border: "1px solid rgba(124,58,237,0.4)",
        boxShadow: "0 0 20px rgba(124,58,237,0.08)",
      } : {
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {badge && (
        <span
          className="absolute top-3 right-3 text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded"
          style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}
        >
          {badge}
        </span>
      )}
      <p className="text-sm font-semibold text-slate-100 pr-16">{title}</p>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
      <ul className="mt-3 space-y-1">
        {pros.map((p) => (
          <li key={p} className="flex items-center gap-2 text-xs text-slate-500">
            <Check style={{ width: 11, height: 11, color: "#7c3aed", flexShrink: 0 }} strokeWidth={3} /> {p}
          </li>
        ))}
      </ul>
      {selected && (
        <div
          className="absolute top-3.5 left-3.5 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: "#7c3aed" }}
        >
          <Check style={{ width: 9, height: 9, color: "#fff" }} strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 mb-1.5 block tracking-wide uppercase">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-700 outline-none transition-all"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(124,58,237,0.5)"; }}
        onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; }}
      />
    </div>
  );
}

function StatusBanner({ ok, message }: { ok: boolean; message: string }) {
  return (
    <div
      className="flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-medium"
      style={ok ? {
        background: "rgba(52,211,153,0.08)",
        border: "1px solid rgba(52,211,153,0.2)",
        color: "#34d399",
      } : {
        background: "rgba(248,113,113,0.08)",
        border: "1px solid rgba(248,113,113,0.2)",
        color: "#f87171",
      }}
    >
      {ok
        ? <Check style={{ width: 15, height: 15, flexShrink: 0 }} strokeWidth={2.5} />
        : <X    style={{ width: 15, height: 15, flexShrink: 0 }} strokeWidth={2.5} />}
      {message}
    </div>
  );
}
