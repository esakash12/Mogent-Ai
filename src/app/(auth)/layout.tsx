import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guest Guard: If user is already authenticated, redirect them directly to their dashboard
  const session = await getSession();
  if (session) {
    if (session.role === "SUPER_ADMIN") {
      redirect("/admin");
    }
    if (session.tenantSlug) {
      redirect(`/${session.tenantSlug}/dashboard`);
    }
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-body antialiased selection:bg-indigo-600 selection:text-white flex flex-col justify-between py-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Ambient Mesh Glow Background */}
      <div className="ambient-mesh-wrap pointer-events-none -z-10">
        <div className="ambient-glow-indigo" />
        <div className="ambient-glow-sky" />
        <div className="ambient-glow-emerald" />
      </div>

      {/* Decorative dot matrix grid */}
      <div className="fixed inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.06),transparent_50%)] pointer-events-none -z-10" />

      {/* Header Navigation */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pb-6 relative z-10">
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="Mogent AI হোমপেজ">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xl shadow-xs group-hover:bg-indigo-700 transition-colors">
            M
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-bold text-xl text-slate-900 leading-tight tracking-tight flex items-center gap-1.5">
              Mogent AI
              <span className="bd-flag-icon" />
            </span>
            <span className="text-[11px] text-slate-500 font-bengali">মার্চেন্ট কন্ট্রোল রুম</span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 font-bengali px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-200 transition-all shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>ওয়েবসাইটে ফিরুন</span>
        </Link>
      </header>

      {/* Main Form Container */}
      <main className="w-full max-w-md mx-auto my-auto relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto pt-6 text-center text-xs text-slate-400 font-bengali relative z-10">
        <p>© {new Date().getFullYear()} Mogent AI • বাংলাদেশের প্রথম মাল্টিচ্যানেল এআই সেলস ইঞ্জিন</p>
      </footer>
    </div>
  );
}
