// src/pages/OssDemo.tsx
import { useMemo, useState } from "react";
import "./ossDemo.css";
import OssStage from "../components/OssStage";

type OssDemoProps = { onBack: () => void };
type Anchor = "alice" | "bob" | "charlie" | "merchant" | "capsule" | "center";

type FlowStep = {
  id: string; // stageId passed to OssStage
  focus: Anchor;
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

  // ========= Protocol state (keep; OssStage can still render these as “time slices”) =========

  // Step 0 (pre-processing auth)
  const [authDone, setAuthDone] = useState(false);
  const [nonce, setNonce] = useState<string | null>(null);
  const [sigChallenge, setSigChallenge] = useState<string | null>(null);

  // Step 1: Alice keygen
  const [vkA, setVkA] = useState<string | null>(null);
  const [skA, setSkA] = useState<string | null>(null);

  // Step 2: Bob generates y + |skB⟩
  const [y, setY] = useState<string | null>(null);
  const [skBAlive, setSkBAlive] = useState<boolean>(false);

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

  // panel-era control (still used by your old actions; keep for later steps if needed)
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const seedBase = useMemo(() => Date.now() & 0xfffffff, []);
  const seed = useMemo(() => seedBase + flowIdx * 1234, [seedBase, flowIdx]);

  // ========= FLOW (now stageId names match the NEW cinematic system) =========
  // IMPORTANT: these ids must match the stageId checks inside OssStage.
  const FLOW: FlowStep[] = [
    { id: "intro", focus: "center" },
    { id: "step0_preprocessing", focus: "alice" },
    { id: "step1_keygen", focus: "alice" },

    // placeholders for next cinematic steps you’ll build:
    { id: "step2_bob_keygen", focus: "bob" },
    { id: "step3_alice_signing", focus: "alice" },
    { id: "step4_bob_mpay", focus: "bob" },
    { id: "step5_verifier_bit", focus: "charlie" },
    { id: "step6_bob_sign_once", focus: "bob" },
    { id: "step7_verify", focus: "charlie" },
    { id: "step8_execute", focus: "charlie" },
  ];

  const step = useMemo(() => FLOW[flowIdx], [flowIdx]);

  // ========= Next/Back =========
  // For now, we let OssStage gate Next for intro/step0/step1 internally (cinematic phases).
  // For later steps, you can add gating either here OR inside OssStage when you rebuild those steps cinematically.
  const canNext = true;

  const onFlowNext = () => {
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
          stageId={step.id}
          focus={step.focus}

          // ✅ OLD SYSTEM IS DISABLED:
          bubbleTitle={""}
          bubbleText={""}
          ctaLabel={undefined}
          ctaHint={undefined}
          onCtaClick={undefined}
          ctaDisabled={false}

          flowIdx={flowIdx}
          flowTotal={FLOW.length}
          canNext={canNext}
          onFlowNext={onFlowNext}
          onFlowBack={onFlowBack}

          // Protocol state (still passed; OssStage can show it in “time slices”)
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
        />
      </div>
    </div>
  );
}
