"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, Send, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/lib/toast-context";

interface AudioRecorderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantSlug: string;
  onSendAudio: (audioUrl: string) => void;
}

export function AudioRecorderModal({
  open,
  onOpenChange,
  tenantSlug,
  onSendAudio,
}: AudioRecorderModalProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingSeconds, setRecordingSeconds] = React.useState(0);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [micError, setMicError] = React.useState<string | null>(null);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = React.useRef<HTMLAudioElement | null>(null);

  // Reset state on open/close
  React.useEffect(() => {
    if (!open) {
      handleReset();
    }
  }, [open]);

  // Clean timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setMicError("মাইক্রোফোন চালু করা যায়নি। অনুগ্রহ করে ব্রাউজারে মাইক্রোফোনের অনুমতি দিন।");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleReset = () => {
    if (isRecording) {
      handleStopRecording();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setAudioBlob(null);
    setAudioUrl(null);
    setIsRecording(false);
    setRecordingSeconds(0);
    setIsPlaying(false);
    setMicError(null);
  };

  const handlePlayToggle = () => {
    if (!audioUrl) return;
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, `voice_note_${Date.now()}.webm`);

      const res = await fetch(`/api/tenants/${tenantSlug}/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onSendAudio(data.url);
        toast.success("ভয়েস মেসেজ পাঠানো হয়েছে!");
        onOpenChange(false);
      } else {
        toast.error("অডিও আপলোড করতে সমস্যা হয়েছে");
      }
    } catch {
      toast.error("সার্ভার সমস্যা, আবার চেষ্টা করুন");
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClose={() => onOpenChange(false)} />
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <Mic className="h-4 w-4 text-rose-500" />
          ভয়েস মেসেজ রেকর্ড করুন (Audio Note)
        </DialogTitle>
      </DialogHeader>

      <div className="flex flex-col items-center justify-center py-6 space-y-4">
        {micError && (
          <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{micError}</span>
          </div>
        )}

        {/* Timer display */}
        <div className="text-3xl font-mono font-bold text-slate-800 dark:text-slate-100">
          {formatTime(recordingSeconds)}
        </div>

        {/* Recording or Action Button */}
        {isRecording ? (
          <div className="flex flex-col items-center space-y-2">
            <button
              type="button"
              onClick={handleStopRecording}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 text-white shadow-xl hover:scale-105 active:scale-95 transition-all animate-pulse"
              title="রেকর্ডিং বন্ধ করুন"
            >
              <Square className="h-6 w-6" />
            </button>
            <span className="text-xs font-semibold text-rose-500">রেকর্ডিং চলছে... চাপ দিয়ে থামান</span>
          </div>
        ) : audioUrl ? (
          /* Preview and send controls */
          <div className="flex flex-col items-center space-y-3 w-full max-w-xs">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayToggle}
                className="h-10 w-10 rounded-full p-0 border-indigo-200 text-indigo-600"
                title={isPlaying ? "বিরতি" : "শুনুন"}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-10 w-10 rounded-full p-0 border-slate-200 text-slate-500 hover:text-rose-600"
                title="মুছে ফেলুন"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                disabled={isUploading}
                onClick={handleSend}
                className="h-10 px-5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 shadow-md"
              >
                <Send className="h-3.5 w-3.5" />
                {isUploading ? "পাঠানো হচ্ছে..." : "মেসেজ পাঠান"}
              </Button>
            </div>
            <span className="text-[11px] text-slate-400">রেকর্ডটি শুনে মেসেজ হিসেবে পাঠিয়ে দিন</span>
          </div>
        ) : (
          /* Start button */
          <div className="flex flex-col items-center space-y-2">
            <button
              type="button"
              onClick={handleStartRecording}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
              title="রেকর্ড শুরু করুন"
            >
              <Mic className="h-7 w-7" />
            </button>
            <span className="text-xs font-medium text-slate-500">চাপ দিয়ে কথা বলা শুরু করুন</span>
          </div>
        )}
      </div>
    </Dialog>
  );
}
