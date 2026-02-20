// src/pages/OssDemo.tsx
import { useMemo, useState } from "react";
import "./ossDemo.css";
import OssStage from "../components/OssStage";

type OssDemoProps = { onBack: () => void };

type Anchor = "alice" | "bob" | "charlie" | "capsule" | "center";

type FlowStep = {
  id: string;
  focus: Anchor;
  title: string;
  text: string;
  isComplete?: () => boolean;
};

function pseudoRandBits(bits: number, seed: number): string {
  let x = seed | 0;
  let out = "";
  for (let i = 0; i < bits; i++) {
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    out += x & 1 ? "1" : "0";
  }
  return out;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function OssDemo({ onBack }: OssDemoProps) {
  const [flowIdx, setFlowIdx] = useState(0);

  // ========= Protocol state (PDF names) ========= :contentReference[oaicite:1]{index=1}

  // Step 0 (pre-processing auth)
  const [authDone, setAuthDone] = useState(false);
  const [nonce, setNonce] = useState<string | null>(null);
  const [sigChallenge, setSigChallenge] = useState<string | null>(null);

  // Step 1: Alice keygen
  const [vkA, setVkA] = useState<string | null>(null);
  const [skA, setSkA] = useState<string | null>(null);

  // Step 2: Bob generates y + |skB⟩
  const [y, setY] = useState<string | null>(null);
  const [skBAlive, setSkBAlive] = useState<boolean>(false); // represents one-shot key usable once

  // Step 3: Alice signs mauth over y
  const [mauth, setMauth] = useState<string | null>(null);
  const [sigmaA, setSigmaA] = useState<string | null>(null);

  // Step 4: Bob constructs mpay
  const [mpay, setMpay] = useState<string | null>(null);

  // Step 5: Verifier selects challenge bit
  const [vBit, setVBit] = useState<0 | 1 | null>(null);

  // Step 6: Bob one-shot signs mpay
  const [sigmaB, setSigmaB] = useState<string | null>(null);

  // Step 7: Verification
  const [verifyOk, setVerifyOk] = useState<boolean | null>(null);

  // Step 8: Execute token
  const [executed, setExecuted] = useState<boolean>(false);

  // ========= UI controls (you can keep these as-is; they are panel-era controls) =========

  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const seedBase = useMemo(() => Date.now() & 0xfffffff, []);
  const seed = useMemo(() => seedBase + flowIdx * 1234, [seedBase, flowIdx]);

  // ========= FLOW (exact PDF step structure, 0–8) ========= :contentReference[oaicite:2]{index=2}
  const FLOW: FlowStep[] = [
    {
      id: "step0_preprocessing",
      focus: "alice",
      title: "Step 0: Pre-processing (authentication)",
      text:
        "Alice initiates an authentication request. Bob sends a fresh nonce, and Alice signs it to authenticate to Bob.",
      isComplete: () => authDone,
    },
    {
      id: "step1_alice_keygen",
      focus: "alice",
      title: "Step 1: Key generation and identity setup by Alice",
      text:
        "Alice generates a PQC keypair (vkA, skA) ← PQC.Gen. The public key vkA uniquely identifies Alice.",
      isComplete: () => Boolean(vkA && skA),
    },
    {
      id: "step2_bob_gen",
      focus: "bob",
      title: "Step 2: Authorisation exchange (Bob generates y, |skB⟩)",
      text:
        "Bob runs Gen to create (y, |skB⟩) ← Gen(crs), then shares the classical public key y with Alice.",
      isComplete: () => Boolean(y) && skBAlive === true,
    },
    {
      id: "step3_alice_sign",
      focus: "alice",
      title: "Step 3: Signing by Alice",
      text:
        "Alice constructs mauth (attributes / constraints) and produces σA = Sign(mauth, y, skA). She sends σA to the verifier.",
      isComplete: () => Boolean(mauth && sigmaA),
    },
    {
      id: "step4_bob_mpay",
      focus: "bob",
      title: "Step 4: Message construction by Bob",
      text:
        "Bob constructs a payment message mpay (attributes, merchant ID, etc.) and sends mpay to the verifier.",
      isComplete: () => Boolean(mpay),
    },
    {
      id: "step5_verifier_bit",
      focus: "charlie",
      title: "Step 5: Challenge selection by the verifier",
      text:
        "The verifier picks a random bit b ∈ {0,1} and assigns it to mpay.",
      isComplete: () => vBit !== null,
    },
    {
      id: "step6_bob_sign_once",
      focus: "bob",
      title: "Step 6: Signing by Bob (one-shot)",
      text:
        "Bob produces a one-shot signature σB = Sign(mpay, |skB⟩) and sends σB to the verifier. The key is consumed after use.",
      isComplete: () => Boolean(sigmaB) && skBAlive === false,
    },
    {
      id: "step7_verify",
      focus: "charlie",
      title: "Step 7: Verification",
      text:
        "Verifier checks σB and σA both. It verifies Alice’s authorisation and Bob’s one-shot signature.",
      isComplete: () => verifyOk !== null,
    },
    {
      id: "step8_execute",
      focus: "charlie",
      title: "Step 8: Executing the token",
      text:
        "If verification succeeds, the verifier authorises the token transfer and the action executes.",
      isComplete: () => executed === true,
    },
  ];

  const step = useMemo(() => FLOW[flowIdx], [flowIdx, FLOW]);

  // ========= Actions (one CTA per step) =========

  const doStep0 = () => {
    if (authDone) return;
    const n = "nonce:" + pseudoRandBits(16, seed + 11);
    const sig = "sig(nonce):" + pseudoRandBits(18, seed + 19);
    setNonce(n);
    setSigChallenge(sig);
    setAuthDone(true);
  };

  const doStep1 = () => {
    if (vkA && skA) return;
    const newSkA = "skA:" + pseudoRandBits(24, seed + 31);
    const newVkA = "vkA:" + pseudoRandBits(24, seed + 37);
    setSkA(newSkA);
    setVkA(newVkA);
  };

  const doStep2 = () => {
    if (skBAlive && y) return;
    // simulate generation delay like demo
    if (isGenerating) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      const newY = "y:" + pseudoRandBits(20, seed + 53);
      setY(newY);
      setSkBAlive(true);
    }, 700);
  };

  const doStep3 = () => {
    if (!skA || !y) return;
    if (mauth && sigmaA) return;
    const newMauth = "mauth:" + pseudoRandBits(28, seed + 71);
    const newSigmaA = "σA:" + pseudoRandBits(22, seed + 73);
    setMauth(newMauth);
    setSigmaA(newSigmaA);
  };

  const doStep4 = () => {
    if (mpay) return;
    const newMpay = "mpay:" + pseudoRandBits(30, seed + 97);
    setMpay(newMpay);
  };

  const doStep5 = () => {
    if (vBit !== null) return;
    const bit = (seed + 123) & 1 ? 1 : 0;
    setVBit(bit as 0 | 1);
  };

  const doStep6 = () => {
    if (!skBAlive) return;
    if (!mpay) return;
    if (sigmaB) return;
    const newSigmaB = "σB:" + pseudoRandBits(22, seed + 141);
    setSigmaB(newSigmaB);
    setSkBAlive(false);
  };

  const doStep7 = () => {
    if (verifyOk !== null) return;
    const ok = Boolean(
      authDone &&
        vkA &&
        skA && // toy: you "have" skA, in real protocol verifier uses vkA
        y &&
        mauth &&
        sigmaA &&
        mpay &&
        vBit !== null &&
        sigmaB &&
        skBAlive === false
    );
    setVerifyOk(ok);
  };

  const doStep8 = () => {
    if (executed) return;
    if (verifyOk !== true) return;
    setExecuted(true);
  };

  const onCtaClick =
    step.id === "step0_preprocessing"
      ? doStep0
      : step.id === "step1_alice_keygen"
      ? doStep1
      : step.id === "step2_bob_gen"
      ? doStep2
      : step.id === "step3_alice_sign"
      ? doStep3
      : step.id === "step4_bob_mpay"
      ? doStep4
      : step.id === "step5_verifier_bit"
      ? doStep5
      : step.id === "step6_bob_sign_once"
      ? doStep6
      : step.id === "step7_verify"
      ? doStep7
      : step.id === "step8_execute"
      ? doStep8
      : undefined;

  const ctaLabel =
    step.id === "step0_preprocessing"
      ? "Authenticate"
      : step.id === "step1_alice_keygen"
      ? "Run PQC.Gen"
      : step.id === "step2_bob_gen"
      ? "Run Gen(crs)"
      : step.id === "step3_alice_sign"
      ? "Sign σA"
      : step.id === "step4_bob_mpay"
      ? "Send mpay"
      : step.id === "step5_verifier_bit"
      ? "Pick bit b"
      : step.id === "step6_bob_sign_once"
      ? "Sign σB (once)"
      : step.id === "step7_verify"
      ? "Verify"
      : step.id === "step8_execute"
      ? "Execute"
      : undefined;

  const ctaHint =
    step.id === "step0_preprocessing"
      ? "Bob sends a fresh nonce; Alice signs it."
      : step.id === "step1_alice_keygen"
      ? "Generates (vkA, skA) ← PQC.Gen"
      : step.id === "step2_bob_gen"
      ? "Generates (y, |skB⟩) and shares y with Alice."
      : step.id === "step3_alice_sign"
      ? "σA = Sign(mauth, y, skA) → sent to verifier."
      : step.id === "step4_bob_mpay"
      ? "Construct mpay and send to verifier."
      : step.id === "step5_verifier_bit"
      ? "Verifier chooses b ∈ {0,1} for mpay."
      : step.id === "step6_bob_sign_once"
      ? "σB = Sign(mpay, |skB⟩). Key is consumed."
      : step.id === "step7_verify"
      ? "Verifier checks σA and σB."
      : step.id === "step8_execute"
      ? "If valid, verifier executes the token action."
      : undefined;

  const ctaDisabled = step.isComplete ? step.isComplete() : false;

  const canNext = step.isComplete ? step.isComplete() : true;
  const onFlowNext = () => {
    if (!canNext) return;
    setFlowIdx((i) => clamp(i + 1, 0, FLOW.length - 1));
  };
  const onFlowBack = () => setFlowIdx((i) => clamp(i - 1, 0, FLOW.length - 1));

  const resetAll = () => {
    setFlowIdx(0);

    setAuthDone(false);
    setNonce(null);
    setSigChallenge(null);

    setVkA(null);
    setSkA(null);

    setY(null);
    setSkBAlive(false);

    setMauth(null);
    setSigmaA(null);

    setMpay(null);
    setVBit(null);

    setSigmaB(null);

    setVerifyOk(null);
    setExecuted(false);
  };

  return (
    <div className="oss-demo-page">
      <div className="oss-demo-header">
        <button className="oss-pill-btn" onClick={onBack} type="button">
          ← Back
        </button>

        <div className="oss-pill">INTERACTIVE OSS DEMO</div>

        <button className="oss-pill-btn oss-reset" onClick={resetAll} type="button">
          Reset
        </button>
      </div>

      <div className="oss-title-wrap">
        <h1 className="oss-title">OSS signature delegation</h1>
        <p className="oss-subtitle">Interactive walkthrough</p>
      </div>

      <div className="oss-stage-shell">
        <OssStage
          focus={step.focus}
          bubbleTitle={step.title}
          bubbleText={step.text}
          flowIdx={flowIdx}
          flowTotal={FLOW.length}
          canNext={canNext}
          onFlowNext={onFlowNext}
          onFlowBack={onFlowBack}
          ctaLabel={ctaLabel}
          ctaHint={ctaHint}
          onCtaClick={onCtaClick}
          ctaDisabled={ctaDisabled}
          // state for rail
          authDone={authDone}
          nonce={nonce}
          sigChallenge={sigChallenge}
          vkA={vkA}
          skA={skA}
          y={y}
          mauth={mauth}
          sigmaA={sigmaA}
          mpay={mpay}
          vBit={vBit}
          skBAlive={skBAlive}
          sigmaB={sigmaB}
          verifyOk={verifyOk}
          executed={executed}
          // keep these UI controls (optional)
        
        />
      </div>
    </div>
  );
}
