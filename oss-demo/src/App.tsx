import React, { useState } from "react";
import "./App.css";
import OssDemo from "./pages/OssDemo";

interface LandingProps {
  onStartDemo: () => void;
}

const Landing: React.FC<LandingProps> = ({ onStartDemo }) => {
  return (
    <div className="landing landing-v2">
      <section className="landing-v2-viewport">
        <div className="landing-v2-grid" aria-hidden="true" />

        <header className="landing-v2-topbar">
          <div className="landing-v2-brand">BTQ Technologies</div>
        </header>

        <div className="landing-v2-main">
          <h1 className="landing-v2-title">One-Shot Signatures</h1>
          <p className="landing-v2-subtitle">
            A One-Shot Signature Is A Quantum-Enhanced Signing Key That Works
            Exactly Once. After Its First Use, It Self-Destructs, Making Key
            Misuse And Replay Attacks Physically Impossible.
          </p>

          <div className="landing-v2-actions">
            <button className="landing-v2-cta" type="button" onClick={onStartDemo}>
              Get Started
            </button>
          </div>
        </div>
      </section>

      <section className="landing-v2-feature">
        <div className="landing-v2-featureText">
          <h2 className="landing-v2-featureTitle">
            Quantum Security, One
            <br />
            Signature at a Time
          </h2>
          <p className="landing-v2-featureCopy">
            How One-Shot Signatures work in real time.
          </p>
        </div>

        <div className="landing-v2-featureAction">
          <button className="landing-v2-cta" type="button" onClick={onStartDemo}>
            Run Demo
          </button>
        </div>
      </section>
    </div>
  );
};



const App: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false);

  return showDemo ? (
    <OssDemo onBack={() => setShowDemo(false)} />
  ) : (
    <Landing onStartDemo={() => setShowDemo(true)} />
  );
};

export default App;
