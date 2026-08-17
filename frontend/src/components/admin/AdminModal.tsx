"use client";

import { useEffect, useRef, useCallback } from "react";
import { X, Loader2, Trash2, AlertTriangle, Info } from "lucide-react";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  footer?: React.ReactNode;
  loading?: boolean;
  preventClose?: boolean;
}

export default function AdminModal({ isOpen, onClose, title, children, size = "md", footer, loading = false, preventClose = false }: AdminModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const stableClose = useCallback(() => onCloseRef.current(), []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !preventClose) stableClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, stableClose, preventClose]);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    "2xl": "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={preventClose ? undefined : onClose}
      />
      <div className={`relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="animate-spin" size={16} />
              Saving...
            </div>
          ) : (
            <button
        onClick={preventClose ? undefined : stableClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Content */}
        <div ref={contentRef} className="px-6 py-4 overflow-y-auto flex-1 min-h-0">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface AdminConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  type?: "danger" | "warning" | "info";
  loading?: boolean;
}

export function AdminConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  type = "danger",
  loading = false,
}: AdminConfirmDialogProps) {
  if (!isOpen) return null;

  const typeConfig = {
    danger: { bg: "bg-red-600 hover:bg-red-700", IconComponent: Trash2, iconColor: "text-red-600" },
    warning: { bg: "bg-amber-600 hover:bg-amber-700", IconComponent: AlertTriangle, iconColor: "text-amber-600" },
    info: { bg: "bg-blue-600 hover:bg-blue-700", IconComponent: Info, iconColor: "text-blue-600" },
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-2 rounded-xl bg-slate-100 ${config.iconColor}`}><config.IconComponent size={24} /></div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-50 ${config.bg}`}
          >
            {loading && <Loader2 className="animate-spin inline mr-2" size={14} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
