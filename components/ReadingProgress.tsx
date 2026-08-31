"use client";

import { useEffect, useState } from "react";

/** Sayfanın en üstünde, kaydırma oranıyla dolan ince bordo çubuk. */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    function update() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0);
      frame = 0;
    }

    function onScroll() {
      // Kaydırma olayı sık tetikleniyor; kare başına bir kez hesapla.
      if (frame === 0) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="reading-progress" aria-hidden="true">
      <div className="reading-progress-fill" style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}
