"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, LogOut, Menu, X, ArrowRight, Shield } from "lucide-react";
import type { SessionPayload } from "@/lib/session";

interface LandingNavbarProps {
  session: SessionPayload | null;
}

export default function LandingNavbar({ session: initialSession }: LandingNavbarProps) {
  const [session, setSession] = useState<SessionPayload | null>(initialSession);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Revalidate session on client mount to eliminate stale BF cache / back button glitches
  useEffect(() => {
    let isMounted = true;
    async function checkLiveSession() {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setSession(data.authenticated ? data.session : null);
          }
        }
      } catch {
        // Fallback to initialSession
      }
    }
    checkLiveSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue to redirect even on network error
    } finally {
      setSession(null);
      // Hard navigation to purge client router cache and memory
      window.location.href = "/";
    }
  };

  const dashboardUrl = session
    ? session.role === "SUPER_ADMIN"
      ? "/admin"
      : session.tenantSlug
      ? `/${session.tenantSlug}/dashboard`
      : "/dashboard"
    : "/dashboard";

  return (
    <>
      {/* Scroll Progress Bar Marker */}
      <div id="scrollProgressBar" aria-hidden="true" />

      {/* Top Announcement Bar */}
      <div className="bg-indigo-600 text-white text-xs font-bengali py-2.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">নতুন v2.0</span>
          <span>বাংলাদেশে প্রথম স্বয়ংক্রিয় এআই ভয়েস কলিং ও Steadfast/Pathao কুরিয়ার সিঙ্ক এখন লাইভ!</span>
          <a href="#pricing" className="underline hover:text-indigo-100 font-semibold ml-1">
            ১৪ দিনের ট্রায়াল নিন &rarr;
          </a>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="font-heading font-extrabold text-2xl tracking-tight text-slate-900 flex items-center gap-1">
                Mogent <span className="text-indigo-600">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 font-bengali block -mt-1 font-medium">
                অল-ইন-ওয়ান স্মার্ট এআই সেলস এজেন্ট
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links (Clean, No Duplicate Dashboard Links) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600 font-bengali">
            <a href="#demo" className="hover:text-indigo-600 transition-colors font-bold text-indigo-700">
              লাইভ ডেমো ও ট্রেইনার
            </a>
            <a href="#bento" className="hover:text-indigo-600 transition-colors">
              ফিচারসমূহ
            </a>
            <a href="#calculator" className="hover:text-indigo-600 transition-colors">
              ROI ক্যালকুলেটর
            </a>
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              স্পেসিফিকেশন
            </a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">
              প্রাইসিং
            </a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">
              এফএকিউ
            </a>
          </nav>

          {/* Desktop Action CTAs (Strictly Synced with Auth State) */}
          <div className="hidden sm:flex items-center gap-3 font-bengali">
            {session ? (
              // Authenticated View: Single Dashboard Button + Logout
              <>
                <Link
                  href={dashboardUrl}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5"
                >
                  {session.role === "SUPER_ADMIN" ? (
                    <Shield className="w-3.5 h-3.5" />
                  ) : (
                    <LayoutDashboard className="w-3.5 h-3.5" />
                  )}
                  <span>{session.role === "SUPER_ADMIN" ? "এডমিন প্যানেল" : "ড্যাশবোর্ডে যান"}</span>
                  <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  title="লগআউট"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isLoggingOut ? "বের হচ্ছে..." : "লগআউট"}</span>
                </button>
              </>
            ) : (
              // Guest View: Login & Free Trial Only
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-all"
                >
                  লগইন
                </Link>
                <Link
                  href="/register"
                  className="btn-shimmer px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5"
                >
                  ফ্রি ট্রায়াল শুরু করুন
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            id="mobileNavOpenBtn"
            type="button"
            aria-label="মেনু খুলুন"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <div
        id="mobileNavDrawer"
        className={`${
          mobileOpen ? "flex" : "hidden"
        } fixed inset-0 z-50 bg-white p-6 flex flex-col justify-between`}
      >
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">
                M
              </div>
              <span className="font-heading font-bold text-lg text-slate-900">Mogent AI</span>
            </div>
            <button
              id="mobileNavCloseBtn"
              type="button"
              aria-label="মেনু বন্ধ করুন"
              onClick={() => setMobileOpen(false)}
              className="p-2 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex flex-col gap-4 mt-6 text-base font-bengali text-slate-700 font-medium">
            <a
              href="#demo"
              onClick={() => setMobileOpen(false)}
              className="mobile-link-item py-2 border-b border-slate-100 font-bold text-indigo-700"
            >
              লাইভ ডেমো ও ট্রেইনার
            </a>
            <a
              href="#bento"
              onClick={() => setMobileOpen(false)}
              className="mobile-link-item py-2 border-b border-slate-100"
            >
              ফিচারসমূহ
            </a>
            <a
              href="#calculator"
              onClick={() => setMobileOpen(false)}
              className="mobile-link-item py-2 border-b border-slate-100"
            >
              ROI ক্যালকুলেটর
            </a>
            <a
              href="#features"
              onClick={() => setMobileOpen(false)}
              className="mobile-link-item py-2 border-b border-slate-100"
            >
              স্পেসিফিকেশন
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileOpen(false)}
              className="mobile-link-item py-2 border-b border-slate-100"
            >
              প্রাইসিং ও ওয়ালেট
            </a>
            <a
              href="#faq"
              onClick={() => setMobileOpen(false)}
              className="mobile-link-item py-2 border-b border-slate-100"
            >
              এফএকিউ
            </a>
          </nav>
        </div>

        {/* Mobile Drawer Action CTAs */}
        <div className="pt-6 border-t border-slate-200 font-bengali flex flex-col gap-3">
          {session ? (
            <>
              <Link
                href={dashboardUrl}
                onClick={() => setMobileOpen(false)}
                className="block w-full py-3 text-center rounded-xl bg-indigo-600 text-white font-bold shadow-md text-sm"
              >
                {session.role === "SUPER_ADMIN" ? "এডমিন প্যানেল &rarr;" : "ড্যাশবোর্ডে যান &rarr;"}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="block w-full py-2.5 text-center rounded-xl border border-rose-200 text-rose-600 font-bold hover:bg-rose-50 transition-colors text-sm"
              >
                লগআউট করুন
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="mobile-link-item block w-full py-2.5 text-center rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm"
              >
                মার্চেন্ট লগইন
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="btn-shimmer mobile-link-item block w-full py-3 text-center rounded-xl bg-indigo-600 text-white font-bold shadow-md text-sm"
              >
                ১৪ দিনের ফ্রি ট্রায়াল নিন
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
