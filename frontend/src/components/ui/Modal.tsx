import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZES = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

export function Modal({ open, onClose, title, children, size = "md" }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 glass"
        style={{ background: "rgba(7,0,26,0.85)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative w-full ${SIZES[size]} max-h-[90vh] flex flex-col`}
        style={{
          background: "linear-gradient(160deg, #0d0025 0%, #110030 100%)",
          border: "1px solid rgba(255,0,110,0.3)",
          borderRadius: 12,
          boxShadow: "0 0 40px rgba(255,0,110,0.2), 0 0 80px rgba(177,79,255,0.1), 0 24px 64px rgba(0,0,0,0.7)",
        }}
      >
        {/* Top neon line */}
        <div style={{
          height: 2,
          borderRadius: "12px 12px 0 0",
          background: "linear-gradient(90deg, #ff006e, #b14fff, #00f5ff)",
          boxShadow: "0 0 12px rgba(255,0,110,0.6), 0 0 24px rgba(177,79,255,0.4)",
          flexShrink: 0,
        }} />

        {title && (
          <div
            className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,0,110,0.12)" }}
          >
            <h2
              className="font-display font-bold"
              style={{ fontSize: 13, letterSpacing: "0.12em", color: "#ff006e", textShadow: "0 0 12px rgba(255,0,110,0.6)" }}
            >
              {title.toUpperCase()}
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded flex items-center justify-center transition-colors"
              style={{ border: "1px solid rgba(255,0,110,0.25)", color: "rgba(255,0,110,0.6)", background: "rgba(255,0,110,0.06)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ff006e"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 8px rgba(255,0,110,0.4)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,0,110,0.6)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
            >
              <X style={{ width: 13, height: 13 }} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
