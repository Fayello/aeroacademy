"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/format";
import { GraduationCap, Layers, BookOpen, HelpCircle, ChevronRight, Plus, Pencil, Trash2, ArrowLeft, Loader2, CheckSquare, Square, X } from "lucide-react";
import toast from "@/lib/toast";
import AdminModal, { AdminConfirmDialog } from "@/components/admin/AdminModal";
import { AdminInput, AdminTextarea, AdminNumber, AdminSelect } from "@/components/admin/AdminForm";

interface QuizAnswer {
  id?: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id?: string;
  text: string;
  answers: QuizAnswer[];
}

interface Quiz {
  id?: string;
  lessonId: string;
  questions: QuizQuestion[];
}

interface Lesson {
  id: string;
  title: string;
  order: number;
  videoUrl: string | null;
  content: string | null;
  labId: string | null;
  quiz?: Quiz | null;
}

interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
  _count?: { lessons: number };
}

interface Course {
  id: string;
  title: string;
  description: string;
  sections: Section[];
  createdAt: string;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [batchDelete, setBatchDelete] = useState<{ open: boolean; items: Course[] }>({ open: false, items: [] });

  // Modal states
  const [courseModal, setCourseModal] = useState<{ open: boolean; editing: Course | null }>({ open: false, editing: null });
  const [sectionModal, setSectionModal] = useState<{ open: boolean; editing: Section | null }>({ open: false, editing: null });
  const [lessonModal, setLessonModal] = useState<{ open: boolean; editing: Lesson | null }>({ open: false, editing: null });
  const [quizModal, setQuizModal] = useState<{ open: boolean; lesson: Lesson | null }>({ open: false, lesson: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; item: Course | Section | Lesson | null }>({ open: false, type: "", item: null });

  // Form states
  const [courseForm, setCourseForm] = useState({ title: "", description: "" });
  const [sectionForm, setSectionForm] = useState({ title: "", order: 0 });
  const [lessonForm, setLessonForm] = useState({ title: "", videoUrl: "", content: "", labId: "", order: 0 });
  const [quizForm, setQuizForm] = useState<QuizQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [labs, setLabs] = useState<{ id: string; title: string }[]>([]);

  const loadCourses = useCallback(async () => {
    try {
      const data = await fetchApi("/courses");
      setCourses(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchApi("/courses");
        if (!cancelled) setCourses(Array.isArray(data) ? data : data.data || []);
      } catch {
        toast.error("Failed to load courses");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    fetchApi("/labs").then((data) => { if (!cancelled) setLabs(Array.isArray(data) ? data : []); }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const loadCourseDetail = async (courseId: string) => {
    try {
      const data = await fetchApi(`/courses/${courseId}`);
      setSelectedCourse(data);
    } catch {
      toast.error("Failed to load course details");
    }
  };

  // === Course CRUD ===
  const handleSaveCourse = async () => {
    if (!courseForm.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      if (courseModal.editing) {
        await fetchApi(`/courses/${courseModal.editing.id}`, { method: "PATCH", body: JSON.stringify(courseForm) });
        toast.success("Course updated");
      } else {
        await fetchApi("/courses", { method: "POST", body: JSON.stringify(courseForm) });
        toast.success("Course created");
      }
      setCourseModal({ open: false, editing: null });
      loadCourses();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };

  const handleDeleteCourse = async () => {
    setSaving(true);
    try {
      if (!deleteDialog.item || deleteDialog.type !== "course") return;
      await fetchApi(`/courses/${deleteDialog.item.id}`, { method: "DELETE" });
      toast.success("Course deleted");
      setDeleteDialog({ open: false, type: "", item: null });
      setSelectedCourse(null);
      loadCourses();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };

  const toggleCourseSelection = (id: string) => {
    const next = new Set(selectedCourses);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCourses(next);
  };

  const toggleSelectAllCourses = () => {
    if (selectedCourses.size === courses.length) setSelectedCourses(new Set());
    else setSelectedCourses(new Set(courses.map((c) => c.id)));
  };

  const confirmBatchDelete = async () => {
    setSaving(true);
    try {
      await fetchApi("/courses/batch/delete", {
        method: "POST",
        body: JSON.stringify({ ids: batchDelete.items.map((c) => c.id) }),
      });
      toast.success(`Deleted ${batchDelete.items.length} course${batchDelete.items.length > 1 ? "s" : ""}`);
      setBatchDelete({ open: false, items: [] });
      setSelectedCourses(new Set());
      loadCourses();
    } catch { toast.error("Failed to delete courses"); } finally { setSaving(false); }
  };

  // === Section CRUD ===
  const handleSaveSection = async () => {
    if (!sectionForm.title.trim()) { toast.error("Title is required"); return; }
    if (!selectedCourse) return;
    setSaving(true);
    try {
      const courseId = selectedCourse.id;
      if (sectionModal.editing) {
        await fetchApi(`/courses/${courseId}/sections/${sectionModal.editing.id}`, { method: "PATCH", body: JSON.stringify(sectionForm) });
        toast.success("Section updated");
      } else {
        await fetchApi(`/courses/${courseId}/sections`, { method: "POST", body: JSON.stringify(sectionForm) });
        toast.success("Section created");
      }
      setSectionModal({ open: false, editing: null });
      loadCourseDetail(courseId);
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };

  const handleDeleteSection = async () => {
    setSaving(true);
    try {
      if (!deleteDialog.item || deleteDialog.type !== "section" || !selectedCourse) return;
      await fetchApi(`/courses/${selectedCourse.id}/sections/${deleteDialog.item.id}`, { method: "DELETE" });
      toast.success("Section deleted");
      setDeleteDialog({ open: false, type: "", item: null });
      loadCourseDetail(selectedCourse.id);
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };

  // === Lesson CRUD ===
  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      if (!selectedCourse || !selectedSection) { setSaving(false); return; }
      const { courseId, sectionId } = { courseId: selectedCourse.id, sectionId: selectedSection.id };
      const payload = { ...lessonForm, labId: lessonForm.labId || null, videoUrl: lessonForm.videoUrl || null, content: lessonForm.content || null };
      if (lessonModal.editing) {
        await fetchApi(`/courses/${courseId}/sections/${sectionId}/lessons/${lessonModal.editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast.success("Lesson updated");
      } else {
        await fetchApi(`/courses/${courseId}/sections/${sectionId}/lessons`, { method: "POST", body: JSON.stringify(payload) });
        toast.success("Lesson created");
      }
      setLessonModal({ open: false, editing: null });
      loadCourseDetail(courseId);
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };

  const handleDeleteLesson = async () => {
    setSaving(true);
    try {
      if (!deleteDialog.item || !deleteDialog.type.startsWith("lesson") || !selectedCourse || !selectedSection) return;
      await fetchApi(`/courses/${selectedCourse.id}/sections/${selectedSection.id}/lessons/${deleteDialog.item.id}`, { method: "DELETE" });
      toast.success("Lesson deleted");
      setDeleteDialog({ open: false, type: "", item: null });
      loadCourseDetail(selectedCourse.id);
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };

  // === Quiz CRUD ===
  const handleSaveQuiz = async () => {
    if (quizForm.length === 0) { toast.error("Add at least one question"); return; }
    for (let i = 0; i < quizForm.length; i++) {
      if (!quizForm[i].text.trim()) { toast.error(`Question ${i + 1} text is required`); return; }
      if (quizForm[i].answers.length < 2) { toast.error(`Question ${i + 1} needs at least 2 answers`); return; }
      if (!quizForm[i].answers.some((a) => a.isCorrect)) { toast.error(`Question ${i + 1} needs a correct answer`); return; }
    }
    setSaving(true);
    try {
      if (!selectedCourse || !selectedSection || !quizModal.lesson) { setSaving(false); return; }
      const { courseId, sectionId, lessonId } = { courseId: selectedCourse.id, sectionId: selectedSection.id, lessonId: quizModal.lesson.id };
      const existingQuiz = selectedLesson?.quiz;
      const url = existingQuiz
        ? `/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/quiz/${existingQuiz.id}`
        : `/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/quiz`;
      const method = existingQuiz ? "PATCH" : "POST";
      await fetchApi(url, { method, body: JSON.stringify({ questions: quizForm }) });
      toast.success(existingQuiz ? "Quiz updated" : "Quiz created");
      setQuizModal({ open: false, lesson: null });
      loadCourseDetail(courseId);
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };

  // === Quiz Form Helpers ===
  const addQuestion = () => setQuizForm([...quizForm, { text: "", answers: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }] }]);
  const updateQuestion = (i: number, data: Partial<QuizQuestion>) => { const next = [...quizForm]; next[i] = { ...next[i], ...data }; setQuizForm(next); };
  const removeQuestion = (i: number) => setQuizForm(quizForm.filter((_, idx) => idx !== i));
  const addAnswer = (qi: number) => { const next = [...quizForm]; next[qi].answers.push({ text: "", isCorrect: false }); setQuizForm(next); };
  const updateAnswer = (qi: number, ai: number, data: Partial<QuizAnswer>) => { const next = [...quizForm]; next[qi].answers[ai] = { ...next[qi].answers[ai], ...data }; setQuizForm(next); };
  const removeAnswer = (qi: number, ai: number) => { const next = [...quizForm]; next[qi].answers = next[qi].answers.filter((_, idx) => idx !== ai); setQuizForm(next); };

  // === Breadcrumb ===
  const renderBreadcrumb = () => (
    <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <button onClick={() => { setSelectedCourse(null); setSelectedSection(null); setSelectedLesson(null); }} className="hover:text-emerald-600 transition-colors">Courses</button>
      {selectedCourse && (
        <>
          <ChevronRight size={14} />
          <button onClick={() => { setSelectedSection(null); setSelectedLesson(null); loadCourseDetail(selectedCourse.id); }} className="hover:text-emerald-600 transition-colors">{selectedCourse.title}</button>
        </>
      )}
      {selectedSection && (
        <>
          <ChevronRight size={14} />
          <button onClick={() => setSelectedLesson(null)} className="hover:text-emerald-600 transition-colors">{selectedSection.title}</button>
        </>
      )}
      {selectedLesson && (
        <>
          <ChevronRight size={14} />
          <span className="text-slate-900 font-medium">{selectedLesson.title}</span>
        </>
      )}
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={32} /></div>;
  }

  // === Course List View ===
  if (!selectedCourse) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><GraduationCap size={28} /></div>
              <div>
                <h1 className="text-2xl font-bold">Manage Courses</h1>
                <p className="text-blue-100 text-sm">{courses.length} courses total</p>
              </div>
            </div>
            <button onClick={toggleSelectAllCourses} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-medium py-2.5 px-4 rounded-xl transition-all text-sm backdrop-blur-sm">
              {selectedCourses.size === courses.length && courses.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />} {selectedCourses.size === courses.length && courses.length > 0 ? "Deselect All" : "Select All"}
            </button>
            <button onClick={() => { setCourseForm({ title: "", description: "" }); setCourseModal({ open: true, editing: null }); }} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-medium py-2.5 px-5 rounded-xl transition-all text-sm backdrop-blur-sm">
              <Plus size={16} /> New Course
            </button>
          </div>
        </div>

        {selectedCourses.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-sm font-medium text-emerald-700">{selectedCourses.size} selected</span>
            <div className="flex items-center gap-2 ml-auto">
              <button onClick={() => setSelectedCourses(new Set())} className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-white transition-all" title="Clear selection">
                <X size={16} />
              </button>
              <button onClick={() => setBatchDelete({ open: true, items: courses.filter((c) => selectedCourses.has(c.id)) })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-all">
                <Trash2 size={14} /> Delete Selected
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {courses.map((course) => (
            <div key={course.id} onClick={() => loadCourseDetail(course.id)} className={`bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all group ${selectedCourses.has(course.id) ? "border-emerald-400 ring-1 ring-emerald-400/40" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={(e) => { e.stopPropagation(); toggleCourseSelection(course.id); }} className="text-slate-300 hover:text-emerald-600 transition-colors shrink-0" title={selectedCourses.has(course.id) ? "Deselect" : "Select"}>
                    {selectedCourses.has(course.id) ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} />}
                  </button>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <GraduationCap size={20} className="text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{course.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-1 max-w-lg">{course.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{course.sections?.length || 0}</p>
                    <p className="text-xs text-slate-500">Sections</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{course.sections?.reduce((acc: number, s: Section) => acc + (s.lessons?.length || s._count?.lessons || 0), 0) || 0}</p>
                    <p className="text-xs text-slate-500">Lessons</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setCourseForm({ title: course.title, description: course.description }); setCourseModal({ open: true, editing: course }); }} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Pencil size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, type: "course", item: course }); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                    <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <AdminModal isOpen={courseModal.open} onClose={() => setCourseModal({ open: false, editing: null })} title={courseModal.editing ? "Edit Course" : "New Course"} footer={<div className="flex gap-3 justify-end"><button onClick={() => setCourseModal({ open: false, editing: null })} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium">Cancel</button><button onClick={handleSaveCourse} disabled={saving} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Save"}</button></div>}>
          <div className="space-y-4">
            <AdminInput label="Title" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} placeholder="Course title" required />
            <AdminTextarea label="Description" value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} placeholder="Course description" rows={4} required />
          </div>
        </AdminModal>

        <AdminConfirmDialog isOpen={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, type: "", item: null })} onConfirm={handleDeleteCourse} title="Delete Course" message={`Delete "${deleteDialog.item?.title}"? This will also delete all sections, lessons, and quizzes.`} loading={saving} />
        <AdminConfirmDialog isOpen={batchDelete.open} onClose={() => setBatchDelete({ open: false, items: [] })} onConfirm={confirmBatchDelete} title="Delete Courses" message={`Delete ${batchDelete.items.length} selected course${batchDelete.items.length > 1 ? "s" : ""}? This will also delete all sections, lessons, and quizzes.`} loading={saving} confirmLabel="Delete Selected" />
      </div>
    );
  }

  // === Section View ===
  if (!selectedSection) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {renderBreadcrumb()}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 p-8 text-white">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => { setSelectedCourse(null); setSelectedSection(null); }} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"><ArrowLeft size={20} /></button>
               <div>
                <h1 className="text-2xl font-bold">{selectedCourse?.title}</h1>
                <p className="text-violet-100 text-sm">{selectedCourse?.sections?.length || 0} sections</p>
              </div>
            </div>
            <button onClick={() => { setSectionForm({ title: "", order: selectedCourse?.sections?.length || 0 }); setSectionModal({ open: true, editing: null }); }} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-medium py-2.5 px-5 rounded-xl transition-all text-sm backdrop-blur-sm">
              <Plus size={16} /> New Section
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {selectedCourse?.sections?.map((section) => (
            <div key={section.id} onClick={() => setSelectedSection(section)} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-violet-300 cursor-pointer transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-600 transition-colors">
                    <Layers size={18} className="text-violet-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-violet-600 transition-colors">{section.title}</h3>
                    <p className="text-sm text-slate-500">{section.lessons?.length || 0} lessons</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">Order: {section.order}</span>
                  <button onClick={(e) => { e.stopPropagation(); setSectionForm({ title: section.title, order: section.order }); setSectionModal({ open: true, editing: section }); }} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Pencil size={16} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, type: "section", item: section }); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-violet-600 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <AdminModal isOpen={sectionModal.open} onClose={() => setSectionModal({ open: false, editing: null })} title={sectionModal.editing ? "Edit Section" : "New Section"} footer={<div className="flex gap-3 justify-end"><button onClick={() => setSectionModal({ open: false, editing: null })} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium">Cancel</button><button onClick={handleSaveSection} disabled={saving} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Save"}</button></div>}>
          <div className="space-y-4">
            <AdminInput label="Title" value={sectionForm.title} onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })} placeholder="Section title" required />
            <AdminNumber label="Order" value={sectionForm.order} onChange={(e) => setSectionForm({ ...sectionForm, order: parseInt(e.target.value) || 0 })} min={0} />
          </div>
        </AdminModal>

        <AdminConfirmDialog isOpen={deleteDialog.open && deleteDialog.type === "section"} onClose={() => setDeleteDialog({ open: false, type: "", item: null })} onConfirm={handleDeleteSection} title="Delete Section" message={`Delete "${deleteDialog.item?.title}"? This will also delete all lessons.`} loading={saving} />
      </div>
    );
  }

  // === Lesson View ===
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {renderBreadcrumb()}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => { setSelectedSection(null); setSelectedLesson(null); }} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="text-2xl font-bold">{selectedSection?.title}</h1>
              <p className="text-emerald-100 text-sm">{selectedSection?.lessons?.length || 0} lessons</p>
            </div>
          </div>
          <button onClick={() => { setLessonForm({ title: "", videoUrl: "", content: "", labId: "", order: selectedSection?.lessons?.length || 0 }); setLessonModal({ open: true, editing: null }); }} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-medium py-2.5 px-5 rounded-xl transition-all text-sm backdrop-blur-sm">
            <Plus size={16} /> New Lesson
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {selectedSection?.lessons?.map((lesson) => (
          <div key={lesson.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <BookOpen size={18} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{lesson.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    {lesson.videoUrl && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Video</span>}
                    {lesson.content && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Content</span>}
                    {lesson.labId && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Lab</span>}
                    {lesson.quiz && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Quiz ({lesson.quiz.questions?.length || 0} Q)</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">Order: {lesson.order}</span>
                <button onClick={() => { setLessonForm({ title: lesson.title, videoUrl: lesson.videoUrl || "", content: lesson.content || "", labId: lesson.labId || "", order: lesson.order }); setLessonModal({ open: true, editing: lesson }); }} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Pencil size={16} /></button>
                <button onClick={() => { setQuizForm(lesson.quiz?.questions?.map((q: QuizQuestion) => ({ text: q.text, answers: q.answers.map((a: QuizAnswer) => ({ text: a.text, isCorrect: a.isCorrect })) })) || []); setQuizModal({ open: true, lesson }); }} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"><HelpCircle size={16} /></button>
                <button onClick={() => setDeleteDialog({ open: true, type: lesson.quiz ? "lesson-with-quiz" : "lesson", item: lesson })} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lesson Modal */}
      <AdminModal isOpen={lessonModal.open} onClose={() => setLessonModal({ open: false, editing: null })} title={lessonModal.editing ? "Edit Lesson" : "New Lesson"} size="lg" footer={<div className="flex gap-3 justify-end"><button onClick={() => setLessonModal({ open: false, editing: null })} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium">Cancel</button><button onClick={handleSaveLesson} disabled={saving} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Save"}</button></div>}>
        <div className="space-y-4">
          <AdminInput label="Title" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="Lesson title" required />
          <AdminInput label="Video URL" value={lessonForm.videoUrl} onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} placeholder="https://..." hint="YouTube, Vimeo, or direct URL" />
          <AdminSelect label="Lab" value={lessonForm.labId} onChange={(e) => setLessonForm({ ...lessonForm, labId: e.target.value })} options={labs.map((l) => ({ value: l.id, label: l.title }))} placeholder="No lab attached" />
          <AdminTextarea label="Content (Markdown)" value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} placeholder="Lesson content in markdown..." rows={10} hint="Supports markdown syntax" />
          <AdminNumber label="Order" value={lessonForm.order} onChange={(e) => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) || 0 })} min={0} />
        </div>
      </AdminModal>

      {/* Quiz Modal */}
      <AdminModal isOpen={quizModal.open} onClose={() => setQuizModal({ open: false, lesson: null })} title="Manage Quiz" size="xl" footer={<div className="flex gap-3 justify-end"><button onClick={() => setQuizModal({ open: false, lesson: null })} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium">Cancel</button><button onClick={handleSaveQuiz} disabled={saving} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Save Quiz"}</button></div>}>
        <div className="space-y-6">
          {quizForm.map((q, qi) => (
            <div key={qi} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-sm font-bold text-slate-500 mt-2.5">Q{qi + 1}</span>
                <div className="flex-1 space-y-3">
                  <input value={q.text} onChange={(e) => updateQuestion(qi, { text: e.target.value })} placeholder="Question text..." className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                  <div className="space-y-2">
                    {q.answers.map((a, ai) => (
                      <div key={ai} className="flex items-center gap-2">
                        <input type="radio" name={`q${qi}`} checked={a.isCorrect} onChange={() => { const next = [...quizForm]; next[qi].answers = next[qi].answers.map((ans, idx) => ({ ...ans, isCorrect: idx === ai })); setQuizForm(next); }} className="text-emerald-600" />
                        <input value={a.text} onChange={(e) => updateAnswer(qi, ai, { text: e.target.value })} placeholder={`Answer ${ai + 1}...`} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/20" />
                        {q.answers.length > 2 && <button onClick={() => removeAnswer(qi, ai)} className="p-1 text-slate-400 hover:text-red-500" aria-label={`Remove answer ${ai + 1}`}><Trash2 size={14} /></button>}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => addAnswer(qi)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">+ Add Answer</button>
                  </div>
                </div>
                <button onClick={() => removeQuestion(qi)} className="p-1 text-slate-400 hover:text-red-500" aria-label={`Remove question ${qi + 1}`}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          <button onClick={addQuestion} className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"><Plus size={16} /> Add Question</button>
        </div>
      </AdminModal>

      <AdminConfirmDialog isOpen={deleteDialog.open && deleteDialog.type === "lesson"} onClose={() => setDeleteDialog({ open: false, type: "", item: null })} onConfirm={handleDeleteLesson} title="Delete Lesson" message={`Delete "${deleteDialog.item?.title}"?`} loading={saving} />
      <AdminConfirmDialog isOpen={deleteDialog.open && deleteDialog.type === "lesson-with-quiz"} onClose={() => setDeleteDialog({ open: false, type: "", item: null })} onConfirm={handleDeleteLesson} title="Delete Lesson with Quiz" message={`Delete "${deleteDialog.item?.title}" and its quiz?`} loading={saving} />
    </div>
  );
}
