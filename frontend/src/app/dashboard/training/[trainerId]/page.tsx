"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, ArrowLeft, Loader2, Check } from "lucide-react";
import { fetchApi } from "@/lib/api";
import toast from "@/lib/toast";
import type { Trainer, TrainingSlot } from "@/types/api";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getNextWeekDates() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export default function TrainerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<TrainingSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TrainingSlot | null>(null);
  const [topic, setTopic] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchApi(`/training/trainers/${params.trainerId}`)
      .then((data) => { if (!cancelled) setTrainer(data as Trainer); })
      .catch(() => { if (!cancelled) toast.error("Failed to load trainer"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.trainerId]);

  useEffect(() => {
    if (!trainer) return;
    let cancelled = false;
    const dateStr = selectedDate.toISOString().split("T")[0];
    (async () => {
      if (!cancelled) {
        setSlotsLoading(true);
        setSelectedSlot(null);
      }
      try {
        const data = await fetchApi(`/training/trainers/${trainer.id}/slots?date=${dateStr}`);
        if (!cancelled) setSlots(data as TrainingSlot[]);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trainer, selectedDate]);

  const handleBook = async () => {
    if (!trainer || !selectedSlot || !topic.trim()) {
      toast.error("Please select a slot and enter a topic");
      return;
    }
    setBooking(true);
    try {
      await fetchApi("/training/book", {
        method: "POST",
        body: JSON.stringify({
          trainerId: trainer.id,
          slotId: selectedSlot.id,
          date: selectedDate.toISOString().split("T")[0],
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          topic: topic.trim(),
        }),
      });
      toast.success("Session booked!");
      router.push("/dashboard/training/bookings");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to book session");
    } finally {
      setBooking(false);
    }
  };

  const weekDates = getNextWeekDates();

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#7AD62A]" size={24} /></div>;
  }

  if (!trainer) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Trainer not found.</p>
        <Link href="/dashboard/training" className="btn-primary text-sm mt-4">Back to Training</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard/training" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-200">
        <ArrowLeft size={16} /> Back to Trainers
      </Link>

      <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="w-20 h-20 rounded-full bg-[#7AD62A]/10 flex items-center justify-center text-[#0F203A] font-bold text-2xl">
            {(trainer.user?.name || "T").charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{trainer.user?.name}</h1>
            <div className="text-sm text-slate-300 mt-1">{trainer.specialties?.join(", ") || "General coaching"}</div>
            {trainer.hourlyRate && (
              <div className="text-sm font-medium text-[#7AD62A] mt-1">{trainer.hourlyRate.toLocaleString()} XAF/hr</div>
            )}
          </div>
        </div>
        {trainer.bio && <p className="text-slate-300 mt-4">{trainer.bio}</p>}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            "Choose a date and slot that matches the week you want to make progress.",
            "Use the topic field to name the exact lab, module, or concept you want help with.",
            "Booked sessions appear in your training bookings so you can track upcoming support.",
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
          <h3 className="font-bold text-white mb-4">Select a Date</h3>
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((d) => {
              const isSelected = d.toDateString() === selectedDate.toDateString();
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelectedDate(d)}
                  className={`flex flex-col items-center p-2 rounded-lg text-xs transition-all ${
                    isSelected
                      ? "bg-[#7AD62A] text-white"
                      : isToday
                        ? "bg-[#7AD62A]/10 text-[#7AD62A] border border-[#7AD62A]/20"
                        : "hover:bg-white/5 text-slate-300"
                  }`}
                >
                  <span className="font-medium">{DAYS[d.getDay()]}</span>
                  <span className="text-lg font-bold">{d.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
          <h3 className="font-bold text-white mb-4">Available Slots</h3>
          {slotsLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-slate-400" size={20} /></div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No slots available for this date.</p>
          ) : (
            <div className="space-y-2">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(slot)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${
                    selectedSlot?.id === slot.id
                      ? "border-[#7AD62A] bg-[#7AD62A]/10"
                      : slot.available
                        ? "border-white/10 hover:border-[#7AD62A]/30"
                        : "border-slate-100 bg-white/5 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-400" />
                    {slot.startTime} - {slot.endTime}
                  </span>
                  {selectedSlot?.id === slot.id && <Check size={14} className="text-[#7AD62A]" />}
                  {!slot.available && <span className="text-xs text-slate-400">Booked</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedSlot && (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
          <h3 className="font-bold text-white mb-4">Book Session</h3>
          <div className="text-sm text-slate-300 mb-4">
            {selectedDate.toLocaleDateString()} | {selectedSlot.startTime} - {selectedSlot.endTime}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-200 mb-1.5">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Name the lab, course area, or assessment skill you want to improve"
              className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#7AD62A] focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20"
            />
          </div>
          <button onClick={handleBook} disabled={booking || !topic.trim()} className="btn-primary text-sm">
            {booking ? <Loader2 className="animate-spin" size={14} /> : <Calendar size={14} />}
            {booking ? "Booking..." : "Confirm Booking"}
          </button>
        </div>
      )}
    </div>
  );
}
