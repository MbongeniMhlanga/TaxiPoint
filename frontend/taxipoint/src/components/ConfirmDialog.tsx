import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Check, X } from 'lucide-react';

type ConfirmTone = 'danger' | 'primary';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  const confirmClasses =
    tone === 'danger'
      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500/30 shadow-red-600/20'
      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/30 shadow-blue-600/20';

  const icon =
    tone === 'danger' ? (
      <AlertTriangle className="text-red-500" size={24} />
    ) : (
      <Check className="text-blue-500" size={24} />
    );

  return createPortal(
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-sm rounded-2xl border border-gray-200/70 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">{message}</p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition"
              aria-label="Dismiss dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950/40 p-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-4 ${confirmClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog;
