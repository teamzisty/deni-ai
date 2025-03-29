import Link from "next/link";
import React, { memo } from "react";

const Footer = memo(() => {
  return (
    <p className="text-xs text-center text-zinc-500 mt-2">
      AI の回答は必ずしも正しいとは限りません。すべての AI
      が無制限に利用できます。
      <br />
      <small>
        <Link
          target="_blank"
          href="https://voids.top/"
          className="hover:text-blue-500 transition-colors"
        >
          Powered by voids.top
        </Link>{" "}
        and{" "}
        <Link
          target="_blank"
          href="https://vercel.com/"
          className="hover:text-blue-500 transition-colors"
        >
          Vercel
        </Link>
      </small>
    </p>
  );
});

Footer.displayName = "Footer";

export { Footer };