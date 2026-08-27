"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useCurrency, CURRENCIES, Currency } from "@/contexts/CurrencyContext";

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Currency: ${CURRENCIES[currency].name}`}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-[#7AD62A] hover:bg-[#7AD62A]/10 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7AD62A]/30"
      >
        {CURRENCIES[currency].symbol}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-[#0f172a] border border-white/10 rounded-xl shadow-lg z-50 py-1 min-w-[140px]">
          {(Object.keys(CURRENCIES) as Currency[]).map((code) => (
            <button
              key={code}
              onClick={() => { setCurrency(code); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                currency === code
                  ? "bg-[#7AD62A]/10 text-[#7AD62A] font-semibold"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <span className="font-mono w-8">{CURRENCIES[code].symbol}</span>
              <span>{CURRENCIES[code].name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
