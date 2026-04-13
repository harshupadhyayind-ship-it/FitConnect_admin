import { createContext, useCallback, useContext, useRef, useState } from 'react';

/* ─── Context ────────────────────────────────────────────────────── */
const DialogContext = createContext(null);

/* ─── Icons ──────────────────────────────────────────────────────── */
const icons = {
  danger: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
};

const palette = {
  danger:  { box: 'bg-rose-50   text-rose-600',   btn: 'bg-rose-600   hover:bg-rose-700   text-white' },
  warning: { box: 'bg-amber-50  text-amber-500',  btn: 'bg-amber-500  hover:bg-amber-600  text-white' },
  error:   { box: 'bg-rose-50   text-rose-600',   btn: 'bg-rose-600   hover:bg-rose-700   text-white' },
  success: { box: 'bg-emerald-50 text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  info:    { box: 'bg-indigo-50  text-indigo-600', btn: 'bg-indigo-600  hover:bg-indigo-700  text-white' },
};

/* ─── Provider ───────────────────────────────────────────────────── */
export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(null);

  /* showAlert — resolves when the user clicks OK */
  const showAlert = useCallback((message, {
    title   = 'Notice',
    variant = 'info',     // 'info' | 'success' | 'warning' | 'error' | 'danger'
    okText  = 'OK',
  } = {}) => {
    return new Promise(resolve => {
      resolveRef.current = resolve;
      setDialog({ kind: 'alert', title, message, variant, okText });
    });
  }, []);

  /* showConfirm — resolves true (confirm) or false (cancel) */
  const showConfirm = useCallback((message, {
    title       = 'Are you sure?',
    variant     = 'warning',    // 'warning' | 'danger' | 'info'
    confirmText = 'Confirm',
    cancelText  = 'Cancel',
  } = {}) => {
    return new Promise(resolve => {
      resolveRef.current = resolve;
      setDialog({ kind: 'confirm', title, message, variant, confirmText, cancelText });
    });
  }, []);

  const close = (result) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setDialog(null);
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {dialog && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[200] p-4"
          onMouseDown={e => { if (e.target === e.currentTarget) close(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-[fadeUp_150ms_ease-out]"
            style={{ animation: 'fadeUp 150ms ease-out' }}>

            {/* Body */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${palette[dialog.variant]?.box}`}>
                  {icons[dialog.variant]}
                </div>
                {/* Text */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-sm font-semibold text-gray-900 leading-snug">{dialog.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{dialog.message}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-2.5 justify-end">
              {dialog.kind === 'confirm' && (
                <button
                  onClick={() => close(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                  {dialog.cancelText}
                </button>
              )}
              <button
                onClick={() => close(true)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${palette[dialog.variant]?.btn}`}>
                {dialog.kind === 'confirm' ? dialog.confirmText : dialog.okText}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

/* ─── Hook ───────────────────────────────────────────────────────── */
export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used inside <DialogProvider>');
  return ctx;
}
