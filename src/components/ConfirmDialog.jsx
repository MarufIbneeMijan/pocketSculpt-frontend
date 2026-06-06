import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm px-4 py-6">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-800 bg-[#07101d]/95 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-red-500/15 text-red-400 shadow-inner shadow-red-500/10">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm text-slate-400 leading-6">{message}</p>
            </div>
          </div>
          <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300 transition hover:bg-slate-800">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className="rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_20px_50px_rgba(236,72,153,0.25)] transition hover:from-red-400 hover:via-rose-400 hover:to-pink-400">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
