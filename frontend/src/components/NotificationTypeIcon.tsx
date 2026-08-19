import { Trophy, Flame, CalendarCheck, CalendarX, Video, Info } from "lucide-react";

export function NotificationTypeIcon({ type, size = 16 }: { type: string; size?: number }) {
  switch (type) {
    case "ACHIEVEMENT":
      return <Trophy size={size} className="text-amber-500" />;
    case "SUCCESS":
      return <Flame size={size} className="text-[#229C62]" />;
    case "BOOKING":
      return <CalendarCheck size={size} className="text-blue-600" />;
    case "WARNING":
      return <CalendarX size={size} className="text-red-500" />;
    case "MASTERCLASS":
      return <Video size={size} className="text-violet-500" />;
    default:
      return <Info size={size} className="text-slate-400" />;
  }
}
