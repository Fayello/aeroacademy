interface BadgeProps {
  children: React.ReactNode;
  variant?: "emerald" | "blue" | "amber" | "red" | "slate";
  className?: string;
}

const variants = {
  emerald: "bg-[#7AD62A]/10 text-[#7AD62A] border-[#7AD62A]/25",
  blue: "bg-blue-500/10 text-blue-300 border-blue-400/25",
  amber: "bg-amber-500/10 text-amber-300 border-amber-400/25",
  red: "bg-red-500/10 text-red-300 border-red-400/25",
  slate: "bg-white/5 text-slate-400 border-white/10",
};

export default function Badge({ children, variant = "slate", className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
