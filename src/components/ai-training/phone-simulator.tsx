"use client";

import * as React from "react";
import { formatCurrencyBdt } from "@/lib/utils";
import {
  Send,
  Sparkles,
  Phone,
  Video,
  ArrowLeft,
  CheckCircle2,
  Package,
  RotateCcw,
  Image as ImageIcon,
  Mic,
  Square,
  Play,
  Pause,
  X,
  ShoppingBag,
  Info,
  Check,
} from "lucide-react";
import { LiveCallModal } from "@/components/voice/live-call-modal";

interface PhoneSimulatorProps {
  tenantSlug: string;
  storeName: string;
}

interface ProductCard {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  stock?: number;
  category?: string | null;
}

interface QuickReply {
  title: string;
  payload: string;
}

interface SimMessage {
  id: string;
  sender: "customer" | "ai";
  text: string;
  mediaUrl?: string;
  audioUrl?: string;
  verifiedStock?: boolean;
  carouselProducts?: ProductCard[];
  quickReplies?: QuickReply[];
  orderSummary?: {
    productName: string;
    price: number;
    deliveryCharge: number;
    totalAmount: number;
    address: string;
    orderNumber?: string;
  };
}

// Sample SVG placeholder for instant 1-click photo testing
const SAMPLE_NID_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='400' height='250' rx='16' fill='%230f172a'/><rect x='20' y='20' width='360' height='210' rx='12' fill='%231e293b' stroke='%2338bdf8' stroke-width='2'/><circle cx='70' cy='90' r='35' fill='%2338bdf8' opacity='0.8'/><rect x='125' y='65' width='180' height='16' rx='4' fill='%23e2e8f0'/><rect x='125' y='95' width='140' height='12' rx='3' fill='%2394a3b8'/><rect x='125' y='115' width='200' height='10' rx='3' fill='%2364748b'/><rect x='35' y='160' width='330' height='40' rx='8' fill='%230284c7'/><text x='200' y='185' fill='%23ffffff' font-family='sans-serif' font-size='14' font-weight='bold' text-anchor='middle'>BANGLADESH NATIONAL ID CARD (PVC)</text></svg>";

export function PhoneSimulator({ tenantSlug, storeName }: PhoneSimulatorProps) {
  const [messages, setMessages] = React.useState<SimMessage[]>([]);
  const [inputText, setInputText] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [attachedImage, setAttachedImage] = React.useState<string | null>(null);
  const [isLiveCallOpen, setIsLiveCallOpen] = React.useState(false);

  // Audio Recording states
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingSeconds, setRecordingSeconds] = React.useState(0);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, attachedImage]);

  // Clean up recording timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("অনুগ্রহ করে একটি ছবি ফাইল নির্বাচন করুন");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAttachedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        if (audioBlob.size > 0) {
          const audioUrl = URL.createObjectURL(audioBlob);
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Audio = reader.result as string;
            sendDirectMessage({
              text: "",
              audioUrl,
              audioBase64: base64Audio,
              audioMimeType: audioBlob.type,
            });
          };
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("Microphone access error:", err);
      // Fallback: send sample voice simulation
      sendDirectMessage({
        text: "ভাইয়া, পিভিসি কার্ডের ডেলিভারি চার্জ সহ মোট কত পরবে?",
        audioUrl: "simulated",
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      audioChunksRef.current = [];
      setRecordingSeconds(0);
    }
  };

  const sendDirectMessage = async (params: {
    text?: string;
    mediaUrl?: string;
    audioUrl?: string;
    audioBase64?: string;
    audioMimeType?: string;
  }) => {
    const rawText = (params.text || "").trim();
    const media = params.mediaUrl;
    const audioUrl = params.audioUrl;
    const audioBase64 = params.audioBase64;
    const audioMimeType = params.audioMimeType;

    if (!rawText && !media && !audioUrl) return;

    const userMsg: SimMessage = {
      id: Date.now().toString(),
      sender: "customer",
      text: rawText,
      mediaUrl: media,
      audioUrl: audioUrl,
    };

    const historyPayload = messages.map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/simulator-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: rawText,
          mediaUrl: media,
          audioBase64: audioBase64,
          audioMimeType: audioMimeType,
          history: historyPayload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawParts = (data.replyText || "")
          .split(/\[SPLIT\]/i)
          .map((p: string) => p.trim())
          .filter((p: string) => p.length > 0);

        const parts =
          rawParts.length > 2
            ? [rawParts[0], rawParts.slice(1).join(" ")]
            : rawParts;

        if (parts.length > 1) {
          for (let i = 0; i < parts.length; i++) {
            if (i > 0) {
              setIsTyping(true);
              await new Promise((resolve) => setTimeout(resolve, 800));
            }
            const aiMsg: SimMessage = {
              id: `${Date.now()}-${i}`,
              sender: "ai",
              text: parts[i],
              verifiedStock: i === parts.length - 1 ? data.verifiedStock : undefined,
              orderSummary: i === parts.length - 1 ? data.orderSummary : undefined,
              carouselProducts:
                i === parts.length - 1 ? data.carouselProducts : undefined,
              quickReplies: i === parts.length - 1 ? data.quickReplies : undefined,
            };
            setMessages((prev) => [...prev, aiMsg]);
          }
        } else if (parts.length === 1) {
          const aiMsg: SimMessage = {
            id: (Date.now() + 1).toString(),
            sender: "ai",
            text: parts[0],
            verifiedStock: data.verifiedStock,
            orderSummary: data.orderSummary,
            carouselProducts: data.carouselProducts,
            quickReplies: data.quickReplies,
          };
          setMessages((prev) => [...prev, aiMsg]);
        }
      }
    } catch (err) {
      console.error("Simulator chat error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedImage) return;

    const text = inputText;
    const img = attachedImage || undefined;

    setInputText("");
    setAttachedImage(null);

    sendDirectMessage({
      text,
      mediaUrl: img,
    });
  };

  return (
    <div className="relative mx-auto w-full max-w-[350px] rounded-[48px] border-[10px] border-slate-950 bg-slate-950 p-2 shadow-2xl ring-1 ring-slate-800">
      {/* Dynamic Island / Notch */}
      <div className="absolute left-1/2 top-4 z-20 h-4 w-24 -translate-x-1/2 rounded-full bg-black flex items-center justify-end pr-2">
        <div className="h-2 w-2 rounded-full bg-slate-900 border border-slate-800" />
      </div>

      {/* Screen Frame */}
      <div className="flex h-[590px] w-full flex-col overflow-hidden rounded-[36px] bg-[#F0F2F5] dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        {/* Status Bar */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-6 pt-3 pb-1 text-[11px] font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span>5G</span>
            <div className="h-2 w-3.5 rounded-xs border border-current p-0.5">
              <div className="h-full w-full bg-current" />
            </div>
          </div>
        </div>

        {/* Real Messenger Header */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3.5 py-2 border-b border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <ArrowLeft className="h-4 w-4 text-[#0084FF] cursor-pointer" />
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#0084FF] to-sky-400 font-bold text-white text-xs shadow-xs">
                {storeName ? storeName.charAt(0) : "M"}
              </div>
              {/* Messenger Online Badge */}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>
            <div>
              <div className="font-bold text-xs truncate max-w-[110px] text-slate-900 dark:text-white">
                {storeName || "Facebook Page"}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                <span>Active now</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-[#0084FF]">
            <button
              type="button"
              onClick={() => setMessages([])}
              title="চ্যাট রিসেট করুন"
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsLiveCallOpen(true)}
              title="এআই এর সাথে লাইভ ভয়েস কল করুন"
              className="p-1 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer text-[#0084FF]"
            >
              <Phone className="h-4 w-4" />
            </button>
            <Video className="h-4 w-4 opacity-50 cursor-not-allowed" />
            <Info className="h-4 w-4 opacity-80 hover:opacity-100 cursor-pointer" />
          </div>
        </div>

        {/* Messenger Message Stream */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
          <div className="flex justify-center my-1">
            <span className="rounded-full bg-slate-200/60 dark:bg-slate-800 px-2.5 py-0.5 text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
              Today
            </span>
          </div>

          {/* Empty State / Welcome Screen */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[340px] text-center p-4 text-slate-400 space-y-3">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {storeName ? storeName.charAt(0) : "M"}
                </div>
                <span className="absolute bottom-0 right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-white">
                  {storeName}
                </h3>
                <p className="text-[10px] text-slate-500">Facebook • 100% Response Rate</p>
              </div>

              <div className="w-full space-y-1.5 pt-2">
                <p className="text-[10px] text-slate-500 font-medium">
                  নিচের স্যাম্পল অপশন দিয়ে টেস্ট করতে পারেন:
                </p>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      sendDirectMessage({
                        text: "১টি পিভিসি কার্ড ডেলিভারি চার্জ সহ কত পড়বে?",
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-2 text-left text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                  >
                    💬 ১টি পিভিসি কার্ডের দাম ও ডেলিভারি কত?
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      sendDirectMessage({
                        text: "আপনাদের প্রোডাক্ট ক্যাটালগ দেখতে চাই",
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-2 text-left text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                  >
                    🛍️ ক্যাটালগ ও প্রডাক্ট কার্ড দেখতে চাই
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      sendDirectMessage({
                        text: "এই কার্ডটা প্রিন্ট করা যাবে?",
                        mediaUrl: SAMPLE_NID_IMAGE,
                      })
                    }
                    className="w-full rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 p-2 text-left text-[11px] font-semibold text-[#0084FF] hover:bg-blue-100 transition-colors shadow-2xs flex items-center justify-between"
                  >
                    <span>📷 ছবি ও স্ক্রিনশট পাঠিয়ে টেস্ট (NID Card)</span>
                    <Sparkles className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Render Messages */}
          {messages.map((m) => {
            const isUser = m.sender === "customer";
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div className="max-w-[88%] space-y-1">
                  {/* Photo if present */}
                  {m.mediaUrl && (
                    <div className="overflow-hidden rounded-[18px] border border-slate-200/60 dark:border-slate-800 shadow-2xs bg-slate-900">
                      <img
                        src={m.mediaUrl}
                        alt="Attached media"
                        className="max-h-[160px] w-full object-cover"
                      />
                    </div>
                  )}

                  {/* Audio note if present */}
                  {m.audioUrl && (
                    <AudioPlayerBubble
                      src={m.audioUrl}
                      isUser={isUser}
                      text={m.text}
                    />
                  )}

                  {/* Main Bubble */}
                  {m.text && (
                    <div
                      className={`rounded-[18px] px-3.5 py-2 text-[11.5px] leading-relaxed shadow-2xs ${
                        isUser
                          ? "rounded-br-[4px] bg-[#0084FF] text-white"
                          : "rounded-tl-[4px] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/70 dark:border-slate-800"
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>

                      {/* Verified Stock Badge */}
                      {m.verifiedStock && (
                        <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Verified Stock
                        </div>
                      )}

                      {/* Order Summary Receipt */}
                      {m.orderSummary && (
                        <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50/60 dark:bg-blue-950/30 p-2.5 text-[10px] space-y-1 text-slate-800 dark:text-slate-200">
                          <span className="font-bold text-[#0084FF] block border-b border-blue-200/60 pb-1">
                            অর্ডার বিবরণ (Order Summary)
                          </span>
                          <div className="flex justify-between font-semibold pt-0.5">
                            <span>{m.orderSummary.productName}</span>
                            <span>{formatCurrencyBdt(m.orderSummary.price)}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>ডেলিভারি চার্জ:</span>
                            <span>{formatCurrencyBdt(m.orderSummary.deliveryCharge)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-blue-200/60 pt-1">
                            <span>সর্বমোট:</span>
                            <span className="text-[#0084FF]">
                              {formatCurrencyBdt(m.orderSummary.totalAmount)}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-500 pt-0.5 line-clamp-1">
                            ঠিকানা: {m.orderSummary.address}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Real Interactive Product Carousel */}
                  {m.carouselProducts && m.carouselProducts.length > 0 && (
                    <div className="mt-2 w-full max-w-[280px]">
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
                        {m.carouselProducts.map((p) => (
                          <div
                            key={p.id}
                            className="snap-start shrink-0 w-[140px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 overflow-hidden shadow-xs flex flex-col justify-between"
                          >
                            <div className="relative h-[85px] w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-slate-400">
                                  <Package className="w-6 h-6 text-[#0084FF] opacity-60" />
                                </div>
                              )}
                              <span className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                {formatCurrencyBdt(p.price)}
                              </span>
                            </div>
                            <div className="p-2 space-y-1">
                              <h4
                                className="font-bold text-[10px] text-slate-900 dark:text-white line-clamp-1"
                                title={p.name}
                              >
                                {p.name}
                              </h4>
                              <button
                                type="button"
                                onClick={() =>
                                  sendDirectMessage({
                                    text: `আমি "${p.name}" নিতে চাই`,
                                  })
                                }
                                className="w-full py-1.5 rounded-xl bg-[#0084FF] hover:bg-blue-600 text-white font-bold text-[9px] transition-colors flex items-center justify-center gap-1 shadow-2xs"
                              >
                                <span>এটি নিতে চাই</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Real Messenger Quick Replies */}
                  {m.quickReplies && m.quickReplies.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {m.quickReplies.map((qr, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => sendDirectMessage({ text: qr.title })}
                          className="rounded-full border border-[#0084FF]/40 bg-white dark:bg-slate-800 text-[#0084FF] hover:bg-blue-50 dark:hover:bg-slate-700 px-2.5 py-1 text-[10px] font-semibold transition-colors shadow-2xs"
                        >
                          {qr.title}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Messenger Seen status on last customer message */}
                  {isUser && m.id === messages[messages.length - 1]?.id && (
                    <div className="flex justify-end items-center gap-1 pr-1 pt-0.5">
                      <span className="text-[9px] text-slate-400 font-medium">Seen</span>
                      <div className="h-3 w-3 rounded-full bg-[#0084FF] text-white flex items-center justify-center text-[7px] font-bold">
                        <Check className="h-2 w-2" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-2 rounded-[18px] rounded-tl-[4px] w-20 shadow-2xs border border-slate-200/80 dark:border-slate-700">
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Attached Image Thumbnail Preview Drawer */}
        {attachedImage && (
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-3 py-1.5 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="relative h-11 w-11 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
                <img
                  src={attachedImage}
                  alt="Thumbnail"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="text-[10px]">
                <span className="font-semibold text-slate-800 dark:text-white block">
                  ছবি সংযুক্ত হয়েছে
                </span>
                <span className="text-slate-400">মেসেজের সাথে পাঠানো হবে</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Real Messenger Input Bar */}
        <div className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 p-2">
          {isRecording ? (
            /* Voice Recording Active Bar */
            <div className="flex items-center justify-between bg-red-50 dark:bg-red-950/30 rounded-2xl px-3 py-2 border border-red-200 dark:border-red-900">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-ping" />
                <span className="text-xs font-bold text-red-600">
                  {Math.floor(recordingSeconds / 60)}:
                  {String(recordingSeconds % 60).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-slate-500">ভয়েস রেকর্ড হচ্ছে...</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelVoiceRecording}
                  className="p-1.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-100 transition-colors"
                  title="রেকর্ড বাতিল"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={stopVoiceRecording}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow-xs hover:bg-red-700"
                  title="রেকর্ড শেষ করে পাঠান"
                >
                  <Square className="h-3 w-3" />
                </button>
              </div>
            </div>
          ) : (
            /* Standard Input Bar */
            <form onSubmit={handleSend} className="flex items-center gap-1.5">
              {/* Hidden File Picker */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Photo Attachment Icon */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="ছবি সংযুক্ত করুন"
                className="p-1.5 text-[#0084FF] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <ImageIcon className="h-5 w-5" />
              </button>

              {/* Mic Icon */}
              <button
                type="button"
                onClick={startVoiceRecording}
                title="ভয়েস মেসেজ রেকর্ড করুন"
                className="p-1.5 text-[#0084FF] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <Mic className="h-5 w-5" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Aa"
                className="flex-1 rounded-full bg-[#F0F2F5] dark:bg-slate-800 px-3.5 py-1.5 text-xs placeholder:text-slate-400 focus:outline-none text-slate-900 dark:text-white"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() && !attachedImage}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0084FF] text-white disabled:opacity-40 transition-opacity"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Live Voice Call Modal (Interactive Speech-to-Speech) */}
      <LiveCallModal
        tenantSlug={tenantSlug}
        storeName={storeName}
        isOpen={isLiveCallOpen}
        onClose={() => setIsLiveCallOpen(false)}
      />
    </div>
  );
}

function AudioPlayerBubble({
  src,
  isUser,
  text,
}: {
  src: string;
  isUser: boolean;
  text?: string;
}) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (src === "simulated") {
      setIsPlaying((prev) => !prev);
      setTimeout(() => setIsPlaying(false), 3000);
      return;
    }

    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <div
      className={`rounded-[18px] p-2 flex items-center gap-2 max-w-[210px] ${
        isUser
          ? "bg-[#0084FF] text-white rounded-br-[4px]"
          : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-[4px] border border-slate-200 dark:border-slate-700"
      }`}
    >
      {src !== "simulated" && (
        <audio
          ref={audioRef}
          src={src}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
      <button
        type="button"
        onClick={togglePlay}
        className={`flex h-7 w-7 items-center justify-center rounded-full shadow-xs transition-transform active:scale-95 ${
          isUser
            ? "bg-white text-[#0084FF]"
            : "bg-[#0084FF] text-white"
        }`}
      >
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
      </button>

      {/* Fake waveform animation */}
      <div className="flex items-center gap-0.5 h-4 flex-1">
        <span
          className={`w-1 rounded-full bg-current ${
            isPlaying ? "h-3 animate-pulse" : "h-2 opacity-60"
          }`}
        />
        <span
          className={`w-1 rounded-full bg-current ${
            isPlaying ? "h-4 animate-bounce" : "h-3 opacity-90"
          }`}
        />
        <span
          className={`w-1 rounded-full bg-current ${
            isPlaying ? "h-2 animate-pulse" : "h-1.5 opacity-50"
          }`}
        />
        <span
          className={`w-1 rounded-full bg-current ${
            isPlaying ? "h-4 animate-bounce [animation-delay:0.15s]" : "h-3.5"
          }`}
        />
        <span
          className={`w-1 rounded-full bg-current ${
            isPlaying ? "h-2.5 animate-pulse" : "h-2 opacity-70"
          }`}
        />
      </div>

      <span className="text-[9px] font-bold opacity-80 shrink-0">
        0:04
      </span>
    </div>
  );
}
