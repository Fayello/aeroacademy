"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";
import { Settings, Mail, Loader2, Save, CheckCircle2 } from "lucide-react";

interface EmailPreferences {
  milestones: boolean;
  weeklyDigest: boolean;
  nudges: boolean;
  reengagement: boolean;
  achievements: boolean;
  courseUpdates: boolean;
}

const CATEGORIES = [
  { key: "milestones", label: "Milestone Emails", description: "25/50/75/100% course progress celebrations" },
  { key: "weeklyDigest", label: "Weekly Digest", description: "Weekly summary of your learning activity" },
  { key: "nudges", label: "Course Reminders", description: "Reminders about enrolled but unfinished courses" },
  { key: "achievements", label: "Achievement Emails", description: "First lab, first flag, level up celebrations" },
  { key: "courseUpdates", label: "Course Updates", description: "Welcome drip and course-related notifications" },
  { key: "reengagement", label: "Re-engagement", description: "Reminders when you've been away for a while" },
] as const;

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<EmailPreferences>({
    milestones: true,
    weeklyDigest: true,
    nudges: true,
    reengagement: true,
    achievements: true,
    courseUpdates: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const me = await fetchApi<{ emailPreferences?: EmailPreferences }>("/auth/me");
        if (me?.emailPreferences) {
          setPreferences(me.emailPreferences);
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleToggle = (key: keyof EmailPreferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchApi("/auth/email-preferences", {
        method: "PATCH",
        body: JSON.stringify({ preferences }),
      });
      toast.success("Email preferences saved");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="bg-slate-100 p-2.5 rounded-xl">
          <Settings size={20} className="text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Email Preferences</h1>
          <p className="text-sm text-slate-500">Choose which emails you want to receive</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="divide-y divide-slate-100">
          {CATEGORIES.map((cat) => (
            <div key={cat.key} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{cat.label}</p>
                  <p className="text-xs text-slate-500">{cat.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(cat.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  preferences[cat.key] ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    preferences[cat.key] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-5 rounded-xl transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
