"use client";

interface AdminFormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function AdminFormField({ label, error, children, className = "" }: AdminFormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}

interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function AdminInput({ label, error, className = "", ...props }: AdminInputProps) {
  return (
    <AdminFormField label={label} error={error}>
      <input
        className={`w-full px-4 py-2.5 rounded-xl border ${error ? "border-red-300 ring-2 ring-red-100" : "border-slate-300"} bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm ${className}`}
        {...props}
      />
    </AdminFormField>
  );
}

interface AdminTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function AdminTextarea({ label, error, className = "", ...props }: AdminTextareaProps) {
  return (
    <AdminFormField label={label} error={error}>
      <textarea
        className={`w-full px-4 py-2.5 rounded-xl border ${error ? "border-red-300 ring-2 ring-red-100" : "border-slate-300"} bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm resize-none ${className}`}
        {...props}
      />
    </AdminFormField>
  );
}

interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function AdminSelect({ label, error, options, className = "", ...props }: AdminSelectProps) {
  return (
    <AdminFormField label={label} error={error}>
      <select
        className={`w-full px-4 py-2.5 rounded-xl border ${error ? "border-red-300 ring-2 ring-red-100" : "border-slate-300"} bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </AdminFormField>
  );
}

interface AdminStatusBadgeProps {
  status: string;
  variants?: Record<string, { bg: string; text: string }>;
}

const DEFAULT_VARIANTS: Record<string, { bg: string; text: string }> = {
  UPCOMING: { bg: "bg-emerald-50", text: "text-emerald-700" },
  LIVE: { bg: "bg-red-50", text: "text-red-700" },
  COMPLETED: { bg: "bg-slate-100", text: "text-slate-600" },
  CANCELLED: { bg: "bg-slate-100", text: "text-slate-500" },
  PENDING: { bg: "bg-amber-50", text: "text-amber-700" },
  CONFIRMED: { bg: "bg-emerald-50", text: "text-emerald-700" },
  ACTIVE: { bg: "bg-emerald-50", text: "text-emerald-700" },
  INACTIVE: { bg: "bg-slate-100", text: "text-slate-500" },
};

export function AdminStatusBadge({ status, variants }: AdminStatusBadgeProps) {
  const v = variants?.[status] || DEFAULT_VARIANTS[status] || { bg: "bg-slate-100", text: "text-slate-600" };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${v.bg} ${v.text}`}>
      {status}
    </span>
  );
}
