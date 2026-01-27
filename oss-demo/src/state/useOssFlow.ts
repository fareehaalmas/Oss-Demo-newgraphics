import { useMemo, useState } from "react";

export type Step =
  | "idle"
  | "alice_gen"
  | "alice_sign_y"
  | "send_y_sigma"
  | "bob_gen"
  | "choose_m"
  | "bob_sign_once"
  | "send_bundle"
  | "charlie_verify";

function randBits(n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.random() < 0.5 ? "0" : "1";
  return s;
}

function fakeSig(label: string, payload: string) {
  const base = btoa(`${label}:${payload}`).replace(/=+/g, "");
  return base.slice(0, 12);
}

export function useOssFlow() {
  const [n, setN] = useState(10);
  const [m, setM] = useState<0 | 1>(0);
  const [step, setStep] = useState<Step>("idle");

  const [y, setY] = useState<string>("");
  const [sigma, setSigma] = useState<string>("");
  const [x, setX] = useState<string>("");

  const [qskAlive, setQskAlive] = useState(false);

  const [pqcOk, setPqcOk] = useState<boolean | null>(null);
  const [ossOk, setOssOk] = useState<boolean | null>(null);

  const crs = useMemo(() => "crs-demo", []);

  function resetAll() {
    setStep("idle");
    setY(""); setSigma(""); setX("");
    setQskAlive(false);
    setPqcOk(null); setOssOk(null);
  }

  function runAliceGen() {
    setStep("alice_gen");
  }

  function runAliceSignY() {
    const yNew = randBits(n);
    setY(yNew);
    setSigma(fakeSig("PQC", yNew));
    setStep("alice_sign_y");
  }

  function sendYSigma() {
    setStep("send_y_sigma");
  }

  function runBobGen() {
    setQskAlive(true);
    setStep("bob_gen");
  }

  function chooseMessage(bit: 0 | 1) {
    setM(bit);
    setStep("choose_m");
  }

  function runBobSignOnce() {
    const out = fakeSig("OSS", `${crs}|${y}|${m}`);
    setX(out);
    setQskAlive(false); // self destruct
    setStep("bob_sign_once");
  }

  function sendBundle() {
    setStep("send_bundle");
  }

  function runCharlieVerify() {
    const ok1 = !!(y && sigma);
    const ok2 = !!(y && x);
    setPqcOk(ok1);
    setOssOk(ok2);
    setStep("charlie_verify");
  }

  return {
    n, setN,
    m, chooseMessage,
    step,
    y, sigma, x, crs,
    qskAlive,
    pqcOk, ossOk,
    resetAll,
    runAliceGen,
    runAliceSignY,
    sendYSigma,
    runBobGen,
    runBobSignOnce,
    sendBundle,
    runCharlieVerify,
  };
}
