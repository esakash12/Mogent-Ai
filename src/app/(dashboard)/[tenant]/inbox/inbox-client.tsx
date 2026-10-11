"use client";

import * as React from "react";
import { ChatList, ConversationItem } from "@/components/inbox/chat-list";
import { ChatThread } from "@/components/inbox/chat-thread";
import { CopilotDrawer } from "@/components/inbox/copilot-drawer";
import { CommentsTab } from "@/components/inbox/comments-tab";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageData } from "@/types/conversation";
import { ShoppingBag, Check } from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { playOrderChime } from "@/lib/audio-alert";

interface InboxClientProps {
  tenantSlug: string;
  initialConversations: ConversationItem[];
  initialComments: any[];
}

export function InboxClient({
  tenantSlug,
  initialConversations,
  initialComments,
}: InboxClientProps) {
  const { toast } = useToast();
  const [conversations, setConversations] = React.useState<ConversationItem[]>(initialConversations);
  const [selectedId, setSelectedId] = React.useState<string | null>(
    initialConversations[0]?.id || null
  );
  const [activeTab, setActiveTab] = React.useState("Messages");
  const [copilotOpen, setCopilotOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<MessageData[]>([]);
  const [conversationDetail, setConversationDetail] = React.useState<any>(null);
  const [recentOrders, setRecentOrders] = React.useState<any[]>([]);
  const [createOrderOpen, setCreateOrderOpen] = React.useState(false);

  // Form states for manual order creation modal
  const [orderProductName, setOrderProductName] = React.useState("Galaxy Gadget");
  const [orderPrice, setOrderPrice] = React.useState("1999");
  const [orderDeliveryFee, setOrderDeliveryFee] = React.useState("60");
  const [orderCustomerName, setOrderCustomerName] = React.useState("");
  const [orderCustomerPhone, setOrderCustomerPhone] = React.useState("");
  const [orderAddress, setOrderAddress] = React.useState("");
  const [orderSuccess, setOrderSuccess] = React.useState(false);

  // Fetch conversation detail and recent orders
  const fetchConversationDetail = React.useCallback(
    async (convId: string) => {
      try {
        const res = await fetch(`/api/tenants/${tenantSlug}/conversations/${convId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.conversation) {
            setConversationDetail(data.conversation);
            setRecentOrders(data.orders || []);
          }
        }
      } catch (err) {
        console.error("Failed to load conversation details:", err);
      }
    },
    [tenantSlug]
  );

  // 1. Fetch messages on conversation change + Real-time message polling (2.5s)
  React.useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setConversationDetail(null);
      setRecentOrders([]);
      return;
    }

    let isMounted = true;

    const loadMessages = async () => {
      try {
        const res = await fetch(
          `/api/tenants/${tenantSlug}/conversations/${selectedId}/messages`
        );
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.messages && Array.isArray(data.messages)) {
            setMessages(data.messages);
          }
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      }
    };

    // Initial load
    loadMessages();
    fetchConversationDetail(selectedId);

    // Real-time polling for new incoming customer/AI messages
    const msgInterval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/tenants/${tenantSlug}/conversations/${selectedId}/messages`
        );
        if (res.ok && isMounted) {
          const data = await res.json();
          const newMsgs = data.messages || [];
          setMessages((prev) => {
            // Check if messages changed
            if (prev.length !== newMsgs.length) {
              return newMsgs;
            }
            const lastPrev = prev[prev.length - 1];
            const lastNew = newMsgs[newMsgs.length - 1];
            if (lastPrev?.id !== lastNew?.id || lastPrev?.content !== lastNew?.content) {
              return newMsgs;
            }
            return prev;
          });
        }
      } catch {
        // Silently ignore background polling errors
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(msgInterval);
    };
  }, [selectedId, tenantSlug, fetchConversationDetail]);

  // 2. Real-time conversation list polling (4.0s)
  React.useEffect(() => {
    let isMounted = true;

    const convInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tenants/${tenantSlug}/conversations`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.success && Array.isArray(data.conversations)) {
            setConversations(data.conversations);
          }
        }
      } catch {
        // Silently ignore background polling errors
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(convInterval);
    };
  }, [tenantSlug]);

  const activeConv = conversations.find((c) => c.id === selectedId);

  // Send message (Human Agent Reply live to Messenger + DB)
  const handleSendMessage = async (text: string, mediaUrl?: string) => {
    if (!selectedId) return;

    // Optimistic UI update
    const tempId = "temp_" + Date.now();
    const newMsg: MessageData = {
      id: tempId,
      conversationId: selectedId,
      senderType: "AGENT",
      senderName: "Agent",
      content: text,
      mediaUrl: mediaUrl || null,
      aiCostBdt: 0,
      verifiedStock: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);

    // Optimistically update conversation snippet in list
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              lastMessageText: text || (mediaUrl ? "ফাইল সংযুক্ত করা হয়েছে" : ""),
              lastMessageAt: new Date().toISOString(),
            }
          : c
      )
    );

    try {
      const res = await fetch(
        `/api/tenants/${tenantSlug}/conversations/${selectedId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: text,
            mediaUrl: mediaUrl || null,
            senderType: "AGENT",
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? data.message : m))
          );
        }
      } else {
        toast.error("মেসেজ পাঠাতে সমস্যা হয়েছে");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("মেসেজ পাঠাতে সমস্যা হয়েছে");
    }
  };

  // Toggle AI for this active conversation
  const handleToggleAi = async (active: boolean) => {
    if (!selectedId) return;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              aiHandled: active,
              ...(active ? { status: "OPEN", takeoverReason: null } : {}),
            }
          : c
      )
    );
    if (conversationDetail) {
      setConversationDetail((prev: any) =>
        prev
          ? {
              ...prev,
              aiHandled: active,
              ...(active ? { status: "OPEN", takeoverReason: null } : {}),
            }
          : prev
      );
    }

    try {
      await fetch(`/api/tenants/${tenantSlug}/conversations/${selectedId}/toggle-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiHandled: active }),
      });
      toast.success(
        active ? "AI অটোমেশন চালু করা হয়েছে" : "AI অটোমেশন বন্ধ (হিউম্যান এজেন্ট মোড)"
      );
    } catch (err) {
      console.error("Failed to toggle AI for conversation:", err);
      toast.error("AI স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে");
    }
  };

  // Update tags for active conversation
  const handleUpdateTags = async (newTags: string) => {
    if (!selectedId) return;

    setConversations((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, tags: newTags } : c))
    );
    if (conversationDetail) {
      setConversationDetail((prev: any) =>
        prev ? { ...prev, tags: newTags } : prev
      );
    }

    try {
      const res = await fetch(
        `/api/tenants/${tenantSlug}/conversations/${selectedId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags: newTags }),
        }
      );
      if (res.ok) {
        toast.success("ট্যাগ আপডেট করা হয়েছে!");
      }
    } catch (err) {
      console.error("Failed to update tags:", err);
      toast.error("ট্যাগ আপডেট করতে সমস্যা হয়েছে");
    }
  };

  // Assign conversation to agent / user
  const handleAssigned = async (agentId: string, agentName: string) => {
    if (!selectedId) return;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId ? { ...c, assignedToId: agentId } : c
      )
    );
    if (conversationDetail) {
      setConversationDetail((prev: any) =>
        prev ? { ...prev, assignedToId: agentId } : prev
      );
    }

    try {
      const res = await fetch(
        `/api/tenants/${tenantSlug}/conversations/${selectedId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignedToId: agentId }),
        }
      );
      if (res.ok) {
        toast.success(`${agentName} কে অ্যাসাইন করা হয়েছে!`);
      }
    } catch (err) {
      console.error("Failed to assign agent:", err);
      toast.error("অ্যাসাইন করতে সমস্যা হয়েছে");
    }
  };

  // Update customer name & phone
  const handleUpdateCustomer = async (newName: string, newPhone: string) => {
    if (!selectedId) return;

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/conversations/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: newName,
          customerPhone: newPhone,
        }),
      });

      if (res.ok) {
        toast.success("কাস্টমার তথ্য আপডেট হয়েছে!");
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedId
              ? { ...c, customerName: newName, customerPhone: newPhone }
              : c
          )
        );
        setConversationDetail((prev: any) =>
          prev ? { ...prev, customerName: newName, customerPhone: newPhone } : prev
        );
        fetchConversationDetail(selectedId);
      } else {
        toast.error("কাস্টমার তথ্য আপডেট করতে সমস্যা হয়েছে");
      }
    } catch (err) {
      console.error("Failed to update customer:", err);
      toast.error("সার্ভার সমস্যা, আবার চেষ্টা করুন");
    }
  };

  // Create Order submit
  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const effectiveName =
        orderCustomerName ||
        conversationDetail?.customerName ||
        activeConv?.customerName ||
        "Customer";
      const effectivePhone =
        orderCustomerPhone ||
        conversationDetail?.customerPhone ||
        activeConv?.customerPhone ||
        "01700000000";

      const res = await fetch(`/api/tenants/${tenantSlug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: effectiveName,
          customerPhone: effectivePhone,
          deliveryAddress: orderAddress || "Dhaka, Bangladesh",
          productName: orderProductName,
          subtotal: parseFloat(orderPrice) || 0,
          deliveryCharge: parseFloat(orderDeliveryFee) || 0,
          channel: conversationDetail?.channelType || activeConv?.channelType || "FACEBOOK",
        }),
      });

      if (res.ok) {
        playOrderChime();
        toast.success("অর্ডার সফলভাবে তৈরি হয়েছে!");
        setOrderSuccess(true);
        if (selectedId) {
          fetchConversationDetail(selectedId);
        }
        setTimeout(() => {
          setOrderSuccess(false);
          setCreateOrderOpen(false);
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to create order:", err);
      toast.error("অর্ডার তৈরি করতে সমস্যা হয়েছে");
    }
  };

  // Derived effective customer details
  const effectiveCustomerName =
    conversationDetail?.customerName || activeConv?.customerName || "Customer";
  const effectiveCustomerPhone =
    conversationDetail?.customerPhone ?? activeConv?.customerPhone ?? null;
  const effectiveChannelType =
    conversationDetail?.channelType || activeConv?.channelType || "FACEBOOK";
  const effectiveAiHandled =
    conversationDetail?.aiHandled !== undefined
      ? conversationDetail.aiHandled
      : activeConv?.aiHandled ?? true;
  const effectiveExternalId =
    conversationDetail?.customerExternalId || activeConv?.customerExternalId || null;

  return (
    <div className="flex h-[calc(100vh-7rem)] w-full rounded-2xl border border-border bg-white shadow-xs dark:bg-slate-950 overflow-hidden relative">
      {/* Column 1: Conversations List (Hidden on mobile if active conversation is selected) */}
      <div
        className={
          activeTab === "Comments"
            ? "hidden md:flex shrink-0"
            : activeConv
            ? "hidden md:flex shrink-0"
            : "flex w-full md:w-80 shrink-0"
        }
      >
        <ChatList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Column 2 & 3: Chat Thread & Copilot Drawer OR Comments Tab */}
      {activeTab === "Comments" ? (
        <CommentsTab comments={initialComments} />
      ) : activeConv ? (
        <>
          <div className="flex flex-1 overflow-hidden min-w-0">
            <ChatThread
              conversationId={activeConv.id}
              customerName={effectiveCustomerName}
              customerPhone={effectiveCustomerPhone}
              channelType={effectiveChannelType}
              messages={messages}
              aiHandled={effectiveAiHandled}
              tenantSlug={tenantSlug}
              status={conversationDetail?.status || activeConv?.status || "OPEN"}
              tags={conversationDetail?.tags ?? activeConv?.tags ?? null}
              takeoverReason={
                conversationDetail?.takeoverReason ?? activeConv?.takeoverReason ?? null
              }
              assignedToId={
                conversationDetail?.assignedToId ?? activeConv?.assignedToId ?? null
              }
              onSendMessage={handleSendMessage}
              onOpenCreateOrder={() => {
                setOrderCustomerName(effectiveCustomerName);
                setOrderCustomerPhone(effectiveCustomerPhone || "");
                setCreateOrderOpen(true);
              }}
              onTakeoverToggle={() => handleToggleAi(!effectiveAiHandled)}
              onBack={() => setSelectedId(null)}
              onToggleCopilot={() => setCopilotOpen(!copilotOpen)}
              onUpdateTags={handleUpdateTags}
              onAssigned={handleAssigned}
            />
          </div>

          {/* Copilot Drawer (Responsive: Always visible on XL, Drawer on mobile/tablet when copilotOpen) */}
          <div
            className={`shrink-0 ${
              copilotOpen
                ? "fixed inset-y-0 right-0 z-40 flex shadow-2xl bg-white dark:bg-slate-950 border-l border-border"
                : "hidden xl:flex"
            }`}
          >
            <CopilotDrawer
              customerName={effectiveCustomerName}
              customerPhone={effectiveCustomerPhone}
              deliveryAddress={conversationDetail?.deliveryAddress || "ঠিকানা এখনো নিশ্চিত করা হয়নি"}
              channelType={effectiveChannelType}
              customerExternalId={effectiveExternalId}
              aiHandled={effectiveAiHandled}
              totalMessages={messages.length}
              totalAiCostBdt={messages.reduce((acc, m) => acc + (m.aiCostBdt || 0), 0)}
              recentOrders={recentOrders}
              onToggleAi={handleToggleAi}
              onCreateOrderClick={() => {
                setOrderCustomerName(effectiveCustomerName);
                setOrderCustomerPhone(effectiveCustomerPhone || "");
                setCreateOrderOpen(true);
              }}
              onUpdateCustomer={handleUpdateCustomer}
            />
          </div>
        </>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center p-10 text-center text-slate-400 text-xs">
          কোনো চ্যাট নির্বাচিত নেই। বামপাশ থেকে একটি চ্যাট নির্বাচন করুন।
        </div>
      )}

      {/* Create Order Modal */}
      <Dialog open={createOrderOpen} onOpenChange={setCreateOrderOpen}>
        <DialogClose onClose={() => setCreateOrderOpen(false)} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-indigo-600" />
            ম্যানুয়াল অর্ডার তৈরি করুন (Create Order)
          </DialogTitle>
        </DialogHeader>

        {orderSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-emerald-600 space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-sm">অর্ডার সফলভাবে তৈরি হয়েছে!</h4>
            <p className="text-xs text-slate-400">অর্ডারটি Orders তালিকায় যুক্ত হয়েছে।</p>
          </div>
        ) : (
          <form onSubmit={handleCreateOrderSubmit} className="space-y-3.5 py-2 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">কাস্টমার নাম</label>
              <Input
                value={orderCustomerName}
                onChange={(e) => setOrderCustomerName(e.target.value)}
                placeholder="কাস্টমারের নাম"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">ফোন নম্বর</label>
              <Input
                value={orderCustomerPhone}
                onChange={(e) => setOrderCustomerPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">ডেলিভারি ঠিকানা</label>
              <Input
                value={orderAddress}
                onChange={(e) => setOrderAddress(e.target.value)}
                placeholder="হাউস নং, রোড নং, এলাকা, জেলা"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">পণ্যের নাম</label>
                <Input
                  value={orderProductName}
                  onChange={(e) => setOrderProductName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">মূল্য (BDT)</label>
                <Input
                  type="number"
                  value={orderPrice}
                  onChange={(e) => setOrderPrice(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">ডেলিভারি চার্জ (BDT)</label>
              <Input
                type="number"
                value={orderDeliveryFee}
                onChange={(e) => setOrderDeliveryFee(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-2.5 rounded-xl shadow-md mt-2"
            >
              অর্ডার কনফার্ম করুন
            </Button>
          </form>
        )}
      </Dialog>
    </div>
  );
}
