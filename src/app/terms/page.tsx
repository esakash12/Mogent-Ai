import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, Mail } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Mogent AI",
  description: "Terms and conditions of using the Mogent AI software platform and integrations.",
};

export default function TermsPage() {
  const lastUpdated = "September 23, 2026";

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
              <span className="block text-[10px] text-slate-400">Terms of Service</span>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/data-deletion" className="text-slate-400 hover:text-white transition-colors">
              Data Deletion
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
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-10">
        <div className="space-y-3 border-b border-slate-800 pb-8">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-400">
            Last Updated: <span className="text-slate-200 font-semibold">{lastUpdated}</span>
          </p>
        </div>

        <section className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            By accessing or using <strong>Mogent AI</strong> (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
          </p>

          <h2 className="text-xl font-bold text-white pt-4">1. Use of Service</h2>
          <p className="text-slate-400">
            Mogent AI provides AI-powered conversational sales tools, automated order processing, and courier logistics management. You agree to use the Service in compliance with all applicable local, national, and international laws, including Meta Platform Policies.
          </p>

          <h2 className="text-xl font-bold text-white pt-4">2. Merchant Responsibilities</h2>
          <p className="text-slate-400">
            Merchants connecting their Facebook Pages, Instagram, WhatsApp, or website widgets are solely responsible for ensuring that their automated responses, product pricing, and business interactions adhere to Meta Commercial Policies and consumer protection regulations.
          </p>

          <h2 className="text-xl font-bold text-white pt-4">3. Prohibited Activities</h2>
          <p className="text-slate-400">
            You agree not to use the Service to transmit unsolicited spam, hateful or illicit content, malware, or to conduct unauthorized scraping or intellectual property infringement.
          </p>

          <h2 className="text-xl font-bold text-white pt-4">4. Limitation of Liability</h2>
          <p className="text-slate-400">
            Mogent AI is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. In no event shall Mogent AI be liable for any indirect, incidental, or consequential damages resulting from downtime or third-party service changes (e.g. Meta API updates).
          </p>

          <h2 className="text-xl font-bold text-white pt-4">5. Contact Information</h2>
          <p className="text-slate-400">
            For questions regarding these Terms, contact us at <span className="text-white font-mono">legal@mogent.ai</span>.
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
