import type { MediaStatus } from "../../types";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  downloaded:  { label: "DOWNLOADED",  color: "#00ff88", bg: "rgba(0,255,136,0.1)"  },
  available:   { label: "AVAILABLE",   color: "#00f5ff", bg: "rgba(0,245,255,0.1)"  },
  searching:   { label: "SEARCHING",   color: "#ffe600", bg: "rgba(255,230,0,0.1)"  },
  grabbed:     { label: "GRABBED",     color: "#ff7700", bg: "rgba(255,119,0,0.1)"  },
  missing:     { label: "MISSING",     color: "#ff006e", bg: "rgba(255,0,110,0.1)"  },
  wanted:      { label: "WANTED",      color: "#b14fff", bg: "rgba(177,79,255,0.1)" },
  monitored:   { label: "MONITORED",   color: "#00f5ff", bg: "rgba(0,245,255,0.1)"  },
  unmonitored: { label: "UNMONITORED", color: "rgba(212,200,240,0.3)", bg: "rgba(212,200,240,0.05)" },
};

function hexRgb(hex: string) {
  if (!hex.startsWith("#")) return "212,200,240";
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}

export function StatusBadge({ status }: { status: MediaStatus | string }) {
  const cfg = STATUS_CONFIG[status?.toLowerCase?.()] ?? {
    label: (status ?? "UNKNOWN").toUpperCase(),
    color: "rgba(212,200,240,0.4)",
    bg: "rgba(212,200,240,0.06)",
  };

  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono"
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.15em",
        padding: "3px 8px",
        borderRadius: 4,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid rgba(${hexRgb(cfg.color)},0.3)`,
        textShadow: `0 0 6px ${cfg.color}`,
      }}
    >
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: cfg.color,
          boxShadow: `0 0 5px ${cfg.color}, 0 0 10px ${cfg.color}`,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}

const QUALITY_CONFIG: Record<string, { color: string; bg: string }> = {
  "4k":    { color: "#ffe600", bg: "rgba(255,230,0,0.1)"  },
  "2160p": { color: "#ffe600", bg: "rgba(255,230,0,0.1)"  },
  "1080p": { color: "#00f5ff", bg: "rgba(0,245,255,0.1)"  },
  "720p":  { color: "#b14fff", bg: "rgba(177,79,255,0.1)" },
  "480p":  { color: "#ff7700", bg: "rgba(255,119,0,0.1)"  },
  "any":   { color: "rgba(212,200,240,0.4)", bg: "rgba(212,200,240,0.06)" },
};

export function QualityBadge({ quality }: { quality?: string }) {
  const key = quality?.toLowerCase() ?? "any";
  const cfg = QUALITY_CONFIG[key] ?? QUALITY_CONFIG["any"];

  return (
    <span
      className="font-mono"
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.15em",
        padding: "3px 8px",
        borderRadius: 4,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid rgba(${hexRgb(cfg.color)},0.3)`,
        textShadow: `0 0 6px ${cfg.color}`,
      }}
    >
      {(quality ?? "ANY").toUpperCase()}
    </span>
  );
}
