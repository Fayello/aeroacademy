"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { useState } from "react";
import { Award, Download, Shield, CheckCircle, Lock, Trophy, Loader2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { CertificationsSkeleton } from "@/components/Skeleton";
import type { User } from "@/types/api";

interface Certification {
  id: string;
  title: string;
  requirement: string;
  icon: typeof Trophy;
  color: string;
  unlocked: boolean;
  xp: number;
}

export default function CertificationsPage() {
  const { userMetrics } = useDashboard();
  const [generating, setGenerating] = useState<string | null>(null);
  const [user] = useState<User | null>(() => {
    try {
      if (typeof window === "undefined") return null;
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  if (!userMetrics) {
    return <CertificationsSkeleton />;
  }

  const generatePDF = async (cert: Certification) => {
    setGenerating(cert.id);
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 297, 210, "F");
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(1.5);
    doc.rect(12, 12, 273, 186);

    doc.setTextColor(5, 150, 105);
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.text("AEROACADEMY", 148.5, 50, { align: "center" });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.text("CERTIFICATE OF ACHIEVEMENT", 148.5, 65, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text("This certifies that", 148.5, 90, { align: "center" });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(24);
    doc.text(user?.name || user?.email?.split("@")[0] || "STUDENT", 148.5, 108, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(`Has achieved the rank of ${userMetrics?.division || "N/A"} with ${userMetrics?.xp || 0} XP`, 148.5, 125, { align: "center" });

    doc.setTextColor(5, 150, 105);
    doc.setFontSize(14);
    doc.text(cert.title, 148.5, 150, { align: "center" });

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("AEROACADEMY — Product Security Training Platform", 148.5, 185, { align: "center" });

    doc.save(`AeroAcademy_${cert.id}.pdf`);
    setGenerating(null);
  };

  const certifications: Certification[] = [
    { id: "MASTER", title: "Master Cyber Operative", requirement: "5,000 XP", icon: Trophy, color: "text-amber-500 bg-amber-100", unlocked: (userMetrics?.xp || 0) >= 5000, xp: 5000 },
    { id: "EXPERT", title: "Expert Security Researcher", requirement: "2,500 XP", icon: Shield, color: "text-purple-500 bg-purple-100", unlocked: (userMetrics?.xp || 0) >= 2500, xp: 2500 },
    { id: "PROFESSIONAL", title: "Professional Pen-Tester", requirement: "1,000 XP", icon: Award, color: "text-blue-500 bg-blue-100", unlocked: (userMetrics?.xp || 0) >= 1000, xp: 1000 },
    { id: "APPRENTICE", title: "Certified Apprentice", requirement: "500 XP", icon: CheckCircle, color: "text-emerald-500 bg-emerald-100", unlocked: (userMetrics?.xp || 0) >= 500, xp: 500 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title="Certifications" description="Earn credentials as you complete training milestones." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certifications.map((cert) => {
          const Icon = cert.unlocked ? cert.icon : Lock;
          return (
            <div key={cert.id} className={`card p-6 flex items-start justify-between ${!cert.unlocked ? "opacity-60" : ""}`}>
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cert.unlocked ? cert.color : "bg-slate-100 text-slate-400"}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{cert.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">Requires {cert.requirement}</p>
                </div>
                <div className="flex items-center gap-3">
                  {cert.unlocked ? (
                    <button
                      onClick={() => generatePDF(cert)}
                      disabled={generating === cert.id}
                      className="btn-primary text-xs"
                    >
                      {generating === cert.id ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                      Download
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                      <Lock size={12} />
                      Locked
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-slate-300">{cert.xp}</p>
                <p className="text-[10px] text-slate-400 font-medium">XP</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
