"use client";

import { useEffect, useRef } from "react";
import { X, Info, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: "info" | "warning" | "danger" | "success";
  confirmText?: string;
  cancelText?: string;
}

const icons = {
  info: Info,
  warning: AlertTriangle,
  danger: AlertCircle,
  success: CheckCircle,
};

const iconColors = {
  info: "text-blue-400 bg-blue-500/10",
  warning: "text-amber-400 bg-amber-500/10",
  danger: "text-red-400 bg-red-500/10",
  success: "text-[#7AD62A] bg-[#7AD62A]/10",
};

const confirmStyles = {
  info: "bg-blue-600 hover:bg-blue-700 text-white",
  warning: "bg-amber-600 hover:bg-amber-700 text-white",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  success: "bg-[#7AD62A] hover:bg-[#6bc422] text-[#0F203A]",
};

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "info",
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      dialogRef.current?.focus();
    } else {
      document.body.style.overflow = "unset";
      previousFocus.current?.focus();
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  const Icon = icons[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-message"
        className="relative bg-[#0f172a] rounded-xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconColors[type]}`}>
              <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 id="modal-title" className="text-lg font-semibold text-white">{title}</h3>
              <p id="modal-message" className="mt-2 text-sm text-slate-400 leading-relaxed">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="px-6 py-4 bg-white/5 border-t border-white/6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            {cancelText}
          </button>
          {onConfirm && (
            <button
              onClick={() => {
                try {
                  const result = (onConfirm as () => unknown)();
                  if (result && typeof (result as Promise<unknown>).then === "function") {
                    (result as Promise<unknown>).catch(() => {}).finally(() => onClose());
                  } else {
                    onClose();
                  }
                } catch {
                  onClose();
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${confirmStyles[type]}`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
