"use client";

import { useState, useRef } from "react";
import { Upload, X, Plus } from "lucide-react";

interface AdminFormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
  required?: boolean;
}

export function AdminFormField({ label, error, children, className = "", hint, required }: AdminFormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function AdminInput({ label, error, hint, required, className = "", ...props }: AdminInputProps) {
  return (
    <AdminFormField label={label} error={error} hint={hint} required={required}>
      <input
        className={`w-full px-4 py-2.5 rounded-xl border ${error ? "border-red-300 ring-2 ring-red-100" : "border-slate-300"} bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm ${className}`}
        {...props}
      />
    </AdminFormField>
  );
}

interface AdminNumberProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export function AdminNumber({ label, error, hint, required, className = "", min, max, step, ...props }: AdminNumberProps) {
  return (
    <AdminFormField label={label} error={error} hint={hint} required={required}>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        className={`w-full px-4 py-2.5 rounded-xl border ${error ? "border-red-300 ring-2 ring-red-100" : "border-slate-300"} bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm ${className}`}
        {...props}
      />
    </AdminFormField>
  );
}

interface AdminTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function AdminTextarea({ label, error, hint, required, className = "", ...props }: AdminTextareaProps) {
  return (
    <AdminFormField label={label} error={error} hint={hint} required={required}>
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
  hint?: string;
  required?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function AdminSelect({ label, error, hint, required, options, placeholder, className = "", ...props }: AdminSelectProps) {
  return (
    <AdminFormField label={label} error={error} hint={hint} required={required}>
      <select
        className={`w-full px-4 py-2.5 rounded-xl border ${error ? "border-red-300 ring-2 ring-red-100" : "border-slate-300"} bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </AdminFormField>
  );
}

interface AdminSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
}

export function AdminSwitch({ label, checked, onChange, error, hint, disabled }: AdminSwitchProps) {
  return (
    <AdminFormField label={label} error={error} hint={hint}>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-emerald-600" : "bg-slate-300"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </AdminFormField>
  );
}

interface AdminCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  disabled?: boolean;
}

export function AdminCheckbox({ label, checked, error, disabled }: AdminCheckboxProps) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${checked ? "bg-emerald-600 border-emerald-600" : "border-slate-300 bg-white"}`}>
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-sm text-slate-700">{label}</span>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

interface AdminRadioProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string;
  onChange: (value: string) => void;
  error?: string;
  horizontal?: boolean;
}

export function AdminRadio({ label, options, selected, error, horizontal }: AdminRadioProps) {
  return (
    <AdminFormField label={label} error={error}>
      <div className={`flex ${horizontal ? "flex-row flex-wrap gap-4" : "flex-col gap-2"}`}>
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected === opt.value ? "border-emerald-600" : "border-slate-300"}`}>
              {selected === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
            </div>
            <span className="text-sm text-slate-700">{opt.label}</span>
          </label>
        ))}
      </div>
    </AdminFormField>
  );
}

interface AdminDatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  type?: "date" | "datetime-local" | "time";
}

export function AdminDatePicker({ label, value, onChange, error, hint, required, type = "datetime-local" }: AdminDatePickerProps) {
  return (
    <AdminFormField label={label} error={error} hint={hint} required={required}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-2.5 rounded-xl border ${error ? "border-red-300 ring-2 ring-red-100" : "border-slate-300"} bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm`}
      />
    </AdminFormField>
  );
}

interface AdminTagsProps {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  maxTags?: number;
}

export function AdminTags({ label, tags, onChange, error, hint, placeholder = "Add tag...", maxTags }: AdminTagsProps) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const tag = input.trim();
    if (tag && !tags.includes(tag) && (!maxTags || tags.length < maxTags)) {
      onChange([...tags, tag]);
      setInput("");
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <AdminFormField label={label} error={error} hint={hint}>
      <div className="space-y-2">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm">
                {tag}
                <button onClick={() => removeTag(i)} className="hover:text-emerald-900 transition-colors" aria-label={`Remove tag ${tag}`}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            placeholder={placeholder}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
          />
          <button
            type="button"
            onClick={addTag}
            disabled={!input.trim() || (maxTags ? tags.length >= maxTags : false)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-all disabled:opacity-50"
          >
            <Plus size={16} />
          </button>
        </div>
        {maxTags && <p className="text-xs text-slate-400">{tags.length}/{maxTags} tags</p>}
      </div>
    </AdminFormField>
  );
}

interface AdminFileUploadProps {
  label: string;
  accept?: string;
  onChange: (file: File | null) => void;
  currentFile?: string | null;
  error?: string;
  hint?: string;
}

export function AdminFileUpload({ label, accept, onChange, currentFile, error, hint }: AdminFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onChange(file);
  };

  return (
    <AdminFormField label={label} error={error} hint={hint}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
          dragOver ? "border-emerald-500 bg-emerald-50" : "border-slate-300 hover:border-slate-400 bg-slate-50"
        }`}
      >
        <Upload size={24} className="text-slate-400 mb-2" />
        <p className="text-sm text-slate-600 font-medium">Click or drag to upload</p>
        <p className="text-xs text-slate-400 mt-1">{accept || "Any file type"}</p>
        {currentFile && (
          <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
            <span className="text-sm text-emerald-700 truncate max-w-[200px]">{currentFile}</span>
            <button onClick={(e) => { e.stopPropagation(); onChange(null); }} className="text-emerald-600 hover:text-emerald-800" aria-label={`Remove file ${currentFile}`}>
              <X size={14} />
            </button>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => onChange(e.target.files?.[0] || null)} />
    </AdminFormField>
  );
}

interface AdminStatusBadgeProps {
  status: string;
  variants?: Record<string, { bg: string; text: string; dot?: string }>;
}

const DEFAULT_VARIANTS: Record<string, { bg: string; text: string; dot: string }> = {
  UPCOMING: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  LIVE: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  COMPLETED: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  CANCELLED: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  CONFIRMED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  ACTIVE: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  INACTIVE: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
  RUNNING: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  STOPPED: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  EXPIRED: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
  PROVISIONING: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  ADMIN: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  STUDENT: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  RECRUITER: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
};

export function AdminStatusBadge({ status, variants }: AdminStatusBadgeProps) {
  const v = variants?.[status] || DEFAULT_VARIANTS[status] || { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${v.bg} ${v.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
      {status}
    </span>
  );
}
