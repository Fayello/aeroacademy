"use client";

interface AngularDividerProps {
  color?: string;
  height?: number;
  angle?: number;
  className?: string;
}

export default function AngularDivider({
  color = "#229C62",
  height = 3,
  angle = -2,
  className = "",
}: AngularDividerProps) {
  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ height: `${height * 3}px` }}>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${color}40 20%, ${color} 50%, ${color}40 80%, transparent 100%)`,
          transform: `skewY(${angle}deg)`,
          transformOrigin: "center",
        }}
      />
    </div>
  );
}
