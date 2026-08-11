"use client";

import Link from "next/link";
import { Terminal, ExternalLink } from "lucide-react";

interface SandboxCardProps {
  logs: Array<{ msg: string; time: string; type: string }>;
}

export default function SandboxCard({ logs }: SandboxCardProps) {
  return (
    <div className="card p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
            <Terminal size={16} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Lab Activity</h3>
            <p className="text-xs text-slate-500">Recent sandbox logs</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 font-mono text-xs h-[140px] overflow-y-auto border border-slate-100">
          {logs.length > 0 ? (
            <div className="space-y-1.5">
              {logs.slice(0, 5).map((log, i) => (
                <div key={i} className="flex gap-2 text-slate-600">
                  <span className="text-slate-400 shrink-0">
                    [{new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                  </span>
                  <span className="truncate">{log.msg}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              No recent activity
            </div>
          )}
        </div>
      </div>

      <Link href="/dashboard/labs" className="btn-secondary w-full mt-6 text-sm">
        Open Labs
        <ExternalLink size={14} />
      </Link>
    </div>
  );
}
