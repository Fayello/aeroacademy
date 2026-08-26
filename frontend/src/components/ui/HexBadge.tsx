"use client";

import { type LucideIcon } from "lucide-react";

interface HexBadgeProps {
  icon?: LucideIcon;
  label: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: { badge: "w-16 h-18", text: "text-[9px]", icon: 12 },
  md: { badge: "w-20 h-22", text: "text-[10px]", icon: 14 },
  lg: { badge: "w-24 h-26", text: "text-xs", icon: 16 },
};

export default function HexBadge({
  icon: Icon,
  label,
  color = "#229C62",
  size = "md",
  className = "",
}: HexBadgeProps) {
  const s = SIZE_MAP[size];

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <div
        className={`${s.badge} flex items-center justify-center hex-badge`}
        style={{ backgroundColor: `${color}20` }}
      >
        {Icon && <Icon size={s.icon} style={{ color }} />}
      </div>
      <span
        className={`mt-1 ${s.text} font-semibold text-center leading-tight`}
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}
