"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Video, Calendar, Clock, UserCheck, ArrowLeft, Loader2, Users } from "lucide-react";
import { fetchApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function MasterClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [mc, setMc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    fetchApi(`/master-classes/${params.id}`)
      .then((data: any) => {
        setMc(data);
        const userId = JSON.parse(localStorage.getItem("user") || "{}").id;
        setIsRegistered(data.registrations?.some((r: any) => r.userId === userId) || false);
      })
      .catch(() => toast.error("Failed to load master class"))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await fetchApi(`/master-classes/${params.id}/register`, { method: "POST" });
      setIsRegistered(true);
      toast.success("Registered successfully!");
      setMc((prev: any) => ({
        ...prev,
        _count: { ...prev._count, registrations: (prev._count?.registrations || 0) + 1 },
      }));
    } catch (err: any) {
      toast.error(err.message || "Failed to register");
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    setRegistering(true);
    try {
      await fetchApi(`/master-classes/${params.id}/register`, { method: "DELETE" });
      setIsRegistered(false);
      toast.success("Unregistered");
      setMc((prev: any) => ({
        ...prev,
        _count: { ...prev._count, registrations: Math.max((prev._count?.registrations || 1) - 1, 0) },
      }));
    } catch (err: any) {
      toast.error(err.message || "Failed to unregister");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-emerald-600" size={24} />
      </div>
    );
  }

  if (!mc) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Master class not found.</p>
        <Link href="/dashboard/master-classes" className="btn-primary text-sm mt-4">Back to Master Classes</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard/master-classes" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Back to Master Classes
      </Link>

      <div className="bg-gradient-to-br from-violet-500 to-emerald-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-medium">{mc.category}</span>
          {mc.status === "LIVE" && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500 text-xs font-bold rounded-full">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE NOW
            </span>
          )}
          {mc.status === "UPCOMING" && (
            <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-medium">Upcoming</span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">{mc.title}</h1>
        <p className="text-white/80 leading-relaxed">{mc.description}</p>

        <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-white/70">
          {mc.instructorName && (
            <span className="flex items-center gap-1.5"><UserCheck size={16} /> {mc.instructorName}</span>
          )}
          {mc.scheduledAt && (
            <span className="flex items-center gap-1.5"><Calendar size={16} /> {new Date(mc.scheduledAt).toLocaleString()}</span>
          )}
          <span className="flex items-center gap-1.5"><Clock size={16} /> {mc.duration} minutes</span>
          <span className="flex items-center gap-1.5"><Users size={16} /> {mc._count?.registrations || 0}{mc.maxParticipants ? `/${mc.maxParticipants}` : ''} registered</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {mc.instructorBio && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-2">About the Instructor</h3>
              <p className="text-sm text-slate-500">{mc.instructorBio}</p>
            </div>
          )}

          {mc.recordingUrl && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-3">Recording</h3>
              <a href={mc.recordingUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
                <Video size={16} /> Watch Recording
              </a>
            </div>
          )}

          {mc.registrations && mc.registrations.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-3">Registered ({mc.registrations.length})</h3>
              <div className="space-y-2">
                {mc.registrations.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                      {(r.user?.name || "U").charAt(0)}
                    </div>
                    {r.user?.name || r.user?.email}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            {mc.status === "UPCOMING" ? (
              isRegistered ? (
                <div className="space-y-3">
                  <div className="text-center text-sm text-emerald-600 font-medium">You are registered!</div>
                  <button onClick={handleUnregister} disabled={registering} className="btn-secondary w-full text-sm">
                    {registering ? <Loader2 className="animate-spin" size={14} /> : "Cancel Registration"}
                  </button>
                </div>
              ) : (
                <button onClick={handleRegister} disabled={registering} className="btn-primary w-full text-sm">
                  {registering ? <Loader2 className="animate-spin" size={14} /> : "Register Now"}
                </button>
              )
            ) : mc.recordingUrl ? (
              <a href={mc.recordingUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full text-sm justify-center">
                <Video size={14} /> Watch Recording
              </a>
            ) : (
              <div className="text-center text-sm text-slate-500">No recording available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
