"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { logout } from "@/lib/auth";
import PageHeader from "@/components/ui/PageHeader";
import {
  User,
  Bell,
  Shield,
  Palette,
  Key,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import toast from "@/lib/toast";
import type { UserPreference } from "@/types/api";

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

function PreferenceRow({
  label,
  description,
  enabled,
  busy,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  busy: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/10 last:border-0">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => !busy && onToggle(!enabled)}
        disabled={busy}
        aria-pressed={enabled}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
          enabled ? "bg-[#229C62]" : "bg-white/10"
        } ${busy ? "cursor-wait opacity-70" : ""}`}
      >
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        >
          {busy ? <Loader2 size={10} className="animate-spin text-slate-500" /> : null}
        </span>
      </button>
    </div>
  );
}

const sections: SettingsSection[] = [
  { id: "account", label: "Account", icon: User, description: "Manage your profile and personal information" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Configure how you receive notifications" },
  { id: "security", label: "Security", icon: Shield, description: "Password, 2FA, and session management" },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Customize the look and feel" },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("account");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string; role?: string } | null>(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [preferences, setPreferences] = useState<UserPreference | null>(null);
  const [savingPreference, setSavingPreference] = useState<"notificationsEnabled" | "weeklyDigestEnabled" | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const updatePreference = useCallback(
    async (key: "notificationsEnabled" | "weeklyDigestEnabled", value: boolean) => {
      const nextPreferences = {
        interests: preferences?.interests || [],
        weakSkills: preferences?.weakSkills || [],
        preferredDifficulty: preferences?.preferredDifficulty || "MEDIUM",
        notificationsEnabled: key === "notificationsEnabled" ? value : preferences?.notificationsEnabled ?? true,
        weeklyDigestEnabled: key === "weeklyDigestEnabled" ? value : preferences?.weeklyDigestEnabled ?? true,
      };

      const previous = preferences;
      setPreferences((current) =>
        current
          ? { ...current, [key]: value }
          : {
              interests: [],
              weakSkills: [],
              preferredDifficulty: "MEDIUM",
              notificationsEnabled: key === "notificationsEnabled" ? value : true,
              weeklyDigestEnabled: key === "weeklyDigestEnabled" ? value : true,
              displayMode: "SYSTEM",
              onboardingCompleted: false,
              onboardingSelections: {},
            },
      );
      setSavingPreference(key);

      try {
        const saved = await fetchApi<UserPreference>("/dashboard/preferences", {
          method: "POST",
          body: JSON.stringify(nextPreferences),
        });
        setPreferences((current) => ({
          interests: saved?.interests || current?.interests || [],
          weakSkills: saved?.weakSkills || current?.weakSkills || [],
          preferredDifficulty: saved?.preferredDifficulty || current?.preferredDifficulty || "MEDIUM",
          notificationsEnabled: saved?.notificationsEnabled ?? nextPreferences.notificationsEnabled,
          weeklyDigestEnabled: saved?.weeklyDigestEnabled ?? nextPreferences.weeklyDigestEnabled,
          displayMode: current?.displayMode || "SYSTEM",
          onboardingCompleted: current?.onboardingCompleted || false,
          onboardingSelections: current?.onboardingSelections || {},
        }));
        toast.success("Preference updated");
      } catch {
        setPreferences(previous);
        toast.error("Failed to update preference");
      } finally {
        setSavingPreference(null);
      }
    },
    [preferences],
  );

  // Close modal on Escape
  useEffect(() => {
    if (!showDeleteConfirm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowDeleteConfirm(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    cancelRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showDeleteConfirm]);

  useEffect(() => {
    fetchApi<{ name?: string; email?: string; role?: string }>("/auth/me").then((u) => {
      setUser(u);
      localStorage.setItem("user", JSON.stringify(u));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchApi<UserPreference | null>("/dashboard/preferences")
      .then((data) => {
        if (!cancelled) {
          setPreferences(
            data || {
              interests: [],
              weakSkills: [],
              preferredDifficulty: "MEDIUM",
              notificationsEnabled: true,
              weeklyDigestEnabled: true,
              displayMode: "SYSTEM",
              onboardingCompleted: false,
              onboardingSelections: {},
            },
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreferences({
            interests: [],
            weakSkills: [],
            preferredDifficulty: "MEDIUM",
            notificationsEnabled: true,
            weeklyDigestEnabled: true,
            displayMode: "SYSTEM",
            onboardingCompleted: false,
            onboardingSelections: {},
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title="Settings" description="Manage your account preferences" />

      <div className="flex flex-col sm:flex-row gap-6">
        <nav className="sm:w-56 flex-shrink-0">
          <div className="angular-card bg-[#0f172a] p-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? "bg-[#7AD62A]/10 text-[#7AD62A]"
                      : "text-slate-400 hover:bg-white/5"
                  }`}
                >
                  <Icon size={18} />
                  {section.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="flex-1 min-w-0">
          {activeSection === "account" && (
            <div className="space-y-6">
              <div className="angular-card bg-[#0f172a] p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <div>
                      <p className="text-sm font-medium text-white">Name</p>
                      <p className="text-sm text-slate-500">{user?.name || "Not set"}</p>
                    </div>
                    <Link href="/dashboard/profile/edit" className="text-sm text-[#7AD62A] hover:underline">
                      Edit
                    </Link>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <div>
                      <p className="text-sm font-medium text-white">Email</p>
                      <p className="text-sm text-slate-500">{user?.email}</p>
                    </div>
                    <span className="text-xs text-slate-400">Verified</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-white">Role</p>
                      <p className="text-sm text-slate-500">{user?.role}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="angular-card bg-[#0f172a] p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Danger Zone</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Delete account</p>
                    <p className="text-sm text-slate-500">Permanently delete your account and all data</p>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-500/10 transition-colors"
                  >
                    Delete account
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="space-y-6">
              <div className="angular-card bg-[#0f172a] p-6">
                <h2 className="text-lg font-semibold text-white mb-2">Notification Preferences</h2>
                <p className="text-sm text-slate-400 mb-6">
                  Control whether AeroAcademy sends progress and summary updates beyond the in-app notification center.
                </p>
                <div className="space-y-4">
                  <PreferenceRow
                    label="Progress alerts"
                    description="Receive email and product alerts for labs, achievements, and important account activity."
                    enabled={preferences?.notificationsEnabled ?? true}
                    busy={savingPreference === "notificationsEnabled" || !preferences}
                    onToggle={(value) => updatePreference("notificationsEnabled", value)}
                  />
                  <PreferenceRow
                    label="Weekly digest"
                    description="Get a weekly summary of your progress, ranking movement, and newly released learning opportunities."
                    enabled={preferences?.weeklyDigestEnabled ?? true}
                    busy={savingPreference === "weeklyDigestEnabled" || !preferences}
                    onToggle={(value) => updatePreference("weeklyDigestEnabled", value)}
                  />
                </div>
              </div>

              <div className="angular-card bg-[#0f172a] p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Always Available In-App</h2>
                <div className="space-y-4">
                  {[
                    { label: "Platform notifications", description: "Unread alerts, exam updates, and platform events remain available in your notification center." },
                    { label: "Security events", description: "Critical account and verification notices remain visible even if email digests are disabled." },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-4 py-3 border-b border-white/10 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="text-sm text-slate-500">{item.description}</p>
                      </div>
                      <span className="text-xs text-[#7AD62A] bg-[#7AD62A]/10 px-3 py-1 rounded-full">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === "security" && (
            <div className="space-y-6">
              <div className="angular-card bg-[#0f172a] p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Password</h2>
                <Link
                  href="/dashboard/profile/change-password"
                  className="angular-btn inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#7AD62A] border border-[#7AD62A] hover:bg-[#7AD62A]/10 transition-colors"
                >
                  <Key size={16} />
                  Change password
                </Link>
              </div>

              <div className="angular-card bg-[#0f172a] p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Sessions</h2>
                <p className="text-sm text-slate-500 mb-4">You are currently signed in on this device.</p>
                <button
                  onClick={() => { logout(); }}
                  className="px-4 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-500/10 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}

          {activeSection === "appearance" && (
            <div className="angular-card bg-[#0f172a] p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Theme</h2>
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div>
                  <p className="text-sm font-medium text-white">Dark mode</p>
                  <p className="text-sm text-slate-500">Toggle between light and dark themes</p>
                </div>
                <ThemeToggle />
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="bg-[#0f172a] rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 id="delete-modal-title" className="font-semibold text-white">Delete account</h3>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              All your data including progress, certificates, and lab history will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                ref={cancelRef}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-300 border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await fetchApi("/users/me", { method: "DELETE" });
                    logout();
                  } catch (err) {
                    console.error("Failed to delete account:", err);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
