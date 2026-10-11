"use client";

import * as React from "react";
import { MessageSquare, Facebook, Send, CheckCircle2, Zap } from "lucide-react";

interface CommentItem {
  id: string;
  postId: string;
  commenterName: string;
  commentText: string;
  aiReplyText?: string | null;
  dmSent: boolean;
  createdAt: string | Date;
}

interface CommentsTabProps {
  comments: CommentItem[];
}

export function CommentsTab({ comments }: CommentsTabProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Facebook Post Comments Automation
          </h2>
          <p className="text-xs text-slate-400">
            পোস্টে কমেন্ট করার সাথে সাথে AI স্বয়ংক্রিয়ভাবে কমেন্টে রিপ্লাই দেয় এবং ইনবক্সে মেসেজ পাঠায়।
          </p>
        </div>
      </div>

      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <MessageSquare className="h-10 w-10 text-slate-300 mb-2" />
          <h4 className="text-xs font-bold text-slate-600">কোনো কমেন্ট পাওয়া যায়নি</h4>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
            আপনার সংযুক্ত ফেসবুক পেজের কোনো পোস্টে কমেন্ট এলে তা স্বয়ংক্রিয়ভাবে এখানে তালিকাভুক্ত হবে।
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-2xl border border-border/80 bg-white p-4 shadow-xs dark:bg-slate-950 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs">
                    {comment.commenterName.charAt(0)}
                  </div>
                  <span>{comment.commenterName}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Customer Comment */}
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <span className="font-semibold text-slate-400 block text-[10px] uppercase mb-1">
                  Customer Comment
                </span>
                {comment.commentText}
              </div>

              {/* AI Auto Reply */}
              {comment.aiReplyText && (
                <div className="rounded-xl bg-indigo-50/60 p-3 text-xs text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200 space-y-1.5 border border-indigo-100 dark:border-indigo-900">
                  <div className="flex items-center justify-between text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    <span className="inline-flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <span>AI Auto Comment Reply</span>
                    </span>
                    {comment.dmSent && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> Inbox DM Sent
                      </span>
                    )}
                  </div>
                  <p>{comment.aiReplyText}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
