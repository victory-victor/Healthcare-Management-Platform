import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, Trash2, ShieldAlert } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [modalConfig, setModalConfig] = useState(null);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Popup Modal Implementation (Replaces all browser window.alert and window.confirm dialogs)
  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      const config = typeof options === 'string' ? { message: options } : (options || {});
      setModalConfig({
        isOpen: true,
        isConfirm: true,
        title: config.title || 'Confirmation Required',
        message: config.message || 'Are you sure you want to proceed?',
        details: config.details || null,
        confirmText: config.confirmText || 'Confirm',
        cancelText: config.cancelText || 'Cancel',
        type: config.type || 'danger',
        onConfirm: () => {
          setModalConfig(null);
          resolve(true);
        },
        onCancel: () => {
          setModalConfig(null);
          resolve(false);
        }
      });
    });
  }, []);

  const alert = useCallback((options) => {
    return new Promise((resolve) => {
      const config = typeof options === 'string' ? { message: options } : (options || {});
      setModalConfig({
        isOpen: true,
        isConfirm: false,
        title: config.title || 'Notice',
        message: config.message || '',
        details: config.details || null,
        buttonText: config.buttonText || 'Understood',
        type: config.type || 'info',
        onConfirm: () => {
          setModalConfig(null);
          resolve(true);
        },
        onCancel: () => {
          setModalConfig(null);
          resolve(true);
        }
      });
    });
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    confirm,
    alert
  };

  return (
    <ToastContext.Provider value={{ toast, confirm, alert }}>
      {children}

      {/* Floating Corner Toasts */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm transition-all duration-300 animate-slide-in ${
              t.type === 'success'
                ? 'bg-white border-emerald-200 text-slate-800'
                : t.type === 'error'
                ? 'bg-white border-rose-200 text-slate-800'
                : t.type === 'warning'
                ? 'bg-white border-amber-200 text-slate-800'
                : 'bg-white border-sky-200 text-slate-800'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
            {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />}
            
            <div className="flex-1 font-medium">{t.message}</div>
            
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Interactive In-App Confirmation / Alert Popup Modal */}
      {modalConfig && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-start gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                modalConfig.type === 'danger'
                  ? 'bg-rose-100 text-rose-600'
                  : modalConfig.type === 'warning'
                  ? 'bg-amber-100 text-amber-600'
                  : modalConfig.type === 'success'
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-sky-100 text-sky-600'
              }`}>
                {modalConfig.type === 'danger' && <Trash2 className="w-5 h-5" />}
                {modalConfig.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                {modalConfig.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                {modalConfig.type === 'info' && <Info className="w-5 h-5" />}
              </div>

              <div className="space-y-1 flex-1 pr-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  {modalConfig.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {modalConfig.message}
                </p>
                {modalConfig.details && (
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 font-mono whitespace-pre-line">
                    {modalConfig.details}
                  </div>
                )}
              </div>

              <button
                onClick={modalConfig.onCancel}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              {modalConfig.isConfirm ? (
                <>
                  <button
                    type="button"
                    onClick={modalConfig.onCancel}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    {modalConfig.cancelText}
                  </button>
                  <button
                    type="button"
                    onClick={modalConfig.onConfirm}
                    className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition ${
                      modalConfig.type === 'danger'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : modalConfig.type === 'warning'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-teal-600 hover:bg-teal-700'
                    }`}
                  >
                    {modalConfig.confirmText}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={modalConfig.onConfirm}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition"
                >
                  {modalConfig.buttonText || 'Understood'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context.toast;
};

export const useModal = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useModal must be used within ToastProvider');
  }
  return {
    confirm: context.confirm,
    alert: context.alert
  };
};
