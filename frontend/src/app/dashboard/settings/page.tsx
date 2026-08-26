"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { logout } from "@/lib/auth";
import {
  User,
  Bell,
  Shield,
  Palette,
  Key,
  AlertTriangle,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const sections: SettingsSection[] = [
  { id: "account", label: "Account", icon: User, description: "Manage your profile and personal information" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Configure how you receive notifications" },
  { id: "security", label: "Security", icon: Shield, description: "Password, 2FA, and session management" },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Customize the look and feel" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("account");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [user, setUser] = useState<any>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

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
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    fetchApi<any>("/auth/me").then((u) => {
      setUser(u);
      localStorage.setItem("user", JSON.stringify(u));
    }).catch(() => {});
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
              <p className="text-slate-500 mt-1">Manage your account preferences</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <nav className="sm:w-56 flex-shrink-0">
                <div className="bg-white rounded-2xl border border-slate-200 p-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          activeSection === section.id
                            ? "bg-[#E9F8EE] text-[#229C62]"
                            : "text-slate-600 hover:bg-slate-50"
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
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                      <h2 className="text-lg font-semibold text-slate-900 mb-4">Profile</h2>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-slate-100">
                          <div>
                            <p className="text-sm font-medium text-slate-900">Name</p>
                            <p className="text-sm text-slate-500">{user?.name || "Not set"}</p>
                          </div>
                          <Link href="/dashboard/profile/edit" className="text-sm text-[#229C62] hover:underline">
                            Edit
                          </Link>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-slate-100">
                          <div>
                            <p className="text-sm font-medium text-slate-900">Email</p>
                            <p className="text-sm text-slate-500">{user?.email}</p>
                          </div>
                          <span className="text-xs text-slate-400">Verified</span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900">Role</p>
                            <p className="text-sm text-slate-500">{user?.role}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                      <h2 className="text-lg font-semibold text-slate-900 mb-4">Danger Zone</h2>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">Delete account</p>
                          <p className="text-sm text-slate-500">Permanently delete your account and all data</p>
                        </div>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                        >
                          Delete account
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "notifications" && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Email Notifications</h2>
                    <div className="space-y-4">
                      {[
                        { label: "Lab completions", description: "Get notified when you complete a lab" },
                        { label: "Achievement unlocks", description: "Get notified when you earn badges" },
                        { label: "Leaderboard changes", description: "Weekly leaderboard rank updates" },
                        { label: "New courses", description: "When new courses are added" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{item.label}</p>
                            <p className="text-sm text-slate-500">{item.description}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#229C62]" />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === "security" && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                      <h2 className="text-lg font-semibold text-slate-900 mb-4">Password</h2>
                      <Link
                        href="/dashboard/profile/change-password"
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#229C62] border border-[#229C62] rounded-xl hover:bg-[#E9F8EE] transition-colors"
                      >
                        <Key size={16} />
                        Change password
                      </Link>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                      <h2 className="text-lg font-semibold text-slate-900 mb-4">Sessions</h2>
                      <p className="text-sm text-slate-500 mb-4">You are currently signed in on this device.</p>
                      <button
                        onClick={() => { logout(); }}
                        className="px-4 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}

                {activeSection === "appearance" && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Theme</h2>
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Dark mode</p>
                        <p className="text-sm text-slate-500">Toggle between light and dark themes</p>
                      </div>
                      <ThemeToggle />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 id="delete-modal-title" className="font-semibold text-slate-900">Delete account</h3>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              All your data including progress, certificates, and lab history will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                ref={cancelRef}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await fetchApi("/v1/users/me", { method: "DELETE" });
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
