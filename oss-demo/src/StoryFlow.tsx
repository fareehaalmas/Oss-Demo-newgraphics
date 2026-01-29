import React, { useEffect, useMemo, useRef, useState } from "react";

// Reuse your existing Visual components
// import { TransferVisual, LedgerVisual, TamperVisual, OssReplaceVisual } from "./IntroSlides"; // or move visuals to a shared file
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
    // Ledger stack / records
    return (
      <svg viewBox="0 0 320 180" className="pro-visual" aria-hidden="true">
        <defs>
          <linearGradient id="ledgerGlow" x1="0" y1="0" x2="1" y2="1">
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
            <rect
              x={88 + k * 10}
              y={75 + k * 10}
              width={144}
              height={8}
              rx={4}
              fill="rgba(148,163,184,0.35)"
            />
            <rect
              x={88 + k * 10}
              y={92 + k * 10}
              width={110}
              height={8}
              rx={4}
              fill="rgba(148,163,184,0.28)"
            />
            <rect
              x={88 + k * 10}
              y={109 + k * 10}
              width={128}
              height={8}
              rx={4}
              fill="rgba(148,163,184,0.22)"
            />
          </g>
        ))}
  
        {/* subtle scanning line */}
        <rect x="70" y="55" width="180" height="70" rx="14" fill="url(#ledgerGlow)" className="anim-scan" />
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
  
type Step = {
  kicker: string;
  title: string;
  line: string;
  points: string[];
  Visual: () => React.ReactElement;
};

export default function StoryFlow() {
  const steps: Step[] = useMemo(
    () => [
      {
        kicker: "The Problem",
        title: "Alice wants Bob to sign on her behalf — only once",
        line: "Trust depends on knowing the signing power cannot be reused.",
        points: [
          "One approval, one time",
          "No copyable credential",
          "No replay after use",
        ],
        Visual: TransferVisual,
      },
      {
        kicker: "Today",
        title: "Most systems enforce this operationally",
        line: "Policies, databases, and reconciliation aim to prevent a second use.",
        points: [
          "State lives in infrastructure",
          "Access control + logging",
          "Ongoing reconciliation",
        ],
        Visual: LedgerVisual,
      },
      {
        kicker: "Risk",
        title: "Operational trust creates failure modes",
        line: "If systems break, approvals can be misused, replayed, or disputed.",
        points: [
          "Replay / misuse risk",
          "Availability & rollback risk",
          "Long-lived credentials",
        ],
        Visual: TamperVisual,
      },
      {
        kicker: "One-Shot Signatures",
        title: "A signing key that expires by physics",
        line: "A quantum signing key is used once, then irreversibly destroyed.",
        points: [
          "Single-use by construction",
          "No cloning, no second signature",
          "Built-in expiration",
        ],
        Visual: OssReplaceVisual,
      },
    ],
    []
  );

  const [active, setActive] = useState(0);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const els = stepRefs.current.filter(Boolean) as HTMLElement[];
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        // pick the most visible entry
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        if (!visible) return;
        const idx = Number((visible.target as HTMLElement).dataset.idx);
        if (!Number.isNaN(idx)) setActive(idx);
      },
      {
        root: null,
        threshold: [0.35, 0.5, 0.65],
        rootMargin: "-15% 0px -55% 0px",
      }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const ActiveVisual = steps[active].Visual;

  return (
    <section className="story">
      <div className="story-grid">
        {/* LEFT: copy */}
        <div className="story-copy">
          {steps.map((s, i) => (
            <article
              key={s.title}
              className={i === active ? "story-step active" : "story-step"}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              data-idx={i}
            >
              <div className="story-kicker">{s.kicker}</div>
              <h3 className="story-title">{s.title}</h3>
              <p className="story-line">{s.line}</p>

              <ul className="story-points">
                {s.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* RIGHT: sticky visual */}
        <aside className="story-visual">
          <div className="story-visual-card" data-active={active}>
            <ActiveVisual />
          </div>
        </aside>
      </div>
    </section>
  );
}
