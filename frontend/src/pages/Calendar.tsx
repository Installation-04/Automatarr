import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCalendar } from "../api";
import { StatusBadge } from "../components/ui/Badge";
import { PageSpinner } from "../components/ui/Spinner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday } from "date-fns";

const TMDB_IMG = "https://image.tmdb.org/t/p/w92";
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Calendar() {
  const [month, setMonth] = useState(new Date());

  const start = format(startOfMonth(month), "yyyy-MM-dd");
  const end   = format(endOfMonth(month),   "yyyy-MM-dd");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["calendar", start, end],
    queryFn: () => getCalendar(start, end),
  });

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const firstDayOfWeek = startOfMonth(month).getDay();

  const getItemsForDay = (day: Date) =>
    items.filter((item: any) => item.date === format(day, "yyyy-MM-dd"));

  if (isLoading) return <PageSpinner />;

  return (
    <div className="p-7 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono mb-1" style={{ fontSize: 9, color: "rgba(255,230,0,0.5)", letterSpacing: "0.2em" }}>// UPCOMING</p>
          <h1 className="font-display font-bold tracking-widest" style={{ fontSize: 28, background: "linear-gradient(90deg, #ffe600 0%, #ff7700 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonth(subMonths(month, 1))}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,230,0,0.06)", border: "1px solid rgba(255,230,0,0.2)", color: "rgba(255,230,0,0.5)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ffe600"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,230,0,0.5)"; }}
          >
            <ChevronLeft style={{ width: 15, height: 15 }} />
          </button>
          <span className="font-display font-bold w-36 text-center" style={{ fontSize: 13, color: "#d4c8f0", letterSpacing: "0.1em" }}>{format(month, "MMMM yyyy").toUpperCase()}</span>
          <button
            onClick={() => setMonth(addMonths(month, 1))}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,230,0,0.06)", border: "1px solid rgba(255,230,0,0.2)", color: "rgba(255,230,0,0.5)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ffe600"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,230,0,0.5)"; }}
          >
            <ChevronRight style={{ width: 15, height: 15 }} />
          </button>
          <button
            onClick={() => setMonth(new Date())}
            className="ml-1 px-3 h-8 rounded-xl font-mono font-bold transition-all"
            style={{ fontSize: 9, letterSpacing: "0.12em", background: "rgba(255,0,110,0.08)", border: "1px solid rgba(255,0,110,0.25)", color: "rgba(255,0,110,0.6)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ff006e"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,0,110,0.5)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,0,110,0.6)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,0,110,0.25)"; }}
          >
            TODAY
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#0d0025", border: "1px solid rgba(255,230,0,0.12)" }}>
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {DAYS_SHORT.map((d) => (
            <div key={d} className="py-3 text-center font-mono font-bold uppercase" style={{ fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,230,0,0.35)" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`e-${i}`} className="min-h-[90px] border-b border-r p-2" style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.15)" }} />
          ))}

          {days.map((day) => {
            const dayItems = getItemsForDay(day);
            const today    = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className="min-h-[90px] border-b border-r p-2"
                style={{
                  borderColor: "rgba(255,230,0,0.06)",
                  background: today ? "rgba(255,0,110,0.04)" : "transparent",
                }}
              >
                <div
                  className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mb-1.5 mx-auto"
                  style={today ? {
                    background: "linear-gradient(135deg, #ff006e, #b14fff)",
                    color: "#fff",
                    boxShadow: "0 0 12px rgba(255,0,110,0.5)",
                  } : { color: "rgba(212,200,240,0.35)", fontSize: 11 }}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayItems.slice(0, 3).map((item: any, i: number) => {
                    const statusColor = item.status === "downloaded" ? "#00ff88"
                      : item.status === "downloading" ? "#a78bfa"
                      : item.status === "wanted" ? "#b14fff"
                      : item.status === "error" ? "#f87171"
                      : "#ffe600";
                    return (
                      <div
                        key={i}
                        className="rounded px-1.5 py-0.5 font-mono truncate"
                        style={{ fontSize: 9, color: statusColor, background: `${statusColor}12`, border: `1px solid ${statusColor}33` }}
                        title={`${item.title} — ${item.status}`}
                      >
                        {item.title}
                      </div>
                    );
                  })}
                  {dayItems.length > 3 && (
                    <p className="font-mono pl-1" style={{ fontSize: 8, color: "rgba(255,230,0,0.35)" }}>+{dayItems.length - 3} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly list */}
      {items.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="font-display font-bold" style={{ fontSize: 10, letterSpacing: "0.2em", color: "#ffe600", textShadow: "0 0 8px #ffe600" }}>THIS MONTH</h2>
            <span className="font-mono font-bold px-1.5 py-0.5 rounded" style={{ fontSize: 9, color: "#ffe600", background: "rgba(255,230,0,0.12)" }}>
              {items.length}
            </span>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#0d0025", border: "1px solid rgba(255,230,0,0.12)" }}>
            {items.map((item: any, i: number) => (
              <div
                key={i}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                style={{ borderBottom: "1px solid rgba(255,230,0,0.06)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,230,0,0.03)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                <div className="w-12 text-center flex-shrink-0">
                  <p className="font-mono uppercase" style={{ fontSize: 8, letterSpacing: "0.15em", color: "rgba(255,230,0,0.4)" }}>
                    {format(new Date(item.date + "T12:00:00"), "MMM")}
                  </p>
                  <p className="font-display font-bold leading-none" style={{ fontSize: 20, color: "#d4c8f0" }}>
                    {format(new Date(item.date + "T12:00:00"), "d")}
                  </p>
                </div>
                {item.poster_path ? (
                  <img
                    src={`${TMDB_IMG}${item.poster_path}`}
                    alt=""
                    className="w-8 h-12 object-cover rounded-lg flex-shrink-0 ring-1 ring-white/10"
                  />
                ) : (
                  <div className="w-8 h-12 rounded-lg flex-shrink-0" style={{ background: "rgba(255,255,255,0.04)" }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#d4c8f0" }}>{item.title}</p>
                  <p className="font-mono mt-0.5" style={{ fontSize: 10, color: "rgba(212,200,240,0.35)" }}>{item.subtitle}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
