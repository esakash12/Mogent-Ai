"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus, Check, UserCheck, Shield } from "lucide-react";
import { useToast } from "@/lib/toast-context";

interface AgentItem {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantSlug: string;
  conversationId: string;
  currentAssignedId?: string | null;
  onAssigned: (agentId: string, agentName: string) => void;
}

export function AssignModal({
  open,
  onOpenChange,
  tenantSlug,
  conversationId,
  currentAssignedId,
  onAssigned,
}: AssignModalProps) {
  const { toast } = useToast();
  const [agents, setAgents] = React.useState<AgentItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [assigningId, setAssigningId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setLoading(true);
      fetch(`/api/tenants/${tenantSlug}/team`)
        .then((res) => res.json())
        .then((data) => {
          if (data.agents) setAgents(data.agents);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, tenantSlug]);

  const handleSelectAgent = async (agent: AgentItem) => {
    setAssigningId(agent.id);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: agent.id }),
      });

      if (res.ok) {
        toast.success(`চ্যাটটি '${agent.name}'-কে অ্যাসাইন করা হয়েছে!`);
        onAssigned(agent.id, agent.name);
        onOpenChange(false);
      } else {
        toast.error("অ্যাসাইন করতে সমস্যা হয়েছে");
      }
    } catch {
      toast.error("সার্ভার সমস্যা, আবার চেষ্টা করুন");
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClose={() => onOpenChange(false)} />
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <UserPlus className="h-4 w-4 text-cyan-500" />
          টিম মেম্বারকে অ্যাসাইন করুন (Assign Conversation)
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-2.5 py-2">
        <p className="text-xs text-slate-500">
          এই চ্যাটটি হ্যান্ডেল করার জন্য একজন টিম মেম্বার বা এজেন্ট সিলেক্ট করুন:
        </p>

        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400">এজেন্টদের তালিকা লোড হচ্ছে...</div>
        ) : agents.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">কোনো টিম মেম্বার পাওয়া যায়নি</div>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {agents.map((agent) => {
              const isSelected = currentAssignedId === agent.id;
              return (
                <button
                  key={agent.id}
                  disabled={assigningId === agent.id}
                  onClick={() => handleSelectAgent(agent)}
                  className={`flex w-full items-center justify-between p-3 rounded-xl border transition-all text-left ${
                    isSelected
                      ? "border-cyan-500 bg-cyan-50/60 dark:bg-cyan-950/30"
                      : "border-border/80 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-700 font-bold text-xs shrink-0">
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        {agent.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {agent.email} • {agent.role}
                      </span>
                    </div>
                  </div>

                  {isSelected ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-600 bg-cyan-100/70 dark:bg-cyan-900/40 px-2 py-0.5 rounded-full">
                      <Check className="h-3 w-3" /> Assigned
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 hover:text-cyan-600 font-semibold">
                      সিলেক্ট করুন
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Dialog>
  );
}
