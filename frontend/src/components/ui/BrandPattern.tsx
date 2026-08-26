"use client";

interface BrandPatternProps {
  className?: string;
  color?: string;
  opacity?: number;
  size?: number;
}

export default function BrandPattern({
  className = "",
  color = "#229C62",
  opacity = 0.04,
  size = 48,
}: BrandPatternProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: `
          linear-gradient(45deg, ${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")} 25%, transparent 25%),
          linear-gradient(-45deg, ${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")} 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, ${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")} 75%),
          linear-gradient(-45deg, transparent 75%, ${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")} 75%)
        `,
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: `0 0, 0 ${size / 2}px, ${size / 2}px -${size / 2}px, -${size / 2}px 0px`,
      }}
    />
  );
}
