"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/format";
import toast from "@/lib/toast";
import PageHeader from "@/components/ui/PageHeader";
import {
  GripVertical,
  Plus,
  Trash2,
  Edit3,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  History,
  Loader2,
  Save,
  X,
  Video,
  FileText,
  FlaskConical,
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  order: number;
  videoUrl: string | null;
  content: string | null;
  sectionId: string;
  sectionTitle?: string;
}

interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
  _count?: { lessons: number };
}

interface CourseStructure {
  id: string;
  title: string;
  description: string;
  sections: Section[];
}

interface ReorderEntry {
  id: string;
  type: "section" | "lesson";
  title: string;
  fromIndex: number;
  toIndex: number;
  timestamp: Date;
}

export default function CourseContentAdminPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [structure, setStructure] = useState<CourseStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Section form
  const [sectionModal, setSectionModal] = useState<{
    open: boolean;
    editing: Section | null;
  }>({ open: false, editing: null });
  const [sectionForm, setSectionForm] = useState({ title: "" });

  // Lesson form
  const [lessonModal, setLessonModal] = useState<{
    open: boolean;
    editing: Lesson | null;
  }>({ open: false, editing: null });
  const [lessonForm, setLessonForm] = useState({
    title: "",
    videoUrl: "",
    content: "",
  });

  // Move lesson
  const [moveModal, setMoveModal] = useState<{
    open: boolean;
    lesson: Lesson | null;
    targetSectionId: string;
  }>({ open: false, lesson: null, targetSectionId: "" });

  // Bulk add
  const [bulkModal, setBulkModal] = useState<{ open: boolean; sectionId: string }>({
    open: false,
    sectionId: "",
  });
  const [bulkJson, setBulkJson] = useState("");

  // Delete confirm
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: "section" | "lesson";
    item: Section | Lesson | null;
  }>({ open: false, type: "section", item: null });

  // Reorder history
  const [history, setHistory] = useState<ReorderEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const loadStructure = useCallback(async () => {
    try {
      const data = await fetchApi(`/admin/courses/${courseId}/structure`);
      setStructure(data);
    } catch {
      toast.error("Failed to load course structure");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadStructure();
  }, [loadStructure]);

  const pushHistory = (
    type: "section" | "lesson",
    title: string,
    fromIndex: number,
    toIndex: number,
    id: string
  ) => {
    setHistory((prev) =>
      [{ id, type, title, fromIndex, toIndex, timestamp: new Date() }, ...prev].slice(0, 10)
    );
  };

  // === Section CRUD ===
  const handleSaveSection = async () => {
    if (!sectionForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      if (sectionModal.editing) {
        await fetchApi(`/admin/courses/${courseId}/sections/${sectionModal.editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ title: sectionForm.title }),
        });
        toast.success("Section updated");
      } else {
        await fetchApi(`/admin/courses/${courseId}/sections`, {
          method: "POST",
          body: JSON.stringify({
            title: sectionForm.title,
            order: structure?.sections?.length || 0,
          }),
        });
        toast.success("Section created");
      }
      setSectionModal({ open: false, editing: null });
      loadStructure();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!deleteDialog.item || deleteDialog.type !== "section") return;
    setSaving(true);
    try {
      await fetchApi(
        `/admin/courses/${courseId}/sections/${deleteDialog.item.id}`,
        { method: "DELETE" }
      );
      toast.success("Section deleted");
      setDeleteDialog({ open: false, type: "section", item: null });
      loadStructure();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // === Lesson CRUD ===
  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!lessonModal.editing?.sectionId && !bulkModal.sectionId) {
      toast.error("No section selected");
      return;
    }
    setSaving(true);
    try {
      const sectionId = lessonModal.editing?.sectionId || bulkModal.sectionId;
      const payload = {
        title: lessonForm.title,
        videoUrl: lessonForm.videoUrl || null,
        content: lessonForm.content || null,
      };
      if (lessonModal.editing) {
        await fetchApi(
          `/admin/courses/${courseId}/sections/${sectionId}/lessons/${lessonModal.editing.id}`,
          { method: "PATCH", body: JSON.stringify(payload) }
        );
        toast.success("Lesson updated");
      } else {
        const section = structure?.sections?.find((s) => s.id === sectionId);
        await fetchApi(
          `/admin/courses/${courseId}/sections/${sectionId}/lessons`,
          {
            method: "POST",
            body: JSON.stringify({
              ...payload,
              order: section?.lessons?.length || 0,
            }),
          }
        );
        toast.success("Lesson created");
      }
      setLessonModal({ open: false, editing: null });
      loadStructure();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!deleteDialog.item || deleteDialog.type !== "lesson") return;
    const lesson = deleteDialog.item as Lesson;
    setSaving(true);
    try {
      await fetchApi(
        `/admin/courses/${courseId}/sections/${lesson.sectionId}/lessons/${lesson.id}`,
        { method: "DELETE" }
      );
      toast.success("Lesson deleted");
      setDeleteDialog({ open: false, type: "lesson", item: null });
      loadStructure();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // === Move Lesson ===
  const handleMoveLesson = async () => {
    if (!moveModal.lesson || !moveModal.targetSectionId) return;
    setSaving(true);
    try {
      await fetchApi(
        `/admin/courses/${courseId}/sections/${moveModal.lesson.sectionId}/lessons/${moveModal.lesson.id}/move`,
        {
          method: "POST",
          body: JSON.stringify({ targetSectionId: moveModal.targetSectionId }),
        }
      );
      toast.success("Lesson moved");
      setMoveModal({ open: false, lesson: null, targetSectionId: "" });
      loadStructure();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // === Bulk Add Lessons ===
  const handleBulkAdd = async () => {
    if (!bulkJson.trim() || !bulkModal.sectionId) return;
    let lessons: { title: string; videoUrl?: string; content?: string }[];
    try {
      lessons = JSON.parse(bulkJson);
      if (!Array.isArray(lessons)) throw new Error("Must be an array");
    } catch {
      toast.error("Invalid JSON. Expected an array of { title, videoUrl?, content? }");
      return;
    }
    setSaving(true);
    try {
      await fetchApi(
        `/admin/courses/${courseId}/sections/${bulkModal.sectionId}/lessons/bulk`,
        { method: "POST", body: JSON.stringify({ lessons }) }
      );
      toast.success(`Added ${lessons.length} lesson${lessons.length !== 1 ? "s" : ""}`);
      setBulkModal({ open: false, sectionId: "" });
      setBulkJson("");
      loadStructure();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // === Reorder ===
  const moveItem = async (
    type: "section" | "lesson",
    items: (Section | Lesson)[],
    index: number,
    direction: "up" | "down"
  ) => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const item = items[index];
    const newOrder = items.map((it, i) => {
      if (i === index) return { ...it, order: items[newIndex].order };
      if (i === newIndex) return { ...it, order: item.order };
      return it;
    });

    pushHistory(type, item.title, index, newIndex, item.id);

    try {
      if (type === "section") {
        await fetchApi(`/admin/courses/${courseId}/sections/${item.id}/reorder`, {
          method: "POST",
          body: JSON.stringify({ newOrder: items[newIndex].order }),
        });
      } else {
        const sectionId = (item as Lesson).sectionId;
        await fetchApi(
          `/admin/courses/${courseId}/sections/${sectionId}/lessons/${item.id}/reorder`,
          {
            method: "POST",
            body: JSON.stringify({ newOrder: items[newIndex].order }),
          }
        );
      }
      loadStructure();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#229C62]" size={32} />
      </div>
    );
  }

  if (!structure) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p>Course not found.</p>
        <Link
          href="/dashboard/admin/courses"
          className="text-[#229C62] hover:text-[#0F203A] mt-2 inline-block"
        >
          Back to courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link
              href="/dashboard/admin/courses"
              className="hover:text-[#229C62] transition-colors"
            >
              Courses
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">{structure.title}</span>
          </div>
          <PageHeader
            title="Course Content"
            description="Manage sections, lessons, and order"
            action={
              <div className="flex gap-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-all"
                >
                  <History size={14} /> History ({history.length})
                </button>
                <button
                  onClick={() => {
                    setSectionForm({ title: "" });
                    setSectionModal({ open: false, editing: null });
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#229C62] hover:bg-[#0F203A] text-white text-sm font-medium transition-all"
                >
                  <Plus size={14} /> New Section
                </button>
              </div>
            }
          />
        </div>
      </div>

      {/* Reorder History */}
      {showHistory && history.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Reorder History
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {history.map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-slate-50"
              >
                <span className="text-slate-600">
                  <span className="font-medium text-slate-900">
                    {entry.title}
                  </span>{" "}
                  moved from {entry.fromIndex + 1} to {entry.toIndex + 1}
                </span>
                <span className="text-slate-400">
                  {entry.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {structure.sections
          ?.sort((a: Section, b: Section) => a.order - b.order)
          .map((section, si) => (
            <div
              key={section.id}
              className="bg-white rounded-xl border border-slate-200"
            >
              {/* Section Header */}
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() =>
                          moveItem(
                            "section",
                            structure.sections || [],
                            si,
                            "up"
                          )
                        }
                        disabled={si === 0}
                        className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() =>
                          moveItem(
                            "section",
                            structure.sections || [],
                            si,
                            "down"
                          )
                        }
                        disabled={si === (structure.sections?.length || 0) - 1}
                        className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    <GripVertical size={16} className="text-slate-300" />
                    <h3 className="font-semibold text-slate-900">
                      {section.title}
                    </h3>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                      {section.lessons?.length || 0} lessons
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSectionForm({ title: section.title });
                        setSectionModal({ open: true, editing: section });
                      }}
                      className="p-2 text-slate-400 hover:text-[#229C62] hover:bg-[#E9F8EE] rounded-lg transition-all"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setBulkJson("");
                        setBulkModal({ open: true, sectionId: section.id });
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Bulk add lessons"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setLessonForm({
                          title: "",
                          videoUrl: "",
                          content: "",
                        });
                        setLessonModal({ open: true, editing: null });
                        lessonModal.editing = { ...({} as Lesson), sectionId: section.id };
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Add lesson"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteDialog({
                          open: true,
                          type: "section",
                          item: section,
                        })
                      }
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Lessons */}
              <div className="divide-y divide-slate-100">
                {section.lessons
                  ?.sort((a: Lesson, b: Lesson) => a.order - b.order)
                  .map((lesson, li) => (
                    <div
                      key={lesson.id}
                      className="px-5 py-3 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() =>
                                moveItem(
                                  "lesson",
                                  section.lessons || [],
                                  li,
                                  "up"
                                )
                              }
                              disabled={li === 0}
                              className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronUp size={12} />
                            </button>
                            <button
                              onClick={() =>
                                moveItem(
                                  "lesson",
                                  section.lessons || [],
                                  li,
                                  "down"
                                )
                              }
                              disabled={
                                li === (section.lessons?.length || 0) - 1
                              }
                              className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronDown size={12} />
                            </button>
                          </div>
                          <GripVertical size={14} className="text-slate-300" />
                          <div className="w-7 h-7 rounded-lg bg-[#E9F8EE] flex items-center justify-center">
                            {lesson.videoUrl ? (
                              <Video size={12} className="text-[#229C62]" />
                            ) : lesson.content ? (
                              <FileText
                                size={12}
                                className="text-[#229C62]"
                              />
                            ) : (
                              <FlaskConical
                                size={12}
                                className="text-[#229C62]"
                              />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {lesson.videoUrl && (
                                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                                  Video
                                </span>
                              )}
                              {lesson.content && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                  Content
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setLessonForm({
                                title: lesson.title,
                                videoUrl: lesson.videoUrl || "",
                                content: lesson.content || "",
                              });
                              setLessonModal({ open: true, editing: lesson });
                            }}
                            className="p-1.5 text-slate-400 hover:text-[#229C62] hover:bg-[#E9F8EE] rounded-lg transition-all"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => {
                              setMoveModal({
                                open: true,
                                lesson,
                                targetSectionId: "",
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Move to another section"
                          >
                            <ArrowRight size={13} />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteDialog({
                                open: true,
                                type: "lesson",
                                item: lesson,
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                {(!section.lessons || section.lessons.length === 0) && (
                  <div className="px-5 py-6 text-center text-sm text-slate-400">
                    No lessons yet.
                  </div>
                )}
              </div>
            </div>
          ))}
        {(!structure.sections || structure.sections.length === 0) && (
          <div className="text-center py-16 text-slate-500">
            <FileText size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No sections yet. Add one to get started.</p>
          </div>
        )}
      </div>

      {/* Section Modal */}
      {sectionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSectionModal({ open: false, editing: null })}
          />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {sectionModal.editing ? "Edit Section" : "New Section"}
              </h3>
              <button
                onClick={() => setSectionModal({ open: false, editing: null })}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Title
                </label>
                <input
                  value={sectionForm.title}
                  onChange={(e) =>
                    setSectionForm({ title: e.target.value })
                  }
                  placeholder="Section title"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#229C62]/20 focus:border-[#229C62]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setSectionModal({ open: false, editing: null })}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSection}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#229C62] hover:bg-[#0F203A] text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {lessonModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setLessonModal({ open: false, editing: null })}
          />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {lessonModal.editing ? "Edit Lesson" : "New Lesson"}
              </h3>
              <button
                onClick={() => setLessonModal({ open: false, editing: null })}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Title
                </label>
                <input
                  value={lessonForm.title}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, title: e.target.value })
                  }
                  placeholder="Lesson title"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#229C62]/20 focus:border-[#229C62]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Video URL
                </label>
                <input
                  value={lessonForm.videoUrl}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, videoUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#229C62]/20 focus:border-[#229C62]"
                />
                <p className="text-xs text-slate-400 mt-1">
                  YouTube, Vimeo, or direct URL
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Content (Markdown)
                </label>
                <textarea
                  value={lessonForm.content}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, content: e.target.value })
                  }
                  placeholder="Lesson content in markdown..."
                  rows={10}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#229C62]/20 focus:border-[#229C62] resize-y"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setLessonModal({ open: false, editing: null })}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLesson}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#229C62] hover:bg-[#0F203A] text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Lesson Modal */}
      {moveModal.open && moveModal.lesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() =>
              setMoveModal({ open: false, lesson: null, targetSectionId: "" })
            }
          />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Move Lesson
              </h3>
              <button
                onClick={() =>
                  setMoveModal({ open: false, lesson: null, targetSectionId: "" })
                }
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Move &quot;{moveModal.lesson.title}&quot; to another section.
            </p>
            <select
              value={moveModal.targetSectionId}
              onChange={(e) =>
                setMoveModal({ ...moveModal, targetSectionId: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#229C62]/20 focus:border-[#229C62]"
            >
              <option value="">Select target section...</option>
              {structure.sections
                ?.filter((s: Section) => s.id !== moveModal.lesson?.sectionId)
                .map((s: Section) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
            </select>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() =>
                  setMoveModal({ open: false, lesson: null, targetSectionId: "" })
                }
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleMoveLesson}
                disabled={saving || !moveModal.targetSectionId}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ArrowRight size={14} />
                )}
                {saving ? "Moving..." : "Move"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {bulkModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setBulkModal({ open: false, sectionId: "" });
              setBulkJson("");
            }}
          />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Bulk Add Lessons
              </h3>
              <button
                onClick={() => {
                  setBulkModal({ open: false, sectionId: "" });
                  setBulkJson("");
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-3">
              Paste a JSON array of lessons.
            </p>
            <textarea
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              placeholder={`[\n  { "title": "Lesson 1", "videoUrl": "https://..." },\n  { "title": "Lesson 2", "content": "Markdown content here" }\n]`}
              rows={12}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#229C62]/20 focus:border-[#229C62] resize-y"
            />
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => {
                  setBulkModal({ open: false, sectionId: "" });
                  setBulkJson("");
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAdd}
                disabled={saving || !bulkJson.trim()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#229C62] hover:bg-[#0F203A] text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                {saving ? "Adding..." : "Add Lessons"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() =>
              setDeleteDialog({ open: false, type: "section", item: null })
            }
          />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Delete {deleteDialog.type === "section" ? "Section" : "Lesson"}
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              {deleteDialog.type === "section"
                ? `Delete "${(deleteDialog.item as Section)?.title}" and all its lessons?`
                : `Delete "${(deleteDialog.item as Lesson)?.title}"?`}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() =>
                  setDeleteDialog({ open: false, type: "section", item: null })
                }
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={
                  deleteDialog.type === "section"
                    ? handleDeleteSection
                    : handleDeleteLesson
                }
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
