"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/format";
import { Users, Shield, GraduationCap, UserCheck, Trash2, ClipboardCheck, AlertTriangle } from "lucide-react";
import toast from "@/lib/toast";
import AdminTable from "@/components/admin/AdminTable";
import AdminModal, { AdminConfirmDialog } from "@/components/admin/AdminModal";
import { AdminInput, AdminSelect, AdminNumber, AdminTextarea, AdminStatusBadge } from "@/components/admin/AdminForm";
import type { AdminUser, UserStats } from "@/types/api";
import PageHeader from "@/components/ui/PageHeader";

type EditingUser = Pick<AdminUser, "id" | "name" | "email" | "role" | "bio" | "city" | "xp"> | null;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditingUser>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; item: AdminUser | null }>({ isOpen: false, item: null });
  const [form, setForm] = useState({ name: "", email: "", role: "STUDENT", bio: "", city: "", xp: 0 });
  const [saving, setSaving] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [batchDelete, setBatchDelete] = useState<{ open: boolean; items: { id: string }[] }>({ open: false, items: [] });
  const [batchRole, setBatchRole] = useState<{ open: boolean; items: { id: string }[]; role: string }>({ open: false, items: [], role: "STUDENT" });

  const loadUsers = useCallback(async (role?: string) => {
    try {
      const url = role ? `/admin/users?role=${role}` : "/admin/users";
      const data = await fetchApi(url);
      setUsers(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load users"); } finally { setLoading(false); }
  }, []);

  const loadStats = useCallback(async () => {
    try { const data = await fetchApi("/admin/users/stats"); setStats(data); } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchApi("/admin/users");
        if (!cancelled) setUsers(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Failed to load users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    (async () => {
      try {
        const data = await fetchApi("/admin/users/stats");
        if (!cancelled) setStats(data);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEdit = (user: AdminUser) => {
    setEditing(user);
    setForm({ name: user.name || "", email: user.email, role: user.role, bio: user.bio || "", city: user.city || "", xp: user.xp || 0 });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.email.trim()) { toast.error("Email is required"); return; }
    setSaving(true);
    try {
      if (editing) {
        await fetchApi(`/admin/users/${editing.id}`, { method: "PATCH", body: JSON.stringify(form) });
        toast.success("User updated");
      }
      setModalOpen(false);
      loadUsers(roleFilter);
      loadStats();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteDialog.item) return;
    setSaving(true);
    try {
      await fetchApi(`/admin/users/${deleteDialog.item.id}`, { method: "DELETE" });
      toast.success("User deleted");
      setDeleteDialog({ isOpen: false, item: null });
      loadUsers(roleFilter);
      loadStats();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };

  const handleBatchDelete = (selected: { id: string }[]) => {
    setBatchDelete({ open: true, items: selected });
  };

  const confirmBatchDelete = async () => {
    setSaving(true);
    try {
      const res = await fetchApi("/admin/users/batch/delete", {
        method: "POST",
        body: JSON.stringify({ ids: batchDelete.items.map((u) => u.id) }),
      });
      toast.success(`Deleted ${res.deleted || batchDelete.items.length} user${(res.deleted || batchDelete.items.length) !== 1 ? "s" : ""}`);
      setBatchDelete({ open: false, items: [] });
      loadUsers(roleFilter);
      loadStats();
    } catch {
      toast.error("Failed to delete users");
    } finally { setSaving(false); }
  };

  const handleBatchRole = (selected: { id: string }[]) => {
    setBatchRole({ open: true, items: selected, role: "STUDENT" });
  };

  const confirmBatchRole = async () => {
    setSaving(true);
    try {
      const res = await fetchApi("/admin/users/batch/role", {
        method: "POST",
        body: JSON.stringify({ ids: batchRole.items.map((u) => u.id), role: batchRole.role }),
      });
      toast.success(`Role updated for ${res.updated || batchRole.items.length} user${(res.updated || batchRole.items.length) !== 1 ? "s" : ""}`);
      setBatchRole({ open: false, items: [], role: "STUDENT" });
      loadUsers(roleFilter);
      loadStats();
    } catch {
      toast.error("Failed to update roles");
    } finally { setSaving(false); }
  };

  const getRoleStats = (role: string) => stats?.byRole?.find((r) => r.role === role)?._count || 0;
  const recruiterCount = getRoleStats("RECRUITER");
  const adminCount = getRoleStats("ADMIN");
  const studentCount = getRoleStats("STUDENT");

  const columns = [
    {
      key: "name",
      label: "User",
      sortable: true,
      render: (user: AdminUser) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7AD62A] to-teal-600 flex items-center justify-center text-white text-sm font-bold">
            {(user.name || user.email)?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-white">{user.name || "No name"}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (user: AdminUser) => <AdminStatusBadge status={user.role} />,
    },
    {
      key: "xp",
      label: "XP",
      sortable: true,
      render: (user: AdminUser) => <span className="font-mono text-sm text-slate-200">{(user.xp || 0).toLocaleString()}</span>,
    },
    {
      key: "level",
      label: "Level",
      render: (user: AdminUser) => <span className="text-sm font-medium text-slate-200">Lv.{Math.floor((user.xp || 0) / 1000) + 1}</span>,
    },
    {
      key: "division",
      label: "Division",
      render: (user: AdminUser) => <span className="text-sm text-slate-300">{user.division}</span>,
    },
    {
      key: "organization",
      label: "Organization",
      render: (user: AdminUser) => <span className="text-sm text-slate-300">{user.organization?.name || "-"}</span>,
    },
    {
      key: "_count",
      label: "Activity",
      render: (user: AdminUser) => (
        <div className="flex gap-2 text-xs text-slate-400">
          <span>{user._count?.progress || 0} lessons</span>
          <span>{user._count?.labSubmissions || 0} labs</span>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      render: (user: AdminUser) => <span className="text-sm text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="User Management"
        description="Control platform access, role hygiene, and account quality from one governed workflow"
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F203A] via-[#122a47] to-[#1b3657] p-6 sm:p-7">
        <div className="absolute inset-0 dot-grid-bg opacity-[0.04] pointer-events-none" />
        <div className="relative grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AD62A]">Access Governance</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Manage people, not just records</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Review role distribution, learner activity, and organization linkage together so account changes stay deliberate and defensible.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Total accounts</p>
                <p className="mt-2 text-sm font-semibold text-white">{stats?.total || 0} visible users</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Role-sensitive users</p>
                <p className="mt-2 text-sm font-semibold text-white">{adminCount + recruiterCount} admin and recruiter accounts</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Primary population</p>
                <p className="mt-2 text-sm font-semibold text-white">{studentCount} learner accounts</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#7AD62A]/20 bg-[#0b1627]/80 p-5">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={16} className="text-[#7AD62A]" />
              <p className="text-sm font-semibold text-white">Recommended review order</p>
            </div>
            <div className="mt-4 space-y-3">
              {[
                "Check role filters before applying bulk edits.",
                "Review organization and activity signals before changing access.",
                "Reserve deletions for clear account cleanup, not normal role changes.",
              ].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="angular-card bg-[#0f172a] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7AD62A]/10 flex items-center justify-center"><Users size={18} className="text-[#7AD62A]" /></div>
            <div><p className="text-lg font-bold text-white">{stats?.total || 0}</p><p className="text-xs text-slate-400">Total</p></div>
          </div>
        </div>
        <div className="angular-card bg-[#0f172a] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><GraduationCap size={18} className="text-blue-600" /></div>
            <div><p className="text-lg font-bold text-white">{studentCount}</p><p className="text-xs text-slate-400">Students</p></div>
          </div>
        </div>
        <div className="angular-card bg-[#0f172a] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><Shield size={18} className="text-purple-600" /></div>
            <div><p className="text-lg font-bold text-white">{adminCount}</p><p className="text-xs text-slate-400">Admins</p></div>
          </div>
        </div>
        <div className="angular-card bg-[#0f172a] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center"><UserCheck size={18} className="text-orange-600" /></div>
            <div><p className="text-lg font-bold text-white">{recruiterCount}</p><p className="text-xs text-slate-400">Recruiters</p></div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Role-change caution</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Treat admin and recruiter assignments as governance events. Review account activity and organization context before promoting access.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={16} className="text-[#7AD62A]" />
            <h3 className="text-sm font-semibold text-white">What to check first</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Filter by role, scan organization linkage, then use activity counts to confirm whether the account is active, dormant, or misconfigured.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
          <div className="flex items-center gap-2">
            <UserCheck size={16} className="text-[#7AD62A]" />
            <h3 className="text-sm font-semibold text-white">Bulk actions</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Use bulk role changes for planned access reviews. Use bulk deletion only for clear cleanup cases where records should not remain active.
          </p>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={users}
        loading={loading}
        searchKeys={["name", "email", "city"]}
        searchPlaceholder="Search by name, email, or city..."
        onEdit={handleEdit}
        onDelete={(item) => setDeleteDialog({ isOpen: true, item })}
        selectable
        exportable
        exportFilename="users"
        bulkActions={[
          { label: "Set Role", icon: <UserCheck size={16} />, onClick: handleBatchRole },
          { label: "Delete", icon: <Trash2 size={16} />, variant: "danger", onClick: handleBatchDelete },
        ]}
        filters={
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); loadUsers(e.target.value); }} className="rounded-xl border border-white/10 bg-[#0f172a] px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20">
            <option value="">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="ADMIN">Admins</option>
            <option value="RECRUITER">Recruiters</option>
          </select>
        }
      />

      {/* Edit Modal (view-only for users) */}
      <AdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Edit User" footer={<div className="flex gap-3 justify-end"><button onClick={() => setModalOpen(false)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5">Cancel</button><button onClick={handleSave} disabled={saving} className="rounded-xl bg-[#7AD62A] px-4 py-2.5 text-sm font-medium text-[#0F203A] hover:bg-[#6bc422] disabled:opacity-50">{saving ? "Saving..." : "Save"}</button></div>}>
        <div className="space-y-4">
          <AdminInput label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
          <AdminInput label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" required />
          <AdminSelect label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={[{ value: "STUDENT", label: "Student" }, { value: "ADMIN", label: "Admin" }, { value: "RECRUITER", label: "Recruiter" }]} />
          <AdminInput label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />
          <AdminTextarea label="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Bio" rows={3} />
          <AdminNumber label="XP" value={form.xp} onChange={(e) => setForm({ ...form, xp: parseInt(e.target.value) || 0 })} min={0} />
        </div>
      </AdminModal>

      <AdminConfirmDialog isOpen={deleteDialog.isOpen} onClose={() => setDeleteDialog({ isOpen: false, item: null })} onConfirm={handleDelete} title="Delete User" message={`Permanently delete "${deleteDialog.item?.email}"? This cannot be undone.`} loading={saving} />

      <AdminModal isOpen={batchRole.open} onClose={() => setBatchRole({ open: false, items: [], role: "STUDENT" })} title="Change User Roles" footer={<div className="flex gap-3 justify-end"><button onClick={() => setBatchRole({ open: false, items: [], role: "STUDENT" })} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5">Cancel</button><button onClick={confirmBatchRole} disabled={saving} className="rounded-xl bg-[#7AD62A] px-4 py-2.5 text-sm font-medium text-[#0F203A] hover:bg-[#6bc422] disabled:opacity-50">{saving ? "Saving..." : "Apply Role"}</button></div>}>
        <p className="mb-4 text-sm text-slate-300">Set the role for <span className="font-semibold text-white">{batchRole.items.length}</span> selected user{batchRole.items.length !== 1 ? "s" : ""}. Your own role cannot be changed.</p>
        <AdminSelect label="Role" value={batchRole.role} onChange={(e) => setBatchRole({ ...batchRole, role: e.target.value })} options={[{ value: "STUDENT", label: "Student" }, { value: "ADMIN", label: "Admin" }, { value: "RECRUITER", label: "Recruiter" }]} />
      </AdminModal>

      <AdminConfirmDialog isOpen={batchDelete.open} onClose={() => setBatchDelete({ open: false, items: [] })} onConfirm={confirmBatchDelete} title="Delete Users" message={`Permanently delete ${batchDelete.items.length} selected user${batchDelete.items.length > 1 ? "s" : ""}? This cannot be undone.`} loading={saving} confirmLabel="Delete Selected" />
    </div>
  );
}
