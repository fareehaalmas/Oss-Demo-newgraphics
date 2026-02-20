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

/* ---------- NEW VISUALS FOR STORY FLOW ---------- */

function TransferVisual() {
  // Alice -> Bob token transfer
  return (
    <svg viewBox="0 0 320 180" className="pro-visual" aria-hidden="true">
      {/* Alice */}
      <g className="anim-float">
        <circle cx="70" cy="90" r="26" fill="rgba(56,189,248,0.12)" stroke="rgba(148,163,184,0.35)" />
        <text x="70" y="95" textAnchor="middle" fontSize="12" fontWeight="700" fill="rgba(248,250,252,0.92)">
          Alice
        </text>
      </g>

      {/* Bob */}
      <g className="anim-float" style={{ animationDelay: "180ms" }}>
        <circle cx="250" cy="90" r="26" fill="rgba(56,189,248,0.12)" stroke="rgba(148,163,184,0.35)" />
        <text x="250" y="95" textAnchor="middle" fontSize="12" fontWeight="700" fill="rgba(248,250,252,0.92)">
          Bob
        </text>
      </g>

      {/* arrow */}
      <path
        d="M105 90 H210"
        fill="none"
        stroke="rgba(148,163,184,0.55)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M210 90 l-10 -7 v14 z"
        fill="rgba(148,163,184,0.55)"
      />

      {/* moving token */}
      {/* token coin */}
<g className="anim-token">
  <image
    href="/coin.png"
    x="110"
    y="80"
    width="20"
    height="20"
    preserveAspectRatio="xMidYMid meet"
  />
</g>

    </svg>
  );
}

function LedgerVisual() {
  const glowId = useMemo(
    () => `ledgerGlow-${Math.random().toString(16).slice(2)}`,
    []
  );

  return (
    <svg viewBox="0 0 320 180" className="pro-visual" aria-hidden="true">
      <defs>
        <linearGradient id={glowId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(56,189,248,0.25)" />
          <stop offset="100%" stopColor="rgba(56,189,248,0.02)" />
        </linearGradient>
      </defs>

      {[0, 1, 2].map((k) => (
        <g key={k} className="anim-rise" style={{ animationDelay: `${k * 90}ms` }}>
          <rect
            x={70 + k * 10}
            y={55 + k * 10}
            width={180}
            height={70}
            rx={14}
            fill="rgba(2,6,23,0.22)"
            stroke="rgba(148,163,184,0.28)"
          />
          <rect x={88 + k * 10} y={75 + k * 10} width={144} height={8} rx={4} fill="rgba(148,163,184,0.35)" />
          <rect x={88 + k * 10} y={92 + k * 10} width={110} height={8} rx={4} fill="rgba(148,163,184,0.28)" />
          <rect x={88 + k * 10} y={109 + k * 10} width={128} height={8} rx={4} fill="rgba(148,163,184,0.22)" />
        </g>
      ))}

      {/* subtle scanning line */}
      <rect
        x="70"
        y="55"
        width="180"
        height="70"
        rx="14"
        fill={`url(#${glowId})`}
        className="anim-scan"
      />
    </svg>
  );
}


function TamperVisual() {
  return (
    <svg viewBox="0 0 320 180" className="pro-visual" aria-hidden="true">
      {/* Ledger */}
      <rect
        x="52"
        y="52"
        width="210"
        height="90"
        rx="16"
        fill="rgba(2,6,23,0.22)"
        stroke="rgba(148,163,184,0.28)"
      />
      <rect x="74" y="78" width="160" height="9" rx="4.5" fill="rgba(148,163,184,0.32)" />
      <rect x="74" y="98" width="120" height="9" rx="4.5" fill="rgba(148,163,184,0.22)" />
      <rect x="74" y="118" width="150" height="9" rx="4.5" fill="rgba(148,163,184,0.18)" />

      {/* Red tamper lines (draw once) */}
      <path
        d="M80 104 L222 88"
        className="anim-red-line"
        fill="none"
        stroke="rgba(248,113,113,0.85)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M86 120 L210 132"
        className="anim-red-line anim-red-line-delay"
        fill="none"
        stroke="rgba(248,113,113,0.75)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      

      
      {/* PNG HAND enters from the left */}
<g className="anim-hand-in-loop">
  <image
    href="/hand.png"
    x="-20"
    y="68"
    width="120"
    height="120"
    preserveAspectRatio="xMidYMid meet"
  />
</g>

    </svg>
  );
}


function OssReplaceVisual() {
  // Bridge -> quantum token / verification
  return (
    <svg viewBox="0 0 320 180" className="pro-visual" aria-hidden="true">
      {/* left: ledger icon */}
      <g opacity="0.85">
        <rect x="55" y="70" width="64" height="50" rx="12" fill="rgba(2,6,23,0.22)" stroke="rgba(148,163,184,0.28)" />
        <rect x="65" y="84" width="44" height="6" rx="3" fill="rgba(148,163,184,0.35)" />
        <rect x="65" y="98" width="34" height="6" rx="3" fill="rgba(148,163,184,0.25)" />
      </g>

      {/* right: bloch-ish sphere */}
      <g className="anim-bloch-rotate">
        <circle cx="245" cy="95" r="36" fill="rgba(56,189,248,0.08)" stroke="rgba(148,163,184,0.35)" />
        <ellipse cx="245" cy="95" rx="36" ry="14" fill="none" stroke="#60a5fa" strokeWidth="2" />
        <ellipse cx="245" cy="95" rx="16" ry="36" fill="none" stroke="rgba(96,165,250,0.4)" strokeWidth="2" />
        <path d="M245 95 L270 75" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="270" cy="75" r="3.5" fill="#e5e7eb" />
      </g>

      {/* arrow */}
      <path
        d="M130 95 H200"
        fill="none"
        stroke="rgba(56,189,248,0.6)"
        strokeWidth="3"
        strokeLinecap="round"
        className="anim-dash"
      />
      <path d="M200 95 l-10 -7 v14 z" fill="rgba(56,189,248,0.6)" />

      {/* “one-shot” spark */}
      <g className="anim-spark">
        <circle cx="165" cy="70" r="2" fill="rgba(56,189,248,0.9)" />
        <circle cx="170" cy="65" r="2" fill="rgba(125,211,252,0.9)" />
        <circle cx="158" cy="62" r="2" fill="rgba(56,189,248,0.75)" />
      </g>
    </svg>
  );
}


/* ---------- MAIN COMPONENT ---------- */

export default function IntroSlides() {
  const slides: Slide[] = [
    {
      kicker: "The Problem",
      title: "Alice wants Bob to sign on her behalf - only once",
      line: "Trust depends on knowing the signing power cannot be reused.",
      bullets: ["The signing authority must be single-use", "Prevent forgery", "Ensure final settlement"],
      Icon: LockIcon,
      Visual: TransferVisual,
    },
    {
      kicker: "Classical approach",
      title: "Traditionally, you use a ledger",
      line: "A shared record proves ownership and prevents double-spends.",
      bullets: ["Trusted database or custodian", "Distributed ledger", "Reconciliation across parties"],
      Icon: BankIcon,
      Visual: LedgerVisual,
    },
    {
      kicker: "Risk",
      title: "But ledgers can fail",
      line: "Trust shifts from the asset to the infrastructure — and that creates new attack surfaces.",
      bullets: ["Tampering / attacks", "Outages or data loss", "Human error + reconciliation"],
      Icon: LockIcon,
      Visual: TamperVisual,
    },
    {
      kicker: "Quantum OSS",
      title: "Replace ledger trust with One-Shot Signatures",
      line: "A quantum-enhanced signing key that works exactly once — then self-destructs.",
      bullets: ["No cloning", "No reuse", "Replay becomes physically impossible"],
      Icon: AtomIcon,
      Visual: OssReplaceVisual,
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
