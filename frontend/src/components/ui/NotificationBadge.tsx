"use client";

import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationBadge({ className = "" }: { className?: string }) {
  const { unread } = useNotifications();
  if (unread <= 0) return null;
  return (
    <span className={`min-w-[16px] h-[16px] px-1 rounded-full bg-[#229C62] text-white text-[9px] font-bold flex items-center justify-center ${className}`}>
      {unread > 99 ? "99+" : unread}
    </span>
  );
}
