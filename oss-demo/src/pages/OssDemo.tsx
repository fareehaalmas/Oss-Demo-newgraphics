// src/pages/OssDemo.tsx
import { useMemo, useState } from "react";
import "./ossDemo.css";
import OssStage from "../components/OssStage";

type OssDemoProps = { onBack: () => void };
type Anchor = "alice" | "bob" | "charlie" | "merchant" | "capsule" | "center";

type FlowStep = {
  id: string; // stageId passed to OssStage
  focus: Anchor;
  label: string;
};

//function pseudoRandBits(bits: number, seed: number): string {
  //let x = seed | 0;
  //let out = "";
  //for (let i = 0; i < bits; i++) {
   // x ^= x << 13;
   // x ^= x >> 17;
   // x ^= x << 5;
    //out += x & 1 ? "1" : "0";
 //}
  //return out;
//}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function OssDemo({ onBack }: OssDemoProps) {
  const [flowIdx, setFlowIdx] = useState(0);

  // ========= Protocol state (keep; OssStage can still render these as “time slices”) =========

  // Step 0 (pre-processing auth)
  const [authDone] = useState(false);
  const [nonce] = useState<string | null>(null);
  const [sigChallenge] = useState<string | null>(null);

  // Step 1: Alice keygen
  const [vkA] = useState<string | null>(null);
  const [skA] = useState<string | null>(null);

  // Step 2: Bob generates y + |skB⟩
  const [y] = useState<string | null>(null);
  const [skBAlive] = useState<boolean>(false);

  // Step 3: Alice signs mauth over y
  const [mauth] = useState<string | null>(null);
  const [sigmaA] = useState<string | null>(null);

  // Step 4: Bob constructs mpay
  const [mpay] = useState<string | null>(null);

  // Step 5: Verifier selects challenge bit
  const [vBit] = useState<0 | 1 | null>(null);

  // Step 6: Bob one-shot signs mpay
  const [sigmaB] = useState<string | null>(null);

  // Step 7: Verification
  const [verifyOk] = useState<boolean | null>(null);

  // Step 8: Execute token
  const [executed] = useState<boolean>(false);

  // panel-era control (still used by your old actions; keep for later steps if needed)
  //const [isGenerating, setIsGenerating] = useState<boolean>(false);

  //const seedBase = useMemo(() => Date.now() & 0xfffffff, []);
  //const seed = useMemo(() => seedBase + flowIdx * 1234, [seedBase, flowIdx]);

  // ========= FLOW (now stageId names match the NEW cinematic system) =========
  // IMPORTANT: these ids must match the stageId checks inside OssStage.
  const FLOW: FlowStep[] = [
    { id: "intro", focus: "center", label: "Intro" },
    { id: "step0_preprocessing", focus: "alice", label: "Pre-Auth" },
    { id: "step1_keygen", focus: "alice", label: "Step 1" },

    // placeholders for next cinematic steps you’ll build:
    { id: "step2_bob_keygen", focus: "bob", label: "Step 2" },
    { id: "step3_alice_signing", focus: "alice", label: "Step 3" },
    { id: "step4_bob_mpay", focus: "bob", label: "Step 4" },
    { id: "step5_verifier_bit", focus: "charlie", label: "Step 5" },
    { id: "step6_bob_sign_once", focus: "bob", label: "Step 6" },
    { id: "step7_verify", focus: "charlie", label: "Step 7" },
    { id: "step8_execute", focus: "charlie", label: "Step 8" },
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
  const onFlowJump = (idx: number) => setFlowIdx(clamp(idx, 0, FLOW.length - 1));

  return (
    <div className="oss-demo-page">
      <div className="oss-demo-header">
        <button className="oss-pill-btn" onClick={onBack} type="button">
          ←
        </button>
      </div>

      <div className="oss-title-wrap">
        <h1 className="oss-title">Interactive demo of One-Shot Signature delegation.</h1>
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
          onFlowJump={onFlowJump}
          flowItems={FLOW}

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
