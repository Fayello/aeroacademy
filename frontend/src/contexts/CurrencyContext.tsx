"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Currency = "USD" | "FCFA" | "EUR" | "GBP";

export interface CurrencyConfig {
  symbol: string;
  code: string;
  name: string;
  rate: number; // rate relative to USD
  format: (amount: number) => string;
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  USD: {
    symbol: "$",
    code: "USD",
    name: "US Dollar",
    rate: 1,
    format: (amount) => `$${amount}`,
  },
  FCFA: {
    symbol: "FCFA",
    code: "FCFA",
    name: "CFA Franc",
    rate: 620,
    format: (amount) => `${amount.toLocaleString()} FCFA`,
  },
  EUR: {
    symbol: "€",
    code: "EUR",
    name: "Euro",
    rate: 0.92,
    format: (amount) => `€${amount}`,
  },
  GBP: {
    symbol: "£",
    code: "GBP",
    name: "British Pound",
    rate: 0.79,
    format: (amount) => `£${amount}`,
  },
};

interface CurrencyContextType {
  currency: Currency;
  config: CurrencyConfig;
  setCurrency: (c: Currency) => void;
  convert: (usdAmount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("FCFA");

  useEffect(() => {
    const stored = localStorage.getItem("currency") as Currency | null;
    if (stored && CURRENCIES[stored]) setCurrencyState(stored);
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("currency", c);
  };

  const config = CURRENCIES[currency];

  const convert = (usdAmount: number) => {
    const converted = Math.round(usdAmount * config.rate);
    return config.format(converted);
  };

  return (
    <CurrencyContext.Provider value={{ currency, config, setCurrency, convert }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
