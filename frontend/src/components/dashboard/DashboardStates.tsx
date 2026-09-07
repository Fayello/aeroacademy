import { AlertTriangle, Loader2, RefreshCcw, type LucideIcon } from "lucide-react";

type Tone = "neutral" | "success" | "warning" | "danger" | "accent";

const toneClasses: Record<Tone, string> = {
  neutral: "border-white/10 bg-white/[0.03] text-slate-300",
  success: "border-[#7AD62A]/25 bg-[#7AD62A]/10 text-[#7AD62A]",
  warning: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  danger: "border-red-400/25 bg-red-500/10 text-red-300",
  accent: "border-blue-400/25 bg-blue-400/10 text-blue-300",
};

export function DashboardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-[#0f172a] p-5">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-white/10 animate-pulse" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-3 w-40 max-w-full rounded bg-white/10 animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-white/8 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardLoadingState({
  title = "Loading workspace",
  rows = 3,
}: {
  title?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 size={16} className="animate-spin text-[#7AD62A]" />
        <span>{title}</span>
      </div>
      <DashboardSkeleton rows={rows} />
    </div>
  );
}

export function DashboardErrorState({
  title = "Unable to load this workspace",
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10">
        <AlertTriangle size={24} className="text-red-300" />
      </div>
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-300">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[#7AD62A]/30 bg-[#7AD62A]/10 px-4 py-2 text-sm font-semibold text-[#7AD62A] transition-colors hover:bg-[#7AD62A]/15"
        >
          <RefreshCcw size={14} />
          Try again
        </button>
      )}
    </div>
  );
}

export function DashboardEmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "neutral",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f172a] p-8 text-center">
      <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl border ${toneClasses[tone]}`}>
        <Icon size={28} />
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-300">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

export function LeaderboardRow({
  rank,
  name,
  meta,
  value,
}: {
  rank: number;
  name: string;
  meta: string;
  value: string;
}) {
  const podium =
    rank === 1
      ? "border-amber-400/40 bg-amber-400/10"
    : rank === 2
        ? "border-slate-300/30 bg-white/[0.08]"
        : rank === 3
          ? "border-orange-400/35 bg-orange-500/10"
          : "border-white/10 bg-white/[0.03]";

  return (
    <div className={`flex items-center gap-3 rounded-xl border p-3 ${podium}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-100">
        {rank <= 3 ? rank : `#${rank}`}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{name}</p>
        <p className="text-xs text-slate-400">{meta}</p>
      </div>
      <p className="shrink-0 text-sm font-bold text-white">{value}</p>
    </div>
  );
}
