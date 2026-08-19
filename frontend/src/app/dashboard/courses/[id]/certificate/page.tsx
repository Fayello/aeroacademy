"use client";

import { useEffect, useState, use } from "react";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";
import Link from "next/link";
import {
  Award,
  Loader2,
  ArrowLeft,
  Download,
  Lock,
  CheckCircle2,
} from "lucide-react";

interface CertificateData {
  id: string;
  courseName: string;
  userName: string;
  issuedAt: string;
  credentialUrl: string;
}

interface CertificateResponse {
  eligible: boolean;
  reason?: string;
  completed?: number;
  total?: number;
  certificate?: CertificateData;
}

export default function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<CertificateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchApi<CertificateResponse>(`/courses/${id}/certificate`);
        setData(res);
      } catch {
        toast.error("Failed to load certificate");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const generatePDF = async () => {
    if (!data?.certificate) return;
    setGenerating(true);
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
      doc.text(data.certificate.userName, 148.5, 110, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("has successfully completed the course", 148.5, 125, { align: "center" });

      doc.setTextColor(5, 150, 105);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(data.certificate.courseName, 148.5, 140, { align: "center" });

      const issueDate = new Date(data.certificate.issuedAt).toLocaleDateString("en-US", {
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
      doc.text("Credential ID: " + data.certificate.id, 148.5, 175, { align: "center" });
      doc.text("Verify: " + data.certificate.credentialUrl, 148.5, 182, { align: "center" });
      doc.text("XpertClass - Cybersecurity Training Platform", 148.5, 192, { align: "center" });

      doc.save("XpertClass_Certificate_" + data.certificate.courseName.replace(/\s+/g, "_") + ".pdf");
      toast.success("Certificate downloaded!");
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!data || !data.eligible) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Link
          href={"/dashboard/courses/" + id}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={14} /> Back to Course
        </Link>

        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <Lock size={40} className="text-slate-300 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-slate-900 mb-2">Certificate Not Available</h1>
          <p className="text-sm text-slate-500 mb-1">
            {data?.reason === "Not enrolled"
              ? "You need to enroll in this course first."
              : data?.reason === "Course not complete"
              ? "You have completed " + (data.completed || 0) + " of " + (data.total || 0) + " lessons."
              : "Certificate is not available yet."}
          </p>
          {data?.completed !== undefined && data?.total !== undefined && data.total > 0 && (
            <div className="mt-4 max-w-xs mx-auto">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: Math.round((data.completed / data.total) * 100) + "%" }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {Math.round((data.completed / data.total) * 100)}% complete
              </p>
            </div>
          )}
          <Link
            href={"/dashboard/courses/" + id}
            className="inline-flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium mt-4 transition-colors"
          >
            Go to Course
          </Link>
        </div>
      </div>
    );
  }

  const cert = data.certificate!;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link
        href={"/dashboard/courses/" + id}
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={14} /> Back to Course
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-8 text-white text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 mx-auto mb-3 flex items-center justify-center">
            <Award size={32} />
          </div>
          <h1 className="text-xl font-bold">Certificate of Completion</h1>
          <p className="text-sm mt-1 opacity-90">{cert.courseName}</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-center">
            <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-2" />
            <h2 className="text-lg font-bold text-slate-900">Congratulations!</h2>
            <p className="text-sm text-slate-600 mt-1">
              You have successfully completed <span className="font-medium">{cert.courseName}</span>.
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Student</span>
              <span className="font-medium text-slate-900">{cert.userName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Course</span>
              <span className="font-medium text-slate-900">{cert.courseName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Issued</span>
              <span className="font-medium text-slate-900">
                {new Date(cert.issuedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Credential ID</span>
              <span className="font-mono text-[11px] text-slate-600">{cert.id}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={generatePDF}
              disabled={generating}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {generating ? "Generating..." : "Download PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
