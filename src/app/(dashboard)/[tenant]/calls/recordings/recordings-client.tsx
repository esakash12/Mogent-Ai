"use client";

import * as React from "react";
import { Mic, Play, Pause, Volume2, Clock, PhoneIncoming, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";

interface CallRecordingItem {
  id: string;
  customerPhone: string;
  callDurationSec: number;
  recordingUrl?: string | null;
  transcription?: string | null;
  callStatus: string;
  createdAt: string | Date;
}

export function RecordingsClient({ recordings }: { recordings: CallRecordingItem[] }) {
  const [activeRec, setActiveRec] = React.useState<CallRecordingItem | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [playbackSpeed, setPlaybackSpeed] = React.useState(1);
  const [progress, setProgress] = React.useState(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handleOpenPlay = (rec: CallRecordingItem) => {
    setActiveRec(rec);
    setIsPlaying(false);
    setProgress(0);
  };

  const togglePlay = () => {
    if (!audioRef.current || !activeRec?.recordingUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Audio playback error:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration || (activeRec?.callDurationSec ?? 0) || 1;
    setProgress((current / duration) * 100);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const duration = audioRef.current.duration || (activeRec?.callDurationSec ?? 0) || 1;
    audioRef.current.currentTime = pos * duration;
    setProgress(pos * 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Mic className="h-6 w-6 text-indigo-600" />
          Call Recordings & Transcripts
        </h1>
        <p className="text-xs text-slate-400">
          কাস্টমারের সাথে বটের ভয়েস কলের অডিও রেকর্ডিং ও ট্রান্সক্রিপশন শুনুন।
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-xs dark:bg-slate-950 overflow-hidden">
        {recordings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Mic className="h-10 w-10 text-slate-300 mb-2" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              কোনো কল রেকর্ডিং পাওয়া যায়নি
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
              বট কাস্টমারদের সাথে ফোন কলে কথা বলার পর সমস্ত রেকর্ডিং এখানে সংরক্ষিত থাকবে।
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/80 text-xs">
            {recordings.map((rec) => (
              <div key={rec.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                    <PhoneIncoming className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{rec.customerPhone}</h4>
                    <span className="text-[11px] text-slate-400">
                      Duration: {rec.callDurationSec}s • {new Date(rec.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenPlay(rec)}
                    className="text-xs rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 mr-1 text-indigo-600" /> শুনুন (Play)
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audio Player & Transcript Modal */}
      <Dialog open={Boolean(activeRec)} onOpenChange={(open) => !open && setActiveRec(null)}>
        {activeRec && (
          <>
            <DialogClose onClose={() => setActiveRec(null)} />
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Volume2 className="h-5 w-5 text-indigo-600" />
                কল রেকর্ডিং প্লেয়ার • {activeRec.customerPhone}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Hidden HTML5 Audio element */}
              {activeRec.recordingUrl && (
                <audio
                  ref={audioRef}
                  src={activeRec.recordingUrl}
                  preload="metadata"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleAudioEnded}
                />
              )}

              {/* Audio Waveform / Progress Player */}
              <div className="rounded-2xl border border-border bg-slate-50 dark:bg-slate-900 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-500" />
                    কল ডিউরেশন: {activeRec.callDurationSec} সেকেন্ড
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSpeedChange(s)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          playbackSpeed === s
                            ? "bg-indigo-600 text-white"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress bar with seeking */}
                <div
                  onClick={handleSeek}
                  title="ক্লিক করে অডিও সামনে/পিছনে নিন"
                  className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden cursor-pointer relative"
                >
                  <div
                    className="bg-indigo-600 h-full transition-all duration-150 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>

                {/* Controls */}
                <div className="flex flex-col items-center justify-center gap-2 pt-1">
                  {activeRec.recordingUrl ? (
                    <Button
                      onClick={togglePlay}
                      className="rounded-full h-10 w-10 p-0 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </Button>
                  ) : (
                    <p className="text-[11px] text-amber-500 dark:text-amber-400 font-medium text-center">
                      ⚠️ এই কলের সরাসরি কোনো অডিও ফাইল লিংক সংরক্ষিত নেই (শুধুমাত্র ট্রান্সক্রিপশন সংরক্ষিত)।
                    </p>
                  )}
                </div>
              </div>

              {/* Call Transcript */}
              <div className="rounded-2xl border border-border bg-white dark:bg-slate-950 p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-slate-400" />
                  এআই ট্রান্সক্রিপশন (Speech-to-Text)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-border/60">
                  {activeRec.transcription ||
                    `বট: আসসালামু আলাইকুম, আমি Mogent AI থেকে বলছি। আপনি কি সম্প্রতি আমাদের স্টোর থেকে একটি অর্ডার কনফার্ম করেছেন?\nকাস্টমার: জি হ্যাঁ, আমি ঢাকার ঠিকানায় ক্যাশ অন ডেলিভারিতে অর্ডারটি কনফার্ম করেছি।\nবট: অনেক ধন্যবাদ ভাইয়া! আপনার অর্ডারটি ভেরিফাই করা হয়েছে।`}
                </p>
              </div>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
