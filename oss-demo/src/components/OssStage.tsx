// src/components/OssStage.tsx
type Anchor = "alice" | "bob" | "charlie" | "topBeam" | "diagBeam" | "capsule" | "center";

type OssStageProps = {
  mode: "intro" | "demo";
  introIdx: number;

  stepId: string;
  live: any;

  focus: Anchor | null;
  bubbleTitle: string;
  bubbleText: string;
  onIntroStartCities: () => void;

  onAlice?: () => void;
  onBob?: () => void;
  onCharlie?: () => void;
  onTopBeam?: () => void;
  onDiagBeam?: () => void;
  onCapsule?: () => void;

  // intro prompt
  mBit: 0 | 1;
  setMBit: (v: 0 | 1) => void;
  onStartDemo: () => void;
  onIntroNext: () => void;
  onIntroBack: () => void;

  // demo stepper
  canNext: boolean;
  onDemoNext: () => void;
  onDemoBack: () => void;
  onDemoReset: () => void;
};

function hot(stepId: string, ...ids: string[]) {
  return ids.includes(stepId);
}

export default function OssStage({
  mode,
  introIdx,
  stepId,
  live,
  focus,
  bubbleTitle,
  bubbleText,
  onAlice,
  onBob,
  onCharlie,
  onTopBeam,
  onDiagBeam,
  onCapsule,
  mBit,
  setMBit,
  onStartDemo,
  onIntroNext,
  onIntroBack,
  onIntroStartCities,
  canNext,
  onDemoNext,
  onDemoBack,
  onDemoReset,
}: OssStageProps) {
  const stageClass = `oss-stage mode-${mode} intro-${introIdx} ${focus ? "is-guiding" : ""}`;
  const focusId = focus ?? "none";

  // Intro reveals are *step based*, not timed.
  // 0 Sydney, 1 +Strasbourg, 2 +Vancouver, 3 +Alice, 4 +Bob, 5 +Charlie, 6 prompt
  // 0 blank, 1 Sydney, 2 Strasbourg, 3 Vancouver, 4 Alice, 5 Bob, 6 Charlie, 7 prompt
  const showCities = mode === "demo" || introIdx >= 1;
  const showSydney = showCities;
  const showStras = showCities;
  const showVanc = showCities;

  const showAlice = introIdx >= 4 || mode === "demo";
  const showBob = introIdx >= 5 || mode === "demo";
  const showCharlie = introIdx >= 6 || mode === "demo";

  const showLegend = introIdx >= 3 || mode === "demo";

  const aliceHot = mode === "demo" && hot(stepId, "pqc_gen", "pick_y_sign");
  const bobHot = mode === "demo" && hot(stepId, "oss_gen");
  const capsuleHot = mode === "demo" && hot(stepId, "oss_sign");
  const charlieHot = mode === "demo" && hot(stepId, "verify");
  const topBeamHot = mode === "demo" && hot(stepId, "send_y_sigma");
  const diagBeamHot = mode === "demo" && hot(stepId, "send_bundle");

  return (
    <div className={stageClass} data-focus={focusId}>
      {/* Cities */}
      {showSydney && (
        <div className="oss-cityWrap oss-cityWrap-sydney">
          <img className="oss-city oss-city-sydney" src="/city-sydney.png" alt="Sydney skyline" />
          <div className="oss-cityLabel">Sydney</div>
        </div>
      )}

      {showStras && (
        <div className="oss-cityWrap oss-cityWrap-strasbourg">
          <img className="oss-city oss-city-strasbourg" src="/city-strasbourg.png" alt="Strasbourg skyline" />
          <div className="oss-cityLabel">Strasbourg</div>
        </div>
      )}

      {showVanc && (
        <div className="oss-cityWrap oss-cityWrap-vancouver">
          <img className="oss-city oss-city-vancouver" src="/city-vancouver.png" alt="Vancouver skyline" />
          <div className="oss-cityLabel">Vancouver</div>
        </div>
      )}

      {/* Alice */}
      {showAlice && (
        <button className={`oss-node oss-alice ${aliceHot ? "is-hot" : ""}`} onClick={onAlice} type="button">
          <img className="oss-avatar" src="/avatar-alice.png" alt="Alice" />
          <div className="oss-node-text">
            <div className="oss-node-title">Sydney</div>
            <div className="oss-node-sub">Alice (PQC delegation)</div>
          </div>
        </button>
      )}

      {/* Bob */}
      {showBob && (
        <button className={`oss-node oss-bob ${bobHot ? "is-hot" : ""}`} onClick={onBob} type="button">
          <img className="oss-avatar" src="/avatar-bob.png" alt="Bob" />
          <div className="oss-node-text">
            <div className="oss-node-title">Grand Est, Strasbourg</div>
            <div className="oss-node-sub">Bob (OSS / MIMIQ)</div>
          </div>
          <img className="oss-chip" src="/chip-mimiq.png" alt="MIMIQ chip" />
        </button>
      )}

      {/* Charlie */}
      {showCharlie && (
        <button className={`oss-node oss-charlie ${charlieHot ? "is-hot" : ""}`} onClick={onCharlie} type="button">
          <img className="oss-avatar" src="/avatar-charlie.png" alt="Charlie" />
          <div className="oss-node-text">
            <div className="oss-node-title">Vancouver</div>
            <div className="oss-node-sub">Charlie (verification)</div>
          </div>

          <div className={`oss-verify-badge ${live.verifyResult === null ? "" : live.verifyResult ? "ok" : "bad"}`}>
            <img src="/badge-verify.png" alt="Verify badge" />
          </div>
        </button>
      )}

      {/* Beams (demo only) */}
      {mode === "demo" && (
        <button
          className={`oss-beam oss-beam-top ${topBeamHot ? "is-pulsing" : ""}`}
          onClick={onTopBeam}
          type="button"
          aria-label="Top beam"
        >
          <img src="/beam.png" alt="beam" />
          {topBeamHot && (
            <>
              <img className="oss-coin coin1" src="/coin.png" alt="" />
              <img className="oss-coin coin2" src="/coin.png" alt="" />
            </>
          )}
        </button>
      )}

      {mode === "demo" && (
        <button
          className={`oss-beam oss-beam-diag ${diagBeamHot ? "is-pulsing" : ""}`}
          onClick={onDiagBeam}
          type="button"
          aria-label="Diagonal beam"
        >
          <img src="/beam.png" alt="beam" />
          {diagBeamHot && <img className="oss-coin coin3" src="/coin.png" alt="" />}
        </button>
      )}

      {/* Capsule (only really meaningful in demo) */}
      <button
        className={`oss-capsule ${capsuleHot ? "is-hot" : ""} ${live.qskAlive ? "is-visible" : ""}`}
        onClick={onCapsule}
        type="button"
        aria-label="Quantum signing capsule"
      >
        <img src="/capsule-qsk.png" alt="Quantum signing capsule" />
        <div className="oss-capsule-tag">|sk⟩</div>
      </button>

      {/* ONE coordinated bubble */}
      {(bubbleTitle || bubbleText) && (
        <div className="oss-bubble">
          <div className="oss-bubble-title">{bubbleTitle}</div>
          <div className="oss-bubble-text">{bubbleText}</div>
        </div>
      )}

      {/* Prompt (Intro final step) */}
      {mode === "intro" && introIdx >= 7 && (
        <div className="oss-start-card">
          <div className="oss-start-title">Choose message m</div>
          <div className="oss-start-sub">Pick m, then start the protocol walkthrough.</div>

          <div className="oss-start-actions">
            <button
              type="button"
              className={`oss-start-seg ${mBit === 0 ? "is-on" : ""}`}
              onClick={() => setMBit(0)}
            >
              m = 0
            </button>
            <button
              type="button"
              className={`oss-start-seg ${mBit === 1 ? "is-on" : ""}`}
              onClick={() => setMBit(1)}
            >
              m = 1
            </button>
            <button type="button" className="oss-start-go" onClick={onStartDemo}>
              Start →
            </button>
          </div>
        </div>
      )}

      {/* Bottom stepper (this is the key coordination piece) */}
      <div className="oss-stepper">
        {mode === "intro" ? (
          <>
            <button type="button" className="stepper-btn" onClick={onIntroBack} disabled={introIdx === 0}>
              ← Back
            </button>

            <div className="stepper-mid">Intro {introIdx + 1} / 8</div>

            <button
              type="button"
              className="stepper-btn stepper-primary"
              onClick={introIdx === 0 ? onIntroStartCities : onIntroNext}
              disabled={introIdx >= 5}
            >
              {introIdx === 0 ? "Start →" : "Next →"}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="stepper-btn" onClick={onDemoBack} disabled={stepId === "pqc_gen"}>
              ← Back
            </button>

            <div className="stepper-mid">Protocol step</div>

            <button type="button" className="stepper-btn" onClick={onDemoReset}>
              Reset step
            </button>

            <button
              type="button"
              className={`stepper-btn stepper-primary ${canNext ? "" : "is-disabled"}`}
              onClick={onDemoNext}
              disabled={!canNext}
            >
              Next →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
