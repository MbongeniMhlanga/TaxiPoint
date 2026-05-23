import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  autoClose?: number | false;
  title?: string;
}

interface InternalToast {
  id: string;
  type: ToastVariant;
  message: string;
  title: string;
  autoClose: number | false;
}

interface ToastContainerProps {
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  theme?: 'light' | 'dark' | 'colored';
  className?: string;
}

const DEFAULT_AUTO_CLOSE: Record<ToastVariant, number> = {
  success: 3200,
  error: 5200,
  info: 3600,
  warning: 4200,
};

const VARIANT_META: Record<ToastVariant, { icon: React.ReactNode; accent: string; label: string }> = {
  success: { icon: <CheckCircle2 size={18} />, accent: '#22C55E', label: 'Success' },
  error: { icon: <XCircle size={18} />, accent: '#EF4444', label: 'Error' },
  info: { icon: <Info size={18} />, accent: '#3B82F6', label: 'Info' },
  warning: { icon: <AlertTriangle size={18} />, accent: '#F59E0B', label: 'Warning' },
};

let toastId = 0;
let containerId = 0;
let activeContainerId: number | null = null;
let items: InternalToast[] = [];
const listeners = new Set<() => void>();
const timers = new Map<string, number>();

const emit = () => {
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const removeToast = (id?: string) => {
  if (id) {
    items = items.filter((item) => item.id !== id);
    const timer = timers.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.delete(id);
    }
  } else {
    items.forEach((item) => {
      const timer = timers.get(item.id);
      if (timer) {
        window.clearTimeout(timer);
        timers.delete(item.id);
      }
    });
    items = [];
  }

  emit();
};

const pushToast = (type: ToastVariant, message: string, options?: ToastOptions) => {
  const id = `tp-toast-${++toastId}`;
  const title = options?.title ?? VARIANT_META[type].label;
  const autoClose = options?.autoClose ?? DEFAULT_AUTO_CLOSE[type];

  items = [
    ...items,
    {
      id,
      type,
      message,
      title,
      autoClose,
    },
  ];

  emit();

  if (autoClose !== false && typeof window !== 'undefined') {
    const timer = window.setTimeout(() => {
      removeToast(id);
    }, autoClose);
    timers.set(id, timer);
  }

  return id;
};

export const toast = {
  success: (message: string, options?: ToastOptions) => pushToast('success', message, options),
  error: (message: string, options?: ToastOptions) => pushToast('error', message, options),
  info: (message: string, options?: ToastOptions) => pushToast('info', message, options),
  warning: (message: string, options?: ToastOptions) => pushToast('warning', message, options),
  dismiss: (id?: string) => removeToast(id),
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'top-center',
  theme = 'light',
  className,
}) => {
  const [mounted, setMounted] = useState(false);
  const [containerToken] = useState(() => {
    containerId += 1;
    return containerId;
  });
  const [snapshot, setSnapshot] = useState<InternalToast[]>(items);

  useEffect(() => {
    setMounted(true);
    if (activeContainerId === null) {
      activeContainerId = containerToken;
    }

    const unsubscribe = subscribe(() => {
      setSnapshot([...items]);
    });

    return () => {
      unsubscribe();
      if (activeContainerId === containerToken) {
        activeContainerId = null;
      }
    };
  }, [containerToken]);

  const positionClass = useMemo(() => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top-center':
      default:
        return 'top-4 left-1/2 -translate-x-1/2';
    }
  }, [position]);

  const cardThemeClass = useMemo(() => {
    switch (theme) {
      case 'dark':
        return 'bg-slate-900 text-white border-slate-700 shadow-black/30';
      case 'colored':
      case 'light':
      default:
        return 'bg-white text-slate-900 border-slate-200 shadow-slate-900/10 dark:bg-slate-900 dark:text-white dark:border-slate-700';
    }
  }, [theme]);

  if (!mounted || activeContainerId !== containerToken || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className={`pointer-events-none fixed z-[9999] flex w-[min(100vw-1rem,28rem)] flex-col gap-3 ${positionClass} ${className ?? ''}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence initial={false}>
        {snapshot.map((item) => {
          const meta = VARIANT_META[item.type];

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className={`pointer-events-auto overflow-hidden rounded-2xl border backdrop-blur-xl ${cardThemeClass}`}
              style={{ boxShadow: '0 20px 45px rgba(15, 23, 42, 0.18)' }}
            >
              <div className="flex items-start gap-3 p-4">
                <div
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: meta.accent }}
                >
                  {meta.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold leading-5">{item.title}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
                        {item.message}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeToast(item.id)}
                      className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                      aria-label="Dismiss notification"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700/70">
                    <div
                      className="h-full rounded-full"
                      style={{ backgroundColor: meta.accent, width: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default toast;
