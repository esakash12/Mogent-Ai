"use client";

import * as React from "react";
import { formatCurrencyBdt } from "@/lib/utils";
import {
  Search,
  MessageSquare,
  Facebook,
  Instagram,
  ShoppingBag,
  Inbox,
  Filter,
  AlertTriangle,
  Bot,
  User,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConversationItem {
  id: string;
  customerName: string;
  customerPhone?: string | null;
  channelType: string;
  status: string;
  aiHandled: boolean;
  lastMessageAt: Date | string;
  lastMessageText?: string;
  unreadCount?: number;
  customerExternalId?: string | null;
  tags?: string | null;
  takeoverReason?: string | null;
  assignedToId?: string | null;
}

interface ChatListProps {
  conversations: ConversationItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ChatList({
  conversations,
  selectedId,
  onSelect,
  activeTab,
  onTabChange,
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [channelFilter, setChannelFilter] = React.useState("ALL");

  const tabs = ["Messages", "Orders", "Unreplied", "Tickets"];

  const filtered = conversations.filter((c) => {
    const matchesSearch = c.customerName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesChannel =
      channelFilter === "ALL" || c.channelType.toUpperCase() === channelFilter;
    return matchesSearch && matchesChannel;
  });

  return (
    <div className="flex h-full w-80 flex-col border-r border-slate-200 bg-white font-body select-none">
      {/* 1. Header Tabs */}
      <div className="flex border-b border-slate-200 px-3 pt-3 gap-1 font-bengali">
        {tabs.map((tab) => {
          const tabLabels: Record<string, string> = {
            Messages: "মেসেজ",
            Orders: "অর্ডার",
            Unreplied: "উত্তরহীন",
            Tickets: "টিকেট",
          };
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={cn(
                "px-3 py-2 text-xs font-bold rounded-t-lg transition-all whitespace-nowrap border-b-2 cursor-pointer",
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/60"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {tabLabels[tab] || tab}
            </button>
          );
        })}
      </div>

      {/* 2. Channel Filter Pills & Search */}
      <div className="p-3 space-y-2 border-b border-slate-100 bg-slate-50/50">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="কাস্টমার খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/15 font-bengali"
          />
        </div>

        {/* Channel Filter Pills */}
        <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto pb-1 font-bengali">
          {["ALL", "FACEBOOK", "WHATSAPP", "INSTAGRAM"].map((ch) => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer",
                channelFilter === ch
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              {ch === "ALL"
                ? "সব চ্যানেল"
                : ch === "FACEBOOK"
                ? "মেসেঞ্জার"
                : ch === "WHATSAPP"
                ? "হোয়াটসঅ্যাপ"
                : "ইনস্টাগ্রাম"}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 scrollbar-thin font-bengali">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-600">কোনো চ্যাট পাওয়া যায়নি</p>
            <p className="text-[11px] text-slate-400 mt-0.5">নতুন কোনো মেসেজ আসলে এখানে দেখাবে</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = selectedId === conv.id;
            const timeFormatted = new Date(conv.lastMessageAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  "p-3 cursor-pointer transition-all hover:bg-slate-50/80 relative flex items-start gap-3",
                  isSelected
                    ? "bg-indigo-50/70 border-l-4 border-l-indigo-600"
                    : "border-l-4 border-l-transparent"
                )}
              >
                {/* Avatar with Channel Badge */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                    {conv.customerName ? conv.customerName.charAt(0).toUpperCase() : "C"}
                  </div>
                  {/* Channel icon */}
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[9px] shadow-2xs">
                    {conv.channelType === "WHATSAPP" ? (
                      <span className="text-emerald-600 font-bold">WA</span>
                    ) : conv.channelType === "INSTAGRAM" ? (
                      <span className="text-pink-600 font-bold">IG</span>
                    ) : (
                      <span className="text-blue-600 font-bold">FB</span>
                    )}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {conv.customerName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {timeFormatted}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {conv.lastMessageText || "নতুন বার্তা..."}
                  </p>

                  <div className="flex items-center gap-1.5 mt-1.5">
                    {conv.aiHandled ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Bot className="w-2.5 h-2.5" />
                        AI সক্রিয়
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                        <User className="w-2.5 h-2.5" />
                        হ্যান্ডওভার
                      </span>
                    )}

                    {conv.status === "ORDER_CREATED" && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        অর্ডার বুকড
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
