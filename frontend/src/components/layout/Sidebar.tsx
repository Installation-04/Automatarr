import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Film, Tv, Calendar, ListVideo, AppWindow, Settings, Zap,
} from "lucide-react";

const NAV = [
  { to: "/",         label: "Dashboard", icon: LayoutDashboard, color: "#ff006e", glow: "rgba(255,0,110,0.55)"  },
  { to: "/movies",   label: "Movies",    icon: Film,            color: "#00f5ff", glow: "rgba(0,245,255,0.55)"  },
  { to: "/shows",    label: "Shows",     icon: Tv,              color: "#ffe600", glow: "rgba(255,230,0,0.55)"  },
  { to: "/calendar", label: "Calendar",  icon: Calendar,        color: "#ff7700", glow: "rgba(255,119,0,0.55)"  },
  { to: "/queue",    label: "Queue",     icon: ListVideo,       color: "#b14fff", glow: "rgba(177,79,255,0.55)" },
  { to: "/apps",     label: "Apps",      icon: AppWindow,       color: "#00ff88", glow: "rgba(0,255,136,0.55)"  },
];

function hexRgb(hex: string) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}

export function Sidebar() {
  const location = useLocation();

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col h-screen sticky top-0"
      style={{
        background: "linear-gradient(180deg, #0d0025 0%, #0a001e 100%)",
        borderRight: "1px solid rgba(255,0,110,0.18)",
        boxShadow: "4px 0 40px rgba(255,0,110,0.06)",
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 animate-flicker"
            style={{
              background: "linear-gradient(135deg, #ff006e 0%, #b14fff 100%)",
              boxShadow: "0 0 16px rgba(255,0,110,0.7), 0 0 32px rgba(255,0,110,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            <Zap style={{ width: 18, height: 18, color: "#fff" }} strokeWidth={2.5} />
          </div>
          <div>
            <p
              className="font-display font-bold leading-none"
              style={{
                fontSize: 10,
                background: "linear-gradient(90deg, #ff006e 0%, #b14fff 50%, #00f5ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "0.2em",
              }}
            >
              AUTOMATARR
            </p>
            <p className="font-mono mt-0.5" style={{ fontSize: 8, color: "rgba(255,0,110,0.45)", letterSpacing: "0.12em" }}>
              // SYNTHWAVE EDITION
            </p>
          </div>
        </div>
        <div className="mt-5 neon-hr" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pt-1">
        <p className="font-mono px-2 mb-3 tracking-[0.2em] uppercase"
          style={{ fontSize: 8, color: "rgba(255,0,110,0.35)" }}>
          // NAV
        </p>

        {NAV.map(({ to, label, icon: Icon, color, glow }) => {
          const exact = to === "/";
          const active = exact
            ? location.pathname === "/"
            : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              end={exact}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 6,
                textDecoration: "none",
                transition: "all 0.15s ease",
                background: isActive ? `rgba(${hexRgb(color)}, 0.1)` : "transparent",
                borderLeft: `2px solid ${isActive ? color : "transparent"}`,
                boxShadow: isActive ? `inset 4px 0 20px rgba(${hexRgb(color)}, 0.07)` : "none",
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    style={{
                      width: 15,
                      height: 15,
                      color: isActive ? color : "rgba(212,200,240,0.35)",
                      filter: isActive ? `drop-shadow(0 0 5px ${color})` : "none",
                      transition: "all 0.15s ease",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: isActive ? 10 : 13,
                      fontWeight: isActive ? 700 : 400,
                      color: isActive ? color : "rgba(212,200,240,0.5)",
                      textShadow: isActive ? `0 0 10px ${glow}, 0 0 20px ${glow}` : "none",
                      fontFamily: isActive ? '"Orbitron", sans-serif' : '"Exo 2", sans-serif',
                      letterSpacing: isActive ? "0.12em" : "0.02em",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="px-3 pb-5 flex-shrink-0">
        <div className="neon-hr mb-3" />
        <NavLink
          to="/settings"
          style={({ isActive }) => ({
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px",
            borderRadius: 6,
            textDecoration: "none",
            background: isActive ? "rgba(177,79,255,0.1)" : "transparent",
            borderLeft: isActive ? "2px solid #b14fff" : "2px solid transparent",
            transition: "all 0.15s ease",
          })}
        >
          {({ isActive }) => (
            <>
              <Settings style={{
                width: 15, height: 15,
                color: isActive ? "#b14fff" : "rgba(212,200,240,0.35)",
                filter: isActive ? "drop-shadow(0 0 5px #b14fff)" : "none",
                transition: "all 0.15s ease",
              }} />
              <span style={{
                fontSize: isActive ? 10 : 13,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? "#b14fff" : "rgba(212,200,240,0.5)",
                textShadow: isActive ? "0 0 10px rgba(177,79,255,0.7), 0 0 20px rgba(177,79,255,0.4)" : "none",
                fontFamily: isActive ? '"Orbitron", sans-serif' : '"Exo 2", sans-serif',
                letterSpacing: isActive ? "0.12em" : "0.02em",
                transition: "all 0.15s ease",
              }}>
                Settings
              </span>
            </>
          )}
        </NavLink>
      </div>
    </aside>
  );
}
