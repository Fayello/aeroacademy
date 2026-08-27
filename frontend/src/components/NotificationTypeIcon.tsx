import { Trophy, Flame, CalendarCheck, CalendarX, Video, Info } from "lucide-react";

export function NotificationTypeIcon({ type, size = 16 }: { type: string; size?: number }) {
  switch (type) {
    case "ACHIEVEMENT":
      return <Trophy size={size} className="text-amber-500" />;
    case "SUCCESS":
      return <Flame size={size} className="text-[#7AD62A]" />;
    case "BOOKING":
      return <CalendarCheck size={size} className="text-blue-400" />;
    case "WARNING":
      return <CalendarX size={size} className="text-red-400" />;
    case "MASTERCLASS":
      return <Video size={size} className="text-violet-400" />;
    default:
      return <Info size={size} className="text-slate-500" />;
  }
}
