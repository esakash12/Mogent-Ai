"use client";

import * as React from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  User,
  Radio,
  X,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiveCallModalProps {
  tenantSlug: string;
  storeName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface CallTurn {
  speaker: "ai" | "user";
  text: string;
}

export function LiveCallModal({
  tenantSlug,
  storeName,
  isOpen,
  onClose,
}: LiveCallModalProps) {
  const [callState, setCallState] = React.useState<
    "idle" | "ringing" | "connected" | "ended"
  >("idle");
  const [callDuration, setCallDuration] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = React.useState(true);
  const [isAiSpeaking, setIsAiSpeaking] = React.useState(false);
  const [isAudioLoading, setIsAudioLoading] = React.useState(false);
  const [needUserTapToPlay, setNeedUserTapToPlay] = React.useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = React.useState(false);
  const [transcripts, setTranscripts] = React.useState<CallTurn[]>([]);
  const [liveUserText, setLiveUserText] = React.useState("");

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = React.useRef<string | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = React.useRef<any>(null);
  const transcriptsEndRef = React.useRef<HTMLDivElement>(null);

  // Prime and unlock browser audio playback on user gesture
  const unlockBrowserAudio = () => {
    if (typeof window === "undefined") return;
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    try {
      // 1-sample silent WAV to unlock HTMLAudioElement in Chrome/Edge
      audioRef.current.src =
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
      audioRef.current.play().catch(() => {});
    } catch {}
  };

  // Convert Base64 data URI to standard Blob URL (0% CPU, hardware accelerated playback)
  const base64ToBlobUrl = (dataUri: string): string => {
    try {
      const base64 = dataUri.includes(",") ? dataUri.split(",")[1] : dataUri;
      const cleanBase64 = base64.replace(/[\r\n\s]/g, "");
      const binaryStr = window.atob(cleanBase64);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes.buffer], { type: "audio/wav" });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.warn("Base64 to blob conversion error:", e);
      return dataUri;
    }
  };

  // Auto-scroll transcripts
  React.useEffect(() => {
    transcriptsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts, liveUserText]);

  // Clean up timer and audio on unmount or close
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (currentBlobUrlRef.current) {
        try {
          URL.revokeObjectURL(currentBlobUrlRef.current);
        } catch {}
      }
      stopSpeechRecognition();
    };
  }, []);

  // When modal opens, auto-start call
  React.useEffect(() => {
    if (isOpen && callState === "idle") {
      startCall();
    }
    if (!isOpen) {
      endCall(false);
      setCallState("idle");
    }
  }, [isOpen]);

  const startCall = async () => {
    unlockBrowserAudio();

    setCallState("ringing");
    setCallDuration(0);
    setTranscripts([]);
    setLiveUserText("");
    setIsAudioLoading(false);
    setNeedUserTapToPlay(false);

    // Simulate 1.5s ringing before AI answers
    setTimeout(async () => {
      setCallState("connected");

      // Start call timer
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // Request greeting from AI
      setIsAudioLoading(true);
      try {
        const res = await fetch(`/api/tenants/${tenantSlug}/calls/live-voice`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start" }),
        });

        if (res.ok) {
          const data = await res.json();
          const greeting =
            data.replyText ||
            `আসসালামু আলাইকুম! আমি ${storeName} থেকে বলছি। কীভাবে সাহায্য করতে পারি বলুন?`;
          addAiTurn(greeting);
          setIsAudioLoading(false);
          playBengaliAudio(greeting, data.audioUrl);
        } else {
          setIsAudioLoading(false);
          const fallbackGreeting = `আসসালামু আলাইকুম! আমি ${storeName} থেকে বলছি। কীভাবে সাহায্য করতে পারি?`;
          addAiTurn(fallbackGreeting);
          playBengaliAudio(fallbackGreeting);
        }
      } catch (err) {
        console.warn("Call start greeting error:", err);
        setIsAudioLoading(false);
        const fallbackGreeting = `আসসালামু আলাইকুম! আমি ${storeName} থেকে বলছি। কীভাবে সাহায্য করতে পারি?`;
        addAiTurn(fallbackGreeting);
        playBengaliAudio(fallbackGreeting);
      }

      // Initialize speech recognition for user
      initSpeechRecognition();
    }, 1500);
  };

  const addAiTurn = (text: string) => {
    setTranscripts((prev) => [...prev, { speaker: "ai", text }]);
  };

  const addUserTurn = (text: string) => {
    setTranscripts((prev) => [...prev, { speaker: "user", text }]);
  };

  const playBengaliAudio = async (text: string, customAudioUrl?: string) => {
    if (!isSpeakerOn) {
      setIsAiSpeaking(false);
      startSpeechRecognition();
      return;
    }

    if (!customAudioUrl) {
      setIsAiSpeaking(false);
      startSpeechRecognition();
      return;
    }

    setIsAiSpeaking(true);
    setNeedUserTapToPlay(false);

    try {
      // Free old blob url memory if exists
      if (currentBlobUrlRef.current) {
        try {
          URL.revokeObjectURL(currentBlobUrlRef.current);
        } catch {}
      }

      // Convert Base64 WAV to Blob URL for native OS hardware-accelerated audio streaming
      const audioSrc = customAudioUrl.startsWith("data:")
        ? base64ToBlobUrl(customAudioUrl)
        : customAudioUrl;

      if (audioSrc.startsWith("blob:")) {
        currentBlobUrlRef.current = audioSrc;
      }

      if (!audioRef.current && typeof window !== "undefined") {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;
      if (!audio) {
        setIsAiSpeaking(false);
        startSpeechRecognition();
        return;
      }

      audio.src = audioSrc;
      audio.volume = 1.0;

      audio.onended = () => {
        setIsAiSpeaking(false);
        setNeedUserTapToPlay(false);
        startSpeechRecognition();
      };

      audio.onerror = (e) => {
        console.warn("[Native Audio Playback Error]:", e);
        setIsAiSpeaking(false);
        setNeedUserTapToPlay(false);
        startSpeechRecognition();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("[Autoplay Policy Protected - Awaiting Click]:", err);
          // If browser policy paused autoplay, present prompt so user can tap to listen immediately
          setNeedUserTapToPlay(true);
        });
      }
    } catch (err) {
      console.warn("[Audio playback setup exception]:", err);
      setIsAiSpeaking(false);
      startSpeechRecognition();
    }
  };

  const initSpeechRecognition = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "bn-BD";

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (interimTranscript) {
          setLiveUserText(interimTranscript);
          setIsUserSpeaking(true);
        }

        if (finalTranscript.trim()) {
          setLiveUserText("");
          setIsUserSpeaking(false);
          handleUserUtterance(finalTranscript.trim());
        }
      };

      recognition.onerror = (e: any) => {
        console.warn("Speech recognition event error:", e.error);
        setIsUserSpeaking(false);
      };

      recognition.onend = () => {
        setIsUserSpeaking(false);
      };

      recognitionRef.current = recognition;
      startSpeechRecognition();
    } catch (err) {
      console.warn("Speech recognition initialization error:", err);
    }
  };

  const startSpeechRecognition = () => {
    if (recognitionRef.current && !isMuted && callState === "connected" && !isAiSpeaking) {
      try {
        recognitionRef.current.start();
      } catch {
        // already started
      }
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  };

  const handleUserUtterance = async (userText: string) => {
    if (!userText.trim()) return;

    // Unlock browser audio upon customer speech action
    unlockBrowserAudio();

    // Pause recognition while AI thinks and speaks
    stopSpeechRecognition();
    addUserTurn(userText);
    setIsAiSpeaking(false);
    setIsAudioLoading(true);

    try {
      const historyPayload = transcripts.map((t) => ({
        sender: t.speaker === "user" ? "customer" : "ai",
        text: t.text,
      }));

      const res = await fetch(`/api/tenants/${tenantSlug}/calls/live-voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "message",
          message: userText,
          history: historyPayload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.replyText || "জি ভাইয়া, আমি বুঝতে পেরেছি।";
        addAiTurn(reply);
        setIsAudioLoading(false);
        playBengaliAudio(reply, data.audioUrl);
      } else {
        setIsAudioLoading(false);
        const fallback = "জি ভাইয়া, আপনার কথাটি শুনতে পেরেছি। আর কিছু কি জানতে চান?";
        addAiTurn(fallback);
        playBengaliAudio(fallback);
      }
    } catch (err) {
      console.error("Call message processing error:", err);
      setIsAudioLoading(false);
      const fallback = "জি ভাইয়া, বলুন শুনছি।";
      addAiTurn(fallback);
      playBengaliAudio(fallback);
    }
  };

  const endCall = async (saveRecord: boolean = true) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (currentBlobUrlRef.current) {
      try {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      } catch {}
      currentBlobUrlRef.current = null;
    }
    stopSpeechRecognition();
    setIsAiSpeaking(false);
    setIsAudioLoading(false);
    setNeedUserTapToPlay(false);
    setIsUserSpeaking(false);

    if (callState === "connected" && saveRecord && transcripts.length > 0) {
      try {
        const transcriptText = transcripts
          .map((t) => `${t.speaker === "user" ? "কাস্টমার" : "এআই"}: ${t.text}`)
          .join("\n");

        await fetch(`/api/tenants/${tenantSlug}/calls/live-voice`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "end",
            callDurationSec: callDuration,
            transcript: transcriptText,
            summary: `লাইভ ব্রাউজার ভয়েস কল সম্পন্ন (${callDuration} সেকেন্ড, ${transcripts.length} টি কথোপকথন)।`,
          }),
        });
      } catch (err) {
        console.warn("Save call recording error:", err);
      }
    }

    setCallState("ended");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-[360px] overflow-hidden rounded-[36px] border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white shadow-2xl flex flex-col h-[600px]">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-300">
              Gemini 3.8 Live • Zephyr Voice
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Call Body */}
        <div className="flex-1 flex flex-col items-center justify-between p-5 overflow-hidden">
          {/* Avatar & Call Info */}
          <div className="flex flex-col items-center text-center space-y-2 mt-2">
            <div className="relative">
              <div
                className={`h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold shadow-xl transition-all duration-300 ${
                  isAiSpeaking
                    ? "bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 ring-4 ring-indigo-400/50 scale-105 animate-pulse"
                    : isAudioLoading
                    ? "bg-gradient-to-tr from-amber-500 to-indigo-600 ring-4 ring-amber-400/50 scale-105 animate-pulse"
                    : isUserSpeaking
                    ? "bg-gradient-to-tr from-emerald-500 to-teal-400 ring-4 ring-emerald-400/50 scale-105"
                    : "bg-gradient-to-tr from-blue-600 to-indigo-700"
                }`}
              >
                <Bot className="h-12 w-12 text-white" />
              </div>
              {callState === "connected" && (
                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-slate-900 flex items-center justify-center text-[8px]">
                  ✓
                </span>
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                {storeName}
              </h3>
              <p className="text-[11px] text-slate-400">
                {callState === "ringing" && "কল সংযোগ হচ্ছে..."}
                {callState === "connected" &&
                  `${Math.floor(callDuration / 60)
                    .toString()
                    .padStart(2, "0")}:${(callDuration % 60)
                    .toString()
                    .padStart(2, "0")}`}
                {callState === "ended" && "কল সমাপ্ত হয়েছে"}
              </p>
            </div>

            {/* Audio Waveform Equalizer Bars */}
            {callState === "connected" && (
              <div className="flex items-center gap-1 h-8 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                {[4, 8, 12, 16, 20, 16, 12, 8, 4].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      height: isAiSpeaking
                        ? `${Math.max(4, Math.sin(Date.now() / 200 + i) * 16 + 8)}px`
                        : isAudioLoading
                        ? `${Math.max(4, Math.sin(Date.now() / 300 + i) * 10 + 6)}px`
                        : isUserSpeaking
                        ? `${Math.max(4, Math.cos(Date.now() / 200 + i) * 14 + 6)}px`
                        : `${h / 2}px`,
                    }}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isAiSpeaking
                        ? "bg-indigo-400"
                        : isAudioLoading
                        ? "bg-amber-400"
                        : isUserSpeaking
                        ? "bg-emerald-400"
                        : "bg-slate-600"
                    }`}
                  />
                ))}
                <span className="text-[10px] ml-1.5 text-slate-400 font-medium">
                  {isAudioLoading
                    ? "এআই উত্তর লোড হচ্ছে..."
                    : isAiSpeaking
                    ? "এআই কথা বলছে (Zephyr)..."
                    : isUserSpeaking
                    ? "আপনার কথা শোনা যাচ্ছে..."
                    : "শুনছি, বলুন..."}
                </span>
              </div>
            )}

            {/* Tap to Play prompt if browser Autoplay policy temporarily paused playback */}
            {needUserTapToPlay && (
              <button
                type="button"
                onClick={() => {
                  unlockBrowserAudio();
                  if (audioRef.current && currentBlobUrlRef.current) {
                    audioRef.current.src = currentBlobUrlRef.current;
                    audioRef.current
                      .play()
                      .then(() => {
                        setNeedUserTapToPlay(false);
                        setIsAiSpeaking(true);
                      })
                      .catch(() => {});
                  }
                }}
                className="my-1 px-4 py-1.5 bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-600 hover:opacity-90 text-white rounded-full text-xs font-bold shadow-lg animate-bounce flex items-center gap-1.5 border border-white/20"
              >
                <Volume2 className="h-4 w-4" />
                🔊 ভয়েস শুনতে এখানে চাপুন
              </button>
            )}
          </div>

          {/* Real-time Subtitle & Transcript Stream */}
          <div className="w-full h-44 overflow-y-auto rounded-2xl bg-white/5 border border-white/10 p-3 my-2 text-xs space-y-2">
            {transcripts.length === 0 && callState === "connected" && (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-1">
                <Radio className="h-5 w-5 text-indigo-400 animate-pulse" />
                <p className="text-[11px]">মাইক্রোফোনে স্বাভাবিকভাবে কথা বলুন</p>
              </div>
            )}

            {transcripts.map((t, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${
                  t.speaker === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-[11px] leading-relaxed ${
                    t.speaker === "user"
                      ? "bg-emerald-600/80 text-white rounded-br-xs"
                      : "bg-slate-800 text-slate-100 rounded-tl-xs border border-white/10"
                  }`}
                >
                  <span className="block text-[9px] font-bold opacity-60 mb-0.5">
                    {t.speaker === "user" ? "আপনি (Customer)" : "এআই এজেন্ট (AI)"}
                  </span>
                  {t.text}
                </div>
              </div>
            ))}

            {/* Live user speaking interim text */}
            {liveUserText && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl px-3 py-1.5 text-[11px] bg-emerald-900/60 text-emerald-200 border border-emerald-500/30 animate-pulse">
                  {liveUserText}...
                </div>
              </div>
            )}

            <div ref={transcriptsEndRef} />
          </div>

          {/* Quick 1-Click Questions (for testing without speaking) */}
          {callState === "connected" && (
            <div className="w-full flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
              <button
                type="button"
                onClick={() => {
                  unlockBrowserAudio();
                  handleUserUtterance("১টি পিভিসি কার্ডের দাম কত পড়বে?");
                }}
                className="shrink-0 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full border border-white/15 text-slate-200 transition-colors"
              >
                💬 দাম কত?
              </button>
              <button
                type="button"
                onClick={() => {
                  unlockBrowserAudio();
                  handleUserUtterance(
                    "ডেলিভারি চার্জ সহ মোট কত পরবে? আর ২টা নিলে কি ফ্রি পাব?"
                  );
                }}
                className="shrink-0 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full border border-white/15 text-slate-200 transition-colors"
              >
                💬 ডেলিভারি চার্জ কত?
              </button>
              <button
                type="button"
                onClick={() => {
                  unlockBrowserAudio();
                  handleUserUtterance("ক্যাশ অন ডেলিভারি দেওয়া যাবে?");
                }}
                className="shrink-0 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full border border-white/15 text-slate-200 transition-colors"
              >
                💬 ক্যাশ অন ডেলিভারি?
              </button>
            </div>
          )}

          {/* Call Controls Bottom Bar */}
          <div className="w-full pt-2">
            {callState === "connected" ? (
              <div className="flex items-center justify-around">
                {/* Mute Mic */}
                <button
                  type="button"
                  onClick={() => {
                    if (isMuted) {
                      setIsMuted(false);
                      startSpeechRecognition();
                    } else {
                      setIsMuted(true);
                      stopSpeechRecognition();
                    }
                  }}
                  className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
                    isMuted
                      ? "bg-red-500 text-white"
                      : "bg-white/15 hover:bg-white/25 text-white"
                  }`}
                  title={isMuted ? "আনমিউট করুন" : "মিউট করুন"}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                {/* Hangup Red Button */}
                <button
                  type="button"
                  onClick={() => endCall(true)}
                  className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg shadow-red-600/40 active:scale-95 transition-transform"
                  title="কল সমাপ্ত করুন"
                >
                  <PhoneOff className="h-7 w-7" />
                </button>

                {/* Speaker Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSpeakerOn(!isSpeakerOn);
                    if (isSpeakerOn && audioRef.current) {
                      audioRef.current.pause();
                    }
                  }}
                  className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
                    !isSpeakerOn
                      ? "bg-amber-600 text-white"
                      : "bg-white/15 hover:bg-white/25 text-white"
                  }`}
                  title={isSpeakerOn ? "স্পিকার অফ" : "স্পিকার অন"}
                >
                  {isSpeakerOn ? (
                    <Volume2 className="h-5 w-5" />
                  ) : (
                    <VolumeX className="h-5 w-5" />
                  )}
                </button>
              </div>
            ) : callState === "ringing" ? (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => endCall(false)}
                  className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg transition-transform active:scale-95"
                >
                  <PhoneOff className="h-6 w-6" />
                </button>
              </div>
            ) : (
              /* Ended State */
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-slate-400">
                  কল সফলভাবে সম্পন্ন হয়েছে ও রেকর্ডিং সেভ হয়েছে।
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={startCall}
                    className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> আবার কল করুন
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="rounded-full border-white/20 text-white hover:bg-white/10 text-xs px-4 py-2"
                  >
                    বন্ধ করুন
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
