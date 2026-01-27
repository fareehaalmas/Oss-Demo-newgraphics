// src/pages/OssDemo.tsx
import { useMemo, useState } from "react";
import "./ossDemo.css";
import OssStage from "../components/OssStage";

type OssDemoProps = { onBack: () => void };

type StepId =
  | "pqc_gen"
  | "pick_y_sign"
  | "send_y_sigma"
  | "oss_gen"
  | "oss_sign"
  | "send_bundle"
  | "verify";

type Step = { id: StepId; title: string; hint: string };

const STEPS: Step[] = [
  { id: "pqc_gen", title: "Step 1 — Alice generates PQC keys", hint: "Click Alice to generate (sk, vk)." },
  { id: "pick_y_sign", title: "Step 2 — Alice signs delegation token", hint: "Click Alice to pick y and sign σ." },
  { id: "send_y_sigma", title: "Step 3 — Send (y, σ) to Bob", hint: "Click the top beam to send (y, σ)." },
  { id: "oss_gen", title: "Step 4 — Bob runs OSS.Gen", hint: "Click Bob to generate one-shot key |sk⟩." },
  { id: "oss_sign", title: "Step 5 — Bob signs m once", hint: "Click the capsule to sign x. |sk⟩ self-destructs." },
  { id: "send_bundle", title: "Step 6 — Send bundle to Charlie", hint: "Click the diagonal beam to send (m, y, σ, x)." },
  { id: "verify", title: "Step 7 — Verify", hint: "Click Charlie to verify ✓ / ✗." },
];

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

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

// Intro flow is *not timed*.
// 0 Sydney, 1 Strasbourg, 2 Vancouver, 3 Alice, 4 Bob, 5 Charlie, 6 Prompt
type Mode = "intro" | "demo";
type Anchor = "alice" | "bob" | "charlie" | "topBeam" | "diagBeam" | "capsule" | "center";

export default function OssDemo({ onBack }: OssDemoProps) {
  const [mode, setMode] = useState<Mode>("intro");
  const [introIdx, setIntroIdx] = useState<number>(0);

  const [stepIdx, setStepIdx] = useState<number>(0);

  const [nBits, setNBits] = useState<number>(10);
  const [mBit, setMBit] = useState<0 | 1>(0);

  // toy protocol state
  const [vk, setVk] = useState<string | null>(null);
  const [sk, setSk] = useState<string | null>(null);
  const [y, setY] = useState<string | null>(null);
  const [sigma, setSigma] = useState<string | null>(null);
  const [qskAlive, setQskAlive] = useState<boolean>(false);
  const [xSig, setXSig] = useState<string | null>(null);
  const [bobHasPacket, setBobHasPacket] = useState<boolean>(false);
  const [charlieHasPacket, setCharlieHasPacket] = useState<boolean>(false);
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);

  const seedBase = useMemo(() => Date.now() & 0xfffffff, []);
  const seed = useMemo(() => seedBase + nBits * 999 + stepIdx * 123, [seedBase, nBits, stepIdx]);

  const step = STEPS[stepIdx];

  const resetProtocol = () => {
    setStepIdx(0);
    setVk(null);
    setSk(null);
    setY(null);
    setSigma(null);
    setQskAlive(false);
    setXSig(null);
    setBobHasPacket(false);
    setCharlieHasPacket(false);
    setVerifyResult(null);
  };

  const resetAll = () => {
    setMode("intro");
    setIntroIdx(0);
    resetProtocol();
  };

  // ---- Intro navigation (user-driven) ----
  const introNext = () => setIntroIdx((i) => clamp(i + 1, 0, 5));
  const introBack = () => setIntroIdx((i) => clamp(i - 1, 0, 5));
  const introStartCities = () => setIntroIdx(1); // one click → all cities appear

  const startDemo = () => {
    setMode("demo");
    resetProtocol();
  };

  // ---- Demo navigation ----
  const demoBack = () => setStepIdx((i) => clamp(i - 1, 0, STEPS.length - 1));
  const demoReset = () => resetProtocol();

  // ---- Guided focus + bubble (only 1 thing at a time) ----
  const focusAndBubble = useMemo((): { focus: Anchor | null; title: string; text: string } => {
    if (mode === "intro") {
      switch (introIdx) {
        case 0:
          return {
            focus: "center",
            title: "Welcome",
            text: "We’ll walk through an OSS delegation flow. Press Start to place three locations on the map.",
          };
        case 1:
          return {
            focus: "center",
            title: "Cities",
            text: "Consider three locations participating in a high-value authorization flow.",
          };
        case 2:
          return { focus: "alice", title: "Alice — Sydney", text: "Alice creates PQC keys and delegates signing authority." };
        case 3:
          return { focus: "bob", title: "Bob — Strasbourg", text: "Bob runs OSS / MIMIQ to sign exactly once." };
        case 4:
          return { focus: "charlie", title: "Charlie — Vancouver", text: "Charlie verifies PQC + OSS end-to-end." };
        case 5:
          return { focus: "center", title: "Choose message m", text: "Pick m and press Start to run the protocol." };
        default:
          return { focus: null, title: "", text: "" };
      }
    }
    
    
    

    // demo
    switch (step.id) {
      case "pqc_gen":
        return { focus: "alice", title: step.title, text: step.hint };
      case "pick_y_sign":
        return { focus: "alice", title: step.title, text: step.hint };
      case "send_y_sigma":
        return { focus: "topBeam", title: step.title, text: step.hint };
      case "oss_gen":
        return { focus: "bob", title: step.title, text: step.hint };
      case "oss_sign":
        return { focus: "capsule", title: step.title, text: step.hint };
      case "send_bundle":
        return { focus: "diagBeam", title: step.title, text: step.hint };
      case "verify":
        return { focus: "charlie", title: step.title, text: step.hint };
      default:
        return { focus: null, title: "", text: "" };
    }
  }, [mode, introIdx, step]);

  // ---- Step gating (so the story feels coordinated) ----
  const canAdvanceDemoStep = useMemo(() => {
    if (mode !== "demo") return false;
    switch (step.id) {
      case "pqc_gen":
        return Boolean(vk && sk);
      case "pick_y_sign":
        return Boolean(y && sigma);
      case "send_y_sigma":
        return bobHasPacket;
      case "oss_gen":
        return qskAlive; // becomes true after OSS.Gen
      case "oss_sign":
        return Boolean(xSig) && !qskAlive;
      case "send_bundle":
        return charlieHasPacket;
      case "verify":
        return verifyResult !== null;
      default:
        return false;
    }
  }, [mode, step.id, vk, sk, y, sigma, bobHasPacket, qskAlive, xSig, charlieHasPacket, verifyResult]);

  const demoNext = () => {
    // allow manual next only if step condition achieved (prevents “random” progression)
    if (!canAdvanceDemoStep) return;
    setStepIdx((i) => clamp(i + 1, 0, STEPS.length - 1));
  };

  // ---- Click handlers that also advance when appropriate ----
  const onAlice = () => {
    if (mode !== "demo") {
      // Intro: clicking the highlighted character can also advance
      if (introIdx === 3) introNext();
      return;
    }

    if (step.id === "pqc_gen") {
      const newSk = "sk:" + pseudoRandBits(nBits, seed);
      const newVk = "vk:" + pseudoRandBits(nBits, seed + 42);
      setSk(newSk);
      setVk(newVk);
      return;
    }

    if (step.id === "pick_y_sign") {
      if (!sk) return;
      const newY = "y:" + pseudoRandBits(nBits, seed + 7);
      const newSigma = "σ:" + pseudoRandBits(Math.min(12, nBits), seed + 99);
      setY(newY);
      setSigma(newSigma);
      return;
    }
  };

  const onTopBeam = () => {
    if (mode !== "demo") return;
    if (step.id !== "send_y_sigma") return;
    if (!y || !sigma) return;
    setBobHasPacket(true);
  };

  const onBob = () => {
    if (mode !== "demo") {
      if (introIdx === 4) introNext();
      return;
    }
    if (step.id !== "oss_gen") return;
    if (!bobHasPacket) return;
    setQskAlive(true);
  };

  const onCapsule = () => {
    if (mode !== "demo") return;
    if (step.id !== "oss_sign") return;
    if (!qskAlive) return;

    const newX = "x:" + pseudoRandBits(10, seed + (mBit === 1 ? 202 : 303));
    setXSig(newX);
    setQskAlive(false);
  };

  const onDiagBeam = () => {
    if (mode !== "demo") return;
    if (step.id !== "send_bundle") return;
    if (!y || !sigma || !xSig) return;
    setCharlieHasPacket(true);
  };

  const onCharlie = () => {
    if (mode !== "demo") {
      if (introIdx === 5) introNext();
      return;
    }
    if (step.id !== "verify") return;
    if (!charlieHasPacket) return;

    const ok = Boolean(vk && y && sigma && xSig && !qskAlive);
    setVerifyResult(ok);
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
        <p className="oss-subtitle">User-driven walkthrough. No random timings.</p>
      </div>

      <div className="oss-stage-shell">
        <OssStage
          mode={mode}
          introIdx={introIdx}
          stepId={step.id}
          focus={focusAndBubble.focus}
          bubbleTitle={focusAndBubble.title}
          bubbleText={focusAndBubble.text}
          // protocol live state (for visuals)
          live={{
            m: mBit,
            vk,
            sk,
            y,
            sigma,
            qskAlive,
            x: xSig,
            bobHasPacket,
            charlieHasPacket,
            verifyResult,
          }}
          // handlers
          onAlice={onAlice}
          onBob={onBob}
          onCharlie={onCharlie}
          onTopBeam={onTopBeam}
          onDiagBeam={onDiagBeam}
          onCapsule={onCapsule}
          // intro controls
          mBit={mBit}
          setMBit={setMBit}
          onStartDemo={startDemo}
          onIntroNext={introNext}
          onIntroBack={introBack}
          onIntroStartCities={introStartCities}
          // demo controls
          canNext={canAdvanceDemoStep}
          onDemoNext={demoNext}
          onDemoBack={demoBack}
          onDemoReset={demoReset}
        />
      </div>
    </div>
  );
}
