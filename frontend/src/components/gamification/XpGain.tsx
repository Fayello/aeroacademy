"use client";

import { useState, useEffect, useCallback } from "react";
import { Zap } from "lucide-react";

interface XpEvent {
  id: number;
  amount: number;
  x: number;
  y: number;
}

let nextId = 0;
const listeners: Set<(event: XpEvent) => void> = new Set();

export function showXpGain(amount: number) {
  const event: XpEvent = {
    id: nextId++,
    amount,
    x: 50 + (Math.random() - 0.5) * 30,
    y: 30 + Math.random() * 20,
  };
  listeners.forEach((fn) => fn(event));
}

export default function XpGainLayer() {
  const [events, setEvents] = useState<XpEvent[]>([]);

  const handleEvent = useCallback((event: XpEvent) => {
    setEvents((prev) => [...prev, event]);
    setTimeout(() => {
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
    }, 2000);
  }, []);

  useEffect(() => {
    listeners.add(handleEvent);
    return () => { listeners.delete(handleEvent); };
  }, [handleEvent]);

  if (events.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      {events.map((event) => (
        <div
          key={event.id}
          className="absolute animate-xp-float"
          style={{
            left: `${event.x}%`,
            top: `${event.y}%`,
          }}
        >
          <div className="flex items-center gap-1 rounded-lg bg-[#7AD62A]/90 px-3 py-1.5 shadow-lg shadow-[#7AD62A]/30 backdrop-blur-sm">
            <Zap size={14} className="text-[#0F203A]" fill="currentColor" />
            <span className="text-sm font-bold text-[#0F203A]">+{event.amount} XP</span>
          </div>
        </div>
      ))}
    </div>
  );
}
