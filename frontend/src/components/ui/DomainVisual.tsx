"use client";

import {
  Server,
  Network,
  GitBranch,
  Database,
  Shield,
  CheckCircle,
  Cloud,
  Terminal,
  Cpu,
  HardDrive,
  Workflow,
  TestTube,
} from "lucide-react";

export interface DomainConfig {
  name: string;
  displayName: string;
  icon: typeof Server;
  motif: string;
  color: string;
  bgColor: string;
  borderColor: string;
  gradient: string;
  symbol: string;
}

export const DOMAIN_CONFIGS: Record<string, DomainConfig> = {
  SYSTEMS: {
    name: "SYSTEMS",
    displayName: "Systems",
    icon: Server,
    motif: "▣",
    color: "text-slate-700",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    gradient: "from-slate-600 to-gray-700",
    symbol: "▣",
  },
  NETWORKING: {
    name: "NETWORKING",
    displayName: "Networking",
    icon: Network,
    motif: "◎",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    gradient: "from-blue-500 to-indigo-600",
    symbol: "◎",
  },
  DEVOPS: {
    name: "DEVOPS",
    displayName: "DevOps",
    icon: GitBranch,
    motif: "→◇→",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    gradient: "from-orange-500 to-amber-600",
    symbol: "→",
  },
  DATABASES: {
    name: "DATABASES",
    displayName: "Databases",
    icon: Database,
    motif: "▤",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    gradient: "from-emerald-500 to-green-600",
    symbol: "▤",
  },
  SECURITY: {
    name: "SECURITY",
    displayName: "Security",
    icon: Shield,
    motif: "◇",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    gradient: "from-red-500 to-rose-600",
    symbol: "◇",
  },
  QA: {
    name: "QA",
    displayName: "QA",
    icon: CheckCircle,
    motif: "✓",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    gradient: "from-purple-500 to-violet-600",
    symbol: "✓",
  },
};

export function getDomainConfig(domainName: string): DomainConfig {
  return DOMAIN_CONFIGS[domainName.toUpperCase()] || {
    name: domainName,
    displayName: domainName,
    icon: Cpu,
    motif: "◆",
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    gradient: "from-slate-500 to-gray-600",
    symbol: "◆",
  };
}

export function DomainMotif({ domain, size = "md" }: { domain: string; size?: "sm" | "md" | "lg" }) {
  const config = getDomainConfig(domain);
  const sizeClasses = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
  };

  return (
    <div className={`${sizeClasses[size]} rounded-md bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white font-mono font-bold`}>
      {config.symbol}
    </div>
  );
}

export function DomainBar({ domain, score, maxScore = 100 }: { domain: string; score: number; maxScore?: number }) {
  const config = getDomainConfig(domain);
  const percentage = Math.min(100, (score / maxScore) * 100);

  return (
    <div className="flex items-center gap-3">
      <div className="w-16 text-right">
        <span className={`text-xs font-semibold ${config.color} font-mono`}>
          {config.symbol} {config.displayName}
        </span>
      </div>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${config.gradient} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="w-10 text-right">
        <span className="text-xs font-bold text-slate-700">{score}</span>
      </div>
    </div>
  );
}
