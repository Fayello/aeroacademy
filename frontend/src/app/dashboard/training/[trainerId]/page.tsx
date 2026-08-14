"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, ArrowLeft, Loader2, Check } from "lucide-react";
import { fetchApi } from "@/lib/api";
import toast from "react-hot-toast";
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
    fetchApi(`/training/trainers/${params.trainerId}`)
      .then((data) => setTrainer(data as Trainer))
      .catch(() => toast.error("Failed to load trainer"))
      .finally(() => setLoading(false));
  }, [params.trainerId]);

  useEffect(() => {
    if (!trainer) return;
    setSlotsLoading(true);
    const dateStr = selectedDate.toISOString().split("T")[0];
    fetchApi(`/training/trainers/${trainer.id}/slots?date=${dateStr}`)
      .then((data) => setSlots(data as TrainingSlot[]))
      .catch(() => {})
      .finally(() => setSlotsLoading(false));
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
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={24} /></div>;
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
      <Link href="/dashboard/training" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Back to Trainers
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-2xl">
            {(trainer.user?.name || "T").charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{trainer.user?.name}</h1>
            <div className="text-sm text-slate-500 mt-1">{trainer.specialties?.join(", ") || "General"}</div>
            {trainer.hourlyRate && (
              <div className="text-sm font-medium text-emerald-600 mt-1">{trainer.hourlyRate.toLocaleString()} XAF/hr</div>
            )}
          </div>
        </div>
        {trainer.bio && <p className="text-slate-500 mt-4">{trainer.bio}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Select a Date</h3>
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
                      ? "bg-emerald-600 text-white"
                      : isToday
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <span className="font-medium">{DAYS[d.getDay()]}</span>
                  <span className="text-lg font-bold">{d.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Available Slots</h3>
          {slotsLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-slate-400" size={20} /></div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No slots available for this date.</p>
          ) : (
            <div className="space-y-2">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(slot)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${
                    selectedSlot?.id === slot.id
                      ? "border-emerald-500 bg-emerald-50"
                      : slot.available
                        ? "border-slate-200 hover:border-emerald-300"
                        : "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-400" />
                    {slot.startTime} - {slot.endTime}
                  </span>
                  {selectedSlot?.id === slot.id && <Check size={14} className="text-emerald-600" />}
                  {!slot.available && <span className="text-xs text-slate-400">Booked</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedSlot && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Book Session</h3>
          <div className="text-sm text-slate-500 mb-4">
            {selectedDate.toLocaleDateString()} | {selectedSlot.startTime} - {selectedSlot.endTime}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What do you want to learn?"
              className="input-field"
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
