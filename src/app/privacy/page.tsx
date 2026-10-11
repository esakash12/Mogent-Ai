import * as React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, Database, Eye, Trash2, Mail, Globe } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Mogent AI",
  description: "Privacy Policy and Data Protection Terms for Mogent AI Platform and Meta Facebook/Instagram integrations.",
};

export default function PrivacyPolicyPage() {
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
              <span className="block text-[10px] text-slate-400">Enterprise Omnichannel Platform</span>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">
              Terms of Service
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
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-12">
        {/* Title */}
        <div className="space-y-3 border-b border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Meta Certified & GDPR / Local Law Compliant</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-400">
            Last Updated: <span className="text-slate-200 font-semibold">{lastUpdated}</span>
          </p>
        </div>

        {/* Introduction */}
        <section className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            Welcome to <strong>Mogent AI</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy and ensuring the security of the personal data processed through our website, software platform, and connected communication channels—including Meta Platforms (Facebook Pages, Messenger, and Instagram).
          </p>
          <p>
            This Privacy Policy explains how Mogent AI collects, uses, encrypts, and safeguards your data when merchants and their customers interact with our automated AI messaging and e-commerce fulfillment services.
          </p>
        </section>

        {/* Core Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Lock className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">AES-256 Encryption</h3>
            <p className="text-xs text-slate-400 leading-normal">
              All Meta access tokens and customer credentials are encrypted at rest with military-grade AES-256-GCM.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Eye className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Zero Data Monetization</h3>
            <p className="text-xs text-slate-400 leading-normal">
              We never sell, rent, or trade merchant or customer personal data to third parties or advertising networks.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <Trash2 className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Right to Erasure</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Merchants and consumers have full control to request complete permanent deletion of their stored data at any time.
            </p>
          </div>
        </div>

        {/* Section 1: Information We Collect */}
        <section className="space-y-4 text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-400" />
            1. Information We Collect
          </h2>
          <p>
            Depending on how you use Mogent AI, we collect and process the following categories of information:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>
              <strong className="text-slate-200">Merchant Account Data:</strong> Business name, email address, phone number, store slug, encrypted passwords, and subscription billing history.
            </li>
            <li>
              <strong className="text-slate-200">Meta / Facebook Platform Data:</strong> Facebook Page ID, Page Name, Page Public Profile, and Facebook Graph API Access Tokens granted through official Meta OAuth Dialog. We request the following permissions solely for operational bot automation:
              <span className="font-mono text-xs text-indigo-300 block mt-1">
                pages_show_list, pages_messaging, pages_manage_metadata, pages_read_engagement, instagram_basic, instagram_manage_messages
              </span>
            </li>
            <li>
              <strong className="text-slate-200">End-Customer Messaging Data:</strong> Customer Name, Facebook Scoped User ID (PSID), incoming message content, and media sent via Facebook Messenger or Instagram Direct Messages to the merchant’s connected pages.
            </li>
            <li>
              <strong className="text-slate-200">Order & Courier Fulfillment Data:</strong> Delivery recipient name, phone number, physical delivery address, item SKU/quantity, and cash on delivery (COD) amount required to generate courier parcels (e.g. Steadfast / Pathao).
            </li>
          </ul>
        </section>

        {/* Section 2: How We Use the Data */}
        <section className="space-y-4 text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-8">
          <h2 className="text-xl font-bold text-white">
            2. How We Use Collected Information
          </h2>
          <p>
            Mogent AI uses the collected data strictly for the following legitimate business purposes:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>To power AI-driven automated conversational customer support on merchant Facebook Pages and Instagram accounts.</li>
            <li>To parse customer order inquiries and create orders directly into the merchant’s Mogent AI dashboard.</li>
            <li>To dispatch delivery consignments and generate tracking codes with licensed courier partners (Steadfast, Pathao).</li>
            <li>To process top-up payments and maintain an immutable audit trail in our financial ledger.</li>
            <li>To diagnose webhook connectivity, measure API latency, and maintain platform security.</li>
          </ul>
        </section>

        {/* Section 3: Third-Party Service Providers */}
        <section className="space-y-4 text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-8">
          <h2 className="text-xl font-bold text-white">
            3. Third-Party Disclosures & Integrations
          </h2>
          <p>
            We only share data with authorized infrastructure providers necessary to operate the service:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>
              <strong className="text-slate-200">Meta Platforms, Inc.:</strong> Data received via Meta Graph API and Webhooks is processed strictly in compliance with the Meta Platform Terms and Developer Policies.
            </li>
            <li>
              <strong className="text-slate-200">AI Intelligence Providers:</strong> Google Cloud (Gemini) and OpenAI API are used to synthesize natural language replies. Messages sent for completion are processed under enterprise confidentiality terms and are not used to train public models.
            </li>
            <li>
              <strong className="text-slate-200">Logistics Gateways:</strong> Customer delivery details (Name, Phone, Address) are transmitted to the merchant&apos;s configured courier service (e.g., Steadfast Courier, Pathao) solely to dispatch parcel shipments.
            </li>
            <li>
              <strong className="text-slate-200">Cloud Hosting & Database:</strong> Data is hosted on secure cloud infrastructure with automated backups and firewall protections.
            </li>
          </ul>
        </section>

        {/* Section 4: Data Retention & Security */}
        <section className="space-y-4 text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-8">
          <h2 className="text-xl font-bold text-white">
            4. Data Storage & Security Measures
          </h2>
          <p>
            We implement rigorous technical and organizational safeguards:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>All HTTP communications are enforced over TLS 1.3 (HTTPS encryption).</li>
            <li>Sensitive credentials including Page Access Tokens, bKash App Secrets, and API keys are stored encrypted at rest with AES-256.</li>
            <li>Tenant data is logically isolated to prevent unauthorized cross-tenant data access (IDOR protection).</li>
          </ul>
        </section>

        {/* Section 5: Data Deletion & User Rights */}
        <section className="space-y-4 text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-rose-400" />
            5. User Rights & Data Deletion Instructions
          </h2>
          <p>
            In compliance with Meta Platform Policies and international privacy regulations (GDPR / CCPA):
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>
              <strong className="text-slate-200">Merchant Disconnect:</strong> A merchant can disconnect any Facebook Page at any time from their Mogent AI dashboard (<strong>Integrations -&gt; Connected Pages -&gt; Disconnect</strong>). Disconnecting immediately revokes our webhook subscriptions and purges the page access token.
            </li>
            <li>
              <strong className="text-slate-200">Facebook User Data Deletion:</strong> Any Facebook user who wishes to delete their data stored by Mogent AI can follow our step-by-step instructions at{" "}
              <Link href="/data-deletion" className="text-indigo-400 underline font-bold">
                Mogent AI Data Deletion Instructions
              </Link>{" "}
              or email us at <span className="text-white font-mono">privacy@mogent.ai</span>. We will permanently delete all associated customer records within 48 hours.
            </li>
          </ul>
        </section>

        {/* Section 6: Contact Us */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Mail className="h-4 w-4 text-indigo-400" />
            Contact Our Data Protection Officer
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            If you have any questions about this Privacy Policy, your personal data, or compliance inquiries, please contact us:
          </p>
          <div className="text-xs text-slate-300 space-y-1">
            <p><strong>Email:</strong> privacy@mogent.ai / support@mogent.ai</p>
            <p><strong>Platform:</strong> Mogent AI Technologies Ltd.</p>
            <p><strong>Operating Region:</strong> Dhaka, Bangladesh</p>
            <p><strong>Website:</strong> https://mogent.ai</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Mogent AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
