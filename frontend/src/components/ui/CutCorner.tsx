"use client";

import { type ReactNode } from "react";

interface CutCornerProps {
  children: ReactNode;
  className?: string;
  variant?: "br" | "tr" | "bl" | "tl" | "both-right" | "all";
}

const CLIP_PATHS = {
  br: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)",
  tr: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)",
  bl: "polygon(0 0, 100% 0, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
  tl: "polygon(20px 0, 100% 0, 100% 100%, 0 100%, 0 20px)",
  "both-right": "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)",
  all: "polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px), 0 20px)",
};

const HOVER_PATHS = {
  br: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
  tr: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
  bl: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
  tl: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
  "both-right": "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
  all: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
};

export default function CutCorner({
  children,
  className = "",
  variant = "br",
}: CutCornerProps) {
  return (
    <div
      className={`transition-[clip-path] duration-300 ease-in-out ${className}`}
      style={{
        clipPath: CLIP_PATHS[variant],
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.clipPath = HOVER_PATHS[variant];
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.clipPath = CLIP_PATHS[variant];
      }}
    >
      {children}
    </div>
  );
}
