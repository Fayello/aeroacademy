"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Users, Shield, GraduationCap, UserCheck, Loader2, BarChart3, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import AdminTable from "@/components/admin/AdminTable";
import AdminModal, { AdminConfirmDialog } from "@/components/admin/AdminModal";
import { AdminInput, AdminSelect, AdminNumber, AdminTextarea, AdminStatusBadge } from "@/components/admin/AdminForm";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; item: any }>({ isOpen: false, item: null });
  const [form, setForm] = useState({ name: "", email: "", role: "STUDENT", bio: "", city: "", xp: 0 });
  const [saving, setSaving] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [batchDelete, setBatchDelete] = useState<{ open: boolean; items: { id: string }[] }>({ open: false, items: [] });
  const [batchRole, setBatchRole] = useState<{ open: boolean; items: { id: string }[]; role: string }>({ open: false, items: [], role: "STUDENT" });

  useEffect(() => { loadUsers(); loadStats(); }, []);

  const loadUsers = async (role?: string) => {
    try {
      const url = role ? `/admin/users?role=${role}` : "/admin/users";
      const data = await fetchApi(url);
      setUsers(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load users"); } finally { setLoading(false); }
  };

  const loadStats = async () => {
    try { const data = await fetchApi("/admin/users/stats"); setStats(data); } catch {}
  };

  const handleAdd = () => {
    setEditing(null);
    setForm({ name: "", email: "", role: "STUDENT", bio: "", city: "Yaoundé", xp: 0 });
    setModalOpen(true);
  };

  const handleEdit = (user: any) => {
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
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await fetchApi(`/admin/users/${deleteDialog.item.id}`, { method: "DELETE" });
      toast.success("User deleted");
      setDeleteDialog({ isOpen: false, item: null });
      loadUsers(roleFilter);
      loadStats();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
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

  const getRoleStats = (role: string) => stats?.byRole?.find((r: any) => r.role === role)?._count || 0;

  const columns = [
    {
      key: "name",
      label: "User",
      sortable: true,
      render: (user: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold">
            {(user.name || user.email)?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-900">{user.name || "No name"}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (user: any) => <AdminStatusBadge status={user.role} />,
    },
    {
      key: "xp",
      label: "XP",
      sortable: true,
      render: (user: any) => <span className="font-mono text-sm text-slate-700">{user.xp.toLocaleString()}</span>,
    },
    {
      key: "level",
      label: "Level",
      render: (user: any) => <span className="text-sm font-medium text-slate-700">Lv.{Math.floor((user.xp || 0) / 1000) + 1}</span>,
    },
    {
      key: "division",
      label: "Division",
      render: (user: any) => <span className="text-sm text-slate-600">{user.division}</span>,
    },
    {
      key: "organization",
      label: "Organization",
      render: (user: any) => <span className="text-sm text-slate-600">{user.organization?.name || "-"}</span>,
    },
    {
      key: "_count",
      label: "Activity",
      render: (user: any) => (
        <div className="flex gap-2 text-xs text-slate-500">
          <span>{user._count?.progress || 0} lessons</span>
          <span>{user._count?.labSubmissions || 0} labs</span>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      render: (user: any) => <span className="text-sm text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><Users size={28} /></div>
          <div>
            <h1 className="text-2xl font-bold">Manage Users</h1>
            <p className="text-emerald-100 text-sm">{stats?.total || 0} total users</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><Users size={18} className="text-emerald-600" /></div>
            <div><p className="text-lg font-bold text-slate-900">{stats?.total || 0}</p><p className="text-xs text-slate-500">Total</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><GraduationCap size={18} className="text-blue-600" /></div>
            <div><p className="text-lg font-bold text-slate-900">{getRoleStats("STUDENT")}</p><p className="text-xs text-slate-500">Students</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><Shield size={18} className="text-purple-600" /></div>
            <div><p className="text-lg font-bold text-slate-900">{getRoleStats("ADMIN")}</p><p className="text-xs text-slate-500">Admins</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center"><UserCheck size={18} className="text-orange-600" /></div>
            <div><p className="text-lg font-bold text-slate-900">{getRoleStats("RECRUITER")}</p><p className="text-xs text-slate-500">Recruiters</p></div>
          </div>
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
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); loadUsers(e.target.value); }} className="px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
            <option value="">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="ADMIN">Admins</option>
            <option value="RECRUITER">Recruiters</option>
          </select>
        }
      />

      {/* Edit Modal (view-only for users) */}
      <AdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Edit User" footer={<div className="flex gap-3 justify-end"><button onClick={() => setModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium">Cancel</button><button onClick={handleSave} disabled={saving} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Save"}</button></div>}>
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

      <AdminModal isOpen={batchRole.open} onClose={() => setBatchRole({ open: false, items: [], role: "STUDENT" })} title="Change User Roles" footer={<div className="flex gap-3 justify-end"><button onClick={() => setBatchRole({ open: false, items: [], role: "STUDENT" })} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium">Cancel</button><button onClick={confirmBatchRole} disabled={saving} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Apply Role"}</button></div>}>
        <p className="text-sm text-slate-600 mb-4">Set the role for <span className="font-semibold text-slate-900">{batchRole.items.length}</span> selected user{batchRole.items.length !== 1 ? "s" : ""}. Your own role cannot be changed.</p>
        <AdminSelect label="Role" value={batchRole.role} onChange={(e) => setBatchRole({ ...batchRole, role: e.target.value })} options={[{ value: "STUDENT", label: "Student" }, { value: "ADMIN", label: "Admin" }, { value: "RECRUITER", label: "Recruiter" }]} />
      </AdminModal>

      <AdminConfirmDialog isOpen={batchDelete.open} onClose={() => setBatchDelete({ open: false, items: [] })} onConfirm={confirmBatchDelete} title="Delete Users" message={`Permanently delete ${batchDelete.items.length} selected user${batchDelete.items.length > 1 ? "s" : ""}? This cannot be undone.`} loading={saving} confirmLabel="Delete Selected" />
    </div>
  );
}
