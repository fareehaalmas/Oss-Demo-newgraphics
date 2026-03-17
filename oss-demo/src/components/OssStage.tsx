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
  onFlowJump: (idx: number) => void;
  flowItems: Array<{ id: string; label: string }>;

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
  canNext,
  onFlowNext,
  onFlowBack,
  onFlowJump,
  flowItems,
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
  const isStep6 = stageId.startsWith("step6");
  const isStep7 = stageId.startsWith("step7");
  const isStep8 = stageId.startsWith("step8");


  // ===== Intro timeline (gated by Start) =====
  const [introStarted, setIntroStarted] = useState(false);
  const [introPhase, setIntroPhase] = useState(0);
  const [introStoryPhase, setIntroStoryPhase] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);

  useEffect(() => {
    if (!isIntro) return;
    setIntroStarted(false);
    setIntroPhase(0);
    setIntroStoryPhase(0);
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
  // 1 trust title
  // 2 auth line
  // 3 auth packet flies
  // 4 auth packet landed at Bob (Next enabled)
  // 5 nonce line
  // 6 nonce packet flies
  // 7 nonce packet landed at Alice (Sign enabled)
  // 8 signed response flies to Bob
  // 9 response packet landed at Bob (Next advances)
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
const [showSigma, setShowSigma] = useState(false);
const [showReadMore, setShowReadMore] = useState(false);
const [showReadMoreModal, setShowReadMoreModal] = useState(false);



const sigmaHoldRef = useRef<HTMLDivElement | null>(null);

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
const [chosenVBit, setChosenVBit] = useState<0 | 1 | null>(null);
const [pendingVBit, setPendingVBit] = useState<0 | 1 | null>(null);
const [coinPulse, setCoinPulse] = useState(false);

// ===== Step 6 =====
// 0 enter
// 1 title shown
// 2 Next -> subline appears, m_pay flies verifier -> Bob (auto)
// 3 packet has reached Bob (ready for next)
// 4 subline begins + m_pay pops (auto)
// 5 signing text continues + sk_B pops (auto)
// 6 mixing runs (auto)
// 7 σ_B appears and holds (Next enabled)
// 8 σ_B flies Bob -> verifier
// 9 σ_B landed near verifier (Next enabled)
const [step6Phase, setStep6Phase] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>(0);
const [visualSigmaB, setVisualSigmaB] = useState<string | null>(null);
const [sigmaBArrivedAtCharlie, setSigmaBArrivedAtCharlie] = useState(false);
const [step6SkBPulse, setStep6SkBPulse] = useState(false);
const [step6MpayPulse, setStep6MpayPulse] = useState(false);
const [step6ShowSigma, setStep6ShowSigma] = useState(false);
const [step6MpayBackPath, setStep6MpayBackPath] = useState<{ sx: number; sy: number; ex: number; ey: number }>({
  sx: 0, sy: 0, ex: 0, ey: 0,
});
const [step6SigmaBPath, setStep6SigmaBPath] = useState<{ sx: number; sy: number; ex: number; ey: number }>({
  sx: 0, sy: 0, ex: 0, ey: 0,
});
// ===== Step 7 =====
// 0 enter
// 1 title shown (both signatures persist from Step 6)
// 2 verification shown (good/bad outcome based on Step 6 action)
const [step7Phase, setStep7Phase] = useState<0 | 1 | 2>(0);
const [step7LaptopPos, setStep7LaptopPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
const STEP7_LAPTOP_X = 70; // + right, - left
const STEP7_LAPTOP_Y = -136; // + down, - up
const [step7VerifyDone, setStep7VerifyDone] = useState(false);
const [step7EvilAttempt, setStep7EvilAttempt] = useState(false);
const [step7ReplayFailed, setStep7ReplayFailed] = useState(false);
const [step6BadBobPath, setStep6BadBobPath] = useState(false);
const [step8CoinPath, setStep8CoinPath] = useState<{ sx: number; sy: number; ex: number; ey: number }>({
  sx: 0, sy: 0, ex: 0, ey: 0,
});
const [step8CoinFlying, setStep8CoinFlying] = useState(false);
const [step8CoinArrived, setStep8CoinArrived] = useState(false);

const [sigmaArrivedAtCharlie, setSigmaArrivedAtCharlie] = useState(false);
const STEP6_MIX_MS = 1800;
const STEP6_FADE_MS = 700;
const STEP_POP_MS = 1400;

  const readMoreNotes: Record<string, { title: string; body: string[] }> = {
    intro: {
      title: "Why this setup first?",
      body: [
        "Before quantum-safe features appear, we need a secure trust baseline. Alice, Bob, Charlie, and the merchant operate as distributed actors across independent domains.",
        "The motivation is to remove heavy global state assumptions while preserving the same delegation functionality users expect from modern signature workflows.",
        "In short: the protocol aims to keep communication lightweight and explicit while still giving the verifier enough structure for later checks."
      ],
    },
    step0_preprocessing: {
      title: "Step 0: Trust establishment",
      body: [
        "Alice opens the session by asking Bob to authenticate the request. This first message is non-confidential metadata and can be carried on an authenticated classical channel.",
        "Bob returns a fresh nonce so replay and reorder attacks cannot be accepted trivially across the later signature exchange.",
        "Alice then signs the challenge tuple (op, nonce, msg) with her classical key, proving she initiated the delegation request."
      ],
    },
    step1_keygen: {
      title: "Step 1: Alice’s classical PQC key setup",
      body: [
        "Alice runs PQC.gen (Dilithium in this demo) and publishes only the verification key while storing the secret key internally.",
        "The design relies on post-quantum signatures for authenticity assumptions against both classical and quantum classical-capable adversaries.",
        "Using a one-time deterministic public-parameter style derivation here helps keep downstream proofs concise."
      ],
    },
    step2_bob_keygen: {
      title: "Step 2: Bob’s quantum resource and public value",
      body: [
        "Bob generates a short-lived signing state in the quantum phase, represented as a notation like |sk_B>.",
        "The companion classical value y is sent to Alice so the later delegated token can be bound to Bob without repeated expensive interactive setup.",
        "This asymmetric cost split is what later lets Bob act as signer while Alice stays mostly lightweight."
      ],
    },
    step3_alice_signing: {
      title: "Step 3: Alice creates m_auth",
      body: [
        "Alice builds m_auth as a restricted attribute envelope: a tuple of claims for a possible transaction.",
        "She then merges Bob’s public value y with her signing key sk_A into a one-way signature object sigma_A.",
        "The packet keeps a compact algebraic relationship so verifier-side checks can later be computed with only classical processing."
      ],
    },
    step4_bob_mpay: {
      title: "Step 4: Bob constructs payment token",
      body: [
        "Bob now prepares m_pay by adding his own merchant-bound attributes and authorization context.",
        "No extra zero-knowledge transcript is introduced yet; this keeps the step linear and practical for a single delegation event.",
        "The challenge bit is not yet fixed at this stage, so the object is still a one-sided binding token."
      ],
    },
    step5_verifier_bit: {
      title: "Step 5: Verifier challenge bit",
      body: [
        "The verifier selects a random bit v in {0,1} using a classical toss primitive modelled as a coin flip.",
        "That bit is attached to the payment object to make replay and selective forgeries expensive and non-transferable.",
        "This is the protocol’s Fiat-Shamir-like challenge selection point, kept classical in flow and explicit in this demo."
      ],
    },
    step6_bob_sign_once: {
      title: "Step 6: Bob computes sigma_B once",
      body: [
        "After receiving m_pay with the challenge bit, Bob combines it with his signing state and emits sigma_B.",
        "The one-shot property is enforced: Bob signs exactly once for this challenge binding.",
        "The result is returned to Charlie for deterministic verification against Alice’s earlier sigma_A and the assigned challenge."
      ],
    },
    step7_verify: {
      title: "Step 7: Verifier acceptance test",
      body: [
        "Charlie validates both signatures against public keys and checks consistency between m_auth, m_pay, sigma_A, and sigma_B.",
        "If any component is malformed or out of range, verification fails and no execution is approved.",
        "This step is where security reductions are usually stated and failure rates are tied to signature soundness assumptions."
      ],
    },
    step8_execute: {
      title: "Step 8: Final execution",
      body: [
        "With successful verification, the merchant-side state transition is finalized and the delegated spend is considered valid.",
        "From a systems perspective, this closes the delegation lifecycle without requiring mining-like global recomputation.",
        "The resulting design keeps transaction logic local while still allowing public auditability through explicit verifier-facing artifacts."
      ],
    },
  };

  const currentReadMore = readMoreNotes[stageId];
  const stageRankMap: Record<string, number> = {
    intro: 0,
    step0_preprocessing: 1,
    step1_keygen: 2,
    step2_bob_keygen: 3,
    step3_alice_signing: 4,
    step4_bob_mpay: 5,
    step5_verifier_bit: 6,
    step6_bob_sign_once: 7,
    step7_verify: 8,
    step8_execute: 9,
  };
  const currentStageRank = stageRankMap[stageId] ?? 0;

  useEffect(() => {
    if (currentStageRank >= 2 && (!visualVkA || !visualSkA)) {
      const kp = fauxPqcKeypair();
      setVisualVkA((prev) => prev ?? kp.vk);
      setVisualSkA((prev) => prev ?? kp.sk);
    }

    if (currentStageRank >= 3) {
      setVisualSkB((prev) => prev ?? `0x${randomHex(32)}`);
      setVisualY((prev) => prev ?? `0x${randomHex(24)}`);
    }

    if (currentStageRank >= 4) {
      setAliceY((prev) => prev ?? visualY ?? `0x${randomHex(24)}`);
      setVisualMauth((prev) => prev ?? "(attr.1, attr.2, …)");
      setVisualSigmaA((prev) => prev ?? `0x${randomHex(24)}`);
      setSigmaArrivedAtCharlie(true);
    }

    if (currentStageRank >= 5) {
      setVisualMpay((prev) => prev ?? "(attr.1, attr.2, …, merchantID, …)");
    }

    if (currentStageRank >= 6) {
      setChosenVBit((prev) => prev ?? 0);
      setMpayArrivedAtCharlie(true);
    }

    if (currentStageRank >= 7) {
      setVisualSigmaB((prev) => prev ?? `0x${randomHex(24)}`);
    }

    if (currentStageRank >= 8) {
      setSigmaBArrivedAtCharlie(true);
    }
  }, [currentStageRank, visualVkA, visualSkA, visualY]);



  // ===== refs =====
  const aliceRef = useRef<HTMLButtonElement | null>(null);
  const bobRef = useRef<HTMLButtonElement | null>(null);
  const charlieRef = useRef<HTMLButtonElement | null>(null);
  const merchantRef = useRef<HTMLButtonElement | null>(null);

  // Step 3: measure σ_A row (for sending path)
  

  //const sydneyCityRef = useRef<HTMLDivElement | null>(null);
  //const strasCityRef = useRef<HTMLDivElement | null>(null);

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

    return () => {
      window.clearTimeout(t1);
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
    setAliceY(null);

    const t1 = window.setTimeout(() => setStep2Phase(1), 250);
    return () => window.clearTimeout(t1);
  }, [isBobKeygen]);

  //step 3 init //
  useEffect(() => {
    if (!isAliceSigning) {
      setStep3Phase(0);
      setVisualMauth(null);

      
setShowSigma(false);
// keep σ_A string for Step 4/5 persistence
// setVisualSigmaA(null);


      setYPulse(false);
      setSkPulse(false);
      setMauthPulse(false);
      setHideAlicePanel(false);
      setHideMauthHold(false);
      return;
    }
  
    setStep3Phase(0);
    setSigmaArrivedAtCharlie(false);
    setVisualMauth("(attr.1, attr.2, …)");
    setVisualSigmaA(`0x${randomHex(24)}`);
    setHideAlicePanel(false);
    setHideMauthHold(false);
    setShowSigma(false);
  
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
        return;
      }
    
      setStep5Phase(1);
      setChosenVBit(null);
      setPendingVBit(null);
    
    }, [isStep5]);

    useEffect(() => {
      if (!isStep5) return;
      if (step5Phase !== 2) return;
      if (pendingVBit !== null) return;

      const out: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
      setPendingVBit(out);
    }, [isStep5, step5Phase, pendingVBit]);

    useEffect(() => {
      if (!isStep6) {
        setStep6Phase(0);
        return;
      }
      setStep6Phase(1);
      setVisualSigmaB(`0x${randomHex(24)}`);
      setSigmaBArrivedAtCharlie(false);
      setStep6SkBPulse(false);
      setStep6MpayPulse(false);
      setStep6ShowSigma(false);
      setStep6BadBobPath(false);
      return;
    }, [isStep6]);

    useEffect(() => {
      if (!isStep7) {
        setStep7Phase(0);
        setStep7VerifyDone(false);
        return;
      }
      setStep7Phase(1);
      setStep7VerifyDone(false);
      setStep7EvilAttempt(step6BadBobPath);
      setStep7ReplayFailed(false);
    }, [isStep7, step6BadBobPath]);

    useEffect(() => {
      if (!isStep7 || step7Phase !== 2) return;
      if (step7EvilAttempt) {
        setStep7ReplayFailed(false);
        const t = window.setTimeout(() => setStep7ReplayFailed(true), 2200);
        return () => window.clearTimeout(t);
      }
      setStep7VerifyDone(false);
      const t = window.setTimeout(() => setStep7VerifyDone(true), 2200);
      return () => window.clearTimeout(t);
    }, [isStep7, step7Phase, step7EvilAttempt]);

    useEffect(() => {
      if (!isStep6 || step6Phase !== 4) return;
      setStep6MpayPulse(true);
      const t = window.setTimeout(() => {
        setStep6MpayPulse(false);
        setStep6Phase(5);
      }, STEP_POP_MS);
      return () => window.clearTimeout(t);
    }, [isStep6, step6Phase, STEP_POP_MS]);

    useEffect(() => {
      if (!isStep6 || step6Phase !== 5) return;
      setStep6SkBPulse(true);
      const t = window.setTimeout(() => {
        setStep6SkBPulse(false);
        setStep6Phase(6);
      }, STEP_POP_MS);
      return () => window.clearTimeout(t);
    }, [isStep6, step6Phase, STEP_POP_MS]);

    useEffect(() => {
      if (!isStep6 || step6Phase !== 6) return;
      setStep6ShowSigma(false);
      const t = window.setTimeout(() => {
        requestAnimationFrame(() => setStep6ShowSigma(true));
        setStep6Phase(7);
      }, STEP6_MIX_MS + STEP6_FADE_MS);
      return () => window.clearTimeout(t);
    }, [isStep6, step6Phase, STEP6_MIX_MS, STEP6_FADE_MS]);
    
  

  useEffect(() => {
    if (!isAliceSigning) return;
  
    const pulse = (setter: (v: boolean) => void) => {
      setter(true);
      const t = window.setTimeout(() => setter(false), STEP_POP_MS);
      return () => window.clearTimeout(t);
    };
  
    if (step3Phase === 3)  pulse(setYPulse);
  if (step3Phase === 4)  pulse(setSkPulse);
  if (step3Phase === 5)  pulse(setMauthPulse);

  if (step3Phase === 6) {
    setShowSigma(false);

    const t = window.setTimeout(() => {
      setHideAlicePanel(true);
      setHideMauthHold(true);
      requestAnimationFrame(() => setShowSigma(true));
      setStep3Phase(7);
    }, STEP3_FADE_MS + STEP3_COMBINE_MS);

    return () => window.clearTimeout(t);
  }
  return;
}, [isAliceSigning, step3Phase, STEP_POP_MS]);

useEffect(() => {
  if (!isAliceSigning) return;
  if (step3Phase !== 3 && step3Phase !== 4 && step3Phase !== 5) return;
  const t = window.setTimeout(() => {
    setStep3Phase((p) => (p === 3 ? 4 : p === 4 ? 5 : p === 5 ? 6 : p));
  }, STEP_POP_MS);
  return () => window.clearTimeout(t);
}, [isAliceSigning, step3Phase, STEP_POP_MS]);
  
  

  // ===== positions =====
    // ===== Map pin anchors (percent-based) =====
  // These are % coordinates of the STAGE box, tuned to match the pins on the map image.
  // Edit ONLY these 8 numbers to line up avatars with pins.
  const PIN_ALICE = { x: 88.5, y: 77.5 };     // Sydney (bottom-right)
  const PIN_BOB = { x: 60.0, y: 35.5 };       // Strasbourg (Europe)
  const PIN_CHARLIE = { x: 22.5, y: 48.5 };   // Vancouver (left)
  const PIN_MERCHANT = { x: 41.5, y: 95.0 };  // Merchant (South America)

  // Small pixel nudges per-avatar (fine alignment after % is correct)
  const NUDGE_ALICE = { dx: -10, dy: -120 };
  const NUDGE_BOB = { dx: -10, dy: -120 };
  const NUDGE_CHARLIE = { dx: -10, dy: -120 };
  const NUDGE_MERCHANT = { dx: -10, dy: -140 };

  function pinToStyle(
    pin: { x: number; y: number },
    nudge: { dx: number; dy: number }
  ): React.CSSProperties {
    return {
      left: `calc(${pin.x}% + ${nudge.dx}px)`,
      top: `calc(${pin.y}% + ${nudge.dy}px)`,
      transform: "translate(-50%, -50%)",
    };
  }

  // Step2 panel anchored near Bob (where auth request lands near Bob)
  const [step2PanelPos, setStep2PanelPos] = useState<{ left: number; top: number }>({ left: 18, top: 18 });
  const hasStep2PanelPos = step2PanelPos.left > 40 && step2PanelPos.top > 40;

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
  const STEP2_BOB_DX = 84;
  const STEP2_BOB_DY = 0;
  // y ejects from inside Bob's panel (the y row), then flies to Alice.
  const Y_POP_START_DX = 34;
  const Y_POP_START_DY = 6;
  // y lands inside Alice's packet panel where the y value row appears.
  const Y_END_PANEL_DX = 22; // relative to Alice panel center
  const Y_END_PANEL_DY = 6;  // relative to Alice panel center
  // Step 3: m_auth packet tuning (near Alice)
  // Negative DX moves left of Alice.
  const MAUTH_START_DX = -126;
  const MAUTH_START_DY = 70;

// Optional: final landing offset near Charlie (relative to Charlie center)
const SIGMA_END_DX = -100;
const SIGMA_END_DY = 10;

// σ_A "landed at Charlie" position (independent, so it can persist across scenes)
const [sigmaCharliePos, setSigmaCharliePos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

// Step 3 text knobs (independent)

const STEP3_FADE_MS = 700;
const STEP3_COMBINE_MS = 1800;


const sigmaHoldPos = (() => {
  const st = stageRef.current?.getBoundingClientRect();
  const a = aliceRef.current?.getBoundingClientRect();
  if (!st || !a) return { left: 0, top: 0 };

  const aCx = a.left + a.width / 2 - st.left;
  const aCy = a.top + a.height / 2 - st.top;

  return {
    // σ_A appears exactly where m_auth was held.
    left: aCx + MAUTH_START_DX,
    top: aCy + MAUTH_START_DY,
  };
})();

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
const [, setVerifierBitPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

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
const MPAY_END_DY = SIGMA_END_DY;

const [mpayPath, setMpayPath] = useState<{ sx: number; sy: number; ex: number; ey: number }>({
  sx: 0,
  sy: 0,
  ex: 0,
  ey: 0,
});

const [mpayArrivedAtCharlie, setMpayArrivedAtCharlie] = useState(false);
const [mpayCharliePos, setMpayCharliePos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
useLayoutEffect(() => {
  if (!isStep4 && !isStep5 && !isStep6 && !isStep7 && !isStep8) return;

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
}, [isStep4, isStep5, isStep6, isStep7, isStep8, stageSize.w, stageSize.h, MPAY_START_DX, MPAY_START_DY, MPAY_END_DX, MPAY_END_DY]);

    useLayoutEffect(() => {
      if (!isStep4 && !isStep5 && !isStep6 && !isStep7 && !isStep8) return;
  
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
    }, [isStep4, isStep5, isStep6, isStep7, isStep8, stageSize.w, stageSize.h, MPAY_HOLD_DX, MPAY_HOLD_DY]);

useLayoutEffect(() => {
  if (!isStep6) return;

  setStep6MpayBackPath({
    sx: mpayCharliePos.left,
    sy: mpayCharliePos.top,
    ex: mpayHoldPos.left,
    ey: mpayHoldPos.top,
  });

  setStep6SigmaBPath({
    sx: mpayHoldPos.left,
    sy: mpayHoldPos.top,
    ex: mpayCharliePos.left,
    ey: mpayCharliePos.top,
  });
}, [isStep6, mpayCharliePos.left, mpayCharliePos.top, mpayHoldPos.left, mpayHoldPos.top]);

useLayoutEffect(() => {
  if (!isStep7) return;
  if (mpayCharliePos.left <= 0 || mpayCharliePos.top <= 0) return;

  setStep7LaptopPos({
    left: mpayCharliePos.left + STEP7_LAPTOP_X,
    top: mpayCharliePos.top + STEP7_LAPTOP_Y,
  });
}, [isStep7, mpayCharliePos.left, mpayCharliePos.top, STEP7_LAPTOP_X, STEP7_LAPTOP_Y]);

useLayoutEffect(() => {
  if (!isStep8) return;
  if (mpayCharliePos.left <= 0 || mpayCharliePos.top <= 0) return;
  const stageEl = stageRef.current;
  const mEl = merchantRef.current;
  if (!stageEl || !mEl) return;

  const s = stageEl.getBoundingClientRect();
  const mRect = mEl.getBoundingClientRect();
  const mCx = mRect.left + mRect.width / 2 - s.left;
  const mCy = mRect.top + mRect.height / 2 - s.top;

  setStep8CoinPath({
    sx: mpayCharliePos.left + 8,
    sy: mpayCharliePos.top - 4,
    ex: mCx + 70,
    ey: mCy + 18,
  });
}, [isStep8, mpayCharliePos.left, mpayCharliePos.top, stageSize.w, stageSize.h]);

useEffect(() => {
  if (!isStep8) {
    setStep8CoinFlying(false);
    setStep8CoinArrived(false);
    return;
  }
  if (step7ReplayFailed) {
    setStep8CoinFlying(false);
    setStep8CoinArrived(false);
    return;
  }
  setStep8CoinArrived(false);
  setStep8CoinFlying(false);
  const t = window.setTimeout(() => setStep8CoinFlying(true), 300);
  return () => window.clearTimeout(t);
}, [isStep8, step7ReplayFailed]);
  

  // midpoint between Alice and Bob (for step0 title/handshake + center text)
  const [, setBaseTrustPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const [trustBeam, setTrustBeam] = useState<{
    ax: number; ay: number;
    bx: number; by: number;
    mx: number; my: number;
  }>({ ax: 0, ay: 0, bx: 0, by: 0, mx: 0, my: 0 });

  useLayoutEffect(() => {
    const stageEl = stageRef.current;
    const aEl = aliceRef.current;
    const bEl = bobRef.current;
    if (!stageEl || !aEl || !bEl) return;
  
    const s = stageEl.getBoundingClientRect();
  
    const aImg = aEl.querySelector("img");
    const bImg = bEl.querySelector("img");
    const aRect = (aImg ?? aEl).getBoundingClientRect();
    const bRect = (bImg ?? bEl).getBoundingClientRect();
  
    const ax = aRect.left + aRect.width / 2 - s.left;
    const ay = aRect.top + aRect.height / 2 - s.top;
    const bx = bRect.left + bRect.width / 2 - s.left;
    const by = bRect.top + bRect.height / 2 - s.top;
  
    // Place the authenticate icon in the upper-right so:
    // - horizontal line can read as Bob -> icon
    // - vertical line can read as Alice -> up to icon
    const TRUST_ICON_FROM_ALICE_DX = -20;
    const TRUST_ICON_FROM_BOB_DY = 0;

    const mx = ax + TRUST_ICON_FROM_ALICE_DX;
    const my = by + TRUST_ICON_FROM_BOB_DY;
  
    setBaseTrustPos({ left: mx, top: my });
    setTrustBeam({ ax, ay, bx, by, mx, my });
  }, [stageSize.w, stageSize.h]);


  

 

  // Packet flight tuning
  const PACKET_START_DX = -15;
  const PACKET_START_DY = -120;
  const PACKET_END_DX = 100;
  const PACKET_END_DY = 2;

  // Nonce starts where auth lands at Bob.
  // End is nudged from auth-start so the signing panel sits near Alice
  // without covering her avatar.
  
  const NONCE_START_DX = 100;
  const NONCE_START_DY = 2;
  const NONCE_END_DX = -15;
  const NONCE_END_DY = -120;

  const SIG_START_DX = -15;
  const SIG_START_DY = -120;
  const SIG_END_DX = 100;
  const SIG_END_DY = 2;

  

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

  
  

  // Step1 chip CTA + keys panel near Alice
  const [, setKeysPanelPos] = useState<{ left: number; top: number }>({ left: 18, top: 18 });
  const [step1PanelPos, setStep1PanelPos] = useState<{ left: number; top: number }>({ left: 18, top: 18 });
  const hasStep1PanelPos = step1PanelPos.left > 40 && step1PanelPos.top > 40;
  const STEP1_PANEL_W = 208;
  const STEP1_PANEL_H = 118;
  const STEP2_PANEL_W = 216;
  const STEP2_PANEL_H = 120;
  const resolvedStep1PanelPos = hasStep1PanelPos
    ? step1PanelPos
    : {
        left: clamp(stageSize.w * (PIN_ALICE.x / 100) + NUDGE_ALICE.dx + NONCE_END_DX, 12 + STEP1_PANEL_W * 0.5, stageSize.w - 12 - STEP1_PANEL_W * 0.5),
        top: clamp(stageSize.h * (PIN_ALICE.y / 100) + NUDGE_ALICE.dy + NONCE_END_DY, 12 + STEP1_PANEL_H * 0.5, stageSize.h - 86 - STEP1_PANEL_H * 0.5),
      };
  const resolvedStep2PanelPos = hasStep2PanelPos
    ? step2PanelPos
    : {
        left: clamp(stageSize.w * (PIN_BOB.x / 100) + NUDGE_BOB.dx + PACKET_END_DX + STEP2_BOB_DX, 12 + STEP2_PANEL_W * 0.5, stageSize.w - 12 - STEP2_PANEL_W * 0.5),
        top: clamp(stageSize.h * (PIN_BOB.y / 100) + NUDGE_BOB.dy + PACKET_END_DY + STEP2_BOB_DY, 12 + STEP2_PANEL_H * 0.5, stageSize.h - 86 - STEP2_PANEL_H * 0.5),
      };

  // Keys panel slightly LEFT/ABOVE Alice
  const KEYS_DX = -18;
  const KEYS_DY = -74;

  // Step2 panel position near Bob, matching auth-request end anchor
  useLayoutEffect(() => {
    if (!isBobKeygen) return;

    const stageEl = stageRef.current;
    const bobEl = bobRef.current;
    if (!stageEl || !bobEl) return;

    const s = stageEl.getBoundingClientRect();
    const bImg = bobEl.querySelector("img");
    const bRect = (bImg ?? bobEl).getBoundingClientRect();

    const bCx = bRect.left + bRect.width / 2 - s.left;
    const bCy = bRect.top + bRect.height / 2 - s.top;

    const PANEL_W = 216;
    const PANEL_H = 120;

    setStep2PanelPos({
      left: clamp(bCx + PACKET_END_DX + STEP2_BOB_DX, 12 + PANEL_W * 0.5, stageSize.w - 12 - PANEL_W * 0.5),
      top: clamp(bCy + PACKET_END_DY + STEP2_BOB_DY, 12 + PANEL_H * 0.5, stageSize.h - 86 - PANEL_H * 0.5),
    });
  }, [isBobKeygen, stageSize.w, stageSize.h, PACKET_END_DX, PACKET_END_DY, STEP2_BOB_DX, STEP2_BOB_DY]);

  // authPath
  useLayoutEffect(() => {
    if (!isPreAuth) return;
  
    const stageEl = stageRef.current;
    const aEl = aliceRef.current;
    const bEl = bobRef.current;
    if (!stageEl || !aEl || !bEl) return;
  
    const s = stageEl.getBoundingClientRect();
  
    const aImg = aEl.querySelector("img");
    const bImg = bEl.querySelector("img");
    const aRect = (aImg ?? aEl).getBoundingClientRect();
    const bRect = (bImg ?? bEl).getBoundingClientRect();
  
    const aCx = aRect.left + aRect.width / 2 - s.left;
    const aCy = aRect.top + aRect.height / 2 - s.top;
    const bCx = bRect.left + bRect.width / 2 - s.left;
    const bCy = bRect.top + bRect.height / 2 - s.top;
  
    setAuthPath({
      sx: aCx + PACKET_START_DX,
      sy: aCy + PACKET_START_DY,
      ex: bCx + PACKET_END_DX,
      ey: bCy + PACKET_END_DY,
    });
  }, [isPreAuth, stageSize.w, stageSize.h, PACKET_TUNING_KEY]);

// noncePath (DIAGONAL): Bob -> Alice
useLayoutEffect(() => {
  if (!isPreAuth) return;

  const stageEl = stageRef.current;
  const aEl = aliceRef.current;
  const bEl = bobRef.current;
  if (!stageEl || !aEl || !bEl) return;

  const s = stageEl.getBoundingClientRect();

  const aImg = aEl.querySelector("img");
  const bImg = bEl.querySelector("img");
  const aRect = (aImg ?? aEl).getBoundingClientRect();
  const bRect = (bImg ?? bEl).getBoundingClientRect();

  const aCx = aRect.left + aRect.width / 2 - s.left;
  const aCy = aRect.top + aRect.height / 2 - s.top;
  const bCx = bRect.left + bRect.width / 2 - s.left;
  const bCy = bRect.top + bRect.height / 2 - s.top;

  setNoncePath({
    sx: bCx + NONCE_START_DX,
    sy: bCy + NONCE_START_DY,
    ex: aCx + NONCE_END_DX,
    ey: aCy + NONCE_END_DY,
  });
}, [isPreAuth, stageSize.w, stageSize.h, NONCE_TUNING_KEY]);

  // sigPath (DIAGONAL): Alice -> Bob (response)
useLayoutEffect(() => {
  if (!isPreAuth) return;

  const stageEl = stageRef.current;
  const aEl = aliceRef.current;
  const bEl = bobRef.current;
  if (!stageEl || !aEl || !bEl) return;

  const s = stageEl.getBoundingClientRect();

  const aImg = aEl.querySelector("img");
  const bImg = bEl.querySelector("img");
  const aRect = (aImg ?? aEl).getBoundingClientRect();
  const bRect = (bImg ?? bEl).getBoundingClientRect();

  const aCx = aRect.left + aRect.width / 2 - s.left;
  const aCy = aRect.top + aRect.height / 2 - s.top;
  const bCx = bRect.left + bRect.width / 2 - s.left;
  const bCy = bRect.top + bRect.height / 2 - s.top;

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
    if (!stageEl || !aEl) return;


    setYPath({
      sx: resolvedStep2PanelPos.left + Y_POP_START_DX,
      sy: resolvedStep2PanelPos.top + Y_POP_START_DY,
      ex: resolvedStep1PanelPos.left + Y_END_PANEL_DX,
      ey: resolvedStep1PanelPos.top + Y_END_PANEL_DY,
    });
  }, [isBobKeygen, stageSize.w, stageSize.h, resolvedStep2PanelPos.left, resolvedStep2PanelPos.top, resolvedStep1PanelPos.left, resolvedStep1PanelPos.top, Y_POP_START_DX, Y_POP_START_DY, Y_END_PANEL_DX, Y_END_PANEL_DY]);

  // Step1 PQC chip CTA + keys panel anchored around Alice
  useLayoutEffect(() => {
    if (!isKeygen && !isBobKeygen && !isAliceSigning) return;

    const stageEl = stageRef.current;
    const aliceEl = aliceRef.current;
    if (!stageEl || !aliceEl) return;

    const s = stageEl.getBoundingClientRect();
    const a = aliceEl.getBoundingClientRect();

   
    

    const PANEL_W = 340;
    const PANEL_H = 170;

    const panelLeft = a.left - s.left - PANEL_W + KEYS_DX;
    const panelTop = a.top - s.top + KEYS_DY;

    setKeysPanelPos({
      left: clamp(panelLeft, 12, stageSize.w - PANEL_W - 12),
      top: clamp(panelTop, 12, stageSize.h - PANEL_H - 86),
    });
  }, [isKeygen, isBobKeygen, isAliceSigning, stageSize.w, stageSize.h, step1Phase, step2Phase, step3Phase]);

  // Step1/Alice panel anchor used in Step1 and as prerequisite anchor for later steps.
  useLayoutEffect(() => {
    if (!isKeygen && !isBobKeygen && !isAliceSigning) return;

    const stageEl = stageRef.current;
    const aliceEl = aliceRef.current;
    if (!stageEl || !aliceEl) return;

    const s = stageEl.getBoundingClientRect();
    const aImg = aliceEl.querySelector("img");
    const aRect = (aImg ?? aliceEl).getBoundingClientRect();

    const aCx = aRect.left + aRect.width / 2 - s.left;
    const aCy = aRect.top + aRect.height / 2 - s.top;

    const PANEL_W = 208;
    const PANEL_H = 118;

    setStep1PanelPos({
      left: clamp(aCx + NONCE_END_DX, 12 + PANEL_W * 0.5, stageSize.w - 12 - PANEL_W * 0.5),
      top: clamp(aCy + NONCE_END_DY, 12 + PANEL_H * 0.5, stageSize.h - 86 - PANEL_H * 0.5),
    });
  }, [isKeygen, isBobKeygen, isAliceSigning, stageSize.w, stageSize.h, NONCE_END_DX, NONCE_END_DY]);

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
  const step0NextEnabled = step0Phase === 1 || step0Phase === 4 || step0Phase === 9;


  // Step 1: Next should work to reveal CTA (phase 1 -> 2), then be blocked until keys generated.
  const step1NextEnabled = step1Phase === 1 || step1Phase === 4;

  const step2NextEnabled = step2Phase === 1 || step2Phase === 4 || step2Phase === 6;
  

  // Step 3: Next is blocked only while σ_A is flying
  const step3NextEnabled =
  step3Phase === 1 ||
  step3Phase === 2 ||
  step3Phase === 7 ||
  step3Phase === 9;
  const showBobPanelInAliceSigning = isAliceSigning;
  const step4NextEnabled = step4Phase === 1 || step4Phase === 2 || step4Phase === 4;
  
  const step5NextEnabled = step5Phase === 1 || step5Phase === 3;
  const step6NextEnabled = step6Phase === 1 || step6Phase === 3 || step6Phase === 9;
  const step7NextEnabled = step7Phase === 1 || step7Phase === 2;


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
                : isStep6
                  ? !step6NextEnabled
                  : isStep7
                    ? !step7NextEnabled
                : !canNext;

  useEffect(() => {
    setShowReadMore(false);
    setShowReadMoreModal(false);
  }, [stageId]);


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
  const introStoryText =
    introStoryPhase === 1 ? (
      <div className="oss-introMsgLine is-on oss-introStoryText">
        Using classical computers, we typically rely on blockchain consensus and shared ledgers.
      </div>
    ) : introStoryPhase === 2 ? (
      <div className="oss-introMsgLine is-on oss-introStoryText">
        However, ledgers can be manipulated.
      </div>
    ) : introStoryPhase === 3 ? (
      <div className="oss-introMsgLine is-on oss-introStoryText">
        Also, current blockchain systems consume enormous amounts of energy, with global environmental impact.
      </div>
    ) : introStoryPhase === 4 ? (
      <div className="oss-introMsgLine is-on oss-introStoryText">
        BTQ shows how to solve this if only one player has a quantum computer, guaranteeing security through physics.
      </div>
    ) : introStoryPhase === 5 ? (
      <div className="oss-introMsgLine is-on oss-introStoryText">
        Our protocol lowers resource cost by keeping communication channels purely classical.
      </div>
    ) : null;
  const STEP1_MAIN_TOP = "44%";
  const STEP0_SUBLINE_TOP = "calc(44% + 36px)";
  const STEP1_SUBLINE_TOP = STEP0_SUBLINE_TOP;
  const STEP2_MAIN_TOP = "44%";
  const STEP2_SUBLINE_TOP = STEP0_SUBLINE_TOP;
  const STEP3_MAIN_TOP = "44%";
  const STEP3_SUBLINE_TOP = STEP0_SUBLINE_TOP;
  const STEP4_MAIN_TOP = "44%";
  const STEP4_SUBLINE_TOP = STEP0_SUBLINE_TOP;
  const STEP5_MAIN_TOP = "44%";
  const STEP5_SUBLINE_TOP = STEP0_SUBLINE_TOP;
  const STEP6_MAIN_TOP = "44%";
  const STEP6_SUBLINE_TOP = STEP0_SUBLINE_TOP;
  const STEP7_MAIN_TOP = "44%";
  const STEP7_SUBLINE_TOP = STEP0_SUBLINE_TOP;
  const STEP8_MAIN_TOP = "44%";
  const STEP8_SUBLINE_TOP = STEP0_SUBLINE_TOP;
  const VK_A = <>vk<sub>A</sub></>;
  const SK_A = <>sk<sub>A</sub></>;
  const SK_B_KET = <>|sk<sub>B</sub>&#10217;</>;
  const SIGMA_A = <>σ<sub>A</sub></>;
  const M_AUTH = <>m<sub>auth</sub></>;
  const M_PAY = <>m<sub>pay</sub></>;
  const mpayLabelWithBit = (
    <>
      {M_PAY}
      {chosenVBit !== null ? <>[v={chosenVBit}]</> : null}
      : {visualMpay ?? "(…)"}
    </>
  );
  const shouldShowSigmaAtCharlie =
    sigmaArrivedAtCharlie &&
    sigmaCharliePos.left > 0 &&
    sigmaCharliePos.top > 0 &&
    (
      (isAliceSigning && step3Phase >= 8) ||
      (!isIntro && !isPreAuth && !isKeygen && !isBobKeygen && !isAliceSigning)
    );
  const shouldShowSigmaBAtCharlie =
    sigmaBArrivedAtCharlie &&
    mpayCharliePos.left > 0 &&
    mpayCharliePos.top > 0 &&
    (isStep6 || isStep7 || isStep8);
  const showQuantumBob = (!isIntro) || (isIntro && introStarted && introPhase >= 4 && introStoryPhase >= 4);
  const introAliceAnchor = { x: stageSize.w * (PIN_ALICE.x / 100) + NUDGE_ALICE.dx, y: stageSize.h * (PIN_ALICE.y / 100) + NUDGE_ALICE.dy };
  const introBobAnchor = { x: stageSize.w * (PIN_BOB.x / 100) + NUDGE_BOB.dx, y: stageSize.h * (PIN_BOB.y / 100) + NUDGE_BOB.dy };
  const introCharlieAnchor = { x: stageSize.w * (PIN_CHARLIE.x / 100) + NUDGE_CHARLIE.dx, y: stageSize.h * (PIN_CHARLIE.y / 100) + NUDGE_CHARLIE.dy };
  const introMerchantAnchor = { x: stageSize.w * (PIN_MERCHANT.x / 100) + NUDGE_MERCHANT.dx, y: stageSize.h * (PIN_MERCHANT.y / 100) + NUDGE_MERCHANT.dy };
  const introLedgerPos = {
    x: introCharlieAnchor.x + 10,
    y: clamp(introCharlieAnchor.y - 180, 90, stageSize.h * 0.42),
  };
  const introArcPath = (sx: number, sy: number, ex: number, ey: number, lift = 0) => {
    const cx = (sx + ex) * 0.5;
    const cy = (sy + ey) * 0.5 + lift;
    return `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;
  };

  return (
    <div ref={stageRef} className={`oss-stage ${focus ? "is-guiding" : ""}`} data-focus={focus ?? "none"}>
    <div className="oss-mapBg">
  <img src="/world%20map-2.png" alt="" />
</div>
      

      {/* Time-slice overlay */}
      <div key={stageId} className="oss-slice">
        {/* Intro narration */}
        {isIntro && introStarted && introStoryPhase === 0 && introText}
        {isIntro && introStarted && introPhase >= 4 && introStoryPhase > 0 && (
          <>
            {introStoryText}
            <div className={`oss-introStoryScene is-phase-${introStoryPhase}`}>
              {introStoryPhase <= 2 && (
                <>
                  <svg className="oss-introStoryBeams" viewBox={`0 0 ${stageSize.w} ${stageSize.h}`} preserveAspectRatio="none">
                    <path d={introArcPath(introAliceAnchor.x, introAliceAnchor.y, introLedgerPos.x, introLedgerPos.y, -38)} />
                    <path d={introArcPath(introBobAnchor.x, introBobAnchor.y, introLedgerPos.x, introLedgerPos.y, -26)} />
                    <path d={introArcPath(introMerchantAnchor.x, introMerchantAnchor.y, introLedgerPos.x, introLedgerPos.y, 46)} />
                    <path d={introArcPath(introCharlieAnchor.x, introCharlieAnchor.y, introLedgerPos.x, introLedgerPos.y, -18)} />
                  </svg>
                  <div className={`oss-ledgerCard ${introStoryPhase >= 2 ? "is-tampered" : ""}`} style={{ left: introLedgerPos.x, top: introLedgerPos.y }}>
                    <div className="oss-ledgerTitle">Shared Ledger</div>
                    <div className="oss-ledgerRows">
                      <span />
                      <span />
                      <span />
                    </div>
                    {introStoryPhase >= 2 && <div className="oss-ledgerCorrupt">Tampered block</div>}
                  </div>
                </>
              )}
              {introStoryPhase === 3 && (
                <div className="oss-introPlanetScene">
                  <div className="oss-introPlanetWrap">
                    <div className="oss-introPlanetMap" />
                    <div className="oss-introPlanetCore" />
                  </div>
                </div>
              )}
              {introStoryPhase === 5 && (
                <svg className="oss-introBitLines" viewBox={`0 0 ${stageSize.w} ${stageSize.h}`} preserveAspectRatio="none">
                  <defs>
                    <path id="bitPath-ab" d={introArcPath(introAliceAnchor.x, introAliceAnchor.y, introBobAnchor.x, introBobAnchor.y, 2)} />
                    <path id="bitPath-bc" d={introArcPath(introBobAnchor.x, introBobAnchor.y, introCharlieAnchor.x, introCharlieAnchor.y, -18)} />
                    <path id="bitPath-cm" d={introArcPath(introCharlieAnchor.x, introCharlieAnchor.y, introMerchantAnchor.x, introMerchantAnchor.y, 10)} />
                    <path id="bitPath-ma" d={introArcPath(introMerchantAnchor.x, introMerchantAnchor.y, introAliceAnchor.x, introAliceAnchor.y, -14)} />
                  </defs>
                  <path className="oss-introBitsTrack" d={introArcPath(introAliceAnchor.x, introAliceAnchor.y, introBobAnchor.x, introBobAnchor.y, 2)} />
                  <path className="oss-introBitsTrack oss-introBitsTrack--offset" d={introArcPath(introBobAnchor.x, introBobAnchor.y, introCharlieAnchor.x, introCharlieAnchor.y, -18)} />
                  <path className="oss-introBitsTrack" d={introArcPath(introCharlieAnchor.x, introCharlieAnchor.y, introMerchantAnchor.x, introMerchantAnchor.y, 10)} />
                  <path className="oss-introBitsTrack oss-introBitsTrack--offset" d={introArcPath(introMerchantAnchor.x, introMerchantAnchor.y, introAliceAnchor.x, introAliceAnchor.y, -14)} />

                  <text className="oss-introBitsText">
                    <textPath href="#bitPath-ab" startOffset="-90%">
                      1010011010100110101001011011001110001101001101100011010011001010011
                      <animate
                        attributeName="startOffset"
                        values="-120%;120%;-120%"
                        dur="3.4s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.45;0.95;0.55;0.95;0.35"
                        dur="1.6s"
                        repeatCount="indefinite"
                      />
                    </textPath>
                  </text>
                  <text className="oss-introBitsText oss-introBitsText--b">
                    <textPath href="#bitPath-bc" startOffset="20%">
                      0101100101010011010010101100100110100100101110010110011010101
                      <animate
                        attributeName="startOffset"
                        values="120%;-120%;120%"
                        dur="3.8s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.55;0.9;0.35;0.85;0.55"
                        dur="1.8s"
                        repeatCount="indefinite"
                      />
                    </textPath>
                  </text>
                  <text className="oss-introBitsText oss-introBitsText--c">
                    <textPath href="#bitPath-cm" startOffset="-40%">
                      0011010010101011010010011010101001101010011010010010101100110
                      <animate
                        attributeName="startOffset"
                        values="-120%;120%;-120%"
                        dur="4.1s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.5;0.95;0.4;0.9;0.5"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </textPath>
                  </text>
                  <text className="oss-introBitsText oss-introBitsText--d">
                    <textPath href="#bitPath-ma" startOffset="30%">
                      1100101001110101011001101001011010010110010011010100100110001110
                      <animate
                        attributeName="startOffset"
                        values="120%;-120%;120%"
                        dur="4.6s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.4;0.9;0.45;0.95;0.4"
                        dur="1.9s"
                        repeatCount="indefinite"
                      />
                    </textPath>
                  </text>
                </svg>
              )}
            </div>
          </>
        )}

        <div className={`oss-quantumBob ${showQuantumBob ? "is-on" : ""}`}>
          <img src="/neutral%20atom.png" alt="Quantum Computer" />
          <div className="oss-quantumBobSubline">Only Bob has access to a quantum computer</div>
        </div>

       {/* ===== STEP 0 visuals ===== */}
{/* ===== STEP 0 visuals ===== */}
{isPreAuth && (
  <>
    {/* Title: centered, same position as intro */}
    {step0Phase >= 1 && (
      <div
        className={`oss-trustText ${step0Phase >= 1 ? "is-on" : ""}`}
        style={{
          position: "absolute",
          left: "50%",
          top: "44%",
          transform: "translate(-50%, -50%)",
          zIndex: 60,
          pointerEvents: "none",
          textAlign: "center",
          maxWidth: 900,
        }}
      >
        Step 0: Establishment of trust
      </div>
    )}

    {/* Sub-line: auth request (phases 2–4) */}
    {step0Phase >= 2 && step0Phase < 5 && (
      <div
        className="oss-authLine is-on"
        style={{
          position: "absolute",
          left: "50%",
          top: STEP0_SUBLINE_TOP,
          transform: "translate(-50%, -50%)",
          zIndex: 60,
          pointerEvents: "none",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        Alice sends an authorisation request to Bob
      </div>
    )}

    {/* Sub-line: nonce (phases 5–7) */}
    {step0Phase >= 5 && step0Phase <= 7 && (
      <div
        className="oss-authLine is-on"
        style={{
          position: "absolute",
          left: "50%",
          top: STEP0_SUBLINE_TOP,
          transform: "translate(-50%, -50%)",
          zIndex: 60,
          pointerEvents: "none",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        Bob sends a fresh nonce to Alice
      </div>
    )}

    {/* Sub-line: signed response (phases 8–9) */}
    {step0Phase >= 8 && step0Phase <= 9 && (
      <div
        className="oss-authLine is-on"
        style={{
          position: "absolute",
          left: "50%",
          top: STEP0_SUBLINE_TOP,
          transform: "translate(-50%, -50%)",
          zIndex: 60,
          pointerEvents: "none",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        Alice sends her signed response to Bob
      </div>
    )}

    {/* Beams: always visible from phase 1 onward */}
    {step0Phase >= 1 && (
      <svg
  className="oss-trustLines"
  viewBox={`0 0 ${stageSize.w} ${stageSize.h}`}
  preserveAspectRatio="xMidYMid meet"
  width={stageSize.w}
  height={stageSize.h}
  style={{ position: "absolute", left: 0, top: 0, zIndex: 58, pointerEvents: "none", overflow: "visible" }}
>
        <defs>
          <filter id="beamGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* VERTICAL segment: Alice -> up to icon */}
<line className="oss-beamBloom" pathLength={1}
  x1={trustBeam.mx} y1={trustBeam.ay}
  x2={trustBeam.mx} y2={trustBeam.my}
  filter="url(#beamGlow)" />
<line className="oss-beamMid" pathLength={1}
  x1={trustBeam.mx} y1={trustBeam.ay}
  x2={trustBeam.mx} y2={trustBeam.my} />
<line className="oss-beamLine" pathLength={1}
  x1={trustBeam.mx} y1={trustBeam.ay}
  x2={trustBeam.mx} y2={trustBeam.my} />

{/* HORIZONTAL segment: Bob -> icon */}
<line className="oss-beamBloom" pathLength={1}
  x1={trustBeam.bx} y1={trustBeam.my}
  x2={trustBeam.mx} y2={trustBeam.my}
  filter="url(#beamGlow)" />
<line className="oss-beamMid" pathLength={1}
  x1={trustBeam.bx} y1={trustBeam.my}
  x2={trustBeam.mx} y2={trustBeam.my} />
<line className="oss-beamLine" pathLength={1}
  x1={trustBeam.bx} y1={trustBeam.my}
  x2={trustBeam.mx} y2={trustBeam.my} />

{/* ticks on vertical segment: horizontal crosshairs */}
{[0.25, 0.5, 0.75].map((t) => {
  const ty = trustBeam.my + (trustBeam.ay - trustBeam.my) * t;
  return (
    <line
      key={`vtick-${t}`}
      className="oss-beamTick"
      x1={trustBeam.mx - 7}
      y1={ty}
      x2={trustBeam.mx + 7}
      y2={ty}
    />
  );
})}
{/* ticks on horizontal segment: vertical crosshairs */}
{[0.25, 0.5, 0.75].map((t) => {
  const tx = trustBeam.bx + (trustBeam.mx - trustBeam.bx) * t;
  return (
    <line
      key={`htick-${t}`}
      className="oss-beamTick"
      x1={tx}
      y1={trustBeam.my - 7}
      x2={tx}
      y2={trustBeam.my + 7}
    />
  );
})}
{/* Corner node */}
<circle className="oss-beamNodeBloom" cx={trustBeam.mx} cy={trustBeam.my} r="16" filter="url(#beamGlow)" />
<circle className="oss-beamNode" cx={trustBeam.mx} cy={trustBeam.my} r="5" />
      </svg>
    )}

 {/* authenticate.png hero icon — wrapped for independent glow/ring/image animations */}
{step0Phase >= 1 && trustBeam.mx > 0 && (
  <div
    className="oss-authIconWrap"
    style={{
      position: "absolute",
      left: trustBeam.mx,
      top: trustBeam.my,
      zIndex: 76,
      pointerEvents: "none",
    }}
  >
    <div className="oss-authIconGlow" />
    <div className="oss-authIconRing" />
    <div className="oss-authFaintArc" />
    <div className="oss-authBgLines" />
    <div className="oss-authHudFrame" />
    <div className="oss-authHudCorners" />
    <div className="oss-authHudSweep" />
    <div className="oss-authHudConnectors" />
    <img src="/authenticate.png" alt="" className="oss-authIconHero" />
  </div>
)}

    {/* Dot: Alice -> Bob (auth request, phase 3) */}
    {step0Phase === 3 && (
  <div
    key="dot-auth"
    className="oss-dotTravel"
    onAnimationEnd={() => {
      if (isPreAuth && step0Phase === 3) setStep0Phase(4);
    }}
    style={{
      position: "absolute",
      left: authPath.sx,
      top: authPath.sy,
      ["--tx" as any]: `${authPath.ex - authPath.sx}px`,
      ["--ty" as any]: `${authPath.ey - authPath.sy}px`,
      zIndex: 80,
      pointerEvents: "none",
    }}
  >
    <img src="/packet.png" alt="" className="oss-dotPacketImg" />
    <div className="oss-dotLabel">auth req</div>
  </div>
)}

    {/* Auth landed at Bob until user clicks Next */}
    {step0Phase === 4 && (
      <div
        className="oss-dotHold"
        style={{
          position: "absolute",
          left: authPath.ex,
          top: authPath.ey,
          zIndex: 81,
          pointerEvents: "none",
        }}
      >
        <img src="/packet.png" alt="" className="oss-dotPacketImg" />
        <div className="oss-dotLabel">auth req</div>
      </div>
    )}

    {/* Dot: Bob -> Alice (nonce, phase 6) */}
    {step0Phase === 6 && (
  <div
    key="dot-nonce"
    className="oss-dotTravel"
    onAnimationEnd={() => {
      if (!isPreAuth || step0Phase !== 6) return;
      const n = `0x${randomHex(12)}`;
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
      zIndex: 80,
      pointerEvents: "none",
    }}
  >
    <img src="/packet.png" alt="" className="oss-dotPacketImg" />
    <div className="oss-dotLabel">nonce</div>
  </div>
)}

    {/* Nonce landed at Alice and waits for Sign */}
    {step0Phase === 7 && (
      <div
        className="oss-dotHold oss-dotHold--interactive oss-dotHold--signing"
        style={{
          position: "absolute",
          left: noncePath.ex,
          top: noncePath.ey,
          zIndex: 81,
          pointerEvents: "auto",
        }}
      >
        <img src="/packet.png" alt="" className="oss-dotPacketImg" />
        <div className="oss-dotSignPanel">
          <div className="oss-dotSignRow">
            <span className="oss-dotSignKey">op</span>
            <span className="oss-dotSignVal">sign.nonce</span>
          </div>
          <div className="oss-dotSignRow">
            <span className="oss-dotSignKey">msg</span>
            <span className="oss-dotSignVal oss-dotSignNonce">{visualNonce ?? "0x…"}</span>
          </div>
        </div>
        <button
          type="button"
          className="oss-chipSignBtn oss-dotSignBtn"
          onClick={() => {
            const n = visualNonce ?? `0x${randomHex(12)}`;
            setVisualNonce(n);
            setVisualSig(fauxSignFromNonce(n));
            setStep0Phase(8);
          }}
        >
          Sign
        </button>
      </div>
    )}

    {/* Signed response flies Alice -> Bob */}
    {step0Phase === 8 && (
      <div
        key="dot-response"
        className="oss-dotTravel"
        onAnimationEnd={() => {
          if (isPreAuth && step0Phase === 8) setStep0Phase(9);
        }}
        style={{
          position: "absolute",
          left: sigPath.sx,
          top: sigPath.sy,
          ["--tx" as any]: `${sigPath.ex - sigPath.sx}px`,
          ["--ty" as any]: `${sigPath.ey - sigPath.sy}px`,
          zIndex: 80,
          pointerEvents: "none",
        }}
      >
        <img src="/packet.png" alt="" className="oss-dotPacketImg" />
        <div className="oss-dotLabel oss-dotLabel--sig">sig: {visualSig ? visualSig.slice(0, 10) + "…" : "SIG(…)"}</div>
      </div>
    )}

    {/* Signed response landed at Bob until Next */}
    {step0Phase === 9 && (
      <div
        className="oss-dotHold"
        style={{
          position: "absolute",
          left: sigPath.ex,
          top: sigPath.ey,
          zIndex: 81,
          pointerEvents: "none",
        }}
      >
        <img src="/packet.png" alt="" className="oss-dotPacketImg" />
        <div className="oss-dotLabel oss-dotLabel--sig">sig: {visualSig ? visualSig.slice(0, 10) + "…" : "SIG(…)"}</div>
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
                  left: "50%",
                  top: STEP1_MAIN_TOP,
                  transform: "translate(-50%, -50%)",
                  zIndex: 60,
                  pointerEvents: "none",
                  textAlign: "center",
                  maxWidth: 900,
                }}
              >
                Step 1: Alice generates a classical PQC keypair.
              </div>
            )}

            {step1Phase >= 2 && step1Phase <= 4 && (
              <div
                className="oss-authLine is-on"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: STEP1_SUBLINE_TOP,
                  transform: "translate(-50%, -50%)",
                  zIndex: 60,
                  pointerEvents: "none",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                Alice runs PQC.gen with Dilithium to produce public key, {VK_A} and secret key, {SK_A}. 
              </div>
            )}

            {step1Phase === 2 && (
              <div
                className="oss-dotHold oss-dotHold--interactive oss-dotHold--step1"
                style={{
                  position: "absolute",
                  left: step1PanelPos.left,
                  top: step1PanelPos.top,
                  zIndex: 62,
                  pointerEvents: "auto",
                }}
              >
                <img src="/packet.png" alt="" className="oss-dotPacketImg" />
                <div className="oss-step1Panel">
                  <div className="oss-step1Row">
                    <span className="oss-step1Key">op</span>
                    <span className="oss-step1Val">PQC.gen</span>
                  </div>
                  <div className="oss-step1Row">
                    <span className="oss-step1Key">algo</span>
                    <span className="oss-step1Val">Dilithium</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="oss-chipSignBtn oss-step1RunBtn"
                  onClick={() => {
                    setStep1Phase(3);
                    setKeygenStatus("running");

                    window.setTimeout(() => setKeygenStatus("generating"), 1800);

                    window.setTimeout(() => {
                      const kp = fauxPqcKeypair();
                      setVisualVkA(kp.vk);
                      setVisualSkA(kp.sk);
                      setStep1Phase(4);
                    }, 3600);
                  }}
                >
                  Run
                </button>
              </div>
            )}

            {isKeygen && step1Phase === 3 && (
              <div
                className="oss-dilithiumStage oss-dilithiumStage--step1"
                style={{
                  position: "absolute",
                  left: step1PanelPos.left + 10,
                  top: step1PanelPos.top - 42,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <img src="/dilithium.png" alt="Dilithium" className="oss-dilithiumImg oss-dilithiumImg--step1" />
                <div className="oss-dilithiumText">
                  {keygenStatus === "running" && "Running the algorithm…"}
                  {keygenStatus === "generating" && "Generating keys…"}
                </div>
              </div>
            )}

            {step1Phase >= 4 && (
              <div
                className="oss-dotHold oss-dotHold--interactive oss-dotHold--step1 oss-dotHold--step1keys"
                style={{
                  position: "absolute",
                  left: step1PanelPos.left,
                  top: step1PanelPos.top,
                  zIndex: 62,
                  pointerEvents: "none",
                }}
              >
                <img src="/packet.png" alt="" className="oss-dotPacketImg" />
                <div className="oss-step1Panel">
                  <div className="oss-step1Row">
                    <span className="oss-step1Key">{VK_A}</span>
                    <span className="oss-step1Val">{vkA ?? visualVkA}</span>
                  </div>
                  <div className="oss-step1Row">
                    <span className="oss-step1Key">{SK_A}</span>
                    <span className="oss-step1Val">{skA ?? visualSkA}</span>
                  </div>
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
                className="oss-dotHold oss-dotHold--interactive oss-dotHold--step1 oss-dotHold--step1keys"
                style={{
                  position: "absolute",
                  left: resolvedStep1PanelPos.left,
                  top: resolvedStep1PanelPos.top,
                  zIndex: 62,
                  pointerEvents: "none",
                }}
              >
                <img src="/packet.png" alt="" className="oss-dotPacketImg" />
                <div className="oss-step1Panel">
                  <div className="oss-step1Row">
                    <span className="oss-step1Key">{VK_A}</span>
                    <span className="oss-step1Val">{vkA ?? visualVkA}</span>
                  </div>
                  <div className="oss-step1Row">
                    <span className="oss-step1Key">{SK_A}</span>
                    <span className="oss-step1Val">{skA ?? visualSkA}</span>
                  </div>
                  {aliceY && (
                    <div className="oss-step1Row">
                      <span className="oss-step1Key">y</span>
                      <span className="oss-step1Val">{aliceY}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Main Step 2 text */}
            {step2Phase >= 1 && (
              <div
                className={`oss-trustText ${step2Phase >= 1 ? "is-on" : ""}`}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: STEP2_MAIN_TOP,
                  transform: "translate(-50%, -50%)",
                  zIndex: 60,
                  pointerEvents: "none",
                  textAlign: "center",
                  maxWidth: 900,
                }}
              >
                Step 2: Bob generates his key pair on a quantum computer
              </div>
            )}

            {/* Sub-line like Step 0 formatting */}
            {step2Phase >= 2 && step2Phase < 5 && (
              <div
                className={`oss-authLine ${step2Phase >= 2 ? "is-on" : ""}`}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: STEP2_SUBLINE_TOP,
                  transform: "translate(-50%, -50%)",
                  zIndex: 60,
                  pointerEvents: "none",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                Bob runs gen.crs to produce quantum signing key {SK_B_KET} and the classical public key y
                
              </div>
            )}

            {/* Chip CTA near Bob */}
            {step2Phase === 2 && (
              <div
                className="oss-dotHold oss-dotHold--interactive oss-dotHold--step2"
                style={{
                  position: "absolute",
                  left: resolvedStep2PanelPos.left,
                  top: resolvedStep2PanelPos.top,
                  zIndex: 62,
                  pointerEvents: "auto",
                }}
              >
                <img src="/packet.png" alt="" className="oss-dotPacketImg" />
                <div className="oss-step2Panel">
                  <div className="oss-step1Row">
                    <span className="oss-step1Key">op</span>
                    <span className="oss-step1Val">gen.crs</span>
                  </div>
                  <div className="oss-step1Row">
                    <span className="oss-step1Key">out</span>
                    <span className="oss-step1Val">{SK_B_KET}, y</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="oss-chipSignBtn oss-step2RunBtn"
                  onClick={() => {
                    setStep2Phase(3);
                    setBobKeygenStatus("running");

                    window.setTimeout(() => setBobKeygenStatus("generating"), 1800);

                    window.setTimeout(() => {
                      setVisualSkB(`0x${randomHex(32)}`);
                      setVisualY(`0x${randomHex(24)}`);
                      setStep2Phase(4);
                    }, 3600);
                  }}
                >
                  Run
                </button>
              </div>
            )}

            {/* Running animation: chip-mimiq.png */}
            {step2Phase === 3 && (
              <div
                className="oss-dilithiumStage oss-dilithiumStage--step2"
                style={{
                  position: "absolute",
                  left: resolvedStep2PanelPos.left,
                  top: resolvedStep2PanelPos.top,
                  transform: "translate(-50%, -50%)",
                  zIndex: 70,
                  pointerEvents: "none",
                }}
              >
                <img src="/chip-mimiq.png" alt="Mimiq" className="oss-dilithiumImg oss-dilithiumImg--step2" />
                <div className="oss-dilithiumText">
                  {bobKeygenStatus === "running" ? "Running the algorithm…" : "Generating keys…"}
                </div>
              </div>
            )}

            {/* After generated: show Bob outputs in-chip */}
            {step2Phase >= 4 && (
              <div
                className="oss-dotHold oss-dotHold--interactive oss-dotHold--step2"
                style={{
                  position: "absolute",
                  left: resolvedStep2PanelPos.left,
                  top: resolvedStep2PanelPos.top,
                  zIndex: 62,
                  pointerEvents: "none",
                }}
              >
                <img src="/packet.png" alt="" className="oss-dotPacketImg" />
                <div className="oss-step2Panel">
                  <div className="oss-step1Row">
                    <span className="oss-step1Key">{SK_B_KET}</span>
                    <span className="oss-step1Val">{visualSkB ?? "|sk_b⟩…"}</span>
                  </div>
                  <div className="oss-step1Row">
                    <span className="oss-step1Key">y</span>
                    <span className={`oss-step1Val ${step2Phase === 5 ? "oss-step2YEjecting" : ""}`}>
                      {visualY ?? "0x…"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* When sending: swap the line text */}
            {step2Phase >= 5 && (
              <div
                className="oss-authLine is-on"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: STEP2_SUBLINE_TOP,
                  transform: "translate(-50%, -50%)",
                  zIndex: 60,
                  pointerEvents: "none",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                Bob then sends his public key y to Alice
              </div>
            )}

            {/* y flies Bob -> Alice */}
            {step2Phase === 5 && (
              <div
                key={`yPacket-${step2Phase}`}
                className="oss-dotTravel"
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
                  zIndex: 80,
                  pointerEvents: "none",
                }}
              >
                <img src="/packet.png" alt="" className="oss-dotPacketImg" />
                <div className="oss-dotLabel">y: {visualY ? visualY.slice(0, 10) + "…" : "0x…"}</div>
              </div>
            )}
          </>
        )}

        {/* Keep Bob panel persistent after Step 2 through Step 5 */}
        {(showBobPanelInAliceSigning || isStep4 || isStep5) && (visualSkB || visualY) && (
          <div
            className="oss-dotHold oss-dotHold--interactive oss-dotHold--step2"
            style={{
              position: "absolute",
              left: resolvedStep2PanelPos.left,
              top: resolvedStep2PanelPos.top,
              zIndex: 62,
              pointerEvents: "none",
              opacity: 1,
              visibility: "visible",
            }}
          >
            <img src="/packet.png" alt="" className="oss-dotPacketImg" />
            <div className="oss-step2Panel">
              <div className="oss-step1Row">
                <span className="oss-step1Key">{SK_B_KET}</span>
                <span className="oss-step1Val">{visualSkB ?? "0x…"}</span>
              </div>
              <div className="oss-step1Row">
                <span className="oss-step1Key">y</span>
                <span className="oss-step1Val">{visualY ?? "0x…"}</span>
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 3 visuals (your requested choreography) ===== */}
{/* ===== STEP 3 visuals (sequential narration + pops + mixing + σ_A packet) ===== */}
{isAliceSigning && (
  <>
    {/* Alice keys panel stays near Alice until mixing hides it */}
    {!hideAlicePanel && (
  <div
    className="oss-dotHold oss-dotHold--interactive oss-dotHold--step1 oss-dotHold--step1keys"
    style={{
      position: "absolute",
      left: resolvedStep1PanelPos.left,
      top: resolvedStep1PanelPos.top,
      zIndex: 62,
      pointerEvents: "none",
      transition: `opacity ${STEP3_FADE_MS}ms ease`,
opacity: step3Phase === 6 ? 0 : 1,
visibility: step3Phase === 6 ? "hidden" : "visible",

    }}
  >
        <img src="/packet.png" alt="" className="oss-dotPacketImg" />
        <div className="oss-step1Panel">
          <div className="oss-step1Row">
            <span className="oss-step1Key">{VK_A}</span>
            <span className="oss-step1Val">{vkA ?? visualVkA}</span>
          </div>
          <div className="oss-step1Row">
            <span className="oss-step1Key">{SK_A}</span>
            <span className={`oss-step1Val ${skPulse ? "oss-popPulse" : ""}`}>{skA ?? visualSkA}</span>
          </div>
          <div className="oss-step1Row">
            <span className="oss-step1Key">y</span>
            <span className={`oss-step1Val ${yPulse ? "oss-popPulse" : ""}`}>{aliceY ?? visualY ?? "0x…"}</span>
          </div>
        </div>
      </div>
    )}

    {/* m_auth packet appears next to Alice from phase 2 onward, pops at phase 4, hides during mixing */}
    {!hideMauthHold && step3Phase >= 2 && (
      <div
      className={`oss-dotHold ${mauthPulse ? "oss-mauthPulse" : ""}`}
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
          visibility: step3Phase === 6 ? "hidden" : "visible",
          animation: step3Phase === 6 ? "none" : undefined,

        }}
      >
        <img src="/packet.png" alt="" className="oss-dotPacketImg" />
        <div className="oss-dotLabel oss-dotLabel--sig">{M_AUTH}: {visualMauth ?? "(attr.1, attr.2, …)"}</div>
      </div>
    )}

    {/* Step 3 title */}
    {step3Phase >= 1 && (
      <div
        className={`oss-trustText ${step3Phase >= 1 ? "is-on" : ""}`}
        style={{
          position: "absolute",
          left: "50%",
          top: STEP3_MAIN_TOP,
          transform: "translate(-50%, -50%)",
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
      left: "50%",
      top: STEP3_SUBLINE_TOP,
      transform: "translate(-50%, -50%)",
      zIndex: 60,
      pointerEvents: "none",
      textAlign: "center",
      maxWidth: 900,
      whiteSpace: "normal",
    }}
  >
    First, Alice constructs a message <span className="intro-em">{M_AUTH} = (attr.1, attr.2, ...)</span> which 
    contains attributes that Alice deems suitable. For instance, if Alice is authorizing
    Bob to make a one time purchase, the attributes can be maximum amount, currency, expiration time etc.
  </div>
)}


    {/* ONE narration line that grows across phases */}
    {(step3Phase === 3 || step3Phase === 4 || step3Phase === 5 || step3Phase === 6) && (
      <div
        className="oss-authLine is-on"
        style={{
          position: "absolute",
          left: "50%",
          top: STEP3_SUBLINE_TOP,

          transform: "translate(-50%, -50%)",
          zIndex: 60,
          pointerEvents: "none",
          textAlign: "center",
          maxWidth: 900,
          whiteSpace: "normal",
        }}
      >
        Next, Alice binds this permission to Bob&apos;s identity using Bob&apos;s public key <span className="intro-em">y</span>,
{step3Phase >= 4 && (
  <>
    {" "}Alice&apos;s secret key <span className="intro-em">{SK_A}</span>
  </>
)}
{step3Phase >= 5 && (
  <>
    {" "}and the <span className="intro-em">{M_AUTH}</span>.
  </>
)}
{step3Phase >= 6 && (
  <>
    {" "}to produce signature <span className="intro-em">{SIGMA_A}</span>.
  </>
)}

 
       {/* Mixing visual (phase 6): three “ghost” packets converge into σ_A hold position */}


        
      </div>
    )}
{/* Spooky mix swirl at σ_A spawn location (phase 6 only) */}

{/* Phase 6 uses the same progressive subline as phases 3-5 */}

{/* Phase 6 combine animation: y + sk_A + m_auth -> σ_A */}
{step3Phase === 6 && (
  <div
    className="oss-combineStage"
    style={{
      position: "absolute",
      left: sigmaHoldPos.left,
      top: sigmaHoldPos.top,
      zIndex: 62,
      pointerEvents: "none",
    }}
  >
    <div className="oss-combineRing oss-combineRing--a" />
    <div className="oss-combineRing oss-combineRing--b" />
    <div className="oss-combinePulse" />
    <div className="oss-combineOrbit oss-combineOrbit--a" />
    <div className="oss-combineToken oss-combineToken--y">y</div>
    <div className="oss-combineToken oss-combineToken--sk">sk<sub>A</sub></div>
    <div className="oss-combineToken oss-combineToken--ma">m<sub>auth</sub></div>
  </div>
)}
    {/* σ_A HOLD packet (knobbed position) */}
    {showSigma && (step3Phase === 6 || step3Phase === 7) && (
  <div
    ref={sigmaHoldRef}
    className="oss-dotHold"
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
    <img src="/packet.png" alt="" className="oss-dotPacketImg" />
    <div className="oss-dotLabel oss-dotLabel--sig">{SIGMA_A}: {visualSigmaA ?? "(…)"}</div>
  </div>
)}

{(step3Phase === 8 || step3Phase === 9) && (
  <div
    className="oss-authLine is-on"
    style={{
      position: "absolute",
      left: "50%",
      top: STEP3_SUBLINE_TOP,
      transform: "translate(-50%, -50%)",
      zIndex: 60,
      pointerEvents: "none",
      textAlign: "center",
      maxWidth: 900,
      whiteSpace: "normal",
    }}
  >
    Alice now sends <span className="intro-em">{SIGMA_A}</span> to Charlie for verification.
  </div>
)}

    {/* σ_A FLIES to Charlie */}
    {step3Phase === 8 && (
      <div
        key={`sigmaFly-${step3Phase}`}
        className="oss-dotTravel"
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
        <img src="/packet.png" alt="" className="oss-dotPacketImg" />
        <div className="oss-dotLabel oss-dotLabel--sig">{SIGMA_A}: {visualSigmaA ?? "σ_A"}</div>
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
      left: "50%",
      top: STEP4_MAIN_TOP,
      transform: "translate(-50%, -50%)",
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
      left: "50%",
      top: STEP4_SUBLINE_TOP,
      transform: "translate(-50%, -50%)",
      zIndex: 60,
      pointerEvents: "none",
      textAlign: "center",
      maxWidth: 900,
      whiteSpace: "normal",
    }}
  >
    Bob constructs a payment message <span className="intro-em">{M_PAY}</span> = (attr.1, attr.2, …, merchantID, …)
  </div>
)}

   {/* m_pay holds near Bob ONLY before sending */}
{step4Phase === 2 && (
  <div
    className="oss-dotHold"
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
    <img src="/packet.png" alt="" className="oss-dotPacketImg" />
    <div className="oss-dotLabel oss-dotLabel--sig">{M_PAY}: {visualMpay ?? "(…)"}</div>
  </div>
)}

    



    {/* ===== INSERT START: send subline + flight + landed hold ===== */}

    {/* Subline + flight happen together */}
    {step4Phase >= 3 && (
  <div
    className="oss-authLine is-on"
    style={{
      position: "absolute",
      left: "50%",
      top: STEP4_SUBLINE_TOP,
      transform: "translate(-50%, -50%)",
      zIndex: 60,
      pointerEvents: "none",
      textAlign: "center",
      maxWidth: 900,
      whiteSpace: "normal",
    }}
  >
    Bob then sends <span className="intro-em">{M_PAY}</span> to the verifier for a challenge.
  </div>
)}


    {/* m_pay flies Bob -> Charlie */}
    {step4Phase === 3 && (
      <div
        key={`mpayFly-${step4Phase}`}
        className="oss-dotTravel"
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
        <img src="/packet.png" alt="" className="oss-dotPacketImg" />
        <div className="oss-dotLabel oss-dotLabel--sig">{M_PAY}: {visualMpay ?? "(…)"}</div>
      </div>
    )}

    {/* m_pay landed + holds near verifier */}
    {step4Phase >= 4 && mpayArrivedAtCharlie && (
      <div
        className="oss-dotHold"
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
        <img src="/packet.png" alt="" className="oss-dotPacketImg" />
        <div className="oss-dotLabel oss-dotLabel--sig">{M_PAY}: {visualMpay ?? "(…)"}</div>
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
                  left: "50%",
                  top: STEP5_MAIN_TOP,
                  transform: "translate(-50%, -50%)",
                  zIndex: 60,
                  pointerEvents: "none",
                  textAlign: "center",
                  maxWidth: 900,
                }}
              >
                Step 5: Challenge selection by the Verifier
              </div>
            )}

            {/* Instruction line during toss and before advancing to Step 6 */}
            {(step5Phase === 2 || step5Phase === 3) && (
              <div
                className="oss-authLine is-on"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: STEP5_SUBLINE_TOP,
                  transform: "translate(-50%, -50%)",
                  zIndex: 60,
                  pointerEvents: "none",
                  textAlign: "center",
                  maxWidth: 900,
                  whiteSpace: "normal",
                }}
              >
The verifier then randomly chooses a bit <span className="intro-em">v ∈ {"{0,1}"}</span> to assign to <span className="intro-em">{M_PAY}</span>.
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
        if (pendingVBit !== null) setChosenVBit(pendingVBit);
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
{/* v bit is shown only inside the m_pay capsule label */}



            {/* Keep m_pay visible near Bob during Step 5 too */}
            {/* Keep m_pay parked near verifier during Step 5 */}
{mpayArrivedAtCharlie && (
  <div
    className="oss-dotHold"
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
    <img src="/packet.png" alt="" className="oss-dotPacketImg" />
    <div className="oss-dotLabel oss-dotLabel--sig">
      {mpayLabelWithBit}
    </div>
  </div>
)}

          </>
        )}

        {/* ===== STEP 6 visuals (Bob signs once) ===== */}
        {isStep6 && (
          <>
            {step6Phase >= 1 && (
              <div
                className="oss-trustText is-on"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: STEP6_MAIN_TOP,
                  transform: "translate(-50%, -50%)",
                  zIndex: 60,
                  pointerEvents: "none",
                  textAlign: "center",
                  maxWidth: 900,
                }}
              >
                Step 6: Signing by Bob
              </div>
            )}

            {(step6Phase === 2 || step6Phase === 3) && (
              <div
                className="oss-authLine is-on"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: STEP6_SUBLINE_TOP,
                  transform: "translate(-50%, -50%)",
                  zIndex: 60,
                  pointerEvents: "none",
                  textAlign: "center",
                  maxWidth: 900,
                  whiteSpace: "normal",
                }}
              >
                Verifier now sends <span className="intro-em">{M_PAY}</span> back to Bob, who now has to sign the bit chosen by the verifier.
              </div>
            )}

            {(step6Phase === 4 || step6Phase === 5 || step6Phase === 6) && (
              <div
                className="oss-authLine is-on"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: STEP6_SUBLINE_TOP,
                  transform: "translate(-50%, -50%)",
                  zIndex: 60,
                  pointerEvents: "none",
                  textAlign: "center",
                  maxWidth: 900,
                  whiteSpace: "normal",
                }}
              >
                Bob now uses <span className="intro-em">{M_PAY}</span>{step6Phase >= 5 ? <> and <span className="intro-em">{SK_B_KET}</span></> : null}{step6Phase >= 6 ? <> to produce signature <span className="intro-em">σ<sub>B</sub></span>.</> : null}
              </div>
            )}

            {step6Phase === 7 && (
              <div
                className="oss-authLine is-on"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: STEP6_SUBLINE_TOP,
                  transform: "translate(-50%, -50%)",
                  zIndex: 60,
                  pointerEvents: "none",
                  textAlign: "center",
                  maxWidth: 980,
                  whiteSpace: "normal",
                }}
              >
                Take action as Bob: attempt another signature or follow the one-shot rule.
              </div>
            )}

            {(step6Phase === 8 || step6Phase === 9) && (
              <div
                className="oss-authLine is-on"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: STEP6_SUBLINE_TOP,
                  transform: "translate(-50%, -50%)",
                  zIndex: 60,
                  pointerEvents: "none",
                  textAlign: "center",
                  maxWidth: 900,
                  whiteSpace: "normal",
                }}
              >
                {!step6BadBobPath && (
                  <>
                    Bob sends signature <span className="intro-em">σ<sub>B</sub></span> to the verifier.
                  </>
                )}
                {step6BadBobPath && (
                  <>
                    Bob cannot re-sign with consumed key, so he spoofs <span className="intro-em">σ<sub>B</sub>&prime;</span> and sends it to the verifier.
                  </>
                )}
              </div>
            )}

            {step6Phase >= 1 && step6Phase <= 5 && (
              <div
                className="oss-dotHold oss-dotHold--interactive oss-dotHold--step2"
                style={{
                  position: "absolute",
                  left: resolvedStep2PanelPos.left,
                  top: resolvedStep2PanelPos.top,
                  zIndex: 62,
                  pointerEvents: "none",
                  transition: `opacity ${STEP6_FADE_MS}ms ease`,
                  opacity: step6Phase >= 6 ? 0 : 1,
                  visibility: step6Phase >= 6 ? "hidden" : "visible",
                }}
              >
                <img src="/packet.png" alt="" className="oss-dotPacketImg" />
                <div className="oss-step2Panel">
                  <div className="oss-step1Row">
                    <span className="oss-step1Key">{SK_B_KET}</span>
                    <span className={`oss-step1Val ${step6SkBPulse ? "oss-popPulse" : ""}`}>{visualSkB ?? "0x…"}</span>
                  </div>
                  <div className="oss-step1Row">
                    <span className="oss-step1Key">y</span>
                    <span className="oss-step1Val">{visualY ?? "0x…"}</span>
                  </div>
                </div>
              </div>
            )}

            {step6Phase === 2 && (
              <div
                key={`mpayBack-${step6Phase}`}
                className="oss-dotTravel"
                onAnimationEnd={() => {
                  if (!isStep6 || step6Phase !== 2) return;
                  setStep6Phase(3);
                }}
                style={{
                  position: "absolute",
                  left: step6MpayBackPath.sx,
                  top: step6MpayBackPath.sy,
                  ["--tx" as any]: `${step6MpayBackPath.ex - step6MpayBackPath.sx}px`,
                  ["--ty" as any]: `${step6MpayBackPath.ey - step6MpayBackPath.sy}px`,
                  zIndex: 61,
                  pointerEvents: "none",
                }}
              >
                <img src="/packet.png" alt="" className="oss-dotPacketImg" />
                <div className="oss-dotLabel oss-dotLabel--sig">{mpayLabelWithBit}</div>
              </div>
            )}

            {step6Phase === 1 && (
              <div
                className="oss-dotHold"
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
                <img src="/packet.png" alt="" className="oss-dotPacketImg" />
                <div className="oss-dotLabel oss-dotLabel--sig">{mpayLabelWithBit}</div>
              </div>
            )}

            {(step6Phase === 3 || step6Phase === 4 || step6Phase === 5) && (
              <div
                className={`oss-dotHold ${step6MpayPulse ? "oss-mauthPulse" : ""}`}
                style={{
                  position: "absolute",
                  left: mpayHoldPos.left,
                  top: mpayHoldPos.top,
                  transform: "translate(-50%, -50%)",
                  zIndex: 61,
                  pointerEvents: "none",
                  transition: `opacity ${STEP6_FADE_MS}ms ease`,
                  opacity: 1,
                  visibility: "visible",
                  animation: undefined,
                  ["--tx" as any]: `0px`,
                  ["--ty" as any]: `0px`,
                }}
              >
                <img src="/packet.png" alt="" className="oss-dotPacketImg" />
                <div className="oss-dotLabel oss-dotLabel--sig">{mpayLabelWithBit}</div>
              </div>
            )}

            {step6Phase === 6 && (
              <div
                className="oss-combineStage"
                style={{
                  position: "absolute",
                  left: mpayHoldPos.left,
                  top: mpayHoldPos.top,
                  zIndex: 62,
                  pointerEvents: "none",
                }}
              >
                <div className="oss-combineRing oss-combineRing--a" />
                <div className="oss-combineRing oss-combineRing--b" />
                <div className="oss-combinePulse" />
                <div className="oss-combineOrbit oss-combineOrbit--a" />
                <div className="oss-combineToken oss-combineToken--y">{M_PAY}</div>
                <div className="oss-combineToken oss-combineToken--sk">{SK_B_KET}</div>
              </div>
            )}

            {step6ShowSigma && step6Phase === 7 && (
              <div
                className="oss-dotHold"
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
                <img src="/packet.png" alt="" className="oss-dotPacketImg" />
                <div className="oss-dotLabel oss-dotLabel--sig">
                  {!step6BadBobPath ? <>σ<sub>B</sub>: {visualSigmaB ?? "(…)"}</> : <>σ<sub>B</sub>&prime;: spoofed</>}
                </div>
              </div>
            )}

            {step6Phase === 7 && (
              <div className="oss-step6ChoiceInline">
                <button
                  type="button"
                  className="oss-bobChoiceBtn"
                  onClick={() => {
                    setStep6BadBobPath(false);
                    setStep7EvilAttempt(false);
                    setStep7ReplayFailed(false);
                    setStep6Phase(8);
                  }}
                >
                  Be good Bob
                </button>
                <button
                  type="button"
                  className="oss-bobChoiceBtn oss-bobChoiceBtn--danger"
                  onClick={() => {
                    setStep6BadBobPath(true);
                    setStep7EvilAttempt(true);
                    setStep7ReplayFailed(false);
                    setStep6Phase(8);
                  }}
                >
                  Be bad Bob
                </button>
              </div>
            )}

            {step6BadBobPath && step6Phase >= 8 && (
              <div
                className="oss-step6ConsumedTag"
                style={{
                  left: resolvedStep2PanelPos.left,
                  top: resolvedStep2PanelPos.top - 98,
                }}
              >
                |sk<sub>B</sub>&#10217; consumed
              </div>
            )}

            {step6Phase === 8 && (
              <div
                key={`sigmaBFly-${step6Phase}`}
                className="oss-dotTravel"
                onAnimationEnd={() => {
                  if (!isStep6 || step6Phase !== 8) return;
                  setSigmaBArrivedAtCharlie(true);
                  setStep6Phase(9);
                }}
                style={{
                  position: "absolute",
                  left: step6SigmaBPath.sx,
                  top: step6SigmaBPath.sy,
                  ["--tx" as any]: `${step6SigmaBPath.ex - step6SigmaBPath.sx}px`,
                  ["--ty" as any]: `${step6SigmaBPath.ey - step6SigmaBPath.sy}px`,
                  zIndex: 61,
                  pointerEvents: "none",
                }}
              >
                <img src="/packet.png" alt="" className="oss-dotPacketImg" />
                <div className="oss-dotLabel oss-dotLabel--sig">
                  {!step6BadBobPath ? <>σ<sub>B</sub>: {visualSigmaB ?? "(…)"}</> : <>σ<sub>B</sub>&prime;: spoofed</>}
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== STEP 7 visuals (verification) ===== */}
        {isStep7 && (
          <>
            {step7Phase >= 1 && (
              <div
                className="oss-trustText is-on"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: STEP7_MAIN_TOP,
                  transform: "translate(-50%, -50%)",
                  zIndex: 60,
                  pointerEvents: "none",
                  textAlign: "center",
                  maxWidth: 900,
                }}
              >
                Step 7: Verification
              </div>
            )}

            {step7Phase === 2 && (
              <div
                className="oss-authLine is-on"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: STEP7_SUBLINE_TOP,
                  transform: "translate(-50%, -50%)",
                  zIndex: 60,
                  pointerEvents: "none",
                  textAlign: "center",
                  maxWidth: 900,
                  whiteSpace: "normal",
                }}
              >
                {!step7EvilAttempt && "Then, the verifier verifies the signatures."}
                {step7EvilAttempt && (
                  <>
                    Bob attempts replay/spoofing to buy a Mercedes; verifier runs freshness checks.
                  </>
                )}
              </div>
            )}

            {step7Phase >= 2 && step7LaptopPos.left > 0 && (
              <div
                className="oss-verifyLaptop"
                style={{
                  left: step7LaptopPos.left,
                  top: step7LaptopPos.top,
                }}
              >
                <div className="oss-verifyLaptopScreen">
                  {!step7EvilAttempt ? (
                    <>
                      <div className="oss-verifyLine oss-verifyLine--a">
                        verify(σ<sub>A</sub>, m<sub>auth</sub>, y) = true
                      </div>
                      <div className="oss-verifyLine oss-verifyLine--b">
                        verify(σ<sub>B</sub>, m<sub>pay</sub>[v], pk<sub>B</sub>) = true
                      </div>
                      <div className="oss-verifyLine oss-verifyLine--c">
                        bind_check(m<sub>auth</sub> -&gt; m<sub>pay</sub>, v) = true
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="oss-verifyLine oss-verifyLine--a">
                        verify(σ<sub>A</sub>, m<sub>auth</sub>, y) = true
                      </div>
                      <div className="oss-verifyLine oss-verifyLine--b">
                        verify(σ<sub>B</sub>&prime;, m<sub>pay</sub>&prime;, pk<sub>B</sub>) = true
                      </div>
                      <div className="oss-verifyLine oss-verifyLine--c">
                        one_shot_freshness(sk<sub>B</sub>, nonce, v) = false
                      </div>
                    </>
                  )}
                  <div className="oss-verifyPulse">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div
                    className={`oss-verifyStatus ${
                      step7EvilAttempt
                        ? (step7ReplayFailed ? "is-fail" : "is-pending")
                        : (step7VerifyDone ? "is-done" : "is-pending")
                    }`}
                  >
                    {!step7EvilAttempt && (step7VerifyDone ? "SIGNATURES VERIFIED" : "VERIFYING SIGNATURES...")}
                    {step7EvilAttempt && (!step7ReplayFailed ? "VERIFYING SIGNATURES..." : "VERIFICATION FAILED (ONE-SHOT KEY CONSUMED)")}
                  </div>
                </div>
                <div className="oss-verifyLaptopBase" />
              </div>
            )}

            {step7EvilAttempt && (
              <div
                className="oss-step7SpentTag"
                style={{
                  left: resolvedStep2PanelPos.left,
                  top: resolvedStep2PanelPos.top - 98,
                }}
              >
                |sk<sub>B</sub>&#10217; consumed
              </div>
            )}
          </>
        )}

        {/* ===== STEP 8 visuals (execution outcome) ===== */}
        {isStep8 && (
          <>
            <div
              className="oss-trustText is-on"
              style={{
                position: "absolute",
                left: "50%",
                top: STEP8_MAIN_TOP,
                transform: "translate(-50%, -50%)",
                zIndex: 60,
                pointerEvents: "none",
                textAlign: "center",
                maxWidth: 920,
              }}
            >
              Step 8: Token transfer
            </div>

            <div
              className="oss-authLine is-on"
              style={{
                position: "absolute",
                left: "50%",
                top: STEP8_SUBLINE_TOP,
                transform: "translate(-50%, -50%)",
                zIndex: 60,
                pointerEvents: "none",
                textAlign: "center",
                maxWidth: 980,
                whiteSpace: "normal",
              }}
            >
              {!step7ReplayFailed && (
                <>
                  Verification succeeds. The delegated token is transferred to the merchant.
                </>
              )}
              {step7ReplayFailed && (
                <>
                  Replay detected and rejected. Token is <span className="intro-em">not transferred</span>.
                </>
              )}
            </div>

            {!step7ReplayFailed && (step8CoinFlying || step8CoinArrived) && (
              <div
                className={step8CoinFlying ? "oss-dotTravel oss-step8CoinTravel" : "oss-step8CoinStatic"}
                onAnimationEnd={() => {
                  if (!step8CoinFlying) return;
                  setStep8CoinFlying(false);
                  setStep8CoinArrived(true);
                }}
                style={{
                  position: "absolute",
                  left: step8CoinFlying ? step8CoinPath.sx : step8CoinPath.ex,
                  top: step8CoinFlying ? step8CoinPath.sy : step8CoinPath.ey,
                  ["--tx" as any]: `${step8CoinPath.ex - step8CoinPath.sx}px`,
                  ["--ty" as any]: `${step8CoinPath.ey - step8CoinPath.sy}px`,
                  zIndex: 63,
                  pointerEvents: "none",
                }}
              >
                <img src="/coin.png" alt="" className={`oss-step8CoinImg ${step8CoinArrived ? "is-pop" : ""}`} />
              </div>
            )}

            {step7ReplayFailed && (
              <div className="oss-step8Outcome is-fail">TRANSFER BLOCKED</div>
            )}
          </>
        )}




</div>

{/* σ_A stays parked near Charlie; keep mounted to avoid re-pop on phase changes */}
{sigmaArrivedAtCharlie && (
  <div
    className="oss-dotHold oss-dotHold--sigmaParked"
    style={{
      position: "absolute",
      left: sigmaCharliePos.left,
      top: sigmaCharliePos.top,
      transform: "translate(-50%, -50%)",
      zIndex: 61,
      pointerEvents: "none",
      opacity: shouldShowSigmaAtCharlie ? 1 : 0,
      visibility: shouldShowSigmaAtCharlie ? "visible" : "hidden",
      ["--tx" as any]: `0px`,
      ["--ty" as any]: `0px`,
    }}
  >
    <img src="/packet.png" alt="" className="oss-dotPacketImg oss-dotPacketImg--steady" />
    <div className="oss-dotLabel oss-dotLabel--sig">{SIGMA_A}: {visualSigmaA ?? "σ_A"}</div>
  </div>
)}

{sigmaBArrivedAtCharlie && (
  <div
    className="oss-dotHold"
    style={{
      position: "absolute",
      left: mpayCharliePos.left,
      top: mpayCharliePos.top,
      transform: "translate(-50%, -50%)",
      zIndex: 62,
      pointerEvents: "none",
      opacity: shouldShowSigmaBAtCharlie ? 1 : 0,
      visibility: shouldShowSigmaBAtCharlie ? "visible" : "hidden",
      ["--tx" as any]: `0px`,
      ["--ty" as any]: `0px`,
    }}
  >
    <img src="/packet.png" alt="" className="oss-dotPacketImg" />
    <div className="oss-dotLabel oss-dotLabel--sig">σ<sub>B</sub>: {visualSigmaB ?? "(…)"}</div>
  </div>
)}






      {/* Avatars */}
      <button
  ref={aliceRef}
  className={`oss-avatarBtn oss-avatar-alice ${isIntro && introPhase === 1 ? "is-pop" : ""}`}
  type="button"
  aria-label="Alice"
  style={pinToStyle(PIN_ALICE, NUDGE_ALICE)}
>
        <img className="oss-avatarOnly" src="/avatar-alice.png" alt="Alice" />
        <div className="oss-avatarLabel">
         
        </div>
      </button>

      <button
  ref={bobRef}
  className={`oss-avatarBtn oss-avatar-bob ${isIntro && introPhase === 2 ? "is-pop" : ""}`}
  type="button"
  aria-label="Bob"
  style={pinToStyle(PIN_BOB, NUDGE_BOB)}
>
        <img className="oss-avatarOnly" src="/avatar-bob.png" alt="Bob" />
        <div className="oss-avatarLabel">
          
  
        </div>
      </button>

      <button
  ref={charlieRef}
  className={`oss-avatarBtn oss-avatar-charlie ${isIntro && introPhase === 4 ? "is-pop" : ""}`}
  type="button"
  aria-label="Charlie"
  style={pinToStyle(PIN_CHARLIE, NUDGE_CHARLIE)}
>
        <img className="oss-avatarOnly" src="/avatar-charlie.png" alt="Charlie" />
        <div className="oss-avatarLabel">
         
      
        </div>
      </button>

      <button
  ref={merchantRef}
  className={`oss-avatarBtn oss-avatar-merchant ${isIntro && introPhase === 3 ? "is-pop" : ""}`}
  type="button"
  aria-label="Merchant"
  style={pinToStyle(PIN_MERCHANT, NUDGE_MERCHANT)}
>
        <img className="oss-avatarOnly" src="/avatar-merchant.png" alt="Merchant" />
        <div className="oss-avatarLabel">
         
        </div>
      </button>

      {currentReadMore && !showReadMoreModal && (
        <div className={`oss-readMore ${showReadMore ? "is-open" : ""}`}>
          <button
            type="button"
            className="oss-readMoreToggle"
            aria-expanded={showReadMore}
            aria-controls="ossReadMorePanel"
            onClick={() => setShowReadMore((s) => !s)}
          >
            {showReadMore ? "Hide Notes" : "Read Notes"}
          </button>

          {showReadMore && (
            <div id="ossReadMorePanel" className="oss-readMorePanel">
              <div className="oss-readMoreTitle">{currentReadMore.title}</div>
              {currentReadMore.body.map((paragraph, idx) => (
                <p key={`${stageId}-${idx}`} className="oss-readMoreText">
                  {paragraph}
                </p>
              ))}
              <div className="oss-readMoreActions">
                <button
                  type="button"
                  className="oss-readMoreFullBtn"
                  onClick={() => {
                    setShowReadMore(false);
                    setShowReadMoreModal(true);
                  }}
                >
                  Open full notes
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showReadMoreModal && currentReadMore && (
        <div
          className="oss-readMoreModalBackdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowReadMoreModal(false)}
        >
          <div className="oss-readMoreModal" onClick={(event) => event.stopPropagation()}>
            <div className="oss-readMoreModalHead">
              <div className="oss-readMoreTitle">{currentReadMore.title}</div>
              <button
                type="button"
                className="oss-readMoreClose"
                onClick={() => setShowReadMoreModal(false)}
                aria-label="Close full notes"
              >
                ✕
              </button>
            </div>

            <div className="oss-readMoreModalBody">
              {currentReadMore.body.map((paragraph, idx) => (
                <p key={`${stageId}-${idx}`} className="oss-readMoreText">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stepper */}
      <div className="oss-stepper">
        <button type="button" className="stepper-btn" onClick={onFlowBack} disabled={flowIdx === 0}>
          ← Back
        </button>

        <div className="stepper-mid">
          <div className="oss-stepJumps">
            {flowItems.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                className={`oss-stepJump ${idx === flowIdx ? "is-active" : ""}`}
                onClick={() => onFlowJump(idx)}
              >
                {item.label}
              </button>
            ))}
          </div>
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
            if (isIntro) {
              if (introStoryPhase < 5) {
                setIntroStoryPhase((p) => ((p + 1) as 1 | 2 | 3 | 4 | 5));
                return;
              }
              onFlowNext();
              return;
            }

            // ===== STEP 0 =====
            if (isPreAuth) {
              if (step0Phase === 1) {
                setStep0Phase(2);
                return;
              }
              if (step0Phase === 4) {
                setStep0Phase(5);
                return;
              }
              if (step0Phase === 9) {
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
              if (step3Phase === 7) { setStep3Phase(8); return; }
              if (step3Phase === 8) return;
              if (step3Phase === 9) { onFlowNext(); return; }
              return;
            }
             // ===== STEP 4 =====
             if (isStep4) {
              if (step4Phase === 1) {
                setStep4Phase(2);
                setVisualMpay("(attr.1, attr.2, …, merchantID, …)");
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
    setStep5Phase(2);
    return;
    
  }

  if (step5Phase === 2) return; // blocked while choosing

  if (step5Phase === 3) {
    onFlowNext();
    return;
  }

  return;
}

    if (isStep6) {
      if (step6Phase === 1) {
        setStep6Phase(2);
        return;
      }
      if (step6Phase === 3) {
        setStep6Phase(4);
        return;
      }
  if (step6Phase === 9) {
    onFlowNext();
    return;
  }
  return;
}

    if (isStep7) {
      if (step7Phase === 1) {
        setStep7Phase(2);
        return;
      }
      if (step7Phase === 2) {
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
