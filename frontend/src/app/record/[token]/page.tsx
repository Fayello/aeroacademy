"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  Shield,
  Award,
  ExternalLink,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

interface DomainCompetency {
  domainName: string;
  mastery: number;
  labsCompleted: number;
}

interface CertRecord {
  name: string;
  code: string;
  credentialId: string;
  awardedAt: string;
  expiresAt: string | null;
}

interface ProfessionalRecord {
  holder?: string;
  generatedAt?: string;
  summary?: {
    totalXP: number;
    domainsMastered: number;
    totalDomains: number;
    labsCompleted: number;
    assessmentsPassed: number;
    certificationsEarned: number;
  };
  domainCompetency?: DomainCompetency[];
  certifications?: CertRecord[];
  error?: string;
}

export default function SharedRecordPage() {
  const { token } = useParams();
  const [record, setRecord] = useState<ProfessionalRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/certifications/record/${token}`
        );
        const data = await res.json();
        if (!cancelled) setRecord(data);
      } catch {
        if (!cancelled) setRecord({ error: "Failed to load record" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08111f] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#7AD62A]" />
      </div>
    );
  }

  if (!record || record.error) {
    return (
      <div className="min-h-screen bg-[#08111f] flex items-center justify-center p-4">
        <div className="text-center">
          <Shield size={48} className="text-slate-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Record Not Found</h1>
          <p className="text-sm text-slate-500">{record?.error || "This record could not be found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08111f] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#7AD62A]">Professional Record</p>
          <h1 className="text-2xl font-bold text-white mt-2">Competency Portfolio</h1>
          <p className="text-sm text-slate-400 mt-1">
            Shared by {record.holder || "Unknown"} via XpertClass Academy
          </p>
        </div>

        {record.summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {[
              { label: "Total XP", value: record.summary.totalXP.toLocaleString() },
              { label: "Domains Mastered", value: `${record.summary.domainsMastered}/${record.summary.totalDomains}` },
              { label: "Labs Completed", value: record.summary.labsCompleted },
              { label: "Assessments Passed", value: record.summary.assessmentsPassed },
              { label: "Certifications", value: record.summary.certificationsEarned },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#0f172a] border border-white/10 rounded-xl p-4 text-center">
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-[10px] text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {record.domainCompetency && record.domainCompetency.length > 0 && (
          <div className="bg-[#0f172a] border border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-[#7AD62A]" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Domain Competency</h2>
            </div>
            <div className="space-y-3">
              {record.domainCompetency.map((d, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-300">{d.domainName}</span>
                    <span className="font-medium text-white">{d.mastery}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#7AD62A] rounded-full"
                      style={{ width: `${d.mastery}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {d.labsCompleted} labs completed
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {record.certifications && record.certifications.length > 0 && (
          <div className="bg-[#0f172a] border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award size={16} className="text-[#7AD62A]" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Certifications</h2>
            </div>
            <div className="space-y-3">
              {record.certifications.map((cert, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/[0.03]">
                  <div>
                    <div className="text-xs font-bold uppercase text-slate-500">{cert.code}</div>
                    <div className="text-sm font-medium text-white">{cert.name}</div>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">{cert.credentialId}</div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <div>Issued: {new Date(cert.awardedAt).toLocaleDateString()}</div>
                    {cert.expiresAt && <div>Expires: {new Date(cert.expiresAt).toLocaleDateString()}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-[#7AD62A] hover:underline"
          >
            <ExternalLink size={10} />
            xpertclass.academy
          </Link>
        </div>
      </div>
    </div>
  );
}
