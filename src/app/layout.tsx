import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans, Hind_Siliguri } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mogent AI — বাংলাদেশের প্রথম অল-ইন-ওয়ান স্মার্ট এআই সেলস এজেন্ট",
  description: "অভিজ্ঞ সেলস ম্যানেজারের মতো স্বাভাবিক বাংলায় চ্যাট ও ফোনে কথা বলে আপনার ই-কমার্স বিক্রি দ্বিগুণ করুন। মেটা মেসেঞ্জার, হোয়াটসঅ্যাপ, ইনস্টাগ্রাম ও কুরিয়ার ইন্টিগ্রেশন।",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
      className={`scroll-smooth ${spaceGrotesk.variable} ${dmSans.variable} ${hindSiliguri.variable}`}
    >
      <body className="bg-[#F8FAFC] text-slate-800 font-body antialiased selection:bg-indigo-600 selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
