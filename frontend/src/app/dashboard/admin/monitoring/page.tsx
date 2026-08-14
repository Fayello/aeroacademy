"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, Users, Container, Gauge, Clock, Loader2, Square, RefreshCw, Monitor } from "lucide-react";
import { fetchApi } from "@/lib/api";
import toast from "react-hot-toast";
import AdminTable from "@/components/admin/AdminTable";
import { AdminStatusBadge } from "@/components/admin/AdminForm";

interface LabInstance {
  id: string;
  userId: string;
  labId: string;
  status: string;
  createdAt: string;
  stoppedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  lab: {
    id: string;
    title: string;
    dockerImage: string;
  };
}

interface SystemStats {
  activeContainers: number;
  activeUsers: number;
  capacity: number;
  maxCapacity: number;
}

function formatElapsed(start: string): string {
  const ms = Date.now() - new Date(start).getTime();
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export default function AdminMonitoringPage() {
  const [instances, setInstances] = useState<LabInstance[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [stoppingId, setStoppingId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [active, systemStats] = await Promise.all([
        fetchApi("/dashboard/active-users"),
        fetchApi("/labs/stats"),
      ]);
      setInstances(Array.isArray(active) ? active : []);
      setStats(systemStats);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const [active, systemStats] = await Promise.all([
          fetchApi("/dashboard/active-users"),
          fetchApi("/labs/stats"),
        ]);
        if (cancelled) return;
        setInstances(Array.isArray(active) ? active : []);
        setStats(systemStats);
      } catch {
        // silently handle
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    const interval = setInterval(run, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const ticker = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(ticker);
  }, []);

  const handleForceStop = async (labId: string, userId: string) => {
    setStoppingId(labId);
    try {
      await fetchApi(`/labs/stop/${labId}`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      setInstances((prev) => prev.filter((i) => i.labId !== labId || i.userId !== userId));
    } catch {
      // silently handle
    } finally {
      setStoppingId(null);
    }
  };

  const handleBatchStop = async (selected: LabInstance[]) => {
    setStoppingId("batch");
    try {
      const res = await fetchApi("/labs/batch/stop", {
        method: "POST",
        body: JSON.stringify({
          items: selected.map((i) => ({ labId: i.labId, userId: i.userId })),
        }),
      });
      setInstances((prev) => prev.filter((i) => !selected.some((s) => s.labId === i.labId && s.userId === i.userId)));
      toast.success(`Stopped ${res.stopped || selected.length} lab session${(res.stopped || selected.length) !== 1 ? "s" : ""}`);
    } catch {
      toast.error("Failed to stop selected sessions");
    } finally {
      setStoppingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  const capacityPercent = stats ? Math.round((stats.capacity / Math.max(stats.maxCapacity, 1)) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center">
              <Monitor size={24} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Lab Monitoring</h1>
              <p className="text-slate-300 text-sm">Real-time active lab sessions</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <Activity size={16} className="text-emerald-400" />
              <span className="text-sm font-medium">{instances.length} Active Session{instances.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <Users size={16} className="text-emerald-400" />
              <span className="text-sm font-medium">{stats?.activeUsers || 0} Users Online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Containers", value: stats?.activeContainers || 0, icon: Container, bg: "bg-emerald-500", color: "text-emerald-600" },
          { label: "Active Users", value: stats?.activeUsers || 0, icon: Users, bg: "bg-blue-500", color: "text-blue-600" },
          { label: "Capacity Used", value: `${capacityPercent}%`, icon: Gauge, bg: "bg-amber-500", color: "text-amber-600" },
          { label: "Max Capacity", value: stats?.maxCapacity || 0, icon: Activity, bg: "bg-violet-500", color: "text-violet-600" },
        ].map((card) => (
          <div key={card.label} className="relative overflow-hidden bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all duration-300">
            <div className={`absolute top-0 right-0 w-20 h-20 ${card.bg} opacity-10 rounded-bl-full`}></div>
            <card.icon size={20} className={`${card.color} mb-3`} />
            <div className="text-2xl font-bold text-slate-900">{card.value}</div>
            <div className="text-sm text-slate-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Active Lab Users</h3>
        <AdminTable
          columns={[
            {
              key: "user",
              label: "User",
              sortable: true,
              render: (item: LabInstance) => (
                <div>
                  <p className="font-medium text-slate-900">{item.user?.name || "Unknown"}</p>
                  <p className="text-xs text-slate-500">{item.user?.email || ""}</p>
                </div>
              ),
            },
            {
              key: "lab",
              label: "Lab",
              sortable: true,
              render: (item: LabInstance) => (
                <span className="text-sm text-slate-700">{item.lab?.title || "Unknown"}</span>
              ),
            },
            {
              key: "createdAt",
              label: "Started",
              sortable: true,
              render: (item: LabInstance) => (
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Clock size={14} className="text-slate-400" />
                  {new Date(item.createdAt).toLocaleTimeString()}
                </div>
              ),
            },
            {
              key: "elapsed",
              label: "Time Elapsed",
              render: (item: LabInstance) => (
                <span className="text-sm font-mono text-slate-600">{formatElapsed(item.createdAt)}</span>
              ),
            },
            {
              key: "status",
              label: "Status",
              sortable: true,
              render: (item: LabInstance) => <AdminStatusBadge status={item.status} />,
            },
          ]}
          data={instances.map((i) => ({ ...i, id: `${i.labId}-${i.userId}` }))}
          searchPlaceholder="Search by user or lab..."
          searchKeys={["user.name", "user.email", "lab.title"]}
          pageSize={15}
          emptyMessage="No active lab sessions"
          selectable
          bulkActions={[
            { label: "Force Stop", icon: <Square size={16} />, variant: "danger", onClick: handleBatchStop },
          ]}
          headerExtra={
            <button onClick={() => loadData()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-all">
              <RefreshCw size={16} /> Refresh
            </button>
          }
        />
      </div>

      {instances.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h4 className="text-sm font-semibold text-slate-700">Quick Actions</h4>
          </div>
          <div className="divide-y divide-slate-100">
            {instances.map((instance) => (
              <div key={`${instance.labId}-${instance.userId}`} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Users size={14} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{instance.user?.name} &middot; {instance.lab?.title}</p>
                    <p className="text-xs text-slate-500">Running for {formatElapsed(instance.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleForceStop(instance.labId, instance.userId)}
                  disabled={stoppingId === instance.labId}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-all disabled:opacity-50"
                >
                  {stoppingId === instance.labId ? <Loader2 size={12} className="animate-spin" /> : <Square size={12} />}
                  Force Stop
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
