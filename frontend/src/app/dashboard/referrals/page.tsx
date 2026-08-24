"use client";

import { useState, useEffect } from "react";
import { UserPlus, Copy, Check, Loader2, Users, Gift, Search } from "lucide-react";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";
import PageHeader from "@/components/ui/PageHeader";

interface ReferralUser {
  id: string;
  name: string;
  joinDate: string;
}

interface ReferralData {
  referralCode: string | null;
  referralCount: number;
  referralXpEarned: number;
  referrals: ReferralUser[];
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [applyCode, setApplyCode] = useState("");
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const result = await fetchApi<ReferralData>("/auth/me/referrals");
        setData(result);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCopy = async () => {
    if (!data?.referralCode) return;
    try {
      await navigator.clipboard.writeText(data.referralCode);
      setCopied(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleCopyLink = async () => {
    if (!data?.referralCode) return;
    const link = `${window.location.origin}/get-started?ref=${data.referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Referral link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleApply = async () => {
    if (!applyCode.trim()) return;
    setApplying(true);
    try {
      await fetchApi("/auth/referral", {
        method: "POST",
        body: JSON.stringify({ code: applyCode.trim().toUpperCase() }),
      });
      toast.success("Referral applied! You earned 500 XP!");
      setApplyCode("");
      const result = await fetchApi<ReferralData>("/auth/me/referrals");
      setData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to apply referral";
      toast.error(message);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-[#229C62] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Referrals"
        description="Invite friends and earn XP rewards for each referral."
      />

      {/* Referral Code Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#E9F8EE] flex items-center justify-center">
            <UserPlus size={20} className="text-[#229C62]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Your Referral Code</h2>
            <p className="text-xs text-slate-500">Share this code with friends to invite them</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
            <span className="text-lg font-mono font-bold tracking-widest text-[#0F203A]">
              {data?.referralCode || "N/A"}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#229C62] text-white text-sm font-medium hover:bg-[#1a7a4d] transition-colors"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <button
          onClick={handleCopyLink}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Copy size={14} />
          Copy Referral Link
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users size={18} className="text-blue-600" />
            </div>
            <span className="text-xs text-slate-500 font-medium">Total Referrals</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data?.referralCount ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-[#E9F8EE] flex items-center justify-center">
              <Gift size={18} className="text-[#229C62]" />
            </div>
            <span className="text-xs text-slate-500 font-medium">XP Earned</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data?.referralXpEarned ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
              <Gift size={18} className="text-amber-600" />
            </div>
            <span className="text-xs text-slate-500 font-medium">XP Per Referral</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">500</p>
        </div>
      </div>

      {/* Apply Referral Code */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Search size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Have a Referral Code?</h2>
            <p className="text-xs text-slate-500">Enter a friend&apos;s code to earn 500 XP</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={applyCode}
            onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
            placeholder="Enter referral code"
            maxLength={8}
            className="flex-1 bg-slate-50 rounded-lg px-4 py-3 border border-slate-200 text-sm font-mono tracking-wider uppercase placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#229C62] focus:border-transparent"
          />
          <button
            onClick={handleApply}
            disabled={applying || !applyCode.trim()}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#0F203A] text-white text-sm font-medium hover:bg-[#1a3050] transition-colors disabled:opacity-50"
          >
            {applying ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Apply
          </button>
        </div>
      </div>

      {/* Referred Users List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Referred Users</h2>
        {data?.referrals && data.referrals.length > 0 ? (
          <div className="space-y-3">
            {data.referrals.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E9F8EE] flex items-center justify-center">
                    <span className="text-sm font-semibold text-[#229C62]">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500">
                      Joined {new Date(user.joinDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[#229C62] bg-[#E9F8EE] px-2 py-1 rounded-full font-medium">
                  +500 XP
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-[#E9F8EE] flex items-center justify-center mx-auto mb-3">
              <Users size={20} className="text-[#229C62]" />
            </div>
            <p className="text-sm font-medium text-slate-900">No referrals yet</p>
            <p className="text-xs text-slate-500 mt-1">Share your code to start earning XP for each invite</p>
          </div>
        )}
      </div>
    </div>
  );
}
