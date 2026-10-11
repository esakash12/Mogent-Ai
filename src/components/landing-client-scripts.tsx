"use client";

import React, { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    initMogentLanding?: () => void;
  }
}

export default function LandingClientScripts() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.initMogentLanding) {
      window.initMogentLanding();
    }
  }, []);

  return (
    <>
      <Script src="/assets/js/brand-svgs.js" strategy="afterInteractive" />
      <Script
        src="/assets/js/main.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== "undefined" && window.initMogentLanding) {
            window.initMogentLanding();
          }
        }}
      />
    </>
  );
}
