import { useEffect, useState } from "react";

export default function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? doc.scrollTop / max : 0;
      setPct(Math.round(p * 100));

      const fill = document.getElementById("scroll-progress-fill");
      if (fill) (fill as HTMLElement).style.transform = `scaleX(${p})`;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="scroll-progress">
      <span className="scroll-progress-text">{pct}%</span>
      <div className="scroll-progress-bar">
        <div id="scroll-progress-fill" className="scroll-progress-fill" />
      </div>
    </div>
  );
}
