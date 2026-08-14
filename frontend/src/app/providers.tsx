"use client";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { I18nProvider } from "@/lib/i18n";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <I18nProvider>{children}</I18nProvider>
    </ErrorBoundary>
  );
}
