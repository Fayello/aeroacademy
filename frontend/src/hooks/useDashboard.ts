import { useDashboardSocket } from "./DashboardSocketContext";

export type { UserMetrics } from "./DashboardSocketContext";

export function useDashboard() {
  return useDashboardSocket();
}
