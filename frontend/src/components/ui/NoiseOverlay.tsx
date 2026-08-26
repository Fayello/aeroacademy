"use client";

interface NoiseOverlayProps {
  className?: string;
  opacity?: number;
}

export default function NoiseOverlay({
  className = "",
  opacity = 0.03,
}: NoiseOverlayProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="noise-filter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect
          width="100%"
          height="100%"
          filter="url(#noise-filter)"
          opacity={opacity}
        />
      </svg>
    </div>
  );
}
