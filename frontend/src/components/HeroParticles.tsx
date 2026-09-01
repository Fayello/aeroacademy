"use client";
import { useRef, useEffect } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

export default function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    const mouse = { x: -1000, y: -1000 };
    let frame: number;
    let time = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      w = parent.offsetWidth;
      h = parent.offsetHeight;
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    const init = () => {
      particles = [];
      const count = Math.min(Math.floor((w * h) / 15000), 60);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 0.8,
          opacity: Math.random() * 0.4 + 0.1,
          color: ["#229C62", "#7AD62A", "#3b82f6"][Math.floor(Math.random() * 3)],
        });
      }
    };

    const drawGrid = () => {
      const gridSize = 60;
      const offsetX = (time * 0.2) % gridSize;

      ctx.strokeStyle = "rgba(34, 156, 98, 0.04)";
      ctx.lineWidth = 0.5;

      // Diagonal lines at 45 degrees
      for (let x = -gridSize + offsetX; x < w + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + h, h);
        ctx.stroke();
      }
      for (let x = -gridSize + offsetX; x < w + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x + h, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Pulsing glow at center
      const pulseAlpha = 0.03 + Math.sin(time * 0.02) * 0.015;
      const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.4);
      gradient.addColorStop(0, `rgba(34, 156, 98, ${pulseAlpha})`);
      gradient.addColorStop(1, "rgba(34, 156, 98, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    };

    const drawScanlines = () => {
      const scanlineY = (time * 1.5) % h;
      const scanlineHeight = 80;

      const gradient = ctx.createLinearGradient(0, scanlineY - scanlineHeight / 2, 0, scanlineY + scanlineHeight / 2);
      gradient.addColorStop(0, "rgba(34, 156, 98, 0)");
      gradient.addColorStop(0.5, "rgba(34, 156, 98, 0.02)");
      gradient.addColorStop(1, "rgba(34, 156, 98, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanlineY - scanlineHeight / 2, w, scanlineHeight);

      // Static scanlines
      ctx.fillStyle = "rgba(255, 255, 255, 0.008)";
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      time++;

      // Layer 1: Angular grid
      drawGrid();

      // Layer 2: Scanlines
      drawScanlines();

      // Layer 3: Particle connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(34,156,98,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Mouse influence
      for (const p of particles) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (1 - dist / 150) * 0.02;
          p.vx -= dx * force;
          p.vy -= dy * force;
        }
      }

      // Layer 4: Particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.vx += (Math.random() - 0.5) * 0.01;
        p.vy += (Math.random() - 0.5) * 0.01;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      frame = requestAnimationFrame(draw);
    };

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleResize = () => { resize(); init(); };

    resize();
    init();
    frame = requestAnimationFrame(draw);

    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousemove", handleMouse);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouse);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-auto"
      style={{ zIndex: 0 }}
    />
  );
}
