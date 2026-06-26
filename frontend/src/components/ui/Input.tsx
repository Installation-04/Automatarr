import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";
import { useState } from "react";

/* ── Label ─────────────────────────────────────────────────────────────────── */
function Label({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono mb-1.5" style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,0,110,0.6)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
      {children}
    </p>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1 font-mono" style={{ fontSize: 9, color: "rgba(212,200,240,0.3)", letterSpacing: "0.05em" }}>
      {children}
    </p>
  );
}

const inputStyle = (focused: boolean): React.CSSProperties => ({
  width: "100%",
  background: "rgba(255,0,110,0.04)",
  border: focused ? "1px solid rgba(255,0,110,0.6)" : "1px solid rgba(255,0,110,0.15)",
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: 13,
  color: "#e2d9f3",
  outline: "none",
  transition: "all 0.15s ease",
  fontFamily: '"Exo 2", sans-serif',
  boxShadow: focused ? "0 0 12px rgba(255,0,110,0.2), inset 0 0 8px rgba(255,0,110,0.04)" : "none",
});

/* ── Input ─────────────────────────────────────────────────────────────────── */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, min, max, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && <Label>{label}</Label>}
      <input
        style={inputStyle(focused)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        min={min}
        max={max}
        {...rest}
      />
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

/* ── Select ────────────────────────────────────────────────────────────────── */
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  children: ReactNode;
}

export function Select({ label, hint, children, ...rest }: SelectProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && <Label>{label}</Label>}
      <select
        style={{ ...inputStyle(focused), cursor: "pointer" }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      >
        {children}
      </select>
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

/* ── Toggle ────────────────────────────────────────────────────────────────── */
interface ToggleProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ label, hint, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        {label && (
          <p style={{ fontSize: 13, fontWeight: 500, color: "#d4c8f0" }}>{label}</p>
        )}
        {hint && <Hint>{hint}</Hint>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          border: checked ? "1px solid rgba(255,0,110,0.5)" : "1px solid rgba(255,0,110,0.2)",
          background: checked ? "rgba(255,0,110,0.15)" : "rgba(255,0,110,0.04)",
          boxShadow: checked ? "0 0 10px rgba(255,0,110,0.35)" : "none",
          position: "relative",
          cursor: "pointer",
          transition: "all 0.2s ease",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 21 : 3,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: checked ? "#ff006e" : "rgba(212,200,240,0.3)",
            boxShadow: checked ? "0 0 8px rgba(255,0,110,0.8), 0 0 16px rgba(255,0,110,0.4)" : "none",
            transition: "all 0.2s ease",
          }}
        />
      </button>
    </div>
  );
}
