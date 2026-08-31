"use client";

import { useEffect, useState } from "react";

/** Sayfa aşağı kaydırıldığında sağ altta beliren "başa dön" düğmesi. */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;

    function update() {
      setVisible(window.scrollY > 600);
      frame = 0;
    }

    function onScroll() {
      if (frame === 0) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <button
      type="button"
      className={visible ? "scroll-top is-visible" : "scroll-top"}
      aria-label="Sayfanın başına dön"
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      ↑
    </button>
  );
}
