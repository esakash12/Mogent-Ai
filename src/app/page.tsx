import React from "react";
import type { Metadata } from "next";
import { LANDING_HTML } from "./landing-content";
import LandingNavbar from "@/components/landing-navbar";
import LandingClientScripts from "@/components/landing-client-scripts";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mogent AI — বাংলাদেশের প্রথম অল-ইন-ওয়ান স্মার্ট এআই সেলস এজেন্ট",
  description: "অভিজ্ঞ সেলস ম্যানেজারের মতো স্বাভাবিক বাংলায় চ্যাট ও ফোনে কথা বলে আপনার ই-কমার্স বিক্রি দ্বিগুণ করুন। মেটা মেসেঞ্জার, হোয়াটসঅ্যাপ, ইনস্টাগ্রাম ও কুরিয়ার ইন্টিগ্রেশন।",
};

export default async function LandingPage() {
  const session = await getSession();

  return (
    <div className="bg-[#F8FAFC] text-slate-800 font-body antialiased selection:bg-indigo-600 selection:text-white min-h-screen">
      {/* Design System Stylesheet */}
      <link rel="stylesheet" href="/assets/css/styles.css" />

      {/* Reactive Authentication-Aware Navbar & Mobile Drawer */}
      <LandingNavbar session={session} />

      {/* 100% Exact 1:1 DOM from Dont Edit or write/index.html */}
      <div
        id="mogent-landing-content"
        dangerouslySetInnerHTML={{ __html: LANDING_HTML }}
      />

      {/* Interactive JS and Brand SVG scripts */}
      <LandingClientScripts />
    </div>
  );
}
