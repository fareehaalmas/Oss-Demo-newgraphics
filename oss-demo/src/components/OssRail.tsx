// src/components/OssRail.tsx
import "./ossRail.css";

type RailRect = { left?: number; right?: number; top: number; width: number; height: number };

type Props = {
  variant: "sydney" | "strasbourg";
  rect: RailRect;

  // Sydney-side
  authDone?: boolean;
  nonce?: string | null;
  sigChallenge?: string | null;

  vkA?: string | null;
  skA?: string | null;

  mauth?: string | null;
  sigmaA?: string | null;

  // Strasbourg-side
  y?: string | null;
  skBAlive?: boolean;

  mpay?: string | null;
  vBit?: 0 | 1 | null;

  sigmaB?: string | null;

  verifyOk?: boolean | null;
  executed?: boolean;
};

function Chip({ label, tone }: { label: string; tone?: "muted" | "ok" | "bad" }) {
  return <span className={`rail-chip ${tone ?? "muted"}`}>{label}</span>;
}

function MonoLine({ label, value }: { label: string; value: string | null | undefined }) {
  return <div className="rail-mono">{value ? `${label}=${value}` : `${label}=—`}</div>;
}

function KeyPairRow({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: {
  leftLabel: string;
  leftValue: string | null | undefined;
  rightLabel: string;
  rightValue: string | null | undefined;
}) {
  return (
    <div className="rail-two">
      <div className="rail-twoCell">
        <div className="rail-mono">{leftValue ? `${leftLabel}=${leftValue}` : `${leftLabel}=—`}</div>
      </div>
      <div className="rail-twoCell">
        <div className="rail-mono">{rightValue ? `${rightLabel}=${rightValue}` : `${rightLabel}=—`}</div>
      </div>
    </div>
  );
}

export default function OssRail({
  variant,
  rect,

  authDone,
  nonce,
  sigChallenge,
  vkA,
  skA,
  mauth,
  sigmaA,

  y,
  skBAlive,
  mpay,
  vBit,
  sigmaB,
  verifyOk,
  executed,
}: Props) {
  const aliceKeysReady = Boolean(vkA && skA);
  const aliceAuthReady = Boolean(mauth && sigmaA);

  const bobKeyReady = Boolean(y) && Boolean(skBAlive);
  const bobConsumed = Boolean(y) && skBAlive === false;
  const mpayReady = Boolean(mpay);
  const bitReady = vBit !== null && vBit !== undefined;

  return (
    <aside
  className="oss-rail"
  style={{
    left: rect.left,
    right: rect.right,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  }}
>


      <div className="rail-head">
        <div className="rail-kicker">STATE</div>
      </div>

      <div className="rail-scroll" style={{ maxHeight: rect.height - 34 }}>
        {variant === "sydney" ? (
          <>
            {/* Pre-processing auth */}
            <div className="rail-section">
              <div className="rail-row">
                <div className="rail-label">Pre-processing auth</div>
                <Chip label={authDone ? "DONE" : "PENDING"} tone={authDone ? "ok" : "muted"} />
              </div>
              <KeyPairRow leftLabel="nonce" leftValue={nonce} rightLabel="sig" rightValue={sigChallenge} />
            </div>

            {/* Alice keys */}
            <div className="rail-section">
              <div className="rail-row">
                <div className="rail-label">Alice keys (vkA, skA)</div>
                <Chip
                  label={aliceKeysReady ? "GENERATED" : "NOT GENERATED"}
                  tone={aliceKeysReady ? "ok" : "muted"}
                />
              </div>
              <MonoLine label="vkA" value={vkA} />
            </div>

            {/* Alice authorisation */}
            <div className="rail-section">
              <div className="rail-row">
                <div className="rail-label">Alice authorisation</div>
                <Chip label={aliceAuthReady ? "SIGNED σA" : "NOT SIGNED"} tone={aliceAuthReady ? "ok" : "muted"} />
              </div>
              <KeyPairRow leftLabel="mauth" leftValue={mauth} rightLabel="σA" rightValue={sigmaA} />
            </div>
          </>
        ) : (
          <>
            {/* Bob (y, skB) */}
            <div className="rail-section">
              <div className="rail-row">
                <div className="rail-label">Bob (y, |skB⟩)</div>
                {bobKeyReady ? (
                  <Chip label="READY" tone="ok" />
                ) : bobConsumed ? (
                  <Chip label="CONSUMED" tone="bad" />
                ) : (
                  <Chip label="NOT READY" tone="muted" />
                )}
              </div>
              <MonoLine label="y" value={y} />
            </div>

            {/* Payment + verifier bit */}
            <div className="rail-section">
              <div className="rail-row">
                <div className="rail-label">Payment + verifier bit</div>
                <Chip
                  label={mpayReady && bitReady ? "READY" : mpayReady ? "WAITING b" : "NOT SENT"}
                  tone={mpayReady ? "ok" : "muted"}
                />
              </div>
              <KeyPairRow
                leftLabel="mpay"
                leftValue={mpay}
                rightLabel="b"
                rightValue={vBit === null || vBit === undefined ? null : String(vBit)}
              />
            </div>

            {/* σB + verification */}
            <div className="rail-section">
              <div className="rail-row">
                <div className="rail-label">σB + verification</div>
                <Chip
                  label={verifyOk === null || verifyOk === undefined ? "PENDING" : verifyOk ? "VALID" : "INVALID"}
                  tone={verifyOk === null || verifyOk === undefined ? "muted" : verifyOk ? "ok" : "bad"}
                />
              </div>
              <KeyPairRow
                leftLabel="σB"
                leftValue={sigmaB}
                rightLabel="verify"
                rightValue={verifyOk === null || verifyOk === undefined ? null : verifyOk ? "VALID" : "INVALID"}
              />
            </div>

            {/* Execution */}
            <div className="rail-section">
              <div className="rail-row">
                <div className="rail-label">Execution</div>
                <Chip label={executed ? "EXECUTED" : "NOT EXECUTED"} tone={executed ? "ok" : "muted"} />
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
