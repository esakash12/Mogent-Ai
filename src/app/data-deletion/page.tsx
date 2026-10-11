import * as React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Trash2, CheckCircle2, Mail, ExternalLink } from "lucide-react";

export const metadata = {
  title: "User Data Deletion Instructions | Mogent AI",
  description: "Instructions on how Facebook and Instagram users can request the deletion of their personal data from Mogent AI.",
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-white hover:opacity-90 transition-opacity">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 font-bold text-white shadow-md shadow-indigo-500/20">
              M
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider">MOGENT AI</span>
              <span className="block text-[10px] text-slate-400">User Data Deletion Center</span>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-16 space-y-10">
        <div className="space-y-3 border-b border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
            <Trash2 className="h-3.5 w-3.5" />
            <span>Facebook Platform Compliance</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            User Data Deletion Instructions
          </h1>
          <p className="text-sm text-slate-400">
            According to Facebook Platform Rules, Mogent AI provides User Data Deletion callback instructions. If you want to delete your activities and data associated with Mogent AI, you can do so by following the instructions below.
          </p>
        </div>

        {/* Method 1: Facebook App Settings */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-xs">
              1
            </div>
            <h2 className="text-base font-bold text-white">
              Method 1: Remove Mogent AI from your Facebook Account
            </h2>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            You can remove Mogent AI and request your data deletion directly within Facebook:
          </p>

          <ol className="list-decimal pl-6 space-y-2 text-xs text-slate-400 leading-relaxed">
            <li>
              Go to your Facebook Profile&apos;s <strong>Settings &amp; Privacy</strong> and click <strong>Settings</strong>.
            </li>
            <li>
              Scroll down on the left-hand menu and click on <strong>Apps and Websites</strong>.
            </li>
            <li>
              Search for <strong>Mogent AI</strong> in the list of active apps.
            </li>
            <li>
              Click the <strong>Remove</strong> button next to the app.
            </li>
            <li>
              Check the box that says <em>&quot;Delete posts, videos or events Mogent AI posted on your timeline&quot;</em> and confirm by clicking <strong>Remove</strong>.
            </li>
            <li>
              Under <strong>Removed Apps and Websites</strong>, click on Mogent AI and click <strong>Send Request</strong> to trigger automatic data deletion.
            </li>
          </ol>
        </section>

        {/* Method 2: Direct Email Request */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xs">
              2
            </div>
            <h2 className="text-base font-bold text-white">
              Method 2: Direct Manual Deletion Request
            </h2>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            If you interacted with any merchant using Mogent AI via Messenger or Instagram and want all conversation logs, orders, or phone numbers erased:
          </p>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-xs">
            <p className="text-slate-300">
              Send an email to: <strong className="text-white font-mono">privacy@mogent.ai</strong>
            </p>
            <p className="text-slate-400">
              Subject: <strong>Data Deletion Request - [Your Name / Facebook Profile Link]</strong>
            </p>
            <p className="text-slate-400">
              Include your Facebook Page Scoped User ID (PSID) or the phone number used during ordering.
            </p>
          </div>

          <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Our data protection team will process your request and permanently erase all associated records within 48 hours.
          </p>
        </section>

        {/* Merchant Page Disconnect */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <h3 className="text-sm font-bold text-white">
            For Merchants: Revoking Page Access
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Merchants can permanently delete their Facebook Page connection at any time by logging into their dashboard, navigating to <strong>Integrations -&gt; Connected Pages</strong>, and clicking <strong>Disconnect</strong>. This action immediately deletes all stored page tokens from our database.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Mogent AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
