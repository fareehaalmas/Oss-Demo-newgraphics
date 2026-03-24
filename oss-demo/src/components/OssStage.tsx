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
  const backLandingRef = useRef<string | null>(null);
  const navEpochRef = useRef(0);


  // ===== Intro timeline (gated by Start) =====
  const [introStarted, setIntroStarted] = useState(false);
  const [introPhase, setIntroPhase] = useState(0);
  const [introStoryPhase, setIntroStoryPhase] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [introPublicSlowReady, setIntroPublicSlowReady] = useState(false);
  const [introSkipTimeline, setIntroSkipTimeline] = useState(false);
  const [introRunId, setIntroRunId] = useState(0);

  const consumeBackLanding = (step: string) => {
    if (backLandingRef.current !== step) return false;
    backLandingRef.current = null;
    return true;
  };

  useEffect(() => {
    if (!isIntro) return;
    if (consumeBackLanding("intro")) {
      setIntroSkipTimeline(true);
      setIntroStarted(true);
      setIntroPhase(7);
      setIntroStoryPhase(5);
      setIntroPublicSlowReady(true);
      return;
    }
    setIntroSkipTimeline(false);
    setIntroStarted(false);
    setIntroPhase(0);
    setIntroStoryPhase(0);
    setIntroPublicSlowReady(false);
  }, [isIntro, flowIdx]);

  useEffect(() => {
    if (!isIntro || !introStarted) return;
    if (introStoryPhase !== 2) {
      setIntroPublicSlowReady(false);
      return;
    }
    setIntroPublicSlowReady(false);
    const t = window.setTimeout(() => setIntroPublicSlowReady(true), 1600);
    return () => window.clearTimeout(t);
  }, [isIntro, introStarted, introStoryPhase]);

  useEffect(() => {
    if (!isIntro) return;
    if (!introStarted) return;
    if (introSkipTimeline) return;

    setIntroPhase(0);

    const t0 = window.setTimeout(() => setIntroPhase(1), 300);
    const t1 = window.setTimeout(() => setIntroPhase(2), 1600);
    const t2 = window.setTimeout(() => setIntroPhase(3), 3000);
    const t3 = window.setTimeout(() => setIntroPhase(4), 4300);
    const t4 = window.setTimeout(() => setIntroPhase(5), 5700);
    const t5 = window.setTimeout(() => setIntroPhase(6), 7000);
    const t6 = window.setTimeout(() => setIntroPhase(7), 8400);

    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
      window.clearTimeout(t5);
      window.clearTimeout(t6);
    };
  }, [isIntro, introStarted, introSkipTimeline, introRunId]);

  // ===== Step 0 beats =====
  // 0 enter
  // 1 step title
  // 2 Alice chooses/authenticates Bob (sub-line)
  // 3 auth request line
  // 4 auth packet flies
  // 5 auth packet landed at Bob (Next enabled)
  // 6 nonce line
  // 7 nonce packet flies
  // 8 nonce packet landed at Alice (Sign enabled)
  // 9 signed response flies to Bob
  // 10 response packet landed at Bob (Next advances)
  const [step0Phase, setStep0Phase] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>(0);
  const [visualNonce, setVisualNonce] = useState<string | null>(null);
  const [visualSig, setVisualSig] = useState<string | null>(null);

  useEffect(() => {
    if (!isPreAuth) {
      setStep0Phase(0);
      return;
    }
    if (consumeBackLanding("step0_preprocessing")) {
      const n = visualNonce ?? `0x${randomHex(12)}`;
      setVisualNonce(n);
      setVisualSig((prev) => prev ?? fauxSignFromNonce(n));
      setStep0Phase(10);
      return;
    }
    setStep0Phase(0);
    setVisualNonce(null);
    setVisualSig(null);

    const t1 = window.setTimeout(() => setStep0Phase(1), 300);
    return () => window.clearTimeout(t1);
  }, [isPreAuth]);

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
type Fig3Point = { x: number; chi: number };
type Fig3Segment = {
  start: number;
  end: number;
  color: string;
  legend: string;
  explain: string;
  marker?: string;
};
const FIG3_POINTS: Fig3Point[] = [
  { x: 1, chi: 1 },
  { x: 756, chi: 4 },
  { x: 2263, chi: 8 },
  { x: 3016, chi: 16 },
  { x: 7537, chi: 63 },
  { x: 7914, chi: 100 },
  { x: 14315, chi: 8 },
  { x: 18836, chi: 8 },
  { x: 20100, chi: 16 },
  { x: 21400, chi: 4 },
  { x: 22500, chi: 2 },
  { x: 30142, chi: 2 },
  { x: 37400, chi: 4 },
  { x: 38600, chi: 8 },
  { x: 39150, chi: 16 },
  { x: 39750, chi: 8 },
  { x: 41449, chi: 8 },
  { x: 45969, chi: 8 },
];
const FIG3_SEGMENTS: Fig3Segment[] = [
  { start: 1, end: 1, color: "#1f2fff", marker: "1", legend: "Circuit 1-1: Hadamard (10 H)", explain: "Start in uniform superposition (Hadamard layer)." },
  { start: 2, end: 4521, color: "#0c9d9c", legend: "Circuit 2-4521: GGM_Simon_32/64", explain: "Entanglement grows and bond dimension climbs in steps." },
  { start: 4522, end: 9794, color: "#ff8a00", legend: "Circuit 4522-9794: U(Graff(r,n))", explain: "Unitary block drives rapid growth up to high χ." },
  { start: 9795, end: 14314, color: "#06a21a", legend: "Circuit 9795-14314: GGM_Simon_32/64†", explain: "Adjoint section stabilizes before measurement." },
  { start: 14315, end: 14315, color: "#ff003e", marker: "8", legend: "Circuit 14315: Measure (5 M) + Hadamard (10 H)", explain: "Measurement point: classical pk is extracted; post-measurement |sk_B⟩ remains with Bob." },
  { start: 14316, end: 18835, color: "#8f1aa4", legend: "Circuit 14316-18835: GGM_Simon_32/64 (sign)", explain: "Signing phase begins from retained post-measurement state." },
  { start: 18836, end: 30141, color: "#d59a00", legend: "Circuit 18836-30141: U(Gr(r,n))^T", explain: "Inverse structured unitary lowers complexity." },
  { start: 30142, end: 30142, color: "#b71222", marker: "2", legend: "Circuit 30142: Oracle (X/Z/C X)", explain: "Oracle check pivot during signing verification path." },
  { start: 30143, end: 41448, color: "#0d7696", legend: "Circuit 30143-41448: U(Gr(r,n))^T†", explain: "Reverse/equilibrate block before output." },
  { start: 41449, end: 45968, color: "#d013c4", legend: "Circuit 41449-45968: GGM_Simon_32/64† (sign)", explain: "Final signing segment at low bond dimension." },
  { start: 45969, end: 45969, color: "#6d8f2b", marker: "1", legend: "Circuit 45969: Hadamard (10 H) + Measure (6 M)", explain: "Final measurement closes the run." },
];
const [fig3Open, setFig3Open] = useState(false);
const [fig3Mode, setFig3Mode] = useState<"keygen" | "sign" | null>(null);
const [fig3SegmentIdx, setFig3SegmentIdx] = useState(0);
const [fig3QubitCount, setFig3QubitCount] = useState(10);

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
const [sigmaAInBobPanel, setSigmaAInBobPanel] = useState(false);
const step6SkipAutoAdvanceOnceRef = useRef(false);
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
const [step8Phase, setStep8Phase] = useState<0 | 1 | 2 | 3>(0);
const [step8RetryAttemptId, setStep8RetryAttemptId] = useState(0);

const [sigmaArrivedAtCharlie, setSigmaArrivedAtCharlie] = useState(false);
const STEP6_FADE_MS = 700;
const STEP_POP_MS = 1400;
const liveRef = useRef({
  isPreAuth: false,
  step0Phase: 0 as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
  isBobKeygen: false,
  step2Phase: 0 as 0 | 1 | 2 | 3 | 4 | 5 | 6,
  visualY: null as string | null,
  isAliceSigning: false,
  step3Phase: 0 as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
  isStep4: false,
  step4Phase: 0 as 0 | 1 | 2 | 3 | 4,
  isStep5: false,
  step5Phase: 0 as 0 | 1 | 2 | 3 | 4,
  pendingVBit: null as 0 | 1 | null,
  isStep6: false,
  step6Phase: 0 as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
  isStep8: false,
  step8CoinFlying: false,
});
liveRef.current = {
  isPreAuth,
  step0Phase,
  isBobKeygen,
  step2Phase,
  visualY,
  isAliceSigning,
  step3Phase,
  isStep4,
  step4Phase,
  isStep5,
  step5Phase,
  pendingVBit,
  isStep6,
  step6Phase,
  isStep8,
  step8CoinFlying,
};

  const readMoreNotes: Record<string, { title: string; body: string[] }> = {
    intro: {
      title: "Why this setup first?",
      body: [
        "The classical approach to one-time delegation requires a shared ledger — every party connects to a common record that tracks whether a signature has already been used. Shared ledgers have two serious problems. First, they can be manipulated: a tampered block can erase the record of a used signature, allowing it to be replayed. Second, maintaining consensus across all parties is expensive — current blockchain systems consume enormous amounts of energy with significant environmental cost.",
        "BTQ's solution changes the model entirely. Only Bob needs access to a quantum computer. The one-shot property is enforced by the physics of the quantum signing state itself — not by any external record. And because all communication between parties remains classical, the protocol requires no quantum channels, keeping resource costs low.",
        "This demo setup setup gives us a clean classical framing of the delegation problem — before we introduce any quantum machinery. Here Alice, Bob, Charlie, and the merchant are geographically separated parties with no shared infrastructure, and are mutually untrusted parties. This demo is kept lightweight and explicit — so the verifier has exactly the structure it needs, and nothing more. "
      ],
    },
    step0_preprocessing: {
      title: "Step 0: Bob selection and authentication",
      body: [
        "Alice opens the session by sending Bob an authorisation request. This is a classical authenticated channel exchange — no quantum resources are involved, and no other parties participate in this step. Only Alice and Bob perform this handshake because they are the two principals in the delegation relationship: Alice is the one granting rights, and Bob is the one who will later act on her behalf. The merchant and verifier are downstream participants who enter only after delegation is already established — they have no role in setting it up.",
        "Bob returns a fresh nonce so that replay attacks cannot be trivially mounted: any intercepted request bound to an old nonce will be rejected.",
       
     "Alice then signs the challenge tuple (op, nonce, msg) with her classical key, proving she initiated the delegation request.",
     "This step is purely about authentication. It establishes that Alice is who she claims to be and that she genuinely intends to delegate. It is entirely separate from the OSS signature exchange that follows — the nonce and classical authenticated signature produced here play no role in the quantum signing steps."
      ],
    },
    step1_keygen: {
      title: "Step 1: Alice’s classical PQC key setup",
      body: [
        "Alice runs PQC.gen using Dilithium to produce a verification key vk_A and a secret key sk_A. She keeps sk_A private and makes vk_A available to any verifier ahead of time. This keypair serves one specific role in the protocol: it allows the verifier to confirm at the end that the authorisation message genuinely came from Alice, and not from someone impersonating her. It is a standard long- term signing key and can be think of it as Alice's identity credential for this system.",
       "Dilithium is a lattice-based signature scheme standardised by NIST as part of its post-quantum cryptography process. Its security holds against both classical and quantum adversaries. This matters here because the whole point of the system is to operate in a world where quantum computers exist — using a classically-secure scheme for Alice's keypair would undermine her authenticity guarantees before the OSS component even comes into play. Dilithium ensures that even an attacker with a quantum computer cannot forge Alice's authorisation.",
       "It is worth noting that this step involves no quantum resources on Alice's side. Dilithium runs entirely on classical hardware — the post-quantum label refers to its resistance to quantum attacks."
      ],
    },
    step2_bob_keygen: {
      title: "Step 2: Bob’s quantum resource and public value",
      body: [
        "Bob runs gen.crs on his quantum computer to produce the quantum signing state |sk_B⟩ and the classical public value y. The quantum signing state is kept private — it is the resource that will be consumed during the OSS signing step. The key pair is generated through a quantum circuit that begins in a uniform superposition over a large set of inputs. The circuit applies a special structure that ensures the proof of security. Measuring the y register collapses the state: y becomes the classical public key, and the remaining partially measured quantum state |sk_B⟩ becomes the secret signing key. The public key y is therefore a classical value that encodes the geometry of the information remaining in the quantum secret key, while the signing state holds the quantum information needed to produce a valid signature. ",
        "The classical value y is Bob's delegation key — it is what Alice will sign in the next step to formally grant Bob the right to act on her behalf. It is also what the verifier will later use to check Bob's signature, confirming that the signing right was legitimately delegated by Alice. Once Alice has received y and issued her delegation, she can go offline entirely. The protocol does not depend on her presence during signing or verification. This is one of the practical strengths of the construction: the delegation is self-contained in Alice's signature, so the system keeps working without her being available."
      ],
    },
    step3_alice_signing: {
      title: "Step 3: Alice creates m_auth",
      body: [
        "Alice constructs m_auth as her delegation message — not a payment instruction, but a statement of the form: I authorise the holder of public key y to sign on my behalf, subject to the following constraints. The attributes she includes, such as maximum amount, currency, and merchant identity, define the exact boundaries of what Bob is permitted to do.",
        "Alice then signs m_auth together with y using her PQC secret key sk_A, producing the classical signature σ_A. This is a standard Dilithium signing operation — the same scheme used in Step 1. Including y in the signed payload is what cryptographically binds the delegation to Bob specifically: only the holder of the quantum signing state corresponding to y can act on it. σ_A is then sent to the verifier, Charlie, who will hold it until Bob presents a his signature. At that point Charlie uses vk_A to confirm that the delegation genuinely came from Alice."
      ],
    },
    step4_bob_mpay: {
      title: "Step 4: Bob constructs payment token",
      body: [
        "Bob prepares m_pay by assembling the transaction details — merchant identity, amount, currency, timestamp, and transaction ID. This is the actual payment message that will be signed in the next step using the quantum signing state.",
        "This step is purely about constructing a well-formed, attribute-bound payment object. Once m_pay is ready, Bob sends it to the verifier to receive a challenge.",
      
      ],
    },
    step5_verifier_bit: {
      title: "Step 5: Verifier challenge bit",
      body: [
        "The verifier reads the content of m_pay and selects a challenge bit v ∈ {0,1}. This bit is determined by the verifier based on the payment message Bob wants to sign — it is tied to the specific transaction details such as the amount and merchant information. In the OSS construction, Bob is permitted to choose the message bit himself. Here in the demo, we give that role to the verifier: the challenge is issued externally and based on m_pay, so that the resulting signature is tightly coupled to this specific transaction and cannot be reused for a different one.."
      ],
    },
    step6_bob_sign_once: {
      title: "Step 6: Bob computes sigma_B once",
      body: [
        "After receiving m_pay with the challenge bit v, Bob measures his quantum signing state |sk_B⟩ according to v to produce the signature σ_B. This measurement consumes the quantum state entirely — it cannot be reused or re- measured. This is where the one-shot property is enforced. The act of signing destroys the signing state, making it physically impossible for Bob to produce a second valid signature regardless of intent. The result σ_B is sent to Charlie, who will verify it against Alice's earlier delegation signature σ_A and the assigned challenge bit v."
      ],
    },
    step7_verify: {
      title: "Step 7: Verifier acceptance test",
      body: [
        "Charlie runs three checks. First, he verifies σ_A against vk_A to confirm that m_auth and y were genuinely signed by Alice. Second, he verifies σ_B against y to confirm that the quantum signature is valid for m_pay under the challenge bit v. Third, he checks that m_pay is consistent with the constraints specified in m_auth — that the payment falls within what Alice actually authorised.If any component fails, the transaction is rejected entirely. The PQC scheme ensures Alice's delegation cannot be forged, and the one-shot nature of the quantum signing state ensures Bob cannot produce a second valid signature for a different challenge bit. Together these two properties are what make the full verification meaningful."
      ],
    },
    step8_execute: {
      title: "Step 8: Final execution",
      body: [
        "With successful verification, Charlie approves the transaction and the payment is settled to the merchant. No further coordination between parties is needed. This completes the delegation lifecycle. The entire protocol — from Alice's authorisation to Bob's signature to the verifier's checks — runs without any shared ledger or global consensus. Each step is local, and the full audit trail is contained in σ_A, σ_B, m_auth, and m_pay, which together provide a self-contained and verifiable record of the transaction. Compare this to the classical blockchain approach: there, completing a delegated transaction would require broadcasting to a network, waiting for consensus, and updating a global ledger that every participant must trust and maintain. Here, none of that is needed. The one-shot property of the quantum signing state replaces the ledger entirely — security comes from physics, not from infrastructure."
      ],
    },
  };

  const currentReadMore = readMoreNotes[stageId];
  const noteCitation = {
    text: "Omri Shmueli and Mark Zhandry. On one-shot signatures, quantum vs classical binding, and obfuscating permutations. Cryptology ePrint Archive, 2025.",
    url: "https://arxiv.org/abs/2507.12456",
  };
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
    if (consumeBackLanding("step1_keygen")) {
      if (!visualVkA || !visualSkA) {
        const kp = fauxPqcKeypair();
        setVisualVkA(kp.vk);
        setVisualSkA(kp.sk);
      }
      setStep1Phase(4);
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
    if (consumeBackLanding("step2_bob_keygen")) {
      const nextSkB = visualSkB ?? `0x${randomHex(32)}`;
      const nextY = visualY ?? `0x${randomHex(24)}`;
      setVisualSkB(nextSkB);
      setVisualY(nextY);
      setAliceY((prev) => prev ?? nextY);
      setStep2Phase(6);
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
    if (consumeBackLanding("step3_alice_signing")) {
      setVisualMauth((prev) => prev ?? "(attr.1, attr.2, …)");
      setVisualSigmaA((prev) => prev ?? `0x${randomHex(24)}`);
      setSigmaArrivedAtCharlie(true);
      setSigmaAInBobPanel(true);
      setHideAlicePanel(true);
      setHideMauthHold(true);
      setShowSigma(false);
      setStep3Phase(9);
      return;
    }
  
    setStep3Phase(0);
    setSigmaArrivedAtCharlie(false);
    setVisualMauth("(attr.1, attr.2, …)");
    setVisualSigmaA(`0x${randomHex(24)}`);
    setHideAlicePanel(false);
    setHideMauthHold(false);
    setShowSigma(false);
    setSigmaAInBobPanel(false);
  
    const t = window.setTimeout(() => setStep3Phase(1), 250);
    return () => window.clearTimeout(t);
  }, [isAliceSigning]);
  
  
    // Step 4 init
    useEffect(() => {
      if (!isStep4) {
        setStep4Phase(0);
        return;
      }
      if (consumeBackLanding("step4_bob_mpay")) {
        setVisualMpay((prev) => prev ?? "(attr.1, attr.2, …, merchantID, …)");
        setMpayArrivedAtCharlie(true);
        setSigmaAInBobPanel(true);
        setStep4Phase(4);
        return;
      }
      setStep4Phase(0);
      setVisualMpay(null);
      setMpayArrivedAtCharlie(false);
      setSigmaAInBobPanel(true);
      if (!visualSigmaA) setVisualSigmaA(`0x${randomHex(24)}`);
      if (!visualSkB) setVisualSkB(`0x${randomHex(32)}`);
      if (!visualY) setVisualY(`0x${randomHex(24)}`);
  
      const t = window.setTimeout(() => setStep4Phase(1), 250);
      return () => window.clearTimeout(t);
    }, [isStep4, visualSigmaA, visualSkB, visualY]);
  
    useEffect(() => {
      if (!isStep5) {
        setStep5Phase(0);
        return;
      }
      if (consumeBackLanding("step5_verifier_bit")) {
        const bit = chosenVBit ?? 0;
        setChosenVBit(bit);
        setPendingVBit(bit);
        setStep5Phase(3);
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
      if (consumeBackLanding("step6_bob_sign_once")) {
        setVisualSigmaB((prev) => prev ?? `0x${randomHex(24)}`);
        setStep6ShowSigma(true);
        setSigmaBArrivedAtCharlie(true);
        setStep6Phase(9);
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
      if (!isBobKeygen || step2Phase !== 3) return;
      setFig3Open(true);
      setFig3Mode("keygen");
      setFig3SegmentIdx(0);
      setBobKeygenStatus("running");
      const tStatus = window.setTimeout(() => setBobKeygenStatus("generating"), 900);
      return () => window.clearTimeout(tStatus);
    }, [isBobKeygen, step2Phase]);

    useEffect(() => {
      if (!isStep7) {
        setStep7Phase(0);
        setStep7VerifyDone(false);
        return;
      }
      if (consumeBackLanding("step7_verify")) {
        setStep7Phase(2);
        setStep7EvilAttempt(step6BadBobPath);
        if (step6BadBobPath) {
          setStep7VerifyDone(false);
          setStep7ReplayFailed(true);
        } else {
          setStep7VerifyDone(true);
          setStep7ReplayFailed(false);
        }
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
      if (!isStep8) {
        setStep8Phase(0);
        return;
      }
      if (consumeBackLanding("step8_execute")) {
        setStep8Phase(step7ReplayFailed ? 3 : 2);
        return;
      }
      setStep8Phase(step7ReplayFailed ? 3 : 2);
    }, [isStep8, step7ReplayFailed]);

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
      if (step6SkipAutoAdvanceOnceRef.current) {
        step6SkipAutoAdvanceOnceRef.current = false;
        return;
      }
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
        setFig3Open(true);
        setFig3Mode("sign");
        setFig3SegmentIdx(5);
      }, 2000);
      return () => window.clearTimeout(t);
    }, [isStep6, step6Phase]);

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
  // Step 3: σ_A to Bob path (simultaneous publish animation)
  const [sigmaAToBobPath, setSigmaAToBobPath] = useState<{ sx: number; sy: number; ex: number; ey: number }>(
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
    ex: (() => {
      const targetX = mCx + 70;
      const stopT = 0.82; // stop earlier on the same diagonal
      return (mpayCharliePos.left + 8) + (targetX - (mpayCharliePos.left + 8)) * stopT;
    })(),
    ey: (() => {
      const targetY = mCy + 18;
      const stopT = 0.82; // keep same diagonal ratio as X
      return (mpayCharliePos.top - 4) + (targetY - (mpayCharliePos.top - 4)) * stopT;
    })(),
  });
}, [isStep8, mpayCharliePos.left, mpayCharliePos.top, stageSize.w, stageSize.h]);

useEffect(() => {
  if (!isStep8) {
    setStep8CoinFlying(false);
    setStep8CoinArrived(false);
    return;
  }
  if (step7ReplayFailed || step8Phase >= 3) {
    setStep8CoinFlying(false);
    setStep8CoinArrived(false);
    return;
  }
  setStep8CoinArrived(false);
  setStep8CoinFlying(false);
  const t = window.setTimeout(() => setStep8CoinFlying(true), 300);
  return () => window.clearTimeout(t);
}, [isStep8, step7ReplayFailed, step8Phase]);

useEffect(() => {
  if (!isStep8) return;
  if (step7ReplayFailed) return;
  if (step8Phase !== 1) return;
  if (!step8CoinArrived) return;
  const t = window.setTimeout(() => setStep8Phase(2), 700);
  return () => window.clearTimeout(t);
}, [isStep8, step7ReplayFailed, step8Phase, step8CoinArrived]);

// Fallback: if the coin animation end event is missed, still advance Step 8 prompt.
useEffect(() => {
  if (!isStep8) return;
  if (step7ReplayFailed) return;
  if (step8Phase !== 1) return;
  if (step8CoinArrived) return;
  const t = window.setTimeout(() => {
    setStep8CoinArrived(true);
    setStep8Phase(2);
  }, 2600);
  return () => window.clearTimeout(t);
}, [isStep8, step7ReplayFailed, step8Phase, step8CoinArrived]);
  

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

  // Step 3: compute simultaneous σ_A publish path from hold to Bob panel
  useLayoutEffect(() => {
    if (!isAliceSigning) return;
    if (step3Phase < 7) return;

    const stageEl = stageRef.current;
    if (!stageEl) return;

    const startEl = sigmaHoldRef.current;
    if (startEl) {
      const s = stageEl.getBoundingClientRect();
      const r = startEl.getBoundingClientRect();
      const sx = r.left + r.width / 2 - s.left;
      const sy = r.top + r.height / 2 - s.top;
      setSigmaAToBobPath({
        sx,
        sy,
        ex: resolvedStep2PanelPos.left + 28,
        ey: resolvedStep2PanelPos.top + 28,
      });
    } else {
      setSigmaAToBobPath({
        sx: sigmaHoldPos.left,
        sy: sigmaHoldPos.top,
        ex: resolvedStep2PanelPos.left + 28,
        ey: resolvedStep2PanelPos.top + 28,
      });
    }
  }, [
    isAliceSigning,
    step3Phase,
    stageSize.w,
    stageSize.h,
    sigmaHoldPos.left,
    sigmaHoldPos.top,
    resolvedStep2PanelPos.left,
    resolvedStep2PanelPos.top,
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
  const step0NextEnabled = step0Phase === 1 || step0Phase === 2 || step0Phase === 3 || step0Phase === 5 || step0Phase === 6 || step0Phase === 10;


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
  const step6NextEnabled = step6Phase === 1 || step6Phase === 3 || step6Phase === 7 || step6Phase === 9;
  const step7NextEnabled = step7Phase === 1 || step7Phase === 2;
  const step8NextEnabled = !step7ReplayFailed && step8Phase === 2;
  const introIsStartLike = isIntro && (!introStarted || (introPhase === 0 && introStoryPhase === 0));


// blocked during 6 (mixing) and 8 (flight)

// blocked during 5 (mixing auto) and 7 (flying)

  const isNextDisabled =
    fig3Open ? true :
    isIntro
      ? (introIsStartLike ? false : ((!introSkipTimeline && introStarted && introPhase < 4) || (!introSkipTimeline && introStarted && introStoryPhase === 2 && !introPublicSlowReady)))
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
                : isStep8
                  ? !step8NextEnabled
                  : !canNext;
  const renderNavEpoch = navEpochRef.current;

  const goBackToPreviousStepEnd = () => {
    if (flowIdx <= 0) {
      onFlowBack();
      return;
    }
    const previousStep = flowItems[flowIdx - 1]?.id;
    if (previousStep) backLandingRef.current = previousStep;
    onFlowBack();
  };

  const handleBackClick = () => {
    navEpochRef.current += 1;
    if (fig3Open) {
      const mode = fig3Mode;
      setFig3Open(false);
      setFig3Mode(null);
      if (mode === "keygen") {
        // Return to the last substep before the keygen popup trigger.
        setStep2Phase(2);
        setFig3SegmentIdx(0);
      } else if (mode === "sign") {
        // Return to the last substep before the signing popup trigger.
        setStep6ShowSigma(false);
        step6SkipAutoAdvanceOnceRef.current = true;
        setStep6BadBobPath(false);
        setStep7EvilAttempt(false);
        setStep7ReplayFailed(false);
        setStep6Phase(5);
        setFig3SegmentIdx(5);
      }
      return;
    }

    if (isIntro) {
      if (introStoryPhase > 0) {
        setIntroSkipTimeline(true);
        setIntroStoryPhase((p) => Math.max(0, p - 1) as 0 | 1 | 2 | 3 | 4 | 5);
        return;
      }
      if (introPhase > 0) {
        setIntroSkipTimeline(true);
        setIntroPhase((p) => Math.max(0, p - 1));
        return;
      }
      if (introStarted) {
        setIntroStarted(false);
        return;
      }
      if (flowIdx > 0) onFlowBack();
      return;
    }

    if (isPreAuth) {
      if (step0Phase > 1) {
        const prevPhase: Record<number, 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10> = {
          2: 1,
          3: 2,
          4: 3,
          5: 3,
          6: 5,
          7: 6,
          8: 6,
          9: 8,
          10: 8,
        };
        setStep0Phase(prevPhase[step0Phase] ?? 1);
        return;
      }
      goBackToPreviousStepEnd();
      return;
    }

    if (isKeygen) {
      if (step1Phase > 1) {
        setStep1Phase((p) => Math.max(1, p - 1) as 0 | 1 | 2 | 3 | 4);
        return;
      }
      goBackToPreviousStepEnd();
      return;
    }

    if (isBobKeygen) {
      if (step2Phase > 1) {
        const prevPhase: Record<number, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
          2: 1,
          3: 2,
          4: 2,
          5: 2,
          6: 2,
        };
        setStep2Phase(prevPhase[step2Phase] ?? 1);
        return;
      }
      goBackToPreviousStepEnd();
      return;
    }

    if (isAliceSigning) {
      if (step3Phase > 1) {
        const prevPhase: Record<number, 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9> = {
          2: 1,
          3: 2,
          4: 2,
          5: 2,
          6: 2,
          7: 2,
          8: 7,
          9: 7,
        };
        if (step3Phase >= 8) {
          setSigmaArrivedAtCharlie(false);
          setSigmaAInBobPanel(false);
        }
        setStep3Phase(prevPhase[step3Phase] ?? 1);
        if (step3Phase <= 7) {
          setHideAlicePanel(false);
          setHideMauthHold(false);
          setShowSigma(false);
        }
        return;
      }
      goBackToPreviousStepEnd();
      return;
    }

    if (isStep4) {
      if (step4Phase > 1) {
        const prevPhase: Record<number, 0 | 1 | 2 | 3 | 4> = {
          2: 1,
          3: 2,
          4: 2,
        };
        setStep4Phase(prevPhase[step4Phase] ?? 1);
        return;
      }
      goBackToPreviousStepEnd();
      return;
    }

    if (isStep5) {
      if (step5Phase > 1) {
        const prevPhase: Record<number, 0 | 1 | 2 | 3 | 4> = {
          2: 1,
          3: 1,
          4: 3,
        };
        setStep5Phase(prevPhase[step5Phase] ?? 1);
        return;
      }
      goBackToPreviousStepEnd();
      return;
    }

    if (isStep6) {
      if (step6Phase > 1) {
        const prevPhase: Record<number, 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9> = {
          2: 1,
          3: 1,
          4: 3,
          5: 3,
          6: 3,
          7: 3,
          8: 7,
          9: 7,
        };
        if (step6Phase >= 8) {
          setSigmaBArrivedAtCharlie(false);
        }
        setStep6Phase(prevPhase[step6Phase] ?? 1);
        return;
      }
      goBackToPreviousStepEnd();
      return;
    }

    if (isStep7) {
      if (step7Phase > 1) {
        setStep7Phase((p) => Math.max(1, p - 1) as 0 | 1 | 2);
        return;
      }
      goBackToPreviousStepEnd();
      return;
    }

    if (isStep8) {
      if (step7ReplayFailed) {
        goBackToPreviousStepEnd();
        return;
      }
      if (step8Phase > 1) {
        setStep8Phase((p) => Math.max(1, p - 1) as 0 | 1 | 2 | 3);
        return;
      }
      goBackToPreviousStepEnd();
      return;
    }

    goBackToPreviousStepEnd();
  };

  useEffect(() => {
    setShowReadMoreModal(false);
  }, [stageId]);


  // ===== Intro narration text =====
  const introText = (
    <div className="oss-introMsg" data-phase={introPhase}>
      <span className={`intro-chunk ${introPhase >= 1 ? "is-on" : ""}`}>
        Alice, in <span className="intro-em">Sydney</span>,
      </span>{" "}
      <span className={`intro-chunk ${introPhase >= 2 ? "is-on" : ""}`}>
        wants to delegate one-time signing rights to Bob in <span className="intro-em">Strasbourg</span> to transfer a token
      </span>{" "}
      <span className={`intro-chunk ${introPhase >= 3 ? "is-on" : ""}`}>
        to a <span className="intro-em">merchant</span>.
      </span>{" "}
      <span className={`intro-chunk ${introPhase >= 4 ? "is-on" : ""}`}>
        There exists a verifier in <span className="intro-em">Vancouver</span> who can verify the signatures.
      </span>
      <span className="intro-line">
        <span className={`intro-chunk ${introPhase >= 5 ? "is-on" : ""}`}>
          Such signatures can be used for single-use tokens and coupons,
        </span>
      </span>
      <span className="intro-line">
        <span className={`intro-chunk ${introPhase >= 6 ? "is-on" : ""}`}>
          one-time release of medical records and execution of legal contracts etc.
        </span>
      </span>
      <span className="intro-line">
        <span className={`intro-chunk ${introPhase >= 7 ? "is-on" : ""}`}>
          In the future, it can power anti-counterfeit quantum money.
        </span>
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
        <span className="oss-storyChunkA">Ledgers are bulky</span>
        <span className="oss-storyChunkB"> and consensus building is slow.</span>
      </div>
    ) : introStoryPhase === 3 ? (
      <div className="oss-introMsgLine is-on oss-introStoryText">
        Also, current blockchain systems consume enormous amounts of energy, with global environmental impact.
      </div>
    ) : introStoryPhase === 4 ? (
      <div className="oss-introMsgLine is-on oss-introStoryText">
        At BTQ, we show how one-time signatures can be done without consensus building with just Bob having a quantum computer and without a quantum internet.
      </div>
    ) : introStoryPhase === 5 ? (
      <div className="oss-introMsgLine is-on oss-introStoryText">
        <span>Furthermore, by keeping communication channels classical, our protocol keeps the resource cost low.</span>
        <span className="oss-storyPhase5Tail"> Let&apos;s get into it.</span>
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
  const M_AUTH = <>m<sub>del</sub></>;
  const M_PAY = <>m<sub>pay</sub></>;
  const mpayLabelWithBit = (
    <>
      {M_PAY}
      {chosenVBit !== null ? <>[v={chosenVBit}]</> : null}
      : {visualMpay ?? "(…)"}
    </>
  );
  const fig3Max = Math.max(...FIG3_POINTS.map((p) => p.chi));
  const fig3MinX = FIG3_POINTS[0]?.x ?? 0;
  const fig3MaxX = FIG3_POINTS[FIG3_POINTS.length - 1]?.x ?? 1;
  const fig3W = 680;
  const fig3H = 280;
  const fig3Pad = 24;
  const fig3Point = (p: Fig3Point) => {
    const x = fig3Pad + ((p.x - fig3MinX) / Math.max(1, fig3MaxX - fig3MinX)) * (fig3W - fig3Pad * 2);
    const y = fig3H - fig3Pad - (p.chi / fig3Max) * (fig3H - fig3Pad * 2);
    return `${x},${y}`;
  };
  const fig3Stepify = (pts: Fig3Point[]) => {
    if (pts.length <= 1) return pts;
    const out: Fig3Point[] = [pts[0]];
    for (let i = 1; i < pts.length; i += 1) {
      const prev = pts[i - 1];
      const next = pts[i];
      out.push({ x: next.x, chi: prev.chi });
      out.push(next);
    }
    return out;
  };
  const fig3StartSegmentIdx = fig3Mode === "sign" ? 4 : 0;
  const fig3EndSegmentIdx = fig3Mode === "keygen" ? 4 : 10;
  const fig3IsAtEnd = fig3SegmentIdx >= fig3EndSegmentIdx;
  const fig3QubitTarget = (() => {
    if (fig3Mode === "keygen") {
      if (fig3SegmentIdx >= 4) return 10;   // final measurement checkpoint
      if (fig3SegmentIdx >= 3) return 14;   // end of green block
      if (fig3SegmentIdx >= 2) return 206;  // end of big orange jump
      return 10;                            // start
    }
    if (fig3Mode === "sign") {
      return 10;
    }
    return 10;
  })();
  const fig3QubitClass =
    fig3QubitCount >= 140 ? "is-dense" : fig3QubitCount >= 40 ? "is-mid" : "is-light";

  useEffect(() => {
    if (!fig3Open) return;
    if (fig3QubitCount === fig3QubitTarget) return;

    const t = window.setInterval(() => {
      setFig3QubitCount((prev) => {
        if (prev === fig3QubitTarget) return prev;
        const delta = fig3QubitTarget - prev;
        const step = Math.max(1, Math.ceil(Math.abs(delta) / 12));
        if (delta > 0) return Math.min(fig3QubitTarget, prev + step);
        return Math.max(fig3QubitTarget, prev - step);
      });
    }, 70);

    return () => window.clearInterval(t);
  }, [fig3Open, fig3QubitTarget, fig3QubitCount]);

  useEffect(() => {
    if (!fig3Open) return;
    if (fig3Mode === "keygen") {
      setFig3QubitCount(10);
      return;
    }
    if (fig3Mode === "sign") {
      setFig3QubitCount(10);
    }
  }, [fig3Open, fig3Mode]);
  const closeFig3Panel = () => {
    const mode = fig3Mode;
    setFig3Open(false);
    setFig3Mode(null);
    if (mode === "keygen") {
      if (!visualSkB) setVisualSkB(`0x${randomHex(32)}`);
      if (!visualY) setVisualY(`0x${randomHex(24)}`);
      setStep2Phase(4);
      return;
    }
    if (mode === "sign") {
      requestAnimationFrame(() => setStep6ShowSigma(true));
      setStep6Phase(8);
    }
  };
  const retreatFig3 = () => {
    setFig3SegmentIdx((prev) => Math.max(fig3StartSegmentIdx, prev - 1));
  };
  const advanceFig3 = () => {
    const next = Math.min(fig3SegmentIdx + 1, fig3EndSegmentIdx);
    setFig3SegmentIdx(next);
    if (next === 4) {
      setVisualSkB(`0x${randomHex(32)}`);
      setVisualY(`0x${randomHex(24)}`);
    }
  };
  const fig3BoundaryX = (x: number) => fig3Pad + ((x - fig3MinX) / Math.max(1, fig3MaxX - fig3MinX)) * (fig3W - fig3Pad * 2);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;

      if (e.key === "Escape") {
        if (showReadMoreModal) {
          e.preventDefault();
          setShowReadMoreModal(false);
          return;
        }
        if (fig3Open) {
          e.preventDefault();
          closeFig3Panel();
          return;
        }
      }

      if (fig3Open) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          retreatFig3();
          return;
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          advanceFig3();
          return;
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (fig3IsAtEnd) closeFig3Panel();
          else advanceFig3();
          return;
        }
        return;
      }

      if (showReadMoreModal) {
        return;
      }

      if (target?.closest(".oss-readMore") || target?.closest(".oss-readMoreModal")) {
        return;
      }

      if (e.key === "ArrowLeft" || e.key === "Backspace") {
        const backBtn = document.querySelector(".oss-stepper .stepper-btn:not(.stepper-primary)") as HTMLButtonElement | null;
        if (!backBtn || backBtn.disabled) return;
        e.preventDefault();
        backBtn.click();
        return;
      }
      if (e.key === "ArrowRight") {
        const primary = document.querySelector(".stepper-primary") as HTMLButtonElement | null;
        if (!primary || primary.disabled) return;
        e.preventDefault();
        primary.click();
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        const stageEl = stageRef.current;
        const isVisible = (el: HTMLButtonElement) => {
          if (el.disabled) return false;
          if (el.getAttribute("aria-hidden") === "true") return false;
          const style = window.getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden") return false;
          return el.getClientRects().length > 0;
        };
        const ctaSelectors = [
          ".oss-dotSignBtn",
          ".oss-step1RunBtn",
          ".oss-step2RunBtn",
          ".oss-step8RetryBtn",
        ];
        if (stageEl) {
          for (const selector of ctaSelectors) {
            const ctas = Array.from(stageEl.querySelectorAll(selector)) as HTMLButtonElement[];
            const targetCta = ctas.find((btn) => isVisible(btn));
            if (targetCta) {
              e.preventDefault();
              targetCta.click();
              return;
            }
          }
        }
        const primary = document.querySelector(".stepper-primary") as HTMLButtonElement | null;
        if (!primary || primary.disabled) return;
        e.preventDefault();
        primary.click();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fig3Open, fig3IsAtEnd, fig3SegmentIdx, fig3StartSegmentIdx, fig3EndSegmentIdx, showReadMoreModal, stageId]);

  const fig3HoldHint = fig3Mode === "keygen" && fig3IsAtEnd;
  const fig3HoldY = fig3H - fig3Pad - (8 / fig3Max) * (fig3H - fig3Pad * 2);
  const fig3HoldX1 = fig3BoundaryX(14315);
  const fig3HoldX2 = fig3BoundaryX(18835);
  const fig3XTicks = [0, 10000, 20000, 30000, 40000];
  const fig3YTicks = [0, 25, 50, 75, 100];
  const fig3XLabel = (v: number) => (v === 0 ? "0" : `${(v / 10000).toFixed(1)}x10^4`);
  const fig3SegmentPoints = (segmentIdx: number) => {
    const seg = FIG3_SEGMENTS[segmentIdx];
    if (!seg) return "";
    const chiBeforeStart = (() => {
      let chi = FIG3_POINTS[0]?.chi ?? 1;
      for (let i = 0; i < FIG3_POINTS.length; i += 1) {
        if (FIG3_POINTS[i].x < seg.start) chi = FIG3_POINTS[i].chi;
      }
      return chi;
    })();
    const chiAtEnd = (() => {
      let chi = chiBeforeStart;
      for (let i = 0; i < FIG3_POINTS.length; i += 1) {
        if (FIG3_POINTS[i].x <= seg.end) chi = FIG3_POINTS[i].chi;
      }
      return chi;
    })();
    const raw = FIG3_POINTS.filter((p) => p.x >= seg.start && p.x <= seg.end);
    const stitched: Fig3Point[] = [{ x: seg.start, chi: chiBeforeStart }, ...raw];
    const last = stitched[stitched.length - 1];
    if (!last || last.x !== seg.end || last.chi !== chiAtEnd) {
      stitched.push({ x: seg.end, chi: chiAtEnd });
    }
    return fig3Stepify(stitched).map(fig3Point).join(" ");
  };
  const fig3MarkerCenter = (segmentIdx: number) => {
    const seg = FIG3_SEGMENTS[segmentIdx];
    if (!seg?.marker) return null;
    const p = FIG3_POINTS.find((pt) => pt.x === seg.start) ?? FIG3_POINTS.find((pt) => pt.x >= seg.start) ?? null;
    if (!p) return null;
    const x = fig3BoundaryX(p.x);
    const y = fig3H - fig3Pad - (p.chi / fig3Max) * (fig3H - fig3Pad * 2);
    return { x, y, marker: seg.marker, color: seg.color };
  };
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
    ((isStep6 && step6Phase >= 9) || isStep7 || isStep8);
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
                  <div className="oss-ledgerCard" style={{ left: introLedgerPos.x, top: introLedgerPos.y }}>
                    <div className="oss-ledgerTitle">Shared Ledger</div>
                    <div className="oss-ledgerRows">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                  {introStoryPhase >= 2 && (
                    <div
                      className="oss-ledgerClock oss-ledgerClock--delayed"
                      style={{ left: introLedgerPos.x + 120, top: introLedgerPos.y - 10 }}
                      aria-hidden="true"
                    >
                      <span className="oss-ledgerClockFace" />
                      <span className="oss-ledgerClockHand oss-ledgerClockHand--hour" />
                      <span className="oss-ledgerClockHand oss-ledgerClockHand--minute" />
                    </div>
                  )}
                </>
              )}
              {introStoryPhase === 3 && (
                <div className="oss-energyFlowScene">
                  <div className="oss-energySmokeField" />
                  <svg className="oss-energyFlowLinks" viewBox={`0 0 ${stageSize.w} ${stageSize.h}`} preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <path id="energyPath-ab" d={introArcPath(introAliceAnchor.x, introAliceAnchor.y, introBobAnchor.x, introBobAnchor.y, -14)} />
                      <path id="energyPath-ac" d={introArcPath(introAliceAnchor.x, introAliceAnchor.y, introCharlieAnchor.x, introCharlieAnchor.y, -18)} />
                      <path id="energyPath-am" d={introArcPath(introAliceAnchor.x, introAliceAnchor.y, introMerchantAnchor.x, introMerchantAnchor.y, 2)} />
                      <path id="energyPath-bc" d={introArcPath(introBobAnchor.x, introBobAnchor.y, introCharlieAnchor.x, introCharlieAnchor.y, -22)} />
                      <path id="energyPath-bm" d={introArcPath(introBobAnchor.x, introBobAnchor.y, introMerchantAnchor.x, introMerchantAnchor.y, 18)} />
                      <path id="energyPath-cm" d={introArcPath(introCharlieAnchor.x, introCharlieAnchor.y, introMerchantAnchor.x, introMerchantAnchor.y, 10)} />
                    </defs>
                    <path className="oss-energyLink" d={introArcPath(introAliceAnchor.x, introAliceAnchor.y, introBobAnchor.x, introBobAnchor.y, -14)} />
                    <path className="oss-energyLink" d={introArcPath(introAliceAnchor.x, introAliceAnchor.y, introCharlieAnchor.x, introCharlieAnchor.y, -18)} />
                    <path className="oss-energyLink" d={introArcPath(introAliceAnchor.x, introAliceAnchor.y, introMerchantAnchor.x, introMerchantAnchor.y, 2)} />
                    <path className="oss-energyLink" d={introArcPath(introBobAnchor.x, introBobAnchor.y, introCharlieAnchor.x, introCharlieAnchor.y, -22)} />
                    <path className="oss-energyLink" d={introArcPath(introBobAnchor.x, introBobAnchor.y, introMerchantAnchor.x, introMerchantAnchor.y, 18)} />
                    <path className="oss-energyLink" d={introArcPath(introCharlieAnchor.x, introCharlieAnchor.y, introMerchantAnchor.x, introMerchantAnchor.y, 10)} />
                    <circle className="oss-energySpark" r="1.8"><animateMotion dur="1.15s" repeatCount="indefinite"><mpath href="#energyPath-ab" /></animateMotion></circle>
                    <circle className="oss-energySpark" r="1.8"><animateMotion dur="1.05s" repeatCount="indefinite" begin="0.16s"><mpath href="#energyPath-ac" /></animateMotion></circle>
                    <circle className="oss-energySpark" r="1.8"><animateMotion dur="1.1s" repeatCount="indefinite" begin="0.34s"><mpath href="#energyPath-am" /></animateMotion></circle>
                    <circle className="oss-energySpark" r="1.8"><animateMotion dur="1.0s" repeatCount="indefinite" begin="0.1s"><mpath href="#energyPath-bc" /></animateMotion></circle>
                    <circle className="oss-energySpark" r="1.8"><animateMotion dur="1.08s" repeatCount="indefinite" begin="0.22s"><mpath href="#energyPath-bm" /></animateMotion></circle>
                    <circle className="oss-energySpark" r="1.8"><animateMotion dur="1.18s" repeatCount="indefinite" begin="0.4s"><mpath href="#energyPath-cm" /></animateMotion></circle>
                    <rect className="oss-energyPacket" x="-4" y="-4" width="8" height="8" rx="1.4"><animateMotion dur="2s" repeatCount="indefinite"><mpath href="#energyPath-ab" /></animateMotion></rect>
                    <rect className="oss-energyPacket" x="-4" y="-4" width="8" height="8" rx="1.4"><animateMotion dur="1.9s" repeatCount="indefinite" begin="0.45s"><mpath href="#energyPath-bc" /></animateMotion></rect>
                    <rect className="oss-energyPacket" x="-4" y="-4" width="8" height="8" rx="1.4"><animateMotion dur="2.1s" repeatCount="indefinite" begin="0.8s"><mpath href="#energyPath-cm" /></animateMotion></rect>
                    <rect className="oss-energyPacket" x="-4" y="-4" width="8" height="8" rx="1.4"><animateMotion dur="2.2s" repeatCount="indefinite" begin="0.28s"><mpath href="#energyPath-am" /></animateMotion></rect>
                  </svg>
                  <img className="oss-energyPowerImg" src="/power.png" alt="Power infrastructure" />
                  <span className="oss-energyPlayerSmoke" style={{ left: introAliceAnchor.x, top: introAliceAnchor.y - 8 }} />
                  <span className="oss-energyPlayerSmoke" style={{ left: introBobAnchor.x, top: introBobAnchor.y - 8 }} />
                  <span className="oss-energyPlayerSmoke" style={{ left: introCharlieAnchor.x, top: introCharlieAnchor.y - 8 }} />
                  <span className="oss-energyPlayerSmoke" style={{ left: introMerchantAnchor.x, top: introMerchantAnchor.y - 8 }} />
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

        <div className={`oss-quantumBob ${showQuantumBob && !fig3Open ? "is-on" : ""}`}>
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
        Step 0: Authentication of Bob
      </div>
    )}

    {/* Sub-line: choose/authenticate Bob (phase 2) */}
    {step0Phase === 2 && (
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
        Alice is choosing and authenticating the Bob she wants to delegate signing rights to.
      </div>
    )}

    {/* Sub-line: auth request (phases 3–5) */}
    {step0Phase >= 3 && step0Phase < 6 && (
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

    {/* Sub-line: nonce (phases 6–8) */}
    {step0Phase >= 6 && step0Phase <= 8 && (
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

    {/* Sub-line: signed response (phases 9–10) */}
    {step0Phase >= 9 && step0Phase <= 10 && (
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

    {/* Dot: Alice -> Bob (auth request, phase 4) */}
    {step0Phase === 4 && (
  <div
    key="dot-auth"
    className="oss-dotTravel"
    onAnimationEnd={() => {
      if (renderNavEpoch !== navEpochRef.current) return;
      if (!liveRef.current.isPreAuth || liveRef.current.step0Phase !== 4) return;
      setStep0Phase(5);
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
    {step0Phase === 5 && (
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

    {/* Dot: Bob -> Alice (nonce, phase 7) */}
    {step0Phase === 7 && (
  <div
    key="dot-nonce"
    className="oss-dotTravel"
    onAnimationEnd={() => {
      if (renderNavEpoch !== navEpochRef.current) return;
      if (!liveRef.current.isPreAuth || liveRef.current.step0Phase !== 7) return;
      const n = `0x${randomHex(12)}`;
      setVisualNonce(n);
      setVisualSig(null);
      setStep0Phase(8);
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
    {step0Phase === 8 && (
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
            setStep0Phase(9);
          }}
        >
          Sign
        </button>
      </div>
    )}

    {/* Signed response flies Alice -> Bob */}
    {step0Phase === 9 && (
      <div
        key="dot-response"
        className="oss-dotTravel"
        onAnimationEnd={() => {
          if (renderNavEpoch !== navEpochRef.current) return;
          if (!liveRef.current.isPreAuth || liveRef.current.step0Phase !== 9) return;
          setStep0Phase(10);
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
    {step0Phase === 10 && (
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
                    <span className="oss-step1Val">{"\u00A0"}</span>
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
                  if (renderNavEpoch !== navEpochRef.current) return;
                  if (!liveRef.current.isBobKeygen || liveRef.current.step2Phase !== 5) return;
                  setAliceY(liveRef.current.visualY);
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
                <span className="oss-step1Val">{"\u00A0"}</span>
              </div>
              <div className="oss-step1Row">
                <span className="oss-step1Key">y</span>
                <span className="oss-step1Val">{visualY ?? "0x…"}</span>
              </div>
              {sigmaAInBobPanel && (
                <div className="oss-step1Row">
                  <span className="oss-step1Key">σ<sub>A</sub></span>
                  <span className="oss-step1Val">{visualSigmaA ?? "0x…"}</span>
                </div>
              )}
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
    {(step3Phase === 3 || step3Phase === 4 || step3Phase === 5 || step3Phase === 6 || step3Phase === 7) && (
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
    Alice then publishes her signature.
  </div>
)}

    {/* σ_A FLIES to Charlie */}
    {step3Phase === 8 && (
      <div
        key={`sigmaFly-${step3Phase}`}
        className="oss-dotTravel"
        onAnimationEnd={() => {
          if (renderNavEpoch !== navEpochRef.current) return;
          if (!liveRef.current.isAliceSigning || liveRef.current.step3Phase !== 8) return;
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

    {/* σ_A also flies to Bob (simultaneous publish) */}
    {step3Phase === 8 && (
      <div
        key={`sigmaFlyBob-${step3Phase}`}
        className="oss-dotTravel"
        onAnimationEnd={() => {
          if (renderNavEpoch !== navEpochRef.current) return;
          if (!liveRef.current.isAliceSigning || liveRef.current.step3Phase !== 8) return;
          setSigmaAInBobPanel(true);
        }}
        style={{
          position: "absolute",
          left: sigmaAToBobPath.sx,
          top: sigmaAToBobPath.sy,
          ["--tx" as any]: `${sigmaAToBobPath.ex - sigmaAToBobPath.sx}px`,
          ["--ty" as any]: `${sigmaAToBobPath.ey - sigmaAToBobPath.sy}px`,
          zIndex: 60,
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
          if (renderNavEpoch !== navEpochRef.current) return;
          if (!liveRef.current.isStep4 || liveRef.current.step4Phase !== 3) return;
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
      if (renderNavEpoch !== navEpochRef.current) return;
      if (!liveRef.current.isStep5) return;
      if (liveRef.current.step5Phase !== 2) return;
      if ((e.target as HTMLElement).classList.contains("oss-coinImg")) {
        if (liveRef.current.pendingVBit !== null) setChosenVBit(liveRef.current.pendingVBit);
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
                Bob has produced <span className="intro-em">σ<sub>B</sub></span> and is ready to send it to the verifier.
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
                    <span className={`oss-step1Val ${step6SkBPulse ? "oss-popPulse" : ""}`}>{"\u00A0"}</span>
                  </div>
                  <div className="oss-step1Row">
                    <span className="oss-step1Key">y</span>
                    <span className="oss-step1Val">{visualY ?? "0x…"}</span>
                  </div>
                  {sigmaAInBobPanel && (
                    <div className="oss-step1Row">
                      <span className="oss-step1Key">σ<sub>A</sub></span>
                      <span className="oss-step1Val">{visualSigmaA ?? "0x…"}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step6Phase === 2 && (
              <div
                key={`mpayBack-${step6Phase}`}
                className="oss-dotTravel"
                onAnimationEnd={() => {
                  if (renderNavEpoch !== navEpochRef.current) return;
                  if (!liveRef.current.isStep6 || liveRef.current.step6Phase !== 2) return;
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

            {step6Phase >= 7 && (
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
                  if (renderNavEpoch !== navEpochRef.current) return;
                  if (!liveRef.current.isStep6 || liveRef.current.step6Phase !== 8) return;
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
              {!step7ReplayFailed && step8Phase < 3 && (
                <>
                  Verification succeeds. The delegated token is transferred to the merchant.
                </>
              )}
              {(step7ReplayFailed || step8Phase >= 3) && (
                <>
                  Cannot use same signing key again due to <span className="oss-noCloneEmphasis">No Cloning theorem</span>. Replay detected and rejected. Token is <span className="intro-em">not transferred</span>.
                </>
              )}
            </div>

            {!step7ReplayFailed && step8Phase < 3 && step8CoinFlying && (
              <div
                className="oss-dotTravel oss-step8CoinTravel"
                onAnimationEnd={() => {
                  if (renderNavEpoch !== navEpochRef.current) return;
                  if (!liveRef.current.isStep8 || !liveRef.current.step8CoinFlying) return;
                  setStep8CoinArrived(true);
                }}
                style={{
                  position: "absolute",
                  left: step8CoinPath.sx,
                  top: step8CoinPath.sy,
                  ["--tx" as any]: `${step8CoinPath.ex - step8CoinPath.sx}px`,
                  ["--ty" as any]: `${step8CoinPath.ey - step8CoinPath.sy}px`,
                  zIndex: 63,
                  pointerEvents: "none",
                }}
              >
                <img src="/coin.png" alt="" className={`oss-step8CoinImg ${step8CoinArrived ? "is-pop" : ""}`} />
              </div>
            )}

            {!step7ReplayFailed && step8Phase >= 2 && step8Phase < 3 && (
              <div className="oss-step8RetryWrap">
                <div className="oss-step8RetryLine">As Bob, try signing another token.</div>
                <button
                  type="button"
                  className="oss-step8RetryBtn"
                  onClick={() => {
                    setStep8RetryAttemptId((n) => n + 1);
                    setStep8Phase(3);
                  }}
                >
                  Sign
                </button>
              </div>
            )}

            {(step7ReplayFailed || step8Phase >= 3) && (
              <>
                {!step7ReplayFailed && (
                  <img
                    key={`noclone-${step8RetryAttemptId}`}
                    src="/2026-03-23%2020.33.44.png"
                    alt="No cloning illustration"
                    className="oss-step8NoCloneImg"
                  />
                )}
                <div
                  className="oss-step8VerifierFail"
                  style={{
                    left: mpayCharliePos.left + 72,
                    top: mpayCharliePos.top - 62,
                  }}
                >
                  Verification failed
                </div>
              </>
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
        <div className="oss-readMore">
          <button
            type="button"
            className="oss-readMoreToggle"
            onClick={() => setShowReadMoreModal(true)}
          >
            Read Notes
          </button>
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
              <p className="oss-readMoreCitation">
                [1] {noteCitation.text}{" "}
                <a href={noteCitation.url} target="_blank" rel="noreferrer">
                  {noteCitation.url}
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {fig3Open && fig3Mode && (
        <div className="oss-fig3Backdrop" role="dialog" aria-modal="true">
          <div className="oss-fig3Modal" onClick={(event) => event.stopPropagation()}>
            <div className="oss-fig3HeadRow">
              <div className="oss-fig3Head">One Shot Signature Bonddim Evolution</div>
              <div className="oss-fig3HeadActions">
                <img src="/logos.png" alt="Logos" className="oss-fig3CornerLogo" />
                <button
                  type="button"
                  className="oss-fig3CloseBtn"
                  aria-label="Close plot window"
                  onClick={closeFig3Panel}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="oss-fig3Sub">
              {fig3Mode === "keygen" && "Step through each key generation circuit block as emulated in MIMIQ."}
              {fig3Mode === "sign" && "Step through each signing circuit block as emulated in MIMIQ."}
            </div>
            <div className="oss-fig3VisualLane">
              {(fig3Mode === "keygen" || fig3Mode === "sign") && (
                <div className="oss-fig3MiniMimiq">
                  <img src="/chip-mimiq.png" alt="Mimiq runtime" />
                  <span>MIMIQ runtime active</span>
                </div>
              )}
            </div>
            {(fig3Mode === "keygen" || fig3Mode === "sign") && (
              <div className="oss-fig3QubitWrap">
                <div className="oss-fig3QubitMeta">
                  <span className="oss-fig3QubitLabel">Qubits</span>
                  <span className="oss-fig3QubitValue">{fig3QubitCount}</span>
                </div>
                <div className={`oss-fig3QubitSwarm ${fig3QubitClass}`}>
                  {Array.from({ length: fig3QubitCount }).map((_, idx) => (
                    <img
                      key={`q-${idx}`}
                      src="/sphere.png"
                      alt=""
                      className="oss-fig3QubitDot"
                      style={{ animationDelay: `${(idx % 24) * 18}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <svg className="oss-fig3Chart oss-fig3ChartExact" viewBox={`0 0 ${fig3W} ${fig3H}`} preserveAspectRatio="none">
              <rect className="oss-fig3PlotBg" x={fig3Pad} y={fig3Pad} width={fig3W - fig3Pad * 2} height={fig3H - fig3Pad * 2} />
              <line className="oss-fig3Axis" x1={fig3Pad} y1={fig3Pad} x2={fig3Pad} y2={fig3H - fig3Pad} />
              <line className="oss-fig3Axis" x1={fig3Pad} y1={fig3H - fig3Pad} x2={fig3W - fig3Pad} y2={fig3H - fig3Pad} />
              {fig3YTicks.map((t) => {
                const y = fig3H - fig3Pad - (t / fig3Max) * (fig3H - fig3Pad * 2);
                return (
                  <g key={`fig3-y-${t}`}>
                    <line className="oss-fig3Tick" x1={fig3Pad - 5} y1={y} x2={fig3Pad} y2={y} />
                    <text className="oss-fig3TickLabel oss-fig3TickLabelY" x={fig3Pad - 8} y={y + 3}>{t}</text>
                  </g>
                );
              })}
              {fig3XTicks.map((t) => {
                const x = fig3BoundaryX(t);
                return (
                  <g key={`fig3-x-${t}`}>
                    <line className="oss-fig3Tick" x1={x} y1={fig3H - fig3Pad} x2={x} y2={fig3H - fig3Pad + 5} />
                    <text className="oss-fig3TickLabel oss-fig3TickLabelX" x={x} y={fig3H - fig3Pad + 18}>{fig3XLabel(t)}</text>
                  </g>
                );
              })}
              <text className="oss-fig3AxisLabel oss-fig3AxisLabelY" x={fig3Pad + 8} y={fig3Pad + 12}>Bond dimension</text>
              <text className="oss-fig3AxisLabel oss-fig3AxisLabelX" x={fig3W - fig3Pad - 138} y={fig3H - fig3Pad - 6}>Circuit parts (fragment index)</text>
              {FIG3_SEGMENTS.map((seg, idx) =>
                idx <= fig3SegmentIdx ? (
                  <polyline
                    key={`fig3-seg-${idx}`}
                    className={`oss-fig3SegLine ${idx === fig3SegmentIdx ? "is-drawing" : ""}`}
                    pathLength={100}
                    style={{ stroke: seg.color }}
                    points={fig3SegmentPoints(idx)}
                  />
                ) : null
              )}
              {FIG3_SEGMENTS.map((_seg, idx) => {
                if (idx > fig3SegmentIdx) return null;
                const marker = fig3MarkerCenter(idx);
                if (!marker) return null;
                return (
                  <g key={`fig3-marker-${idx}`}>
                    <circle className="oss-fig3MarkerRing" cx={marker.x} cy={marker.y} r="8.8" />
                    <circle cx={marker.x} cy={marker.y} r="7.2" style={{ fill: marker.color }} />
                    <text className="oss-fig3MarkerText" x={marker.x} y={marker.y + 2.8}>{marker.marker}</text>
                  </g>
                );
              })}
              {fig3HoldHint && (
                <>
                  <line className="oss-fig3HoldDash" x1={fig3HoldX1} y1={fig3HoldY} x2={fig3HoldX2} y2={fig3HoldY} />
                  <text className="oss-fig3HoldText" x={fig3HoldX1 + 6} y={fig3HoldY - 8}>
                    Bob can hold |sk
                    <tspan baseline-shift="sub" font-size="8">B</tspan>
                    ⟩ before signing
                  </text>
                </>
              )}
            </svg>

            <div className="oss-fig3Actions">
              {!fig3IsAtEnd && (
                <button
                  type="button"
                  className="oss-fig3SkipBtn"
                  disabled={fig3SegmentIdx <= fig3StartSegmentIdx}
                  onClick={retreatFig3}
                >
                  ←
                </button>
              )}
              {!fig3IsAtEnd && (
                <button
                  type="button"
                  className="oss-fig3SkipBtn"
                  onClick={advanceFig3}
                >
                  →
                </button>
              )}
              {fig3IsAtEnd && (
                <button
                  type="button"
                  className="oss-fig3SkipBtn"
                  onClick={closeFig3Panel}
                >
                  Continue
                </button>
              )}
              <button
                type="button"
                className="oss-fig3SkipBtn"
                onClick={() => {
                  const to = fig3Mode === "keygen" ? 4 : 10;
                  setFig3SegmentIdx(to);
                  if (to >= 4) {
                    setVisualSkB(`0x${randomHex(32)}`);
                    setVisualY(`0x${randomHex(24)}`);
                  }
                }}
              >
                Skip to checkpoint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stepper */}
      <div className="oss-stepper">
        <button type="button" className="stepper-btn" onClick={handleBackClick}>
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
            if (introIsStartLike) {
              setIntroSkipTimeline(false);
              setIntroStarted(true);
              setIntroPhase(0);
              setIntroStoryPhase(0);
              setIntroPublicSlowReady(false);
              setIntroRunId((n) => n + 1);
              return;
            }
            if (isIntro && introStoryPhase === 0 && introPhase < 7) {
              setIntroSkipTimeline(true);
              setIntroPhase((p) => Math.min(7, p + 1));
              return;
            }
            if (isIntro && introPhase < 7) return;
            if (isIntro) {
              if (!introSkipTimeline && introStoryPhase === 2 && !introPublicSlowReady) return;
              if (introStoryPhase < 5) {
                setIntroSkipTimeline(true);
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
              if (step0Phase === 2) {
                setStep0Phase(3);
                return;
              }
              if (step0Phase === 3) {
                setStep0Phase(4);
                return;
              }
              if (step0Phase === 5) {
                setStep0Phase(6);
                return;
              }
              if (step0Phase === 6) {
                setStep0Phase(7);
                return;
              }
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
      if (step6Phase === 7) {
        setStep6BadBobPath(false);
        setStep7EvilAttempt(false);
        setStep7ReplayFailed(false);
        setStep6Phase(8);
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

    if (isStep8) {
      if (step7ReplayFailed) return;
      if (step8Phase === 2) {
        setStep8RetryAttemptId((n) => n + 1);
        setStep8Phase(3);
      }
      return;
    }

            





            // ===== Future steps =====
            if (!canNext) return;
            onFlowNext();
          }}
          disabled={isNextDisabled}
        >
          {introIsStartLike ? "Start →" : "Next →"}
        </button>
      </div>
    </div>
  );
}
