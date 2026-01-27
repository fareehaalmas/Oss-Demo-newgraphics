// src/IntroSlides.tsx
import React, { useMemo, useState } from "react";

type Slide = {
  kicker: string;
  title: string;
  line: string;
  bullets: string[];
  Icon: () => React.ReactElement;
  Visual: () => React.ReactElement;
};

/* ---------- Icons (top-left badge only, unchanged) ---------- */

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="pro-ico">
      <path d="M7 11V8a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.5 11h11A1.5 1.5 0 0 1 19 12.5v7A2.5 2.5 0 0 1 16.5 22h-9A2.5 2.5 0 0 1 5 19.5v-7A1.5 1.5 0 0 1 6.5 11Z"
        fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function AtomIcon() {
  return (
    <svg viewBox="0 0 24 24" className="pro-ico">
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <path d="M4.5 12c2.5-4.2 12.5-4.2 15 0-2.5 4.2-12.5 4.2-15 0Z"
        fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 4.5c4.2 2.5 4.2 12.5 0 15-4.2-2.5-4.2-12.5 0-15Z"
        fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg viewBox="0 0 24 24" className="pro-ico">
      <path d="M4 10h16M6 10v9M10 10v9M14 10v9M18 10v9M4.5 21h15"
        fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/* ---------- SLIDE 1: MARKET WAVES (no grid, no text) ---------- */

function MarketVisual() {
  return (
    <svg viewBox="0 0 320 180" className="pro-visual" aria-hidden="true">
      {/* axes */}
      <line x1="24" y1="12" x2="24" y2="156" stroke="rgba(148,163,184,.45)" strokeWidth="1"/>
      <line x1="24" y1="156" x2="304" y2="156" stroke="rgba(148,163,184,.45)" strokeWidth="1"/>

      {/* animated price path */}
      <path
        d="M24 120
           L50 95
           L75 132
           L105 70
           L130 110
           L160 60
           L190 98
           L220 55
           L255 85
           L304 40"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="2.8"
        className="anim-market-zigzag"
      />

      {/* glow overlay */}
      <path
        d="M24 120
           L50 95
           L75 132
           L105 70
           L130 110
           L160 60
           L190 98
           L220 55
           L255 85
           L304 40"
        fill="none"
        stroke="rgba(56,189,248,.35)"
        strokeWidth="7"
        className="anim-market-zigzag"
      />
    </svg>
  );
}


/* ---------- SLIDE 2: LOCK BREAKING (clear failure) ---------- */

function LockBreakVisual() {
  return (
    <svg viewBox="0 0 320 160" className="pro-visual">
      {/* shackle (breaks apart) */}
      <path
        d="M120 65 A40 40 0 0 1 200 65"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="5"
        strokeLinecap="round"
        className="anim-lock-break"
      />

      {/* lock body */}
      <rect
        x="120"
        y="70"
        width="80"
        height="60"
        rx="10"
        fill="rgba(15,23,42,0.9)"
        stroke="rgba(148,163,184,0.4)"
      />

      {/* crack flash */}
      <path
        d="M160 75 l-8 10 10 8 -8 12"
        fill="none"
        stroke="#7dd3fc"
        strokeWidth="2"
        className="anim-lock-crack"
      />
    </svg>
  );
}

/* ---------- SLIDE 3: BLOCH SPHERE (no labels) ---------- */

function BlochMiniVisual() {
  const theta = useMemo(() => Math.random() * Math.PI, []);
  const phi = useMemo(() => Math.random() * Math.PI * 2, []);

  const R = 48;
  const cx = 160;
  const cy = 80;

  const x = cx + R * Math.sin(theta) * Math.cos(phi);
  const y = cy - R * Math.cos(theta);

  return (
    <svg viewBox="0 0 320 160" className="pro-visual">
      <g className="anim-bloch-rotate">
        <circle cx={cx} cy={cy} r={R} fill="rgba(56,189,248,0.08)" stroke="rgba(148,163,184,0.35)" />
        <ellipse cx={cx} cy={cy} rx={R} ry={R * 0.35}
          fill="none" stroke="#60a5fa" strokeWidth="2" />
        <ellipse cx={cx} cy={cy} rx={R * 0.4} ry={R}
          fill="none" stroke="rgba(96,165,250,0.4)" strokeWidth="2" />

        {/* quantum state arrow */}
        <path
          d={`M${cx} ${cy} L${x} ${y}`}
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx={x} cy={y} r="3.5" fill="#e5e7eb" />
      </g>
    </svg>
  );
}

/* ---------- SLIDE 4: APPLICATIONS ---------- */

function ApplicationsVisual() {
  const items = [
    "Asset Issuance",
    "Custody Release",
    "OTC Settlement",
    "Treasury Transfer",
  ];

  // Visual geometry
  const cx = 160;          // center x
  const w = 250;           // panel width
  const h = 26;            // panel height
  const rx = 13;           // rounded corners
  const gap = 10;          // vertical gap
  const top = 34;          // top start

  return (
    <svg viewBox="0 0 320 180" className="pro-visual" aria-hidden="true">
      <defs>
        {/* subtle glossy overlay */}
        <linearGradient id="pillGlass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
        </linearGradient>

        {/* soft shadow (very light) */}
        <filter id="pillShadow" x="-20%" y="-50%" width="140%" height="200%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="rgba(0,0,0,0.35)" />
        </filter>
      </defs>

      {items.map((label, i) => {
        const y = top + i * (h + gap);
        const x = cx - w / 2;

        return (
          <g
            key={label}
            className="anim-rise"
            style={{ animationDelay: `${i * 90}ms` }}
            filter="url(#pillShadow)"
          >
            {/* transparent “glass” pill */}
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={rx}
              fill="rgba(2,6,23,0.18)"                 // transparent shading (not solid)
              stroke="rgba(148,163,184,0.28)"         // elegant outline
              strokeWidth="1"
            />
            {/* subtle highlight sheen */}
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={rx}
              fill="url(#pillGlass)"
              opacity="0.9"
            />

            {/* center text */}
            <text
              x={cx}
              y={y + h / 2 + 4}
              textAnchor="middle"
              fontSize="12.5"
              fontWeight="600"
              fill="rgba(248,250,252,0.92)"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- MAIN COMPONENT ---------- */

export default function IntroSlides() {
  const slides: Slide[] = [
    {
      kicker: "The problem",
      title: "Reusable keys scale risk",
      line: "Long-lived signing keys authorize unlimited value.",
      bullets: ["Single compromise moves billions", "Replay is structurally allowed"],
      Icon: LockIcon,
      Visual: MarketVisual,
    },
    {
      kicker: "Failure mode",
      title: "Reuse breaks trust",
      line: "Once a key is reused, guarantees collapse.",
      bullets: ["Silent misuse", "Operational complexity"],
      Icon: LockIcon,
      Visual: LockBreakVisual,
    },
    {
      kicker: "Physics",
      title: "One-Shot Signatures",
      line: "Single-use by physical law.",
      bullets: ["No cloning", "No reuse"],
      Icon: AtomIcon,
      Visual: BlochMiniVisual,
    },
    {
      kicker: "Deployment",
      title: "Built for institutions",
      line: "Designed for high-value authorization flows.",
      bullets: ["Custody", "Settlement", "OTC"],
      Icon: BankIcon,
      Visual: ApplicationsVisual,
    },
  ];

  const [i, setI] = useState(0);
  const s = slides[i];

  return (
    <section className="pro-slides">
      <div key={i} className="pro-card">
        <div className="pro-badge">
          <s.Icon />
        </div>

        <div className="pro-content">
          <div className="pro-kicker">{s.kicker}</div>
          <h3 className="pro-title">{s.title}</h3>
          <p className="pro-line">{s.line}</p>
          <ul className="pro-bullets">
            {s.bullets.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </div>

        <div className="pro-right">
          <s.Visual />
        </div>
      </div>

      <div className="pro-nav">
        {slides.map((_, j) => (
          <button
            key={j}
            className={j === i ? "pro-dot active" : "pro-dot"}
            onClick={() => setI(j)}
          />
        ))}
      </div>
    </section>
  );
}
