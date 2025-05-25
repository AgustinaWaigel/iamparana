"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    sa?: {
      trackPage: (url: string) => void;
      track?: (eventName: string) => void;
    };
  }
}

export default function AnalyticsProvider() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (window.sa && prevPathname.current !== pathname) {
      window.sa.trackPage(pathname);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  return (
    <Script
      src="https://scripts.simpleanalyticscdn.com/latest.js"
      strategy="afterInteractive"
      async
      defer
    />
  );
}
