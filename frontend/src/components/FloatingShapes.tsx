"use client";

interface FloatingShapesProps {
  className?: string;
}

function Hexagon({ size, x, y, delay, duration, color }: {
  size: number;
  x: string;
  y: string;
  delay: string;
  duration: string;
  color: string;
}) {
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${size / 2 + (size / 2) * Math.cos(angle)},${size / 2 + (size / 2) * Math.sin(angle)}`;
  }).join(" ");

  return (
    <svg
      className="absolute pointer-events-none"
      width={size}
      height={size}
      style={{
        left: x,
        top: y,
        opacity: 0,
        animation: `floatShape ${duration} ease-in-out ${delay} infinite`,
      }}
    >
      <polygon
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity="0.15"
      />
    </svg>
  );
}

function Triangle({ size, x, y, delay, duration, color }: {
  size: number;
  x: string;
  y: string;
  delay: string;
  duration: string;
  color: string;
}) {
  return (
    <svg
      className="absolute pointer-events-none"
      width={size}
      height={size}
      style={{
        left: x,
        top: y,
        opacity: 0,
        animation: `floatShape ${duration} ease-in-out ${delay} infinite`,
      }}
    >
      <polygon
        points={`${size / 2},0 ${size},${size} 0,${size}`}
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity="0.12"
      />
    </svg>
  );
}

function Diamond({ size, x, y, delay, duration, color }: {
  size: number;
  x: string;
  y: string;
  delay: string;
  duration: string;
  color: string;
}) {
  return (
    <svg
      className="absolute pointer-events-none"
      width={size}
      height={size}
      style={{
        left: x,
        top: y,
        opacity: 0,
        animation: `floatShape ${duration} ease-in-out ${delay} infinite`,
      }}
    >
      <polygon
        points={`${size / 2},0 ${size},${size / 2} ${size / 2},${size} 0,${size / 2}`}
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity="0.1"
      />
    </svg>
  );
}

export default function FloatingShapes({ className = "" }: FloatingShapesProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <Hexagon size={80} x="10%" y="20%" delay="0s" duration="12s" color="#229C62" />
      <Hexagon size={50} x="85%" y="15%" delay="2s" duration="15s" color="#7AD62A" />
      <Hexagon size={40} x="75%" y="70%" delay="4s" duration="18s" color="#229C62" />
      <Triangle size={60} x="20%" y="65%" delay="1s" duration="14s" color="#229C62" />
      <Triangle size={35} x="90%" y="45%" delay="3s" duration="16s" color="#7AD62A" />
      <Diamond size={45} x="5%" y="80%" delay="2.5s" duration="13s" color="#229C62" />
      <Diamond size={30} x="60%" y="10%" delay="5s" duration="17s" color="#7AD62A" />

      <style jsx>{`
        @keyframes floatShape {
          0%, 100% {
            opacity: 0;
            transform: translateY(20px) rotate(0deg);
          }
          20% {
            opacity: 0.15;
          }
          80% {
            opacity: 0.15;
          }
          50% {
            transform: translateY(-30px) rotate(180deg);
          }
        }
      `}</style>
    </div>
  );
}
