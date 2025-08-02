"use client";

import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";

export default function SmoothScroller() {
  useEffect(() => {
    // OSの「視差/アニメーション軽減」を尊重
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) return;

    const lenis = new Lenis({
      // 体感を好みに応じて微調整
      duration: 0.6, // 0.8〜1.4あたりで好みを探す
      smoothWheel: true,
      // smoothTouch オプションは LenisOptions には存在しないため削除
      // デフォルトの easing でも十分。こだわるなら下記のようにカスタムも可
      // easing: (t) => 1 - Math.pow(1 - t, 3),
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}