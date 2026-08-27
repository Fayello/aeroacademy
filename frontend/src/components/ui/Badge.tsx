interface BadgeProps {
  children: React.ReactNode;
  variant?: "emerald" | "blue" | "amber" | "red" | "slate";
  className?: string;
}

const variants = {
  emerald: "bg-[#7AD62A]/10 text-[#0F203A] border-[#7AD62A]/20",
  blue: "bg-blue-500/10 text-blue-700 border-blue-200",
  amber: "bg-amber-500/10 text-amber-700 border-amber-200",
  red: "bg-red-500/10 text-red-700 border-red-200",
  slate: "bg-slate-100 text-slate-600 border-white/10",
};

export default function Badge({ children, variant = "slate", className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
