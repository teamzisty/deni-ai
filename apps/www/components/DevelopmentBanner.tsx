"use client";

import { useEffect, useState } from "react";
import { ReactNode } from "react";

interface DevelopmentBannerProps {
  children?: ReactNode;
}

export const DevelopmentBanner = ({ children }: DevelopmentBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const bannerHeight = 40; // バナーの高さをピクセル単位で設定

  // ハイドレーション完了後にマウント状態を更新
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {    
    // カスタムイベントも発行（より直接的な通知方法）
    window.dispatchEvent(new CustomEvent('dev-banner-visibility-change', {
      detail: { isVisible }
    }));

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+L のキー組み合わせを検出
      if (event.ctrlKey && event.shiftKey && event.key === "L") {
        setIsVisible((prev) => !prev);
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVisible]);

  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <>
      {isDevelopment && isVisible && (
        <div className="fixed bottom-0 left-0 w-full z-50 bg-primary text-primary-foreground text-center py-2 px-4">
          <p>
            DEVELOPMENT BUILD - MAY NOT REPRESENT THE FINAL LOOK OF DESIGN
          </p>
        </div>
      )}
      <div>
        {children}
      </div>
    </>
  );
};