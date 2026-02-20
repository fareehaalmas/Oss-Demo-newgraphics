// src/components/OssPanel.tsx
import "./ossPanel.css";

export type PanelMode = "keygen" | "sign" | "verify";

type OssPanelProps = {
  mode: PanelMode;
  title: string;
  style?: React.CSSProperties;

  // Keygen controls
  execMode: "quantum" | "classical";
  setExecMode: (v: "quantum" | "classical") => void;

  cipher: "simon" | "present";
  setCipher: (v: "simon" | "present") => void;

  lambda: number;
  setLambda: (v: number) => void;

  rootKey: string;
  setRootKey: (v: string) => void;

  isGenerating: boolean;
  onGenerateKeys: () => void;

  // Outputs
  pk: string | null;
  qskReady: boolean;

  // Sign controls
  message: string;
  setMessage: (v: string) => void;
  signingConsumed: boolean;
  signature: string | null;
  onSign: () => void;

  // Verify controls
  verifyResult: boolean | null;
  onVerify: () => void;
};

export default function OssPanel({
  mode,
  title,
  style,

  execMode,
  setExecMode,
  cipher,
  setCipher,
  lambda,
  setLambda,
  rootKey,
  setRootKey,
  isGenerating,
  onGenerateKeys,

  pk,
  qskReady,

  message,
  setMessage,
  signingConsumed,
  signature,
  onSign,

  verifyResult,
  onVerify,
}: OssPanelProps) {
  return (
    <div className="oss-panel" style={style}>
      <div className="oss-panel-header">
        <div className="oss-panel-title">{title}</div>
      </div>

      {mode === "keygen" && (
        <div className="oss-panel-body two-col">
          <div className="oss-panel-left">
            <div className="oss-section-title">PARAMETERS</div>

            <div className="oss-field">
              <div className="oss-field-label">Execution Mode</div>
              <div className="oss-seg">
                <button
                  type="button"
                  className={`oss-seg-btn ${execMode === "quantum" ? "on" : ""}`}
                  onClick={() => setExecMode("quantum")}
                >
                  Quantum Circuit
                </button>
                <button
                  type="button"
                  className={`oss-seg-btn ${execMode === "classical" ? "on" : ""}`}
                  onClick={() => setExecMode("classical")}
                >
                  Classical Simulation
                </button>
              </div>
            </div>

            <div className="oss-field">
              <div className="oss-field-label">Cipher</div>
              <div className="oss-seg">
                <button
                  type="button"
                  className={`oss-seg-btn ${cipher === "simon" ? "on" : ""}`}
                  onClick={() => setCipher("simon")}
                >
                  Simon (k=64)
                </button>
                <button
                  type="button"
                  className={`oss-seg-btn ${cipher === "present" ? "on" : ""}`}
                  onClick={() => setCipher("present")}
                >
                  PRESENT (k=80)
                </button>
              </div>
            </div>

            <div className="oss-field">
              <div className="oss-field-label">Security Parameter (λ): {lambda}</div>
              <input type="range" min={1} max={5} value={lambda} onChange={(e) => setLambda(Number(e.target.value))} />
            </div>

            <div className="oss-field">
              <div className="oss-field-label">Root Key</div>
              <input className="oss-input" value={rootKey} onChange={(e) => setRootKey(e.target.value)} />
              <div className="oss-hint">8 characters • 64-bit key</div>
            </div>

            <button type="button" className="oss-primary" onClick={onGenerateKeys} disabled={isGenerating}>
              {isGenerating ? "Generating…" : "Generate Keys"}
            </button>
          </div>

          <div className="oss-panel-right">
            <div className="oss-section-title">GENERATED KEYS</div>

            <div className="oss-card">
              <div className="oss-card-title">Public Key (pk)</div>
              <div className="oss-mono">{pk ?? "No key generated"}</div>
            </div>

            <div className="oss-card">
              <div className="oss-card-title">Quantum Signing Key (sk)</div>
              <div className={`oss-status ${qskReady ? "ok" : "muted"}`}>
                {qskReady ? "READY (can sign 1 message)" : "NOT GENERATED"}
              </div>
              <div className="oss-mono">{qskReady ? "|ψ⟩ = Σₓ aₓ |x⟩ where f(x)=y" : ""}</div>
            </div>
          </div>
        </div>
      )}

      {mode === "sign" && (
        <div className="oss-panel-body two-col">
          <div className="oss-panel-left">
            <div className="oss-section-title">SIGN MESSAGE</div>

            <div className="oss-card">
              <div className="oss-card-title">Signing Key Status</div>
              <div className={`oss-status ${signingConsumed ? "bad" : "ok"}`}>
                {signingConsumed ? "KEY CONSUMED" : "READY"}
              </div>
            </div>

            <div className="oss-field">
              <div className="oss-field-label">Message to Sign</div>
              <input className="oss-input" value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>

            <button type="button" className="oss-primary" onClick={onSign} disabled={signingConsumed}>
              Sign Message
            </button>

            <div className="oss-card">
              <div className="oss-card-title">Signature (x)</div>
              <div className="oss-mono">{signature ?? "—"}</div>
            </div>
          </div>

          <div className="oss-panel-right">
            <div className="oss-section-title">VERIFY SIGNATURE</div>

            <div className="oss-field">
              <div className="oss-field-label">Public Key (pk)</div>
              <div className="oss-monoBox">{pk ?? "—"}</div>
            </div>

            <div className="oss-field">
              <div className="oss-field-label">Message</div>
              <div className="oss-monoBox">{message || "—"}</div>
            </div>

            <div className="oss-field">
              <div className="oss-field-label">Signature (x)</div>
              <div className="oss-monoBox">{signature ?? "—"}</div>
            </div>

            <button type="button" className="oss-primary" onClick={onVerify}>
              Verify Signature
            </button>

            <div className="oss-card">
              <div className="oss-card-title">Verification Result</div>
              <div className={`oss-status ${verifyResult ? "ok" : verifyResult === false ? "bad" : "muted"}`}>
                {verifyResult === null ? "—" : verifyResult ? "VALID ✓" : "INVALID ✗"}
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === "verify" && (
        <div className="oss-panel-body">
          <div className="oss-section-title">VERIFY</div>
          <button type="button" className="oss-primary" onClick={onVerify}>
            Verify
          </button>
          <div className={`oss-status ${verifyResult ? "ok" : verifyResult === false ? "bad" : "muted"}`}>
            {verifyResult === null ? "—" : verifyResult ? "VALID ✓" : "INVALID ✗"}
          </div>
        </div>
      )}
    </div>
  );
}
