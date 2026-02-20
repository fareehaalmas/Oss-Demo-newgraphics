// src/components/OssStage.tsx
import { useEffect, useLayoutEffect, useRef, useState } from "react";

// NOTE: Rails + old bubble/CTA system are removed on purpose.
import "./ossRail.css";

type Anchor =
  | "alice"
  | "bob"
  | "charlie"
  | "merchant"
  | "topBeam"
  | "diagBeam"
  | "capsule"
  | "center";

type OssStageProps = {
  stageId: string;
  focus: Anchor | null;

  // legacy props kept for compatibility with OssDemo; ignored now
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

  // Protocol state (still passed from OssDemo; you can use later for time-slices)
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

function randomHex(bytes: number) {
  const alphabet = "0123456789abcdef";
  const arr = new Uint8Array(bytes);

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
  }

  let out = "";
  for (let i = 0; i < arr.length; i++) {
    const b = arr[i];
    out += alphabet[(b >> 4) & 0xf] + alphabet[b & 0xf];
  }
  return out;
}

// Cinematic "signature" derived from nonce (NOT real crypto)
function fauxSignFromNonce(n: string) {
  const base = (n.replace(/^0x/, "") + "deadbeefcafebabe").slice(0, 32);
  let mixed = "";
  for (let i = 0; i < base.length; i++) {
    const c = base.charCodeAt(i);
    mixed += ((c + i * 17) % 16).toString(16);
  }
  const tail = randomHex(6);
  return `SIG(${n.slice(0, 8)}…):0x${mixed}${tail}`;
}

// Cinematic PQC keypair (NOT real crypto)
function fauxPqcKeypair() {
  const vk = `0x${randomHex(48)}`; // 96 hex chars
  const sk = `0x${randomHex(64)}`; // 128 hex chars
  return { vk, sk };
}

export default function OssStage({
  stageId,
  focus,
  flowIdx,
  flowTotal,
  canNext,
  onFlowNext,
  onFlowBack,
  vkA,
  skA,
}: OssStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);

  const isIntro = stageId === "intro";
  const isPreAuth = stageId === "step0_preprocessing";
  const isKeygen = stageId === "step1_keygen";
  const isBobKeygen = stageId === "step2_bob_keygen";
  const isAliceSigning = stageId === "step3_alice_signing";

  // Step 4 / 5 stage matching (prefix-based to avoid hardcoding exact ids)
  const isStep4 = stageId.startsWith("step4");
  const isStep5 = stageId.startsWith("step5");


  // ===== Intro timeline (gated by Start) =====
  const [introStarted, setIntroStarted] = useState(false);
  const [introPhase, setIntroPhase] = useState(0);

  useEffect(() => {
    if (!isIntro) return;
    setIntroStarted(false);
    setIntroPhase(0);
  }, [isIntro, flowIdx]);

  useEffect(() => {
    if (!isIntro) return;
    if (!introStarted) return;

    setIntroPhase(0);

    const t0 = window.setTimeout(() => setIntroPhase(1), 300);
    const t1 = window.setTimeout(() => setIntroPhase(2), 1600);
    const t2 = window.setTimeout(() => setIntroPhase(3), 3000);
    const t3 = window.setTimeout(() => setIntroPhase(4), 4300);

    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [isIntro, introStarted]);

  // ===== Step 0 beats =====
  // 0 enter
  // 1 trust title + handshake
  // 2 auth line
  // 3 auth packet flies -> onAnimationEnd => 4
  // 4 auth arrived (Next enabled)
  // 5 nonce line
  // 6 nonce flies -> onAnimationEnd => 7 (+ mint nonce)
  // 7 Sign CTA inside chip (Next disabled)
  // 8 signing (nonce->sig) -> onAnimationEnd => 9
  // 9 response packet flies -> onAnimationEnd => 10
  // 10 done (Next advances)
  const [step0Phase, setStep0Phase] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>(0);
  const [visualNonce, setVisualNonce] = useState<string | null>(null);
  const [visualSig, setVisualSig] = useState<string | null>(null);

  useEffect(() => {
    if (!isPreAuth) {
      setStep0Phase(0);
      return;
    }
    setStep0Phase(0);
    setVisualNonce(null);
    setVisualSig(null);

    const t1 = window.setTimeout(() => setStep0Phase(1), 300);
    return () => window.clearTimeout(t1);
  }, [isPreAuth]);

  useEffect(() => {
    if (!isPreAuth) return;
    if (step0Phase !== 2) return;
    const t = window.setTimeout(() => setStep0Phase(3), 260);
    return () => window.clearTimeout(t);
  }, [isPreAuth, step0Phase]);

  useEffect(() => {
    if (!isPreAuth) return;
    if (step0Phase !== 5) return;
    const t = window.setTimeout(() => setStep0Phase(6), 260);
    return () => window.clearTimeout(t);
  }, [isPreAuth, step0Phase]);

  // ===== Step 1: PQC keygen cinematic =====
  // 0 enter
  // 1 show center text
  // 2 after user presses Next -> show PQC.gen chip CTA near Alice (Next disabled until clicked)
  // 3 generated -> show vk/sk panel, enable Next
  const [step1Phase, setStep1Phase] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [keygenStatus, setKeygenStatus] = useState<"idle" | "running" | "generating">("idle");
  const [visualVkA, setVisualVkA] = useState<string | null>(null);
  const [visualSkA, setVisualSkA] = useState<string | null>(null);

  // ===== Step 2: Bob quantum signing key + CRS gen + send y to Alice =====
  // 0 enter
  // 1 show Step 2 main text
  // 2 after Next -> show "Bob runs gen.crs..." line + chip CTA near Bob (Next disabled)
  // 3 running animation (chip-mimic.png)
  // 4 generated (chip shows |sk_B> and y) (Next enabled)
  // 5 send y packet to Alice (Next disabled while animating)
  // 6 done (Next advances)
  const [step2Phase, setStep2Phase] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(0);
  const [bobKeygenStatus, setBobKeygenStatus] = useState<"running" | "generating">("running");
  const [visualSkB, setVisualSkB] = useState<string | null>(null);
  const [visualY, setVisualY] = useState<string | null>(null);
  const [aliceY, setAliceY] = useState<string | null>(null);

// ===== Step 3: sequential pops -> fade swap -> send =====
// 0 enter
// 1 title
// 2 BIG paragraph + m_auth appears
// 3 "...using y"      + y pops
// 4 "...sk_A"         + sk_A pops
// 5 "...and m_auth"   + m_auth pops
// 6 "construct signature..." + fade swap (panel + m_auth out, σ_A in)
// 7 σ_A holds (Next enabled)
// 8 σ_A flies (Next disabled)
// 9 done

const [step3Phase, setStep3Phase] =
  useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>(0);

const [visualMauth, setVisualMauth] = useState<string | null>(null);
const [visualSigmaA, setVisualSigmaA] = useState<string | null>(null);

const [yPulse, setYPulse] = useState(false);
const [skPulse, setSkPulse] = useState(false);
const [mauthPulse, setMauthPulse] = useState(false);

const [hideAlicePanel, setHideAlicePanel] = useState(false);
const [hideMauthHold, setHideMauthHold] = useState(false);
const [fadeSwapDone, setFadeSwapDone] = useState(false);



const sigmaHoldRef = useRef<HTMLDivElement | null>(null);


const [showSigma, setShowSigma] = useState(false);

// ===== Step 4 =====
// 0 enter
// 1 title text
// 2 subline + m_pay appears near Bob (holds)
// 3 done (Next advances)
const [step4Phase, setStep4Phase] = useState<0 | 1 | 2 | 3 | 4>(0);
const [visualMpay, setVisualMpay] = useState<string | null>(null);
// ===== Step 5 =====
// 0 enter
// 1 title text
// 2 coin toss animation (Next disabled while tossing)
// 3 outcome shown: v ∈ {0,1} assigned to m_pay (holds)
// 4 done (Next advances)
const [step5Phase, setStep5Phase] = useState<0 | 1 | 2 | 3 | 4>(0);
const [vBitLocal, setVBitLocal] = useState<0 | 1 | null>(null);
const [coinPulse, setCoinPulse] = useState(false);


const [sigmaArrivedAtCharlie, setSigmaArrivedAtCharlie] = useState(false);



  // ===== refs =====
  const aliceRef = useRef<HTMLButtonElement | null>(null);
  const bobRef = useRef<HTMLButtonElement | null>(null);
  const charlieRef = useRef<HTMLButtonElement | null>(null);
  const merchantRef = useRef<HTMLButtonElement | null>(null);

  // Step 3: measure σ_A row (for sending path)
  

  const sydneyCityRef = useRef<HTMLDivElement | null>(null);
  const strasCityRef = useRef<HTMLDivElement | null>(null);

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

  // ===== Step 1 init =====
  useEffect(() => {
    if (!isKeygen) {
      setStep1Phase(0);
      return;
    }
    // ✅ reset anything that belongs to Step 2 / Step 3
  setVisualSkB(null);
  setVisualY(null);
  setAliceY(null);

    setStep1Phase(0);

    const t1 = window.setTimeout(() => setStep1Phase(1), 250);
    const t2 = window.setTimeout(() => setStep1Phase(2), 1050);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [isKeygen]);

  // ===== Step 2 init =====
  useEffect(() => {
    if (!isBobKeygen) {
      setStep2Phase(0);
      return;
    }

    setStep2Phase(0);
    setBobKeygenStatus("running");

    const t1 = window.setTimeout(() => setStep2Phase(1), 250);
    return () => window.clearTimeout(t1);
  }, [isBobKeygen]);

  //step 3 init //
  useEffect(() => {
    if (!isAliceSigning) {
      setStep3Phase(0);
      setVisualMauth(null);
      //etSigmaArrivedAtCharlie(false);

      

setFadeSwapDone(false);

setShowSigma(false);
// keep σ_A string for Step 4/5 persistence
// setVisualSigmaA(null);


      setYPulse(false);
      setSkPulse(false);
      setMauthPulse(false);
      setHideAlicePanel(false);
      setHideMauthHold(false);
      setFadeSwapDone(false);
      return;
    }
  
    setStep3Phase(0);
    setVisualMauth("m_auth=(attr.1, attr.2, …)");
    setVisualSigmaA("σ_A=(y, sk_A, m_auth)");
    setHideAlicePanel(false);
    setHideMauthHold(false);
    setShowSigma(false);
    setFadeSwapDone(false);
  
    const t = window.setTimeout(() => setStep3Phase(1), 250);
    return () => window.clearTimeout(t);
  }, [isAliceSigning]);
  
  
    // Step 4 init
    useEffect(() => {
      if (!isStep4) {
        setStep4Phase(0);
        return;
      }
      setStep4Phase(0);
      setVisualMpay(null);
      setMpayArrivedAtCharlie(false);
  
      const t = window.setTimeout(() => setStep4Phase(1), 250);
      return () => window.clearTimeout(t);
    }, [isStep4]);
  
    useEffect(() => {
      if (!isStep5) {
        setStep5Phase(0);
        setVBitLocal(null);
        return;
      }
    
      setStep5Phase(1);
      setVBitLocal(null);
    
    }, [isStep5]);
    
  

  useEffect(() => {
    if (!isAliceSigning) return;
  
    const pulse = (setter: (v: boolean) => void) => {
      setter(true);
      const t = window.setTimeout(() => setter(false), 260);
      return () => window.clearTimeout(t);
    };
  
    if (step3Phase === 3)  pulse(setYPulse);
  if (step3Phase === 4)  pulse(setSkPulse);
  if (step3Phase === 5)  pulse(setMauthPulse);

  if (step3Phase === 6) {
    setFadeSwapDone(false);
    setShowSigma(false);

    const t = window.setTimeout(() => {
      setHideAlicePanel(true);
      setHideMauthHold(true);
      setFadeSwapDone(true);
      requestAnimationFrame(() => setShowSigma(true));
    }, STEP3_FADE_MS);

    return () => window.clearTimeout(t);
  }
  return;
}, [isAliceSigning, step3Phase]);
  
  

  // ===== positions =====

  // Step2 chip anchored near Bob
  const [bobChipPos, setBobChipPos] = useState<{ left: number; top: number }>({ left: 18, top: 18 });

  // y flight path Bob -> Alice (like nonce/sig packets)
  const [yPath, setYPath] = useState<{ sx: number; sy: number; ex: number; ey: number }>({
    sx: 0,
    sy: 0,
    ex: 0,
    ey: 0,
  });

  // Step 3: σ_A to Charlie path
  const [sigmaAToVerifierPath, setSigmaAToVerifierPath] = useState<{ sx: number; sy: number; ex: number; ey: number }>(
    { sx: 0, sy: 0, ex: 0, ey: 0 }
  );

  // tune these like your other knobs
  const BOB_CHIP_DX = 900;
  const BOB_CHIP_DY = -6;
  const Y_START_DX = -120; // relative to Bob center
  const Y_START_DY = 80;
  const Y_END_DX = 35; // relative to Alice center
  const Y_END_DY = 80;
  // Step 3: σ_A packet hold position tuning (relative to Alice center)
const SIGMA_HOLD_DX = -300;
const SIGMA_HOLD_DY = 10;

// Optional: final landing offset near Charlie (relative to Charlie center)
const SIGMA_END_DX = -320;
const SIGMA_END_DY = 10;

// σ_A "landed at Charlie" position (independent, so it can persist across scenes)
const [sigmaCharliePos, setSigmaCharliePos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

// Step 3 text knobs (independent)
const STEP3_BIG_DX = 0;
const STEP3_BIG_DY = 0;

const STEP3_BIND_DX = 0;
const STEP3_BIND_DY = 0;

const STEP3_SIGMAKE_DX = 0;
const STEP3_SIGMAKE_DY = 0;
const STEP3_FADE_MS = 520;


const sigmaHoldPos = (() => {
  const st = stageRef.current?.getBoundingClientRect();
  const a = aliceRef.current?.getBoundingClientRect();
  if (!st || !a) return { left: 0, top: 0 };

  const aCx = a.left + a.width / 2 - st.left;
  const aCy = a.top + a.height / 2 - st.top;

  return {
    left: aCx + SIGMA_HOLD_DX,
    top: aCy + SIGMA_HOLD_DY,
  };
})();



  // Step 3: m_auth packet tuning (near Alice)
  const MAUTH_START_DX = 50;
  const MAUTH_START_DY = 70;

    // Step 4: m_pay packet tuning (near Bob)
    const MPAY_HOLD_DX = -170;
    const MPAY_HOLD_DY = 40;
  
    const [mpayHoldPos, setMpayHoldPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });


    // Step 5: verifier coin + bit positioning (near Charlie)
const VERIFIER_COIN_DX = +130;
const VERIFIER_COIN_DY = 20;

const VERIFIER_BIT_DX = +130;
const VERIFIER_BIT_DY = +20;

const [verifierCoinPos, setVerifierCoinPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
const [verifierBitPos, setVerifierBitPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

useLayoutEffect(() => {
  if (!isStep5) return;

  const stageEl = stageRef.current;
  const cEl = charlieRef.current;
  if (!stageEl || !cEl) return;

  const s = stageEl.getBoundingClientRect();
  const c = cEl.getBoundingClientRect();

  const cCx = c.left + c.width / 2 - s.left;
  const cCy = c.top + c.height / 2 - s.top;

  setVerifierCoinPos({
    left: cCx + VERIFIER_COIN_DX,
    top: cCy + VERIFIER_COIN_DY,
  });

  setVerifierBitPos({
    left: cCx + VERIFIER_BIT_DX,
    top: cCy + VERIFIER_BIT_DY,
  });
}, [
  isStep5,
  stageSize.w,
  stageSize.h,
  VERIFIER_COIN_DX,
  VERIFIER_COIN_DY,
  VERIFIER_BIT_DX,
  VERIFIER_BIT_DY,
]);


// Step 4: m_pay flight tuning (Bob -> Charlie)
const MPAY_START_DX = -170;
const MPAY_START_DY = 40;

// lands near Charlie (independent knobs)
const MPAY_END_DX = -200;
const MPAY_END_DY = 0;

const [mpayPath, setMpayPath] = useState<{ sx: number; sy: number; ex: number; ey: number }>({
  sx: 0,
  sy: 0,
  ex: 0,
  ey: 0,
});

const [mpayArrivedAtCharlie, setMpayArrivedAtCharlie] = useState(false);
const [mpayCharliePos, setMpayCharliePos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
useLayoutEffect(() => {
  if (!isStep4) return;

  const stageEl = stageRef.current;
  const bEl = bobRef.current;
  const cEl = charlieRef.current;
  if (!stageEl || !bEl || !cEl) return;

  const s = stageEl.getBoundingClientRect();
  const b = bEl.getBoundingClientRect();
  const c = cEl.getBoundingClientRect();

  const bCx = b.left + b.width / 2 - s.left;
  const bCy = b.top + b.height / 2 - s.top;

  const cCx = c.left + c.width / 2 - s.left;
  const cCy = c.top + c.height / 2 - s.top;

  setMpayPath({
    sx: bCx + MPAY_START_DX,
    sy: bCy + MPAY_START_DY,
    ex: cCx + MPAY_END_DX,
    ey: cCy + MPAY_END_DY,
  });

  setMpayCharliePos({
    left: cCx + MPAY_END_DX,
    top: cCy + MPAY_END_DY,
  });
}, [isStep4, stageSize.w, stageSize.h, MPAY_START_DX, MPAY_START_DY, MPAY_END_DX, MPAY_END_DY]);

    useLayoutEffect(() => {
      if (!isStep4 && !isStep5) return;
  
      const stageEl = stageRef.current;
      const bEl = bobRef.current;
      if (!stageEl || !bEl) return;
  
      const s = stageEl.getBoundingClientRect();
      const b = bEl.getBoundingClientRect();
  
      const bCx = b.left + b.width / 2 - s.left;
      const bCy = b.top + b.height / 2 - s.top;
  
      setMpayHoldPos({
        left: bCx + MPAY_HOLD_DX,
        top: bCy + MPAY_HOLD_DY,
      });
    }, [isStep4, isStep5, stageSize.w, stageSize.h, MPAY_HOLD_DX, MPAY_HOLD_DY]);
  

  // midpoint between Alice and Bob (for step0 title/handshake + center text)
  const [baseTrustPos, setBaseTrustPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });


  useLayoutEffect(() => {
    const stageEl = stageRef.current;
    const aEl = aliceRef.current;
    const bEl = bobRef.current;
    if (!stageEl || !aEl || !bEl) return;

    const s = stageEl.getBoundingClientRect();
    const a = aEl.getBoundingClientRect();
    const b = bEl.getBoundingClientRect();

    const ax = a.left + a.width / 2;
    const bx = b.left + b.width / 2;
    const midX = (ax + bx) / 2 - s.left;

    const baseY = Math.max(a.top + a.height * 0.62, b.top + b.height * 0.62) - s.top;
    setBaseTrustPos({ left: midX, top: baseY });
  }, [stageSize.w, stageSize.h]);

  // ===== Independent position controls =====
  const TRUST_TEXT_DX = 0;
  const TRUST_TEXT_DY = +170;
  const HAND_DX = 0;
  const HAND_DY = -30;

  // Step 1 text tuning (independent from Step 0)
  const STEP1_TEXT_DX = 0; // +right / -left
  const STEP1_TEXT_DY = -45; // +down / -up

  const AUTH_LINE_DX = 0;
  const AUTH_LINE_DY = -15;

  const NONCE_LINE_DX = 0;
  const NONCE_LINE_DY = -15;

  const RESPONSE_LINE_DX = -10;
  const RESPONSE_LINE_DY = -15;

  // Packet flight tuning
  const PACKET_START_DX = 120;
  const PACKET_START_DY = 80;
  const PACKET_END_DX = -120;
  const PACKET_END_DY = 80;

  // Nonce: shift start toward center (left), and end away from Alice
  const NONCE_START_DX = -120;
  const NONCE_START_DY = 80;
  const NONCE_END_DX = 35;
  const NONCE_END_DY = 80;

  const SIG_START_DX = 50;
  const SIG_START_DY = 80;
  const SIG_END_DX = -120;
  const SIG_END_DY = 80;

  // Packet image tuning
  const PACKET_IMG_W = 110;
  const PACKET_IMG_H = 110;
  const PACKET_IMG_DX = -60;
  const PACKET_IMG_DY = -60;

  const PACKET_TUNING_KEY = `${PACKET_START_DX}|${PACKET_START_DY}|${PACKET_END_DX}|${PACKET_END_DY}`;
  const NONCE_TUNING_KEY = `${NONCE_START_DX}|${NONCE_START_DY}|${NONCE_END_DX}|${NONCE_END_DY}`;
  const SIG_TUNING_KEY = `${SIG_START_DX}|${SIG_START_DY}|${SIG_END_DX}|${SIG_END_DY}`;

  // Packet paths
  const [authPath, setAuthPath] = useState<{ sx: number; sy: number; ex: number; ey: number }>({
    sx: 0,
    sy: 0,
    ex: 0,
    ey: 0,
  });

  const [noncePath, setNoncePath] = useState<{ sx: number; sy: number; ex: number; ey: number }>({
    sx: 0,
    sy: 0,
    ex: 0,
    ey: 0,
  });

  const [sigPath, setSigPath] = useState<{ sx: number; sy: number; ex: number; ey: number }>({
    sx: 0,
    sy: 0,
    ex: 0,
    ey: 0,
  });

  // Step0 chip position anchored to Alice LEFT
  const [chipPos, setChipPos] = useState<{ left: number; top: number }>({ left: 18, top: 18 });
  const CHIP_DX = 22;
  const CHIP_DY = -6;
  const CHIP_GAP = 6;

  // Step1 chip CTA + keys panel near Alice
  const [pqcChipPos, setPqcChipPos] = useState<{ left: number; top: number }>({ left: 18, top: 18 });
  const [keysPanelPos, setKeysPanelPos] = useState<{ left: number; top: number }>({ left: 18, top: 18 });

  // Keys panel slightly LEFT/ABOVE Alice
  const KEYS_DX = -18;
  const KEYS_DY = -74;

  // Bob chip position (RIGHT of Bob if possible)
  useLayoutEffect(() => {
    if (!isBobKeygen && !isAliceSigning) return;

    const stageEl = stageRef.current;
    const bobEl = bobRef.current;
    if (!stageEl || !bobEl) return;

    const s = stageEl.getBoundingClientRect();
    const b = bobEl.getBoundingClientRect();

    const CHIP_W = 320;
    const CHIP_H = 118;

    const baseTop = b.top - s.top + b.height * 0.45 - CHIP_H * 0.5;

    const maxLeft = stageSize.w - CHIP_W + 80;
    const maxTop = stageSize.h - CHIP_H - 86;

    const rightLeft = b.left - s.left + b.width + CHIP_GAP;
    const leftLeft = b.left - s.left - CHIP_W - CHIP_GAP;

    const hasRoomOnRight = rightLeft + CHIP_W <= stageSize.w - 12;
    const baseLeft = hasRoomOnRight ? rightLeft : leftLeft;

    setBobChipPos({
      left: clamp(baseLeft + BOB_CHIP_DX, 12, maxLeft),
      top: clamp(baseTop + BOB_CHIP_DY, 12, maxTop),
    });
  }, [isBobKeygen, isAliceSigning, stageSize.w, stageSize.h, step2Phase]);

  // authPath
  useLayoutEffect(() => {
    if (!isPreAuth) return;

    const stageEl = stageRef.current;
    const aEl = aliceRef.current;
    const bEl = bobRef.current;
    if (!stageEl || !aEl || !bEl) return;

    const s = stageEl.getBoundingClientRect();
    const a = aEl.getBoundingClientRect();
    const b = bEl.getBoundingClientRect();

    const aCx = a.left + a.width / 2 - s.left;
    const aCy = a.top + a.height / 2 - s.top;

    const bCx = b.left + b.width / 2 - s.left;
    const bCy = b.top + b.height / 2 - s.top;

    setAuthPath({
      sx: aCx + PACKET_START_DX,
      sy: aCy + PACKET_START_DY,
      ex: bCx + PACKET_END_DX,
      ey: bCy + PACKET_END_DY,
    });
  }, [isPreAuth, stageSize.w, stageSize.h, PACKET_TUNING_KEY]);

  // noncePath
  useLayoutEffect(() => {
    if (!isPreAuth) return;

    const stageEl = stageRef.current;
    const aEl = aliceRef.current;
    const bEl = bobRef.current;
    if (!stageEl || !aEl || !bEl) return;

    const s = stageEl.getBoundingClientRect();
    const a = aEl.getBoundingClientRect();
    const b = bEl.getBoundingClientRect();

    const aCx = a.left + a.width / 2 - s.left;
    const aCy = a.top + a.height / 2 - s.top;

    const bCx = b.left + b.width / 2 - s.left;
    const bCy = b.top + b.height / 2 - s.top;

    setNoncePath({
      sx: bCx + NONCE_START_DX,
      sy: bCy + NONCE_START_DY,
      ex: aCx + NONCE_END_DX,
      ey: aCy + NONCE_END_DY,
    });
  }, [isPreAuth, stageSize.w, stageSize.h, NONCE_TUNING_KEY]);

  // sigPath
  useLayoutEffect(() => {
    if (!isPreAuth) return;

    const stageEl = stageRef.current;
    const aEl = aliceRef.current;
    const bEl = bobRef.current;
    if (!stageEl || !aEl || !bEl) return;

    const s = stageEl.getBoundingClientRect();
    const a = aEl.getBoundingClientRect();
    const b = bEl.getBoundingClientRect();

    const aCx = a.left + a.width / 2 - s.left;
    const aCy = a.top + a.height / 2 - s.top;

    const bCx = b.left + b.width / 2 - s.left;
    const bCy = b.top + b.height / 2 - s.top;

    setSigPath({
      sx: aCx + SIG_START_DX,
      sy: aCy + SIG_START_DY,
      ex: bCx + SIG_END_DX,
      ey: bCy + SIG_END_DY,
    });
  }, [isPreAuth, stageSize.w, stageSize.h, SIG_TUNING_KEY]);

  // Step2: y flight path Bob -> Alice
  useLayoutEffect(() => {
    if (!isBobKeygen) return;

    const stageEl = stageRef.current;
    const aEl = aliceRef.current;
    const bEl = bobRef.current;
    if (!stageEl || !aEl || !bEl) return;

    const s = stageEl.getBoundingClientRect();
    const a = aEl.getBoundingClientRect();
    const b = bEl.getBoundingClientRect();

    const aCx = a.left + a.width / 2 - s.left;
    const aCy = a.top + a.height / 2 - s.top;

    const bCx = b.left + b.width / 2 - s.left;
    const bCy = b.top + b.height / 2 - s.top;

    setYPath({
      sx: bCx + Y_START_DX,
      sy: bCy + Y_START_DY,
      ex: aCx + Y_END_DX,
      ey: aCy + Y_END_DY,
    });
  }, [isBobKeygen, stageSize.w, stageSize.h]);

  // Step0 chip anchored to Alice
  useLayoutEffect(() => {
    if (!isPreAuth) return;

    const stageEl = stageRef.current;
    const aliceEl = aliceRef.current;
    if (!stageEl || !aliceEl) return;

    const s = stageEl.getBoundingClientRect();
    const a = aliceEl.getBoundingClientRect();

    const CHIP_W = 320;
    const CHIP_H = step0Phase === 7 ? 128 : 92;

    const baseLeft = a.left - s.left - CHIP_W - CHIP_GAP;
    const baseTop = a.top - s.top + a.height * 0.45 - CHIP_H * 0.5;

    const maxLeft = stageSize.w - CHIP_W - 12;
    const maxTop = stageSize.h - CHIP_H - 86;

    setChipPos({
      left: clamp(baseLeft + CHIP_DX, 12, maxLeft),
      top: clamp(baseTop + CHIP_DY, 12, maxTop),
    });
  }, [isPreAuth, step0Phase, stageSize.w, stageSize.h]);

  // Step1 PQC chip CTA + keys panel anchored around Alice
  useLayoutEffect(() => {
    if (!isKeygen && !isBobKeygen && !isAliceSigning) return;

    const stageEl = stageRef.current;
    const aliceEl = aliceRef.current;
    if (!stageEl || !aliceEl) return;

    const s = stageEl.getBoundingClientRect();
    const a = aliceEl.getBoundingClientRect();

    const CHIP_W = 320;
    const CHIP_H = 118;

    const baseLeft = a.left - s.left - CHIP_W - CHIP_GAP;
    const baseTop = a.top - s.top + a.height * 0.45 - CHIP_H * 0.5;

    const maxLeft = stageSize.w - CHIP_W - 12;
    const maxTop = stageSize.h - CHIP_H - 86;

    setPqcChipPos({
      left: clamp(baseLeft + CHIP_DX, 12, maxLeft),
      top: clamp(baseTop + CHIP_DY, 12, maxTop),
    });

    const PANEL_W = 340;
    const PANEL_H = 170;

    const panelLeft = a.left - s.left - PANEL_W + KEYS_DX;
    const panelTop = a.top - s.top + KEYS_DY;

    setKeysPanelPos({
      left: clamp(panelLeft, 12, stageSize.w - PANEL_W - 12),
      top: clamp(panelTop, 12, stageSize.h - PANEL_H - 86),
    });
  }, [isKeygen, isBobKeygen, isAliceSigning, stageSize.w, stageSize.h, step1Phase, step2Phase, step3Phase]);

  // Step 3: compute σ_A send path from σ_A row in the panel (preferred) else from panel center
  useLayoutEffect(() => {
    if (!isAliceSigning) return;
    if (step3Phase < 7) return;
  
    const stageEl = stageRef.current;
    const cEl = charlieRef.current;
    if (!stageEl || !cEl) return;
  
    const s = stageEl.getBoundingClientRect();
    const c = cEl.getBoundingClientRect();
    const cCx = c.left + c.width / 2 - s.left;
    const cCy = c.top + c.height / 2 - s.top;
  
    const startEl = sigmaHoldRef.current;
    if (startEl) {
      const r = startEl.getBoundingClientRect();
      const sx = r.left + r.width / 2 - s.left;
      const sy = r.top + r.height / 2 - s.top;
      setSigmaAToVerifierPath({ sx, sy, ex: cCx + SIGMA_END_DX, ey: cCy + SIGMA_END_DY });
    } else {
      setSigmaAToVerifierPath({ sx: sigmaHoldPos.left, sy: sigmaHoldPos.top, ex: cCx + SIGMA_END_DX, ey: cCy + SIGMA_END_DY });
    }
  }, [
    isAliceSigning,
    step3Phase,
    stageSize.w,
    stageSize.h,
    sigmaHoldPos.left,
    sigmaHoldPos.top,
    SIGMA_END_DX,
    SIGMA_END_DY,
  ]);
    
    // σ_A: landed hold position near Charlie (updates on resize)
  useLayoutEffect(() => {
    if (!sigmaArrivedAtCharlie) return;

    const stageEl = stageRef.current;
    const cEl = charlieRef.current;
    if (!stageEl || !cEl) return;

    const s = stageEl.getBoundingClientRect();
    const c = cEl.getBoundingClientRect();

    const cCx = c.left + c.width / 2 - s.left;
    const cCy = c.top + c.height / 2 - s.top;

    setSigmaCharliePos({
      left: cCx + SIGMA_END_DX,
      top: cCy + SIGMA_END_DY,
    });
  }, [sigmaArrivedAtCharlie, stageSize.w, stageSize.h, SIGMA_END_DX, SIGMA_END_DY]);


  // ===== Next gating =====
  const step0NextEnabled =
    step0Phase >= 1 &&
    step0Phase !== 2 &&
    step0Phase !== 3 &&
    step0Phase !== 5 &&
    step0Phase !== 6 &&
    step0Phase !== 7 &&
    step0Phase !== 8 &&
    step0Phase !== 9;


  // Step 1: Next should work to reveal CTA (phase 1 -> 2), then be blocked until keys generated.
  const step1NextEnabled = step1Phase === 1 || step1Phase === 4;

  const step2NextEnabled = step2Phase === 1 || step2Phase === 4 || step2Phase === 6;
  

  // Step 3: Next is blocked only while σ_A is flying
  const step3NextEnabled =
  step3Phase === 1 ||
  step3Phase === 2 ||
  step3Phase === 3 ||
  step3Phase === 4 ||
  step3Phase === 5 ||
  (step3Phase === 6 && fadeSwapDone) ||
  step3Phase === 7 ||
  step3Phase === 9;
  const step4NextEnabled = step4Phase === 1 || step4Phase === 2 || step4Phase === 4;
  
  const step5NextEnabled = step5Phase === 1 || step5Phase === 3 || step5Phase === 4;


// blocked during 6 (mixing) and 8 (flight)

// blocked during 5 (mixing auto) and 7 (flying)

  const isNextDisabled =
    isIntro
      ? introStarted && introPhase < 4
      : isPreAuth
        ? !step0NextEnabled
        : isKeygen
          ? !step1NextEnabled
          : isBobKeygen
            ? !step2NextEnabled
            : isAliceSigning
            ? !step3NextEnabled
            : isStep4
              ? !step4NextEnabled
              : isStep5
                ? !step5NextEnabled
                : !canNext;


  // ===== Intro narration text =====
  const introText = (
    <div className="oss-introMsg" data-phase={introPhase}>
      <span className={`intro-chunk ${introPhase >= 1 ? "is-on" : ""}`}>
        Alice, in <span className="intro-em">Sydney</span>,
      </span>{" "}
      <span className={`intro-chunk ${introPhase >= 2 ? "is-on" : ""}`}>
        wants to delegate signing rights to Bob in <span className="intro-em">Strasbourg</span> to transfer a token
      </span>{" "}
      <span className={`intro-chunk ${introPhase >= 3 ? "is-on" : ""}`}>
        to a <span className="intro-em">merchant</span>.
      </span>{" "}
      <span className={`intro-chunk ${introPhase >= 4 ? "is-on" : ""}`}>
        There exists a verifier in <span className="intro-em">Vancouver</span> who can authenticate the signatures.
      </span>
    </div>
  );

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

      <div className="oss-cityWrap oss-cityWrap-merchant">
        <img className="oss-city oss-city-merchant" src="/merchant.png" alt="Merchant institution" />
      </div>

      {/* Time-slice overlay */}
      <div key={stageId} className="oss-slice">
        {/* Intro narration */}
        {isIntro && introStarted && introText}

        {/* ===== STEP 0 visuals ===== */}
        {isPreAuth && step0Phase >= 1 && (
          <>
            <div
              className={`oss-trustText ${step0Phase >= 1 ? "is-on" : ""}`}
              style={{
                position: "absolute",
                left: baseTrustPos.left + TRUST_TEXT_DX,
                top: baseTrustPos.top + TRUST_TEXT_DY,
                transform: "translate(-50%, 0)",
                zIndex: 60,
                pointerEvents: "none",
              }}
            >
              Step 0: Establishment of trust
            </div>

            {step0Phase < 2 && (
              <img
                className={`oss-trustHandshake ${step0Phase >= 1 ? "is-on" : ""}`}
                src="/handshake.png"
                alt="Handshake"
                style={{
                  position: "absolute",
                  left: baseTrustPos.left + HAND_DX,
                  top: baseTrustPos.top + HAND_DY,
                  transform: "translate(-50%, 0)",
                  zIndex: 59,
                  pointerEvents: "none",
                }}
              />
            )}
          </>
        )}

        {/* Step 0: auth line + auth packet */}
        {isPreAuth && step0Phase >= 2 && step0Phase < 5 && (
          <>
            <div
              className={`oss-authLine ${step0Phase >= 2 ? "is-on" : ""}`}
              style={{
                position: "absolute",
                left: baseTrustPos.left + TRUST_TEXT_DX + AUTH_LINE_DX,
                top: baseTrustPos.top + TRUST_TEXT_DY + 42 + AUTH_LINE_DY,
                transform: "translate(-50%, 0)",
                zIndex: 60,
                pointerEvents: "none",
              }}
            >
              First, Alice sends an authorisation request
            </div>

            {step0Phase >= 3 && (
              <div
                key={`authPacket-${step0Phase}`}
                className={`oss-authPacket ${step0Phase >= 3 ? "is-on" : ""}`}
                onAnimationEnd={() => {
                  if (isPreAuth && step0Phase === 3) setStep0Phase(4);
                }}
                style={{
                  position: "absolute",
                  left: authPath.sx,
                  top: authPath.sy,
                  ["--tx" as any]: `${authPath.ex - authPath.sx}px`,
                  ["--ty" as any]: `${authPath.ey - authPath.sy}px`,
                  zIndex: 61,
                  pointerEvents: "none",
                }}
              >
                <img
                  className="oss-packetImg"
                  src="/authenticate.png"
                  alt="Authorization request packet"
                  style={{
                    width: PACKET_IMG_W,
                    height: PACKET_IMG_H,
                    transform: `translate(${PACKET_IMG_DX}px, ${PACKET_IMG_DY}px)`,
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* Step 0: nonce line + nonce packet */}
        {isPreAuth && step0Phase >= 5 && step0Phase < 8 && (
          <>
            <div
              className={`oss-authLine ${step0Phase >= 5 ? "is-on" : ""}`}
              style={{
                position: "absolute",
                left: baseTrustPos.left + TRUST_TEXT_DX + NONCE_LINE_DX,
                top: baseTrustPos.top + TRUST_TEXT_DY + 42 + NONCE_LINE_DY,
                transform: "translate(-50%, 0)",
                zIndex: 60,
                pointerEvents: "none",
              }}
            >
              Bob sends a fresh nonce
            </div>

            {step0Phase >= 6 && (
              <div
                key={`noncePacket-${step0Phase}`}
                className={`oss-authPacket ${step0Phase >= 6 ? "is-on" : ""}`}
                onAnimationEnd={() => {
                  if (!isPreAuth || step0Phase !== 6) return;

                  const n = `0x${randomHex(10)}`;
                  setVisualNonce(n);
                  setVisualSig(null);
                  setStep0Phase(7);
                }}
                style={{
                  position: "absolute",
                  left: noncePath.sx,
                  top: noncePath.sy,
                  ["--tx" as any]: `${noncePath.ex - noncePath.sx}px`,
                  ["--ty" as any]: `${noncePath.ey - noncePath.sy}px`,
                  zIndex: 61,
                  pointerEvents: "none",
                }}
              >
                <div className="packet-shell">
                  <div className="packet-binary">00011&nbsp;10100101&nbsp;0110</div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Step 0: unified chip + response packet */}
        {isPreAuth && step0Phase >= 7 && (
          <>
            <div
              className={`oss-nonceChip ${step0Phase >= 8 ? "is-signing" : ""} ${step0Phase >= 9 ? "is-signed" : ""}`}
              style={{
                position: "absolute",
                left: chipPos.left,
                top: chipPos.top,
                zIndex: 62,
                pointerEvents: "auto",
              }}
            >
              <div className="oss-chipRow">
                <span className="oss-chipLabel">nonce</span>
                <span className="nonceText">{visualNonce ?? "0x…"}</span>
              </div>

              {step0Phase >= 9 && step0Phase <= 10 && (
                <div
                  className="oss-authLine is-on"
                  style={{
                    position: "absolute",
                    left: baseTrustPos.left + TRUST_TEXT_DX + RESPONSE_LINE_DX,
                    top: baseTrustPos.top + TRUST_TEXT_DY + 42 + RESPONSE_LINE_DY,
                    transform: "translate(-50%, 0)",
                    zIndex: 60,
                    pointerEvents: "none",
                    textAlign: "center",
                    width: "max-content",
                    maxWidth: 900,
                    whiteSpace: "normal",
                  }}
                >
                  Then, Alice sends her response to Bob
                </div>
              )}

              <div className="oss-chipRow">
                <span className="oss-chipLabel">sig</span>
                <span
                  className="sigText"
                  onAnimationEnd={() => {
                    if (isPreAuth && step0Phase === 8) setStep0Phase(9);
                  }}
                >
                  {visualSig ?? "SIG(…):0x…"}
                </span>
              </div>

              {step0Phase === 7 && (
                <button
                  type="button"
                  className="oss-chipSignBtn"
                  onClick={() => {
                    const n = visualNonce ?? `0x${randomHex(10)}`;
                    setVisualNonce(n);
                    setVisualSig(fauxSignFromNonce(n));
                    setStep0Phase(8);
                  }}
                >
                  Sign
                </button>
              )}
            </div>

            {step0Phase >= 9 && (
              <div
                key={`sigPacket-${step0Phase}`}
                className={`oss-sigPacket ${step0Phase >= 9 ? "is-on" : ""}`}
                onAnimationEnd={() => {
                  if (isPreAuth && step0Phase === 9) setStep0Phase(10);
                }}
                style={{
                  position: "absolute",
                  left: sigPath.sx,
                  top: sigPath.sy,
                  ["--tx" as any]: `${sigPath.ex - sigPath.sx}px`,
                  ["--ty" as any]: `${sigPath.ey - sigPath.sy}px`,
                  zIndex: 61,
                  pointerEvents: "none",
                }}
              >
                <div className="packet-shell packet-shell--sig">
                  <div className="packet-sig">response</div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== STEP 1 visuals (PQC.gen) ===== */}
        {isKeygen && (
          <>
            {step1Phase >= 1 && (
              <div
                className={`oss-trustText ${step1Phase >= 1 ? "is-on" : ""}`}
                style={{
                  position: "absolute",
                  left: baseTrustPos.left + STEP1_TEXT_DX,
                  top: baseTrustPos.top + TRUST_TEXT_DY + STEP1_TEXT_DY,
                  transform: "translate(-50%, 0)",
                  zIndex: 60,
                  pointerEvents: "none",
                  textAlign: "center",
                  maxWidth: 900,
                }}
              >
                Step 1: Alice generates a classical PQC keypair (vk_A, sk_A) by running PQC.gen using Dilithium. The public
                key vk_A uniquely identifies Alice.
              </div>
            )}

            {step1Phase === 2 && (
              <div
                className="oss-nonceChip"
                style={{
                  position: "absolute",
                  left: pqcChipPos.left,
                  top: pqcChipPos.top,
                  zIndex: 62,
                  pointerEvents: "auto",
                }}
              >
                <div className="oss-chipRow">
                  <span className="oss-chipLabel">op</span>
                  <span className="nonceText">PQC.gen</span>
                </div>

                <div className="oss-chipRow">
                  <span className="oss-chipLabel">algo</span>
                  <span className="sigText">Dilithium</span>
                </div>

                <button
                  type="button"
                  className="oss-chipSignBtn"
                  onClick={() => {
                    setStep1Phase(3);
                    setKeygenStatus("running");

                    window.setTimeout(() => setKeygenStatus("generating"), 1200);

                    window.setTimeout(() => {
                      const kp = fauxPqcKeypair();
                      setVisualVkA(kp.vk);
                      setVisualSkA(kp.sk);
                      setStep1Phase(4);
                    }, 2400);
                  }}
                >
                  Run
                </button>
              </div>
            )}

            {isKeygen && step1Phase === 3 && (
              <div className="oss-dilithiumStage">
                <img src="/dilithium.png" alt="Dilithium" className="oss-dilithiumImg" />
                <div className="oss-dilithiumText">
                  {keygenStatus === "running" && "Running the algorithm…"}
                  {keygenStatus === "generating" && "Generating keys…"}
                </div>
              </div>
            )}

            {step1Phase >= 4 && (
              <div
                className="oss-keysPanel"
                style={{
                  position: "absolute",
                  left: keysPanelPos.left,
                  top: keysPanelPos.top,
                  zIndex: 62,
                  pointerEvents: "none",
                }}
              >
                <div className="oss-keysRow">
                  <div className="oss-keysLabel">vk_A</div>
                  <div className="oss-keysVal">{vkA ?? visualVkA }</div>
                </div>

                <div className="oss-keysRow">
                  <div className="oss-keysLabel">sk_A</div>
                  <div className="oss-keysVal">{skA ?? visualSkA }</div>
                </div>

                
              </div>
            )}
          </>
        )}

        {/* ===== STEP 2 visuals (Bob gen.crs + send y) ===== */}
        {isBobKeygen && (
          <>
            {/* Keep Alice keys visible */}
            {(vkA ?? visualVkA) && (skA ?? visualSkA) && (
              <div
                className="oss-keysPanel"
                style={{
                  position: "absolute",
                  left: keysPanelPos.left,
                  top: keysPanelPos.top,
                  zIndex: 62,
                  pointerEvents: "none",
                }}
              >
                <div className="oss-keysRow">
                  <div className="oss-keysLabel">vk_A</div>
                  <div className="oss-keysVal">{vkA ?? visualVkA}</div>
                </div>
                <div className="oss-keysRow">
                  <div className="oss-keysLabel">sk_A</div>
                  <div className="oss-keysVal">{skA ?? visualSkA}</div>
                </div>
                {aliceY && (
  <div className="oss-keysRow oss-yRow">
    <div className="oss-keysLabel">y</div>
    <div className="oss-keysVal">{aliceY}</div>
  </div>
)}

              </div>
            )}

            {/* Main Step 2 text */}
            {step2Phase >= 1 && (
              <div
                className={`oss-trustText ${step2Phase >= 1 ? "is-on" : ""}`}
                style={{
                  position: "absolute",
                  left: baseTrustPos.left + STEP1_TEXT_DX,
                  top: baseTrustPos.top + TRUST_TEXT_DY + STEP1_TEXT_DY,
                  transform: "translate(-50%, 0)",
                  zIndex: 60,
                  pointerEvents: "none",
                  textAlign: "center",
                  maxWidth: 900,
                }}
              >
                Step 2: Bob generates his quantum signing key |sk_B&gt; and the classical public key y.
              </div>
            )}

            {/* Sub-line like Step 0 formatting */}
            {step2Phase >= 2 && step2Phase < 5 && (
              <div
                className={`oss-authLine ${step2Phase >= 2 ? "is-on" : ""}`}
                style={{
                  position: "absolute",
                  left: baseTrustPos.left + TRUST_TEXT_DX + AUTH_LINE_DX,
                  top: baseTrustPos.top + TRUST_TEXT_DY + 42 + AUTH_LINE_DY,
                  transform: "translate(-50%, 0)",
                  zIndex: 60,
                  pointerEvents: "none",
                  textAlign: "center",
                  width: "max-content",
                  maxWidth: 900,
                  whiteSpace: "normal",
                }}
              >
                Bob runs gen.crs on his quantum computer
              </div>
            )}

            {/* Chip CTA near Bob */}
            {step2Phase === 2 && (
              <div
                className="oss-nonceChip"
                style={{
                  position: "absolute",
                  left: bobChipPos.left,
                  top: bobChipPos.top,
                  zIndex: 62,
                  pointerEvents: "auto",
                }}
              >
                <div className="oss-chipRow">
                  <span className="oss-chipLabel">op</span>
                  <span className="nonceText">gen.crs</span>
                </div>

                <div className="oss-chipRow">
                  <span className="oss-chipLabel">out</span>
                  <span className="sigText">|sk_B&gt;, y</span>
                </div>

                <button
                  type="button"
                  className="oss-chipSignBtn"
                  onClick={() => {
                    setStep2Phase(3);
                    setBobKeygenStatus("running");

                    window.setTimeout(() => setBobKeygenStatus("generating"), 1200);

                    window.setTimeout(() => {
                      setVisualSkB(`0x${randomHex(32)}`);
                      setVisualY(`0x${randomHex(24)}`);
                      setStep2Phase(4);
                    }, 2400);
                  }}
                >
                  Run
                </button>
              </div>
            )}

            {/* Running animation: chip-mimiq.png */}
            {step2Phase === 3 && (
              <div
                className="oss-dilithiumStage"
                style={{
                  position: "absolute",
                  left: bobChipPos.left,
                  top: bobChipPos.top,
                  transform: "translate(0, 0)",
                  zIndex: 70,
                  pointerEvents: "none",
                }}
              >
                <img src="/chip-mimiq.png" alt="Mimiq" className="oss-dilithiumImg" />
                <div className="oss-dilithiumText">
                  {bobKeygenStatus === "running" ? "Running the algorithm…" : "Generating keys…"}
                </div>
              </div>
            )}

            {/* After generated: show Bob outputs in-chip */}
            {step2Phase >= 4 && (
              <div
                className="oss-nonceChip"
                style={{
                  position: "absolute",
                  left: bobChipPos.left,
                  top: bobChipPos.top,
                  zIndex: 62,
                  pointerEvents: "none",
                }}
              >
                <div className="oss-chipRow">
                  <span className="oss-chipLabel">|sk_B&gt;</span>
                  <span className="nonceText">{visualSkB ?? "|sk_B>…"}</span>
                </div>

                <div className="oss-chipRow">
                  <span className="oss-chipLabel">y</span>
                  <span className="sigText">{visualY ?? "0x…"}</span>
                </div>
              </div>
            )}

            {/* When sending: swap the line text */}
            {step2Phase >= 5 && (
              <div
                className="oss-authLine is-on"
                style={{
                  position: "absolute",
                  left: baseTrustPos.left + TRUST_TEXT_DX + RESPONSE_LINE_DX,
                  top: baseTrustPos.top + TRUST_TEXT_DY + 42 + RESPONSE_LINE_DY,
                  transform: "translate(-50%, 0)",
                  zIndex: 60,
                  pointerEvents: "none",
                  textAlign: "center",
                  width: "max-content",
                  maxWidth: 900,
                  whiteSpace: "normal",
                }}
              >
                Bob then sends his public key y to Alice
              </div>
            )}

            {/* y flies Bob -> Alice */}
            {step2Phase === 5 && (
              <div
                key={`yPacket-${step2Phase}`}
                className="oss-authPacket is-on"
                onAnimationEnd={() => {
                  if (!isBobKeygen || step2Phase !== 5) return;
                  setAliceY(visualY);
                  setStep2Phase(6);
                }}
                style={{
                  position: "absolute",
                  left: yPath.sx,
                  top: yPath.sy,
                  ["--tx" as any]: `${yPath.ex - yPath.sx}px`,
                  ["--ty" as any]: `${yPath.ey - yPath.sy}px`,
                  zIndex: 61,
                  pointerEvents: "none",
                }}
              >
                <div className="packet-shell">
                  <div className="packet-binary">{visualY ?? "0x…"}</div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== STEP 3 visuals (your requested choreography) ===== */}
{/* ===== STEP 3 visuals (sequential narration + pops + mixing + σ_A packet) ===== */}
{isAliceSigning && (
  <>
    {/* Alice keys panel stays near Alice until mixing hides it */}
    {!hideAlicePanel && (
  <div
    className="oss-keysPanel"
    style={{
      position: "absolute",
      left: keysPanelPos.left,
      top: keysPanelPos.top,
      zIndex: 62,
      pointerEvents: "none",
      transition: `opacity ${STEP3_FADE_MS}ms ease`,
opacity: step3Phase === 6 ? 0 : 1,

    }}
  >


        <div className="oss-keysRow">
          <div className="oss-keysLabel">vk_A</div>
          <div className="oss-keysVal">{vkA ?? visualVkA}</div>
        </div>

        <div className="oss-keysRow">
          <div className="oss-keysLabel">sk_A</div>
          <div className={`oss-keysVal ${skPulse ? "oss-popPulse" : ""}`}>{skA ?? visualSkA}</div>
        </div>

        {/* y should exist by Step 3; show it and pop it */}
        <div className="oss-keysRow">
          <div className="oss-keysLabel">y</div>
          <div className={`oss-keysVal ${yPulse ? "oss-popPulse" : ""}`}>{aliceY ?? visualY ?? "0x…"}</div>
        
        </div>
      </div>
    )}

    {/* m_auth packet appears next to Alice from phase 2 onward, pops at phase 4, hides during mixing */}
    {!hideMauthHold && step3Phase >= 2 && (
      <div
      className={`oss-sigPacket is-on ${mauthPulse ? "oss-popPulse" : ""}`}
            style={{
            position: "absolute",
            left: (() => {
            const st = stageRef.current?.getBoundingClientRect();
            const a = aliceRef.current?.getBoundingClientRect();
            if (!st || !a) return 0;
            const aCx = a.left + a.width / 2 - st.left;
            return aCx + MAUTH_START_DX;
          })(),
          top: (() => {
            const st = stageRef.current?.getBoundingClientRect();
            const a = aliceRef.current?.getBoundingClientRect();
            if (!st || !a) return 0;
            const aCy = a.top + a.height / 2 - st.top;
            return aCy + MAUTH_START_DY;
          })(),
          ["--tx" as any]: `0px`,
          ["--ty" as any]: `0px`,
          zIndex: 61,
          pointerEvents: "none",
          transition: `opacity ${STEP3_FADE_MS}ms ease`,
          opacity: step3Phase === 6 ? 0 : 1,
          animation: step3Phase === 6 ? "none" : undefined,

        }}
      >
        <div className="packet-shell packet-shell--sig">
          <div className="packet-sig">{visualMauth ?? "m_auth=(attr.1, attr.2, …)"}</div>
        </div>
      </div>
    )}

    {/* Step 3 title */}
    {step3Phase >= 1 && (
      <div
        className={`oss-trustText ${step3Phase >= 1 ? "is-on" : ""}`}
        style={{
          position: "absolute",
          left: baseTrustPos.left + STEP1_TEXT_DX,
          top: baseTrustPos.top + TRUST_TEXT_DY + STEP1_TEXT_DY,
          transform: "translate(-50%, 0)",
          zIndex: 60,
          pointerEvents: "none",
          textAlign: "center",
          maxWidth: 900,
        }}
      >
        Step 3: Signing by Alice
      </div>
    )}
    {/* Phase 2: BIG paragraph (the one you lost) */}
{step3Phase === 2 && (
  <div
    className="oss-authLine is-on"
    style={{
      position: "absolute",
      left: baseTrustPos.left + TRUST_TEXT_DX + STEP3_BIG_DX,
top: baseTrustPos.top + TRUST_TEXT_DY - 10 + STEP3_BIG_DY,
      transform: "translate(-50%, 0)",
      zIndex: 60,
      pointerEvents: "none",
      textAlign: "center",
      width: "max-content",
      maxWidth: 900,
      whiteSpace: "normal",
    }}
  >
    First, Alice constructs a message <span className="intro-em">m_auth = (attr.1, attr.2, ...)</span> which 
    contains attributes that Alice deems suitable. For instance, if Alice is authorizing
    Bob to make a one time purchase, the attributes can be maximum amount, currency, expiration time etc.
  </div>
)}


    {/* ONE narration line that grows across phases */}
    {(step3Phase === 3 || step3Phase === 4 || step3Phase === 5) && (
      <div
        className="oss-authLine is-on"
        style={{
          position: "absolute",
          left: baseTrustPos.left + TRUST_TEXT_DX + STEP3_BIND_DX,
top: baseTrustPos.top + TRUST_TEXT_DY -10 + STEP3_BIND_DY,

          transform: "translate(-50%, 0)",
          zIndex: 60,
          pointerEvents: "none",
          textAlign: "center",
          width: "max-content",
          maxWidth: 900,
          whiteSpace: "normal",
        }}
      >
        Next, Alice binds this permission to Bob&apos;s identity using Bob&apos;s public key <span className="intro-em">y</span>,
{step3Phase >= 4 && (
  <>
    {" "}Alice&apos;s secret key <span className="intro-em">sk_A</span>
  </>
)}
{step3Phase >= 5 && (
  <>
    {" "}and the <span className="intro-em">m_auth</span>.
  </>
)}

 
       {/* Mixing visual (phase 6): three “ghost” packets converge into σ_A hold position */}


        
      </div>
    )}
{/* Spooky mix swirl at σ_A spawn location (phase 6 only) */}

{/* Phase 6: fresh text describing signature construction */}
{step3Phase === 6 && (
  <div
    className="oss-authLine is-on"
    style={{
      position: "absolute",
      left: baseTrustPos.left + TRUST_TEXT_DX + STEP3_SIGMAKE_DX,
  top: baseTrustPos.top + TRUST_TEXT_DY -10 + STEP3_SIGMAKE_DY,

      transform: "translate(-50%, 0)",
      zIndex: 60,
      pointerEvents: "none",
      textAlign: "center",
      width: "max-content",
      maxWidth: 900,
      whiteSpace: "normal",
    }}
  >
    And Alice constructs a signature by using <span className="intro-em">y</span>, <span className="intro-em">sk_A</span>, and <span className="intro-em">m_auth</span>.
  </div>
)}
    {/* σ_A HOLD packet (knobbed position) */}
    {showSigma && (step3Phase === 6 || step3Phase === 7) && (
  <div
    ref={sigmaHoldRef}
    className="oss-sigPacket is-on"
    style={{
      position: "absolute",
      left: sigmaHoldPos.left,
      top: sigmaHoldPos.top,
      zIndex: 61,
      pointerEvents: "none",
      transition: "opacity 520ms ease",
      opacity: step3Phase >= 6 ? 1 : 0,
    }}
  >
    <div className="packet-shell packet-shell--sig">
      <div className="packet-sig">{visualSigmaA ?? "σ_A=(y, sk_A, m_auth)"}</div>
    </div>
  </div>
)}

{(step3Phase === 8 || step3Phase === 9) && (
  <div
    className="oss-authLine is-on"
    style={{
      position: "absolute",
      left: baseTrustPos.left + TRUST_TEXT_DX + AUTH_LINE_DX,
      top: baseTrustPos.top + TRUST_TEXT_DY + 4 + AUTH_LINE_DY,
      transform: "translate(-50%, 0)",
      zIndex: 60,
      pointerEvents: "none",
      textAlign: "center",
      width: "max-content",
      maxWidth: 900,
      whiteSpace: "normal",
    }}
  >
    Alice now sends <span className="intro-em">σ_A</span> to Charlie for verification.
  </div>
)}

    {/* σ_A FLIES to Charlie */}
    {step3Phase === 8 && (
      <div
        key={`sigmaFly-${step3Phase}`}
        className="oss-sigPacket is-on"
        onAnimationEnd={() => {
          if (!isAliceSigning || step3Phase !== 8) return;
          // ✅ freeze landing coords immediately (no dependency on Step-3-only path later)
  setSigmaCharliePos({
    left: sigmaAToVerifierPath.ex,
    top: sigmaAToVerifierPath.ey,
  });

  setSigmaArrivedAtCharlie(true);
  setStep3Phase(9);
}}
        style={{
          position: "absolute",
          left: sigmaAToVerifierPath.sx,
          top: sigmaAToVerifierPath.sy,
          ["--tx" as any]: `${sigmaAToVerifierPath.ex - sigmaAToVerifierPath.sx}px`,
          ["--ty" as any]: `${sigmaAToVerifierPath.ey - sigmaAToVerifierPath.sy}px`,
          zIndex: 61,
          pointerEvents: "none",
        }}
      >
        <div className="packet-shell packet-shell--sig">
          <div className="packet-sig">{visualSigmaA ?? "σ_A"}</div>
        </div>
      </div>
    )}
    

  </>
)}
        
        {/* ===== STEP 4 visuals (Bob constructs m_pay) ===== */}
{isStep4 && (
  <>
    {step4Phase >= 1 && (
  <div
    className="oss-trustText is-on"
    style={{
      position: "absolute",
      left: baseTrustPos.left + STEP1_TEXT_DX,
      top: baseTrustPos.top + TRUST_TEXT_DY + STEP1_TEXT_DY,
      transform: "translate(-50%, 0)",
      zIndex: 60,
      pointerEvents: "none",
      textAlign: "center",
      maxWidth: 900,
    }}
  >
    Step 4: Message construction by Bob
  </div>
)}


{step4Phase === 2 && (
  <div
    className="oss-authLine is-on"
    style={{
      position: "absolute",
      left: baseTrustPos.left + TRUST_TEXT_DX + AUTH_LINE_DX,
      top: baseTrustPos.top + TRUST_TEXT_DY  + AUTH_LINE_DY,
      transform: "translate(-50%, 0)",
      zIndex: 60,
      pointerEvents: "none",
      textAlign: "center",
      width: "max-content",
      maxWidth: 900,
      whiteSpace: "normal",
    }}
  >
    Bob constructs a payment message <span className="intro-em">m_pay</span> = (attr.1, attr.2, …, merchantID, …)
  </div>
)}

   {/* m_pay holds near Bob ONLY before sending */}
{step4Phase === 2 && (
  <div
    className="oss-sigPacket is-on"
    style={{
      position: "absolute",
      left: mpayHoldPos.left,
      top: mpayHoldPos.top,
      transform: "translate(-50%, -50%)",
      zIndex: 61,
      pointerEvents: "none",
      ["--tx" as any]: `0px`,
      ["--ty" as any]: `0px`,
    }}
  >
    <div className="packet-shell packet-shell--sig">
      <div className="packet-sig">{visualMpay ?? "m_pay=(…)"}</div>
    </div>
  </div>
)}

    



    {/* ===== INSERT START: send subline + flight + landed hold ===== */}

    {/* Subline + flight happen together */}
    {step4Phase >= 3 && (
  <div
    className="oss-authLine is-on"
    style={{
      position: "absolute",
      left: baseTrustPos.left + TRUST_TEXT_DX + RESPONSE_LINE_DX,
      top: baseTrustPos.top + TRUST_TEXT_DY + RESPONSE_LINE_DY,
      transform: "translate(-50%, 0)",
      zIndex: 60,
      pointerEvents: "none",
      textAlign: "center",
      width: "max-content",
      maxWidth: 900,
      whiteSpace: "normal",
    }}
  >
    Bob then sends <span className="intro-em">m_pay</span> to the verifier for a challenge.
  </div>
)}


    {/* m_pay flies Bob -> Charlie */}
    {step4Phase === 3 && (
      <div
        key={`mpayFly-${step4Phase}`}
        className="oss-sigPacket is-on"
        onAnimationEnd={() => {
          if (!isStep4 || step4Phase !== 3) return;
          setMpayArrivedAtCharlie(true);
          setStep4Phase(4);
        }}
        style={{
          position: "absolute",
          left: mpayPath.sx,
          top: mpayPath.sy,
          ["--tx" as any]: `${mpayPath.ex - mpayPath.sx}px`,
          ["--ty" as any]: `${mpayPath.ey - mpayPath.sy}px`,
          zIndex: 61,
          pointerEvents: "none",
        }}
      >
        <div className="packet-shell packet-shell--sig">
          <div className="packet-sig">{visualMpay ?? "m_pay=(…)"}</div>
        </div>
      </div>
    )}

    {/* m_pay landed + holds near verifier */}
    {step4Phase >= 4 && mpayArrivedAtCharlie && (
      <div
        className="oss-sigPacket is-on"
        style={{
          position: "absolute",
          left: mpayCharliePos.left,
          top: mpayCharliePos.top,
          transform: "translate(-50%, -50%)",
          zIndex: 61,
          pointerEvents: "none",
          ["--tx" as any]: `0px`,
          ["--ty" as any]: `0px`,
        }}
      >
        <div className="packet-shell packet-shell--sig">
          <div className="packet-sig">{visualMpay ?? "m_pay=(…)"}</div>
        </div>
      </div>
    )}

    {/* ===== INSERT END ===== */}
  </>
)}

        
                {/* ===== STEP 5 visuals (Verifier assigns v via coin toss) ===== */}
                {isStep5 && (
          <>
            {step5Phase >= 1 && (
              <div
                className="oss-trustText is-on"
                style={{
                  position: "absolute",
                  left: baseTrustPos.left + STEP1_TEXT_DX,
                  top: baseTrustPos.top + TRUST_TEXT_DY + STEP1_TEXT_DY,
                  transform: "translate(-50%, 0)",
                  zIndex: 60,
                  pointerEvents: "none",
                  textAlign: "center",
                  maxWidth: 900,
                }}
              >
                Step 5: Challenge selection by the Verifier
              </div>
            )}

            {/* Instruction line (stays during toss + outcome) */}
            {(step5Phase === 1 || step5Phase === 2 || step5Phase === 3) && (
              <div
                className="oss-authLine is-on"
                style={{
                  position: "absolute",
                  left: baseTrustPos.left + TRUST_TEXT_DX + AUTH_LINE_DX,
                  top: baseTrustPos.top + TRUST_TEXT_DY  + AUTH_LINE_DY,
                  transform: "translate(-50%, 0)",
                  zIndex: 60,
                  pointerEvents: "none",
                  textAlign: "center",
                  width: "max-content",
                  maxWidth: 900,
                  whiteSpace: "normal",
                }}
              >
The verifier then randomly chooses a bit <span className="intro-em">v ∈ {"{0,1}"}</span> to assign to <span className="intro-em">m_pay</span>.
</div>
            )}

            {/* Coin spin (process only) */}
{step5Phase === 2 && (
  <div
    className={`oss-coinWrap is-tossing ${coinPulse ? "oss-popPulse" : ""}`}
    onAnimationEnd={(e) => {
      if (!isStep5) return;
      if (step5Phase !== 2) return;
      if ((e.target as HTMLElement).classList.contains("oss-coinImg")) {
        setStep5Phase(3); // resolve -> coin disappears, bit persists
        setCoinPulse(true);
        window.setTimeout(() => setCoinPulse(false), 260);
      }
    }}
    style={{
      position: "absolute",
      left: verifierCoinPos.left,
      top: verifierCoinPos.top,
      transform: "translate(-50%, -50%)",
      zIndex: 80,
      pointerEvents: "none",
    }}
  >
    <img
      src="/coin2.png"
      alt="Verifier choosing a bit"
      className="oss-coinImg"
    />
    <div className="oss-dilithiumText">
  Randomly choosing a bit…
</div>

  </div>
)}

{/* Result bit (holds after coin disappears) */}
{step5Phase >= 3 && vBitLocal !== null && (
  <div
    className="oss-authLine is-on"
    style={{
      position: "absolute",
      left: verifierBitPos.left,
      top: verifierBitPos.top,
      transform: "translate(-50%, -50%)",
      zIndex: 61,
      pointerEvents: "none",
      whiteSpace: "nowrap",
    }}
  >
    v = <span className="intro-em">{vBitLocal}</span>
  </div>
)}



            {/* Keep m_pay visible near Bob during Step 5 too */}
            {/* Keep m_pay parked near verifier during Step 5 */}
{mpayArrivedAtCharlie && (
  <div
    className="oss-sigPacket is-on"
    style={{
      position: "absolute",
      left: mpayCharliePos.left,
      top: mpayCharliePos.top,
      transform: "translate(-50%, -50%)",
      zIndex: 61,
      pointerEvents: "none",
      ["--tx" as any]: `0px`,
      ["--ty" as any]: `0px`,
    }}
  >
    <div className="packet-shell packet-shell--sig">
      <div className="packet-sig">
        {visualMpay ?? "m_pay=(…)"}
        {step5Phase >= 3 && vBitLocal !== null && (
          <>
            {" "}· v=<span className="intro-em">{vBitLocal}</span>
          </>
        )}
      </div>
    </div>
  </div>
)}

          </>
        )}




</div>

{/* σ_A stays parked near Charlie ONLY from Step 4 onward */}
{sigmaArrivedAtCharlie && !(isAliceSigning && step3Phase === 8) && (
  <div
    className="oss-sigPacket is-on"
    style={{
      position: "absolute",
      left: sigmaCharliePos.left,
      top: sigmaCharliePos.top,
      transform: "translate(-50%, -50%)",
      zIndex: 61,
      pointerEvents: "none",
      ["--tx" as any]: `0px`,
      ["--ty" as any]: `0px`,
    }}
  >
    <div className="packet-shell packet-shell--sig">
      <div className="packet-sig">{visualSigmaA ?? "σ_A"}</div>
    </div>
  </div>
)}






      {/* Avatars */}
      <button
        ref={aliceRef}
        className={`oss-avatarBtn oss-avatar-alice ${isIntro && introPhase === 1 ? "is-pop" : ""}`}
        type="button"
        aria-label="Alice"
      >
        <img className="oss-avatarOnly" src="/avatar-alice.png" alt="Alice" />
        <div className="oss-avatarLabel">
          <div className="t1">Sydney</div>
          <div className="t2">Alice</div>
        </div>
      </button>

      <button
        ref={bobRef}
        className={`oss-avatarBtn oss-avatar-bob ${isIntro && introPhase === 2 ? "is-pop" : ""}`}
        type="button"
        aria-label="Bob"
      >
        <img className="oss-avatarOnly" src="/avatar-bob.png" alt="Bob" />
        <div className="oss-avatarLabel">
          <div className="t1">Strasbourg</div>
          <div className="t2">Bob</div>
        </div>
      </button>

      <button
        ref={charlieRef}
        className={`oss-avatarBtn oss-avatar-charlie ${isIntro && introPhase === 4 ? "is-pop" : ""}`}
        type="button"
        aria-label="Charlie"
      >
        <img className="oss-avatarOnly" src="/avatar-charlie.png" alt="Charlie" />
        <div className="oss-avatarLabel">
          <div className="t1">Vancouver</div>
          <div className="t2">Charlie</div>
        </div>
      </button>

      <button
        ref={merchantRef}
        className={`oss-avatarBtn oss-avatar-merchant ${isIntro && introPhase === 3 ? "is-pop" : ""}`}
        type="button"
        aria-label="Merchant"
      >
        <img className="oss-avatarOnly" src="/avatar-merchant.png" alt="Merchant" />
        <div className="oss-avatarLabel">
          <div className="t1">Merchant</div>
          <div className="t2">Institution</div>
        </div>
      </button>

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
          className={`stepper-btn stepper-primary ${isNextDisabled ? "is-disabled" : ""}`}
          onClick={() => {
            // ===== INTRO =====
            if (isIntro && !introStarted) {
              setIntroStarted(true);
              return;
            }
            if (isIntro && introPhase < 4) return;

            // ===== STEP 0 =====
            if (isPreAuth) {
              if (step0Phase === 1) {
                setStep0Phase(2);
                return;
              }
              if (step0Phase === 2 || step0Phase === 3) return;

              if (step0Phase === 4) {
                setStep0Phase(5);
                return;
              }
              if (step0Phase === 5 || step0Phase === 6) return;

              if (step0Phase === 7 || step0Phase === 8 || step0Phase === 9) return;

              if (step0Phase === 10) {
                onFlowNext();
                return;
              }
              return;
            }

            // ===== STEP 1 =====
            if (isKeygen) {
              if (step1Phase === 1) {
                setStep1Phase(2);
                return;
              }
              if (step1Phase === 2) return;

              if (step1Phase === 4) {
                onFlowNext();
                return;
              }
              return;
            }

            // ===== STEP 2 =====
            if (isBobKeygen) {
              if (step2Phase === 1) {
                setStep2Phase(2);
                return;
              }
              if (step2Phase === 2 || step2Phase === 3) return;

              if (step2Phase === 4) {
                setStep2Phase(5);
                return;
              }

              if (step2Phase === 6) {
                onFlowNext();
                return;
              }
              return;
            }

            
            
            if (isAliceSigning) {
              if (step3Phase === 1) { setStep3Phase(2); return; }
              if (step3Phase === 2) { setStep3Phase(3); return; }
              if (step3Phase === 3) { setStep3Phase(4); return; }
              if (step3Phase === 4) { setStep3Phase(5); return; }
              if (step3Phase === 5) { setStep3Phase(6); return; }
              if (step3Phase === 6 && fadeSwapDone) {
                setStep3Phase(8);  // jump directly to send phase
                return;
              }              
              
              if (step3Phase === 8) return;
              if (step3Phase === 9) { onFlowNext(); return; }
              return;
            }
             // ===== STEP 4 =====
             if (isStep4) {
              if (step4Phase === 1) {
                setStep4Phase(2);
                setVisualMpay("m_pay=(attr.1, attr.2, …, merchantID, …)");
                return;
              }
              if (step4Phase === 2) {
                setStep4Phase(3); // launches flight + subline simultaneously
                return;
              }
              if (step4Phase === 3) return; // flying
              if (step4Phase === 4) {
                onFlowNext();
                return;
              }
              return;
            }
            
           
                        // ===== STEP 5 =====
if (isStep5) {
  if (step5Phase === 1) {
    // User triggers verifier decision
    const out: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
    setVBitLocal(out);
    setStep5Phase(2);

    // After a few seconds, resolve
    window.setTimeout(() => {
      setStep5Phase(3);
    }, 1600);
    return;
    
  }

  if (step5Phase === 2) return; // blocked while choosing

  if (step5Phase === 3) {
    setStep5Phase(4);
    return;
  }

  if (step5Phase === 4) {
    onFlowNext();
    return;
  }

  return;
}

            





            // ===== Future steps =====
            if (!canNext) return;
            onFlowNext();
          }}
          disabled={isNextDisabled}
        >
          {isIntro && !introStarted ? "Start →" : "Next →"}
        </button>
      </div>
    </div>
  );
}
