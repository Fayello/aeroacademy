"use client";

import { useState, useEffect } from "react";
import {
  Award,
  Download,
  Shield,
  CheckCircle,
  Lock,
  Trophy,
  Loader2,
  BookOpen,
  ExternalLink,
  Share2,
  Server,
  Network,
  Cloud,
  Database,
  ShieldCheck,
  Bug,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";
import PageHeader from "@/components/ui/PageHeader";

interface DomainCertification {
  domain: string;
  domainDisplayName: string;
  labCount: number;
  totalLabs: number;
  completedAt: string;
}

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

const domainIcons: Record<string, typeof Server> = {
  SYSTEMS: Server,
  NETWORKING: Network,
  DEVOPS: Cloud,
  DATABASES: Database,
  SECURITY: ShieldCheck,
  QA: Bug,
};

const domainColors: Record<string, string> = {
  SYSTEMS: "from-blue-500 to-blue-600",
  NETWORKING: "from-cyan-500 to-cyan-600",
  DEVOPS: "from-orange-500 to-orange-600",
  DATABASES: "from-purple-500 to-purple-600",
  SECURITY: "from-[#229C62] to-[#1a7a4d]",
  QA: "from-rose-500 to-rose-600",
};

function openPrintableCert(cert: DomainCertification, userName: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const dateStr = new Date(cert.completedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const certId = `XC-${cert.domain}-${Date.now().toString(36).toUpperCase()}`;

  printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Certificate - ${cert.domainDisplayName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
  .cert { width: 900px; height: 636px; background: white; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); position: relative; overflow: hidden; }
  .cert-border { position: absolute; inset: 8px; border: 2px solid #0F203A; border-radius: 8px; }
  .cert-inner-border { position: absolute; inset: 14px; border: 1px solid #229C62; border-radius: 6px; }
  .cert-header { text-align: center; padding-top: 60px; }
  .cert-logo { font-size: 32px; font-weight: 700; color: #0F203A; letter-spacing: -0.5px; }
  .cert-logo span { color: #229C62; }
  .cert-subtitle { font-size: 11px; letter-spacing: 3px; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
  .cert-title { font-size: 28px; font-weight: 700; color: #0F203A; margin-top: 36px; text-transform: uppercase; letter-spacing: 2px; }
  .cert-divider { width: 200px; height: 2px; background: linear-gradient(90deg, transparent, #229C62, transparent); margin: 20px auto; }
  .cert-body { text-align: center; padding: 0 80px; }
  .cert-label { font-size: 13px; color: #94a3b8; margin-bottom: 8px; }
  .cert-name { font-size: 26px; font-weight: 600; color: #0F203A; margin-bottom: 16px; }
  .cert-domain { font-size: 20px; font-weight: 600; color: #229C62; }
  .cert-meta { font-size: 12px; color: #94a3b8; margin-top: 8px; }
  .cert-footer { position: absolute; bottom: 40px; left: 0; right: 0; text-align: center; }
  .cert-footer-line { width: 200px; height: 1px; background: linear-gradient(90deg, transparent, #e2e8f0, transparent); margin: 0 auto 12px; }
  .cert-id { font-size: 10px; color: #cbd5e1; letter-spacing: 1px; }
  .cert-brand { font-size: 10px; color: #cbd5e1; margin-top: 4px; }
  .btn-print { position: fixed; bottom: 30px; right: 30px; background: #0F203A; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif; }
  .btn-print:hover { background: #1a3050; }
  @media print { .btn-print { display: none; } body { background: white; } .cert { box-shadow: none; } }
</style>
</head>
<body>
  <div class="cert">
    <div class="cert-border"></div>
    <div class="cert-inner-border"></div>
    <div class="cert-header">
      <div class="cert-logo">Xpert<span>Class</span></div>
      <div class="cert-subtitle">Academy</div>
    </div>
    <div class="cert-body">
      <div class="cert-title">Certificate of Completion</div>
      <div class="cert-divider"></div>
      <div class="cert-label">This certifies that</div>
      <div class="cert-name">${userName}</div>
      <div class="cert-label">has successfully completed all labs in</div>
      <div class="cert-domain">${cert.domainDisplayName}</div>
      <div class="cert-meta">${cert.labCount} lab${cert.labCount !== 1 ? "s" : ""} completed &middot; ${dateStr}</div>
    </div>
    <div class="cert-footer">
      <div class="cert-footer-line"></div>
      <div class="cert-id">Credential ID: ${certId}</div>
      <div class="cert-brand">XpertClass Academy &mdash; Cybersecurity Training Platform</div>
    </div>
  </div>
  <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
</body>
</html>`);
  printWindow.document.close();
}

export default function CertificationsPage() {
  const [domainCerts, setDomainCerts] = useState<DomainCertification[]>([]);
  const [courseCerts, setCourseCerts] = useState<CourseCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [userXP, setUserXP] = useState(0);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setUserXP(user.xp || 0);
        setUserName(user.name || user.email || "Student");

        const [domains, courses] = await Promise.all([
          fetchApi<DomainCertification[]>("/certifications").catch(() => []),
          fetchApi<Array<{ id: string; title: string }>>("/courses").catch(() => []),
        ]);

        setDomainCerts(domains);

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

  const completedCourseCerts = courseCerts.filter((c) => c.eligible);
  const inProgressCourses = courseCerts.filter((c) => !c.eligible && c.total > 0 && c.completed > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader title="Certifications" description="Earn credentials as you complete training milestones." />

      {/* Domain Certifications */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-[#0F203A]" />
          <h2 className="text-sm font-semibold text-slate-900">Domain Certifications</h2>
        </div>
        {domainCerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {domainCerts.map((cert) => {
              const Icon = domainIcons[cert.domain] || Award;
              const gradient = domainColors[cert.domain] || "from-slate-500 to-slate-600";
              const dateStr = new Date(cert.completedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              return (
                <div
                  key={cert.domain}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <CheckCircle size={18} className="text-[#229C62]" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{cert.domainDisplayName}</h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {cert.labCount}/{cert.totalLabs} labs completed
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Completed {dateStr}</p>
                  <button
                    onClick={() => openPrintableCert(cert, userName)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0F203A] text-white text-xs font-medium hover:bg-[#1a3050] transition-colors"
                  >
                    <Download size={14} /> Download Certificate
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Award size={36} className="text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No Domain Certifications Yet</h3>
            <p className="text-xs text-slate-500 mb-4">
              Complete all labs in a domain to earn a certification.
            </p>
            <Link
              href="/dashboard/labs"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#229C62] text-white text-xs font-medium hover:bg-[#1a7a4d] transition-colors"
            >
              <BookOpen size={14} /> Browse Labs
            </Link>
          </div>
        )}
      </div>

      {/* Course Certificates */}
      {completedCourseCerts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Course Certificates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedCourseCerts.map((cert) => (
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

      {/* In Progress Courses */}
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

      {/* Rank Certifications */}
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
    </div>
  );
}
