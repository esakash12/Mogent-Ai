"use client";

import * as React from "react";
import { PhoneSimulator } from "@/components/ai-training/phone-simulator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Bot,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Truck,
  RotateCcw,
  MessageSquare,
  RefreshCw,
  Store,
  Mic,
  MicOff,
  Paperclip,
  Image as ImageIcon,
  X,
  Volume2,
  Briefcase,
  PlayCircle,
  Check,
} from "lucide-react";
import { formatCurrencyBdt } from "@/lib/utils";
import { BUSINESS_ARCHETYPES, getBusinessArchetype, BusinessArchetype } from "@/lib/ai/business-archetypes";
import Link from "next/link";

interface TrainerMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  isVoice?: boolean;
  imagePreview?: string;
  transcribedText?: string;
  acknowledged?: string[];
  missing?: string[];
  noteTitle?: string;
  noteCategory?: string;
  action?: "CREATED" | "UPDATED" | "NOTED" | "NONE" | "DELETED";
}

export function SetupClient({
  tenantSlug,
  initialSettings,
  storeName,
  initialBusinessType = "ECOMMERCE",
}: {
  tenantSlug: string;
  initialSettings: any;
  storeName: string;
  initialBusinessType?: string;
}) {
  const [businessType, setBusinessType] = React.useState(initialBusinessType);
  const currentArchetype = getBusinessArchetype(businessType);

  const [currentPolicies, setCurrentPolicies] = React.useState({
    insideDhakaFee: initialSettings?.insideDhakaFee ?? 60,
    outsideDhakaFee: initialSettings?.outsideDhakaFee ?? 120,
    bkashNumber: initialSettings?.bkashNumber || null,
    returnPolicy: initialSettings?.returnPolicy || null,
    greetingStyle: initialSettings?.greetingStyle || currentArchetype.defaultGreeting || "ভাইয়া / আপু",
  });

  const [messages, setMessages] = React.useState<TrainerMessage[]>([
    {
      id: "1",
      sender: "bot",
      text: `স্বাগতম! আপনার "${storeName}" প্রতিষ্ঠানের জন্য আমি একজন সার্বক্ষণিক সেলস ও সাপোর্ট অ্যাসিস্ট্যান্ট।\n\nআপনি আমাকে সরাসরি বাংলায় লিখে, মাইক চেপে ভয়েস পাঠিয়ে অথবা সাইজ চার্ট/মেনু কার্ডের ছবি দিয়ে আপনার ব্যবসার নিয়ম শেখাতে পারেন। কোনো জটিল ফর্ম পূরণ করতে হবে না!`,
    },
  ]);

  const [inputText, setInputText] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const chatScrollRef = React.useRef<HTMLDivElement>(null);

  // Audio Voice Recording States
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingSeconds, setRecordingSeconds] = React.useState(0);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const recordingTimerRef = React.useRef<any>(null);

  // Image Attachment States
  const [attachedImage, setAttachedImage] = React.useState<{ base64: string; name: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Smart Interviewer Wizard States
  const [interviewActive, setInterviewActive] = React.useState(false);
  const [interviewStep, setInterviewStep] = React.useState(0);

  React.useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing, isRecording]);

  // Clean up recording timer on unmount
  React.useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  // 1. Send Text or Multimodal Input to Server
  const handleSendTrainer = async (
    e?: React.FormEvent,
    customText?: string,
    mediaPayload?: { audioBase64?: string; audioMime?: string; imageBase64?: string }
  ) => {
    if (e) e.preventDefault();
    const textToSend = (customText || inputText).trim();

    if (!textToSend && !mediaPayload?.audioBase64 && !mediaPayload?.imageBase64) return;
    if (isProcessing) return;

    setInputText("");
    const currentAttachedImage = attachedImage;
    setAttachedImage(null);

    // Create User Message Bubble
    const userMsgId = Date.now().toString();
    const userMsg: TrainerMessage = {
      id: userMsgId,
      sender: "user",
      text: mediaPayload?.audioBase64
        ? "ভয়েস বার্তা পাঠানো হয়েছে..."
        : textToSend || (mediaPayload?.imageBase64 ? "ডকুমেন্ট/ছবি বিশ্লেষণ পাঠানো হয়েছে..." : ""),
      isVoice: Boolean(mediaPayload?.audioBase64),
      imagePreview: mediaPayload?.imageBase64 || (currentAttachedImage ? currentAttachedImage.base64 : undefined),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      let endpoint = `/api/tenants/${tenantSlug}/ai-setup-chat`;
      let payload: any = { message: textToSend };

      // If audio or image attached, use multimodal training endpoint
      if (mediaPayload?.audioBase64 || mediaPayload?.imageBase64 || currentAttachedImage?.base64) {
        endpoint = `/api/tenants/${tenantSlug}/ai-multimodal-train`;
        payload = {
          text: textToSend,
          audioBase64: mediaPayload?.audioBase64,
          audioMimeType: mediaPayload?.audioMime,
          imageBase64: mediaPayload?.imageBase64 || currentAttachedImage?.base64,
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // If voice was transcribed, update the user bubble with the real text
        if (data.transcribedText) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === userMsgId ? { ...m, text: `"${data.transcribedText}"` } : m
            )
          );
        }

        if (data.allCurrentSettings) {
          setCurrentPolicies({
            insideDhakaFee: data.allCurrentSettings.insideDhakaFee,
            outsideDhakaFee: data.allCurrentSettings.outsideDhakaFee,
            bkashNumber: data.allCurrentSettings.bkashNumber,
            returnPolicy: data.allCurrentSettings.returnPolicy,
            greetingStyle: data.allCurrentSettings.greetingStyle,
          });
          if (data.allCurrentSettings.businessType) {
            setBusinessType(data.allCurrentSettings.businessType);
          }
        }

        const isNoteAction = data.action === "CREATED" || data.action === "UPDATED";
        const botReply: TrainerMessage = {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: data.replyMessage,
          missing: data.missingFields,
          noteTitle: isNoteAction ? data.title : undefined,
          noteCategory: isNoteAction ? data.category : undefined,
          action: data.action,
        };
        setMessages((prev) => [...prev, botReply]);
      } else {
        const errorReply: TrainerMessage = {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: data.error || "বার্তাটি বুঝতে পারিনি, অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
        };
        setMessages((prev) => [...prev, errorReply]);
      }
    } catch (err: any) {
      console.error("Trainer error:", err);
      const errorReply: TrainerMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "সার্ভারে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে আবার বলুন।",
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Browser Voice Recording Controls
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("মাইক্রোফোন চালু করা সম্ভব হয়নি। অনুগ্রহ করে ব্রাউজারের পারমিশন চেক করুন।");
    }
  };

  const stopRecordingAndSend = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      // Stop all tracks to turn off recording indicator
      mediaRecorderRef.current?.stream?.getTracks().forEach((track) => track.stop());

      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        handleSendTrainer(undefined, undefined, {
          audioBase64: base64Audio,
          audioMime: "audio/webm",
        });
      };
      reader.readAsDataURL(audioBlob);
    };

    mediaRecorderRef.current.stop();
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    mediaRecorderRef.current?.stream?.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  // 3. Image Selection Handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("অনুগ্রহ করে শুধুমাত্র ছবি ফাইল (JPG, PNG) নির্বাচন করুন।");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedImage({
        base64: reader.result as string,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // 4. Guided Interview Flow (স্মার্ট অনবোর্ডিং উইজার্ড)
  const interviewQuestions = [
    {
      question: "আপনার ব্যবসাটি মূলত কোন ক্যাটাগরির অন্তর্ভুক্ত?",
      options: [
        { label: "ই-কমার্স ও রিটেইল", value: "আমাদের ব্যবসা ই-কমার্স ও রিটেইল পণ্য বিক্রির জন্য" },
        { label: "সার্ভিস ও এজেন্সি", value: "আমাদের ব্যবসা ডিজিটাল সার্ভিস ও আইটি এজেন্সির জন্য" },
        { label: "ক্লিনিক ও ডাক্তার", value: "আমাদের প্রতিষ্ঠান ডক্টরস চেম্বার ও ক্লিনিক সার্ভিসের জন্য" },
        { label: "রেস্টুরেন্ট ও ফুড", value: "আমাদের ব্যবসা রেস্টুরেন্ট ও হোম ডেলিভারি খাবারের জন্য" },
        { label: "রিয়েল এস্টেট", value: "আমাদের ব্যবসা রিয়েল এস্টেট ফ্ল্যাট ও প্রপার্টির জন্য" },
        { label: "কোচিং ও কোর্স", value: "আমাদের প্রতিষ্ঠান এডুকেশন একাডেমি ও স্কিল কোর্সের জন্য" },
        { label: "পাইকারি ও B2B", value: "আমাদের ব্যবসা পাইকারি ও ফ্যাক্টরি ম্যানুফ্যাকচারিং সাপ্লাইয়ের জন্য" },
      ],
    },
    {
      question: "গ্রাহকদের আপনি কোন সম্বোধনে কথা বলা পছন্দ করেন?",
      options: [
        { label: "সালাম (Assalamu Alaikum)", value: "কাস্টমারের সাথে কথা শুরু করবা সালাম দিয়ে" },
        { label: "ভাইয়া / আপু", value: "সম্ভাষণ স্টাইল: ভাইয়া / আপু" },
        { label: "স্যার / ম্যাডাম", value: "সম্ভাষণ স্টাইল: স্যার / ম্যাডাম" },
      ],
    },
    {
      question: "আপনার ডেলিভারি চার্জ বা সার্ভিস প্রারম্ভিক ফি কেমন?",
      options: [
        { label: "ঢাকা ৬০, বাইরে ১২০ টাকা", value: "ঢাকার ভেতর ডেলিভারি ৬০ টাকা, বাইরে ১২০ টাকা" },
        { label: "সারা বাংলাদেশে ১০০ টাকা", value: "সারা দেশে ডেলিভারি চার্জ ১০০ টাকা ফিক্সড" },
        { label: "ফ্রি ডেলিভারি", value: "আমাদের সমস্ত অর্ডারে ফ্রি ডেলিভারি সুবিধা রয়েছে" },
        { label: "সার্ভিস ফি ৫,০০০ টাকা", value: "আমাদের প্রাথমিক কনসালটেশন ও সার্ভিস প্যাকেজ ৫,০০০ টাকা থেকে শুরু" },
      ],
    },
    {
      question: "পেমেন্ট পদ্ধতি বা বুকিংয়ের নিয়ম কী?",
      options: [
        { label: "ক্যাশ অন ডেলিভারি (COD)", value: "ক্যাশ অন ডেলিভারিতে সম্পূর্ণ মূল্য পরিশোধ করা যাবে" },
        { label: "বিকাশে ১০০ টাকা অগ্রিম", value: "অর্ডার কনফার্ম করতে ১০০ টাকা বিকাশ পার্সোনাল নম্বরে পাঠাতে হবে" },
        { label: "সম্পূর্ণ অগ্রিম পেমেন্ট", value: "অর্ডার বা বুকিং নিশ্চিত করতে সম্পূর্ণ মূল্য অগ্রিম পরিশোধ করতে হবে" },
      ],
    },
  ];

  const handleStartInterview = () => {
    setInterviewActive(true);
    setInterviewStep(0);
    const welcomeMsg: TrainerMessage = {
      id: Date.now().toString(),
      sender: "bot",
      text: `চমৎকার! আসুন ৩ মিনিটে আপনার এআই অ্যাসিস্ট্যান্ট সেটআপ করে নিই।\n\nপ্রথম প্রশ্ন: ${interviewQuestions[0].question}`,
    };
    setMessages((prev) => [...prev, welcomeMsg]);
  };

  const handleInterviewOptionClick = (optionValue: string) => {
    handleSendTrainer(undefined, optionValue);
    const nextStep = interviewStep + 1;
    if (nextStep < interviewQuestions.length) {
      setInterviewStep(nextStep);
      setTimeout(() => {
        const nextQMsg: TrainerMessage = {
          id: Date.now().toString(),
          sender: "bot",
          text: `ধাপ ${nextStep + 1} / ${interviewQuestions.length}: ${interviewQuestions[nextStep].question}`,
        };
        setMessages((prev) => [...prev, nextQMsg]);
      }, 900);
    } else {
      setInterviewActive(false);
      setInterviewStep(0);
      setTimeout(() => {
        const finishMsg: TrainerMessage = {
          id: Date.now().toString(),
          sender: "bot",
          text: `অভিনন্দন! আপনার প্রাথমিক অনবোর্ডিং সফলভাবে সম্পন্ন হয়েছে। এখন পাশের লাইভ ফোনে কাস্টমার সেজে বটকে টেস্ট করতে পারেন!`,
        };
        setMessages((prev) => [...prev, finishMsg]);
      }, 900);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Step Tracker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              AI Setup & Multi-Modal Trainer
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-3 h-3" />
              Chat + Voice + Image (Mogent 3.0)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            মুখে কথা বলে, টেক্সট লিখে অথবা সাইজ চার্ট/মেনু কার্ডের ছবি পাঠিয়ে এআই-কে ব্যবসার নিয়ম শেখান।
          </p>
        </div>

        {/* Guided Interview CTA */}
        <div className="flex items-center gap-2">
          {!interviewActive && (
            <Button
              type="button"
              onClick={handleStartInterview}
              variant="outline"
              size="sm"
              className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl text-xs gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              স্মার্ট ইন্টারভিউ অনবোর্ডিং
            </Button>
          )}

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-border/80 rounded-2xl px-3 py-1.5 text-xs">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[10px]">
              1
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">ট্রেনিং</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px]">
              2
            </span>
            <span className="text-slate-500">ফোন সিমুলেটর</span>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column View: Phone Simulator (Left) + Chat Trainer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Phone Simulator (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              লাইভ ফোন সিমুলেটর (Split-Messages)
            </span>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              রিয়েল-টাইম সিঙ্ক
            </span>
          </div>
          <PhoneSimulator tenantSlug={tenantSlug} storeName={storeName} />
        </div>

        {/* Right Column: Active Policies Status & Chat Trainer (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Policies Real-time Card Grid */}
          <div className="rounded-2xl border border-border/80 bg-white dark:bg-slate-900/80 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2.5">
              <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-600" />
                বর্তমান সক্রিয় পলিসি ও বিজনেস আর্কিটাইপ
              </span>
              <Link
                href={`/${tenantSlug}/ai-training/train-content`}
                className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 transition-colors hover:underline"
              >
                <BookOpen className="w-3.5 h-3.5" />
                লিভিং নোটবুক দেখুন &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {/* Business Archetype */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5 bg-slate-50/70 dark:bg-slate-950/40">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                  <span>ব্যবসার ধরন</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate" title={currentArchetype.nameBn}>
                  {currentArchetype.nameBn.split("(")[0]}
                </div>
              </div>

              {/* Delivery Dhaka */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5 bg-slate-50/70 dark:bg-slate-950/40">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <Truck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>ঢাকা ভেতরে</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {formatCurrencyBdt(currentPolicies.insideDhakaFee)}
                </div>
              </div>

              {/* Delivery Outside */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5 bg-slate-50/70 dark:bg-slate-950/40">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <Truck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>ঢাকা বাইরে</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {formatCurrencyBdt(currentPolicies.outsideDhakaFee)}
                </div>
              </div>

              {/* bKash */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5 bg-slate-50/70 dark:bg-slate-950/40">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <CreditCard className="w-3.5 h-3.5 text-pink-500" />
                  <span>বিকাশ নম্বর</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
                  {currentPolicies.bkashNumber ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                      {currentPolicies.bkashNumber}
                    </span>
                  ) : (
                    <span className="text-amber-500 font-normal">সেট করা হয়নি</span>
                  )}
                </div>
              </div>

              {/* Greeting Style */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5 bg-slate-50/70 dark:bg-slate-950/40 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                  <span>সম্ভাষণ স্টাইল</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {currentPolicies.greetingStyle || "ভাইয়া / আপু"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Conversational AI Training Chat Container */}
          <div className="rounded-2xl border border-border/80 bg-white dark:bg-slate-900 shadow-sm flex flex-col h-[480px] overflow-hidden">
            {/* Chat Top Banner */}
            <div className="p-3 border-b border-border/80 bg-slate-50/90 dark:bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    Mogent AI Trainer
                    <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                      Voice + Multimodal
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    কথা বলুন, টেক্সট দিন অথবা সাইজ চার্ট/মেনু কার্ডের ছবি ড্রপ করুন
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Auto DB Sync</span>
              </div>
            </div>

            {/* Chat Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {messages.map((m) => {
                const isBot = m.sender === "bot";
                return (
                  <div
                    key={m.id}
                    className={`flex ${isBot ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                        isBot
                          ? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/60 dark:border-slate-700/60"
                          : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-xs"
                      }`}
                    >
                      {/* Image Preview if user uploaded an image */}
                      {m.imagePreview && (
                        <div className="mb-2 rounded-xl overflow-hidden max-w-[200px] border border-white/20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.imagePreview} alt="Uploaded attachment" className="w-full h-auto object-cover" />
                        </div>
                      )}

                      <p className="whitespace-pre-line">{m.text}</p>

                      {isBot && m.noteTitle && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            {m.action === "UPDATED" ? "নোটবুকে আপডেট হয়েছে" : "নোটবুকে যুক্ত হয়েছে"}: {m.noteTitle}
                          </span>
                          {m.noteCategory && (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 dark:bg-slate-700/60 px-1.5 py-0.5 rounded">
                              {m.noteCategory}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl w-44">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                  <span>তথ্য ও ভয়েস প্রসেস হচ্ছে...</span>
                </div>
              )}
              <div ref={chatScrollRef} />
            </div>

            {/* Smart Interviewer Quick Options (Shown when guided interview is active) */}
            {interviewActive && interviewQuestions[interviewStep] && (
              <div className="px-3 py-2 border-t border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block mb-1.5">
                  ক্লিক করে উত্তর নির্বাচন করুন:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {interviewQuestions[interviewStep].options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleInterviewOptionClick(opt.value)}
                      disabled={isProcessing}
                      className="text-[11px] rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Prompt Suggestions (When interview is inactive) */}
            {!interviewActive && (
              <div className="px-3 pt-2 pb-1 border-t border-border/50 bg-slate-50/50 dark:bg-slate-950/40">
                <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                  ক্লিক করে দ্রুত প্রম্পট পাঠান ({currentArchetype.nameEn}):
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {currentArchetype.quickTrainingPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendTrainer(undefined, prompt)}
                      disabled={isProcessing}
                      className="whitespace-nowrap text-[11px] rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-400 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Attached Image Thumbnail Preview */}
            {attachedImage && (
              <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-t border-border/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={attachedImage.base64} alt="Attached thumbnail" className="w-7 h-7 object-cover rounded-md" />
                  <span className="truncate max-w-[200px] text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                    {attachedImage.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="text-slate-400 hover:text-rose-500 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Voice Recording Active Bar */}
            {isRecording && (
              <div className="p-3 border-t border-rose-500/30 bg-rose-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-semibold animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                  ভয়েস রেকর্ড হচ্ছে... ({recordingSeconds}s)
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={cancelRecording}
                    className="h-7 text-xs text-slate-500 hover:text-rose-600"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    বাতিল
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={stopRecordingAndSend}
                    className="h-7 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    রেকর্ড পাঠান
                  </Button>
                </div>
              </div>
            )}

            {/* Chat Input & Toolbar */}
            {!isRecording && (
              <form
                onSubmit={(e) => handleSendTrainer(e)}
                className="p-2.5 border-t border-border/80 bg-white dark:bg-slate-900 flex items-center gap-1.5"
              >
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />

                {/* Attach Image / Document Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  title="সাইজ চার্ট, মেনু কার্ড বা পলিসির ছবি আপলোড করুন"
                  disabled={isProcessing}
                  className="h-8 w-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                {/* Record Voice Note Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={startRecording}
                  title="মাইক চেপে কথা বলে ট্রেনিং দিন"
                  disabled={isProcessing}
                  className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  <Mic className="h-4 w-4" />
                </Button>

                {/* Text Input */}
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="বাংলায় বলুন বা লিখুন (যেমন: শুক্রবার শোরুম বন্ধ, ডেলিভারি চার্জ ৬০ টাকা)..."
                  className="text-xs flex-1 rounded-xl h-9"
                  disabled={isProcessing}
                />

                {/* Send Button */}
                <Button
                  type="submit"
                  size="sm"
                  disabled={(!inputText.trim() && !attachedImage) || isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3.5 h-9 flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold hidden sm:inline">পাঠান</span>
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
