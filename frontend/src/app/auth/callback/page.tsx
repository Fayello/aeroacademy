"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      window.history.replaceState(null, "", "/auth/callback");
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      document.cookie = `token=${accessToken}; path=/; max-age=3600; samesite=lax`;
      router.replace("/dashboard");
    } else {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#229C62] mb-6">
          <img src="/logo-icon.svg" alt="XpertClass" className="w-10 h-10" />
        </div>
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="animate-spin text-[#229C62]" size={20} />
          <span className="text-sm font-medium">Signing you in...</span>
        </div>
      </div>
    </div>
  );
}
