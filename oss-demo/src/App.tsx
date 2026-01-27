import React, { useState } from "react";
import "./App.css";
import OssDemo from "./pages/OssDemo";

import IntroSlides from "./IntroSlides";

interface LandingProps {
  onStartDemo: () => void;
}

const Landing: React.FC<LandingProps> = ({ onStartDemo }) => {
  return (
    <div className="landing">

      {/* animated background layers */}
      <div className="bg-tech" aria-hidden="true" />

      <header className="landing-hero">
        <div className="pill pill-logo">
          <img src="/btq-icon-white.png" alt="BTQ" className="pill-logo-img" />
          BTQ Technologies
        </div>

        <h1 className="hero-title">One-Shot Signatures</h1>
        <p className="hero-tagline">digital trust powered by physics</p>

        <p className="hero-subtitle">
          A one-shot signature is a quantum-enhanced signing key that works{" "}
          <strong>exactly once</strong>. After its first use, it{" "}
          <strong>self-destructs</strong>, making key misuse and replay attacks
          physically impossible.
        </p>
      </header>

      <main className="landing-content">
        <IntroSlides />

        <div className="hero-actions section-cta">
          <button className="primary-cta" type="button" onClick={onStartDemo}>
            ▶ Run interactive demo
          </button>
          <span className="cta-caption">
            Follow a role-play between an issuer, a custodian bank, and an
            investor.
          </span>
        </div>
      </main>
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
