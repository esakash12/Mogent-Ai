"use client";

import * as React from "react";
import { Users, UserPlus, Trash2, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface TeamClientProps {
  tenantSlug: string;
  initialMembers: TeamMember[];
}

export function TeamClient({ tenantSlug, initialMembers }: TeamClientProps) {
  const [members, setMembers] = React.useState<TeamMember[]>(initialMembers);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("AGENT");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/settings/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMembers([data.member, ...members]);
        setName("");
        setEmail("");
        setModalOpen(false);
      } else {
        setError(data.error || "মেম্বার যুক্ত করতে ব্যর্থ হয়েছে।");
      }
    } catch (err) {
      setError("সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই মেম্বারকে ডিলিট করতে চান?")) return;
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/settings/team?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMembers(members.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete member:", err);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            Team Members & Roles
          </h1>
          <p className="text-xs text-slate-400">
            [UNLOCKED] একাধিক এজেন্ট নিয়োগ করুন এবং তাদের ইনবক্স চ্যাট হ্যান্ডেল করার দায়িত্ব দিন।
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
        >
          <UserPlus className="h-4 w-4 mr-1.5" /> নতুন মেম্বার যুক্ত করুন
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-xs dark:bg-slate-950 overflow-hidden">
        <div className="p-4 border-b border-border font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
          <span>Active Staff & Agents</span>
          <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Unlimited Team Seats Unlocked
          </span>
        </div>

        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="h-10 w-10 text-slate-300 mb-2" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">কোনো টিম মেম্বার যোগ করা হয়নি</h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
              আপনার অনলাইন শপে কাস্টমার সাপোর্টের জন্য কর্মী নিয়োগ করতে উপরের বাটনটিতে ক্লিক করুন।
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border text-xs">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{member.name}</h4>
                    <span className="text-[11px] text-slate-400">{member.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                    {member.role}
                  </span>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogClose onClose={() => setModalOpen(false)} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            নতুন টিম মেম্বার যুক্ত করুন
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAddMember} className="space-y-4 py-2 text-xs">
          {error && <p className="text-rose-500 font-medium">{error}</p>}

          <div>
            <label className="font-bold text-slate-700 block mb-1">স্টাফ/এজেন্টের নাম</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: মো: আরিফুল ইসলাম"
              className="text-xs rounded-xl"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">অফিশিয়াল ইমেইল</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@example.com"
              className="text-xs rounded-xl"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">রোল ও এক্সেস লেভেল</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-input p-2.5 text-xs bg-slate-50 dark:bg-slate-900"
            >
              <option value="AGENT">Customer Support Agent (চ্যাট ও অর্ডার)</option>
              <option value="MANAGER">Manager (ইনবক্স, সেলস ও পার্সেল)</option>
            </select>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            মেম্বার কনফার্ম করুন
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
