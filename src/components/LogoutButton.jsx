import React, { useState } from 'react';
import { LogOut, AlertTriangle, X } from 'lucide-react';

const LogoutButton = ({ onLogout }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleOpen = () => setConfirmOpen(true);
  const handleClose = () => setConfirmOpen(false);
  const handleConfirm = () => {
    setConfirmOpen(false);
    onLogout?.();
  };

  return (
    <> 
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
      >
        <LogOut size={14} />
        Logout
      </button>

      {confirmOpen && (
        <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-2xl shadow-black/60">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.22em] text-slate-100">Confirm logout</h3>
                  <p className="mt-2 text-[11px] leading-5 text-slate-400">
                    This will end your current session and redirect you back to the login screen.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 transition hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-2xl bg-rose-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-rose-700"
              >
                Yes, sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LogoutButton;
