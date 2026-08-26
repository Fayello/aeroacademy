"use client";

interface AnimatedGridProps {
  className?: string;
  color?: string;
  speed?: number;
}

export default function AnimatedGrid({
  className = "",
  color = "#229C62",
  speed = 8,
}: AnimatedGridProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {/* Animated diagonal lines */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="angular-grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0" y1="0" x2="0" y2="60"
              stroke={color}
              strokeWidth="0.5"
              strokeOpacity="0.06"
            />
            <line
              x1="0" y1="0" x2="60" y2="0"
              stroke={color}
              strokeWidth="0.5"
              strokeOpacity="0.06"
            />
          </pattern>
          <linearGradient id="grid-fade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="30%" stopColor="white" stopOpacity="1" />
            <stop offset="70%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="grid-mask">
            <rect width="100%" height="100%" fill="url(#grid-fade)" />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#angular-grid)"
          mask="url(#grid-mask)"
          opacity="1"
        >
          <animate
            attributeName="y"
            from="0"
            to="60"
            dur={`${speed}s`}
            repeatCount="indefinite"
          />
        </rect>
      </svg>

      {/* Pulsing glow overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${color}08 0%, transparent 70%)`,
          animation: `pulse 4s ease-in-out infinite`,
        }}
      />

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
