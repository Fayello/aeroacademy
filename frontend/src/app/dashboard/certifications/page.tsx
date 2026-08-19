"use client";

import { useState, useEffect } from "react";
import { Award, Download, Shield, CheckCircle, Lock, Trophy, Loader2, BookOpen, ExternalLink, Share2 } from "lucide-react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";
import PageHeader from "@/components/ui/PageHeader";

interface CourseCertificate {
  courseId: string;
  courseName: string;
  eligible: boolean;
  completed: number;
  total: number;
  certificate?: {
    id: string;
    courseName: string;
    userName: string;
    issuedAt: string;
    credentialUrl: string;
  };
}

const DIVISION_CERTS = [
  { id: "APPRENTICE", title: "Certified Apprentice", requirement: "500 XP", color: "text-[#229C62] bg-[#E9F8EE]", xp: 500 },
  { id: "PROFESSIONAL", title: "Professional Pen-Tester", requirement: "1,000 XP", color: "text-blue-500 bg-blue-100", xp: 1000 },
  { id: "EXPERT", title: "Expert Security Researcher", requirement: "2,500 XP", color: "text-purple-500 bg-purple-100", xp: 2500 },
  { id: "MASTER", title: "Master Cyber Operative", requirement: "5,000 XP", color: "text-amber-500 bg-amber-100", xp: 5000 },
];

export default function CertificationsPage() {
  const [courseCerts, setCourseCerts] = useState<CourseCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [userXP, setUserXP] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setUserXP(user.xp || 0);

        const courses = await fetchApi<Array<{ id: string; title: string }>>("/courses");
        const certs: CourseCertificate[] = [];

        for (const course of courses.slice(0, 10)) {
          try {
            const cert = await fetchApi<CourseCertificate>("/courses/" + course.id + "/certificate");
            certs.push(cert);
          } catch {
            certs.push({ courseId: course.id, courseName: course.title, eligible: false, completed: 0, total: 0 });
          }
        }

        setCourseCerts(certs);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const generateCoursePDF = async (cert: CourseCertificate) => {
    if (!cert.certificate) return;
    setGenerating(cert.courseId);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 297, 210, "F");

      doc.setDrawColor(5, 150, 105);
      doc.setLineWidth(2);
      doc.rect(10, 10, 277, 190);

      doc.setDrawColor(5, 150, 105);
      doc.setLineWidth(0.5);
      doc.rect(14, 14, 269, 182);

      doc.setTextColor(5, 150, 105);
      doc.setFontSize(36);
      doc.setFont("helvetica", "bold");
      doc.text("XpertClass", 148.5, 45, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("ACADEMY", 148.5, 54, { align: "center" });

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("CERTIFICATE OF COMPLETION", 148.5, 75, { align: "center" });

      doc.setDrawColor(5, 150, 105);
      doc.setLineWidth(0.3);
      doc.line(60, 82, 237, 82);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("This is to certify that", 148.5, 95, { align: "center" });

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(cert.certificate.userName, 148.5, 110, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("has successfully completed the course", 148.5, 125, { align: "center" });

      doc.setTextColor(5, 150, 105);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(cert.certificate.courseName, 148.5, 140, { align: "center" });

      const issueDate = new Date(cert.certificate.issuedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Issued: " + issueDate, 148.5, 158, { align: "center" });

      doc.setDrawColor(5, 150, 105);
      doc.setLineWidth(0.3);
      doc.line(60, 165, 237, 165);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Credential ID: " + cert.certificate.id, 148.5, 175, { align: "center" });
      doc.text("Verify: " + cert.certificate.credentialUrl, 148.5, 182, { align: "center" });
      doc.text("XpertClass - Training Platform", 148.5, 192, { align: "center" });

      doc.save("XpertClass_" + cert.certificate.courseName.replace(/\s+/g, "_") + ".pdf");
      toast.success("Certificate downloaded!");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  const completedCerts = courseCerts.filter((c) => c.eligible);
  const inProgressCourses = courseCerts.filter((c) => !c.eligible && c.total > 0 && c.completed > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title="Certifications" description="Earn credentials as you complete training milestones." />

      {completedCerts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Course Certificates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedCerts.map((cert) => (
              <div key={cert.courseId} className="bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E9F8EE] flex items-center justify-center">
                    <Award size={20} className="text-[#229C62]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{cert.courseName}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Completed {cert.completed}/{cert.total} lessons
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => generateCoursePDF(cert)}
                      disabled={generating === cert.courseId}
                      className="btn-primary text-xs"
                    >
                      {generating === cert.courseId ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                      Download
                    </button>
                    <Link
                      href={"/dashboard/courses/" + cert.courseId + "/certificate"}
                      className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                      <ExternalLink size={12} /> View
                    </Link>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/verify/${cert.courseId}/${JSON.parse(localStorage.getItem("user") || "{}").id || ""}`;
                        navigator.clipboard.writeText(url).then(() => toast.success("Verify link copied!"));
                      }}
                      className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                      title="Copy verification link"
                    >
                      <Share2 size={12} /> Share
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <CheckCircle size={18} className="text-[#229C62]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inProgressCourses.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">In Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inProgressCourses.map((cert) => {
              const pct = Math.round((cert.completed / cert.total) * 100);
              return (
                <Link
                  key={cert.courseId}
                  href={"/dashboard/courses/" + cert.courseId}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        <BookOpen size={20} className="text-slate-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{cert.courseName}</h3>
                        <p className="text-[11px] text-slate-500">{cert.completed}/{cert.total} lessons completed</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{pct}%</span>
                  </div>
                  <div className="mt-3 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: pct + "%" }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Rank Certifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DIVISION_CERTS.map((cert) => {
            const unlocked = userXP >= cert.xp;
            return (
              <div key={cert.id} className={`bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between ${!unlocked ? "opacity-60" : ""}`}>
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${unlocked ? cert.color : "bg-slate-100 text-slate-400"}`}>
                    {unlocked ? <Trophy size={20} /> : <Lock size={20} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{cert.title}</h3>
                    <p className="text-[11px] text-slate-500">Requires {cert.requirement}</p>
                  </div>
                  {unlocked ? (
                    <span className="inline-flex items-center gap-1 text-xs text-[#229C62] bg-[#E9F8EE] px-2 py-0.5 rounded-full">
                      <CheckCircle size={12} /> Unlocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      <Lock size={12} /> Locked
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-300">{cert.xp}</p>
                  <p className="text-[10px] text-slate-400 font-medium">XP</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {completedCerts.length === 0 && inProgressCourses.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Award size={40} className="text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">No Certificates Yet</h2>
          <p className="text-sm text-slate-500 mb-4">Complete courses to earn certificates.</p>
          <Link
            href="/dashboard/courses"
            className="btn-primary text-xs inline-flex items-center gap-1.5"
          >
            <BookOpen size={14} /> Browse Courses
          </Link>
        </div>
      )}
    </div>
  );
}
