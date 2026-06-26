export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke="rgba(255,0,110,0.15)" strokeWidth="2.5" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="url(#spin-sw)" strokeWidth="2.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="spin-sw" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff006e" />
          <stop offset="100%" stopColor="#b14fff" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function PageSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Spinner size={32} />
      <p className="font-mono font-bold" style={{ fontSize: 9, color: "rgba(255,0,110,0.5)", letterSpacing: "0.3em" }}>
        LOADING...
      </p>
    </div>
  );
}
