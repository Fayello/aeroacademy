"use client";

import { type ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  color?: string;
  className?: string;
}

export default function SectionLabel({
  children,
  color = "#229C62",
  className = "",
}: SectionLabelProps) {
  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <span
        className="label-tracking"
        style={{ color }}
      >
        {children}
      </span>
      <div
        className="mt-2 h-[2px] w-12"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          transform: "skewX(-12deg)",
        }}
      />
    </div>
  );
}
