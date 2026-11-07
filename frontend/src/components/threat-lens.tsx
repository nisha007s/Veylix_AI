import { cn } from "../lib/utils";

/**
 * Veylix "Threat Lens": the product's signature visual. Concentric rings, a
 * slow radar sweep and a central shield. Purely decorative — it shows no data.
 */
export function ThreatLens({ className }: { className?: string }) {
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  return (
    <div className={cn("relative aspect-square w-full max-w-95", className)} aria-hidden="true">
      {/* Ambient glow */}
      <div className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle,var(--glow),transparent_68%)] blur-2xl" />

      <svg viewBox="0 0 400 400" className="relative size-full">
        <defs>
          <radialGradient id="vl-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="vl-sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.32" />
          </linearGradient>
          <linearGradient id="vl-shield" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6e8cff" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>

        <circle cx="200" cy="200" r="190" fill="url(#vl-core)" />

        {/* Static rings */}
        {[188, 150, 112, 74].map((r, i) => (
          <circle
            key={r}
            cx="200"
            cy="200"
            r={r}
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth={i === 0 ? 1.25 : 1}
            strokeDasharray={i % 2 ? "2 6" : undefined}
          />
        ))}

        {/* Crosshair */}
        <g stroke="var(--line)" strokeWidth="1">
          <line x1="200" y1="12" x2="200" y2="388" />
          <line x1="12" y1="200" x2="388" y2="200" />
        </g>

        {/* Rotating tick ring */}
        <g className="motion-safe:animate-spin-slower" style={{ transformBox: "view-box", transformOrigin: "200px 200px" }}>
          {ticks.map((i) => {
            const a = (i / ticks.length) * Math.PI * 2;
            const long = i % 5 === 0;
            const r1 = 170;
            const r2 = long ? 160 : 165;
            return (
              <line
                key={i}
                x1={200 + Math.cos(a) * r1}
                y1={200 + Math.sin(a) * r1}
                x2={200 + Math.cos(a) * r2}
                y2={200 + Math.sin(a) * r2}
                stroke={long ? "var(--accent)" : "var(--line-strong)"}
                strokeOpacity={long ? 0.7 : 1}
                strokeWidth={long ? 1.5 : 1}
              />
            );
          })}
        </g>

        {/* Radar sweep */}
        <g className="motion-safe:animate-sweep" style={{ transformBox: "view-box", transformOrigin: "200px 200px" }}>
          <path d="M200 200 L388 200 A188 188 0 0 0 333 67 Z" fill="url(#vl-sweep)" opacity="0.85" />
          <line x1="200" y1="200" x2="388" y2="200" stroke="var(--accent)" strokeOpacity="0.55" strokeWidth="1.25" />
        </g>

        {/* Orbit arc */}
        <g className="motion-safe:animate-spin-slow" style={{ transformBox: "view-box", transformOrigin: "200px 200px" }}>
          <circle cx="200" cy="200" r="131" fill="none" stroke="var(--accent)" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="60 760" strokeLinecap="round" />
          <circle cx="331" cy="200" r="3.5" fill="var(--accent)" />
        </g>

        {/* Core shield */}
        <g transform="translate(200 200)">
          <circle r="46" fill="var(--surface)" stroke="var(--line-strong)" />
          <circle r="46" fill="none" stroke="var(--accent)" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="3 5" />
          <path
            d="M0 -24 L19 -16.5 V-2 C19 11 10.5 20.5 0 25 C-10.5 20.5 -19 11 -19 -2 V-16.5 Z"
            fill="url(#vl-shield)"
          />
          <path d="M-7.5 0.5 L-2 6 L8.5 -5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}
