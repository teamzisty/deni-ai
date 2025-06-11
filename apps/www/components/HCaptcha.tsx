"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useTranslations } from "next-intl";
import { useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { useTheme } from "next-themes";

interface HCaptchaComponentProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: string) => void;
  size?: "normal" | "compact" | "invisible";
}

export const HCaptchaComponent = forwardRef<any, HCaptchaComponentProps>(
  ({ onVerify, onExpire, onError, size = "normal" }, ref) => {
    const t = useTranslations();
    const { theme } = useTheme();
    const captchaRef = useRef<HCaptcha>(null);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      execute: () => {
        if (captchaRef.current) {
          captchaRef.current.execute();
        }
      },
      resetCaptcha: () => {
        if (captchaRef.current) {
          captchaRef.current.resetCaptcha();
        }
      },
    }));

    const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
    const handleVerify = useCallback(
      (token: string) => {
        console.log("hCaptcha verified with token:", token);
        onVerify(token);
      },
      [onVerify]
    );

    const handleExpire = useCallback(() => {
      console.log("hCaptcha expired, resetting captcha");
      // Reset the captcha widget when it expires
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
      }
      onExpire?.();
    }, [onExpire]);

    const handleError = useCallback(
      (error: string) => {
        console.error("hCaptcha error:", error);
        // Reset the captcha widget on error
        if (captchaRef.current) {
          captchaRef.current.resetCaptcha();
        }
        onError?.(error);
      },
      [onError]
    );
    if (!siteKey) {
      console.warn("hCaptcha site key not found in environment variables");
      return null;
    }
    // Determine theme - use 'light' as fallback since hCaptcha only supports 'light' and 'dark'
    const captchaTheme = theme === "dark" ? "dark" : "light";

    return (
      <div className="flex justify-center my-4">
        {" "}
        <HCaptcha
          ref={captchaRef}
          sitekey={siteKey}
          onVerify={handleVerify}
          onExpire={handleExpire}
          onError={handleError}
          size={size}
          theme={captchaTheme}
        />
      </div>
    );
  }
);

HCaptchaComponent.displayName = "HCaptchaComponent";

export default HCaptchaComponent;
