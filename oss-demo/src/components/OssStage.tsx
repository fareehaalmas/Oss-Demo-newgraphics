// src/components/OssStage.tsx
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import OssRail from "./OssRail";
import "./ossRail.css";

type Anchor = "alice" | "bob" | "charlie" | "topBeam" | "diagBeam" | "capsule" | "center";


type OssStageProps = {
  focus: Anchor | null;
  bubbleTitle: string;
  bubbleText: string;

  ctaHint?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  ctaDisabled?: boolean;

  flowIdx: number;
  flowTotal: number;
  canNext: boolean;
  onFlowNext: () => void;
  onFlowBack: () => void;

  // Protocol state (PDF names)
  authDone: boolean;
  nonce: string | null;
  sigChallenge: string | null;

  vkA: string | null;
  skA: string | null;

  y: string | null;
  skBAlive: boolean;

  mauth: string | null;
  sigmaA: string | null;

  mpay: string | null;
  vBit: 0 | 1 | null;

  sigmaB: string | null;

  verifyOk: boolean | null;
  executed: boolean;
};

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function computeAnchorPos(target: HTMLElement | null, container: HTMLElement | null) {
  if (!target || !container) return { left: 18, top: 18 };

  const t = target.getBoundingClientRect();
  const c = container.getBoundingClientRect();

  const left = t.left - c.left + t.width + 14;
  const top = t.top - c.top + Math.max(6, t.height * 0.25);

  return { left, top };
}

function computeBelow(el: HTMLElement | null, container: HTMLElement | null, w: number, h: number) {
  if (!el || !container) return { left: 16, top: 140, width: w, height: h };

  const r = el.getBoundingClientRect();
  const c = container.getBoundingClientRect();

  const left = r.left - c.left;
  const top = r.top - c.top + r.height + 14;

  return { left, top, width: w, height: h };
}

export default function OssStage({
  focus,
  bubbleTitle,
  bubbleText,
  flowIdx,
  flowTotal,
  canNext,
  onFlowNext,
  onFlowBack,
  ctaLabel,
  ctaHint,
  onCtaClick,
  ctaDisabled,

  authDone,
  nonce,
  sigChallenge,
  vkA,
  skA,
  y,
  skBAlive,
  mauth,
  sigmaA,
  mpay,
  vBit,
  sigmaB,
  verifyOk,
  executed,
}: OssStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);

  const aliceRef = useRef<HTMLButtonElement | null>(null);
  const bobRef = useRef<HTMLButtonElement | null>(null);
  const charlieRef = useRef<HTMLButtonElement | null>(null);

  // City wrapper refs (for anchoring the mini panels)
  const sydneyCityRef = useRef<HTMLDivElement | null>(null);
  const strasCityRef = useRef<HTMLDivElement | null>(null);

  const [ctaPos, setCtaPos] = useState<{ left: number; top: number }>({ left: 18, top: 18 });
  const [stageSize, setStageSize] = useState({ w: 1000, h: 680 });

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const update = () => setStageSize({ w: el.offsetWidth, h: el.offsetHeight });
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Focus element for CTA positioning
  const focusEl = useMemo(() => {
    switch (focus) {
      case "alice":
        return aliceRef.current;
      case "bob":
        return bobRef.current;
      case "charlie":
        return charlieRef.current;
      default:
        return null;
    }
  }, [focus]);

  // CTA tooltip clamping
  const showCta = Boolean(ctaLabel && onCtaClick);

  useLayoutEffect(() => {
    const base = computeAnchorPos(focusEl, stageRef.current);

    const TOOLTIP_W = 260;
    const TOOLTIP_H = ctaHint ? 110 : 52;

    const maxLeft = stageSize.w - TOOLTIP_W - 12;
    const maxTop = stageSize.h - TOOLTIP_H - 86;

    const left = clamp(base.left, 12, maxLeft);
    const top = clamp(base.top, 12, maxTop);

    setCtaPos({ left, top });
  }, [focusEl, focus, stageSize.w, stageSize.h, ctaHint]);

  const hintAbove = ctaPos.top > stageSize.h - 200;

  const RAIL_W = 360;
  const RAIL_H = 210;
  const INSET = 22;
  
  const railsTop = useMemo(() => {
    const STEP_BAR_H = 44;
    const STEP_BAR_MARGIN = 16;
    const SAFE_BOTTOM = STEP_BAR_H + STEP_BAR_MARGIN + 8;
    const maxTop = stageSize.h - SAFE_BOTTOM - RAIL_H;
  
    const desired = Math.round(stageSize.h * 0.52) - Math.round(RAIL_H * 0.5);
    return clamp(desired, INSET, maxTop);
  }, [stageSize.h]);
  
  const sydneyRailRect = useMemo(
    () => ({ left: INSET, top: railsTop, width: RAIL_W, height: RAIL_H }),
    [railsTop]
  );
  
  const strasRailRect = useMemo(
    () => ({ right: INSET, top: railsTop, width: RAIL_W, height: RAIL_H }),
    [railsTop]
  );
  



  // Bubble stays bottom-left (you can keep your existing placement; this is safe)
  const bubbleRect = useMemo(() => {
    return {
      left: 18,
      bottom: 72,
      width: 360,
    };
  }, []);

  return (
    <div ref={stageRef} className={`oss-stage ${focus ? "is-guiding" : ""}`} data-focus={focus ?? "none"}>
      {/* Cities */}
      <div ref={sydneyCityRef} className="oss-cityWrap oss-cityWrap-sydney">
        <img className="oss-city oss-city-sydney" src="/city-sydney.png" alt="Sydney skyline" />
      </div>

      <div ref={strasCityRef} className="oss-cityWrap oss-cityWrap-strasbourg">
        <img className="oss-city oss-city-strasbourg" src="/city-strasbourg.png" alt="Strasbourg skyline" />
      </div>

      <div className="oss-cityWrap oss-cityWrap-vancouver">
        <img className="oss-city oss-city-vancouver" src="/city-vancouver.png" alt="Vancouver skyline" />
      </div>

      {/* ✅ Two mini state panels */}
      <OssRail
        variant="sydney"
        rect={sydneyRailRect}
        authDone={authDone}
        nonce={nonce}
        sigChallenge={sigChallenge}
        vkA={vkA}
        skA={skA}
        mauth={mauth}
        sigmaA={sigmaA}
      />

      <OssRail
        variant="strasbourg"
        rect={strasRailRect}
        y={y}
        skBAlive={skBAlive}
        mpay={mpay}
        vBit={vBit}
        sigmaB={sigmaB}
        verifyOk={verifyOk}
        executed={executed}
      />

      {/* Avatars */}
      <button ref={aliceRef} className="oss-avatarBtn oss-avatar-alice" type="button" aria-label="Alice">
        <img className="oss-avatarOnly" src="/avatar-alice.png" alt="Alice" />
        <div className="oss-avatarLabel">
          <div className="t1">Sydney</div>
          <div className="t2">Alice</div>
        </div>
      </button>

      <button ref={bobRef} className="oss-avatarBtn oss-avatar-bob" type="button" aria-label="Bob">
        <img className="oss-avatarOnly" src="/avatar-bob.png" alt="Bob" />
        <div className="oss-avatarLabel">
          <div className="t1">Strasbourg</div>
          <div className="t2">Bob</div>
        </div>
      </button>

      <button ref={charlieRef} className="oss-avatarBtn oss-avatar-charlie" type="button" aria-label="Charlie">
        <img className="oss-avatarOnly" src="/avatar-charlie.png" alt="Charlie" />
        <div className="oss-avatarLabel">
          <div className="t1">Vancouver</div>
          <div className="t2">Charlie</div>
        </div>
      </button>

      {/* ✅ CTA + hint */}
      {showCta && (
        <div className="oss-ctaWrap" style={{ left: ctaPos.left, top: ctaPos.top }}>
          {ctaHint && hintAbove && <div className="oss-cta-hint">{ctaHint}</div>}

          <button
            type="button"
            className={`oss-cta ${ctaDisabled ? "is-disabled" : ""}`}
            onClick={onCtaClick}
            disabled={ctaDisabled}
          >
            {ctaLabel}
          </button>

          {ctaHint && !hintAbove && <div className="oss-cta-hint">{ctaHint}</div>}
        </div>
      )}

      {/* Bubble */}
      {(bubbleTitle || bubbleText) && (
        <div
          className="oss-bubble"
          style={{
            left: bubbleRect.left,
            bottom: bubbleRect.bottom,
            width: bubbleRect.width,
          }}
        >
          <div className="oss-bubble-title">{bubbleTitle}</div>
          <div className="oss-bubble-text">{bubbleText}</div>
        </div>
      )}

      {/* Stepper */}
      <div className="oss-stepper">
        <button type="button" className="stepper-btn" onClick={onFlowBack} disabled={flowIdx === 0}>
          ← Back
        </button>

        <div className="stepper-mid">
          Step {flowIdx + 1} / {flowTotal}
        </div>

        <button
          type="button"
          className={`stepper-btn stepper-primary ${canNext ? "" : "is-disabled"}`}
          onClick={onFlowNext}
          disabled={!canNext}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
