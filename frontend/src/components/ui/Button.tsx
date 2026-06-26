import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon,
  children,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: "5px 12px",  fontSize: 11, gap: 5,  borderRadius: 6,  letterSpacing: "0.08em" },
    md: { padding: "8px 18px",  fontSize: 12, gap: 6,  borderRadius: 8,  letterSpacing: "0.08em" },
    lg: { padding: "11px 24px", fontSize: 13, gap: 8,  borderRadius: 10, letterSpacing: "0.1em"  },
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(135deg, #ff006e 0%, #b14fff 100%)",
      color: "#fff",
      border: "none",
      boxShadow: "0 0 16px rgba(255,0,110,0.5), 0 0 32px rgba(255,0,110,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 700,
    },
    secondary: {
      background: "rgba(255,0,110,0.08)",
      color: "#ff006e",
      border: "1px solid rgba(255,0,110,0.4)",
      boxShadow: "0 0 8px rgba(255,0,110,0.1)",
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 600,
    },
    ghost: {
      background: "transparent",
      color: "rgba(212,200,240,0.6)",
      border: "1px solid rgba(212,200,240,0.12)",
      boxShadow: "none",
    },
    danger: {
      background: "rgba(255,0,80,0.1)",
      color: "#ff0050",
      border: "1px solid rgba(255,0,80,0.4)",
      boxShadow: "0 0 8px rgba(255,0,80,0.15)",
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 600,
    },
  };

  return (
    <button
      disabled={disabled || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.45 : 1,
        transition: "all 0.15s ease",
        fontWeight: 600,
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
      {...rest}
    >
      {loading ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : icon}
      {children}
    </button>
  );
}
