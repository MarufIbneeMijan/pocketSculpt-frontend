import React from 'react';
import { Database, Loader2, RefreshCw } from 'lucide-react';

const DatabaseLoadingModal = ({ isOpen = true }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300">
      {/* Modal Container */}
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-black p-6 shadow-2xl shadow-black/50 md:p-8">
        
        {/* Top Icon & Status Section */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 shadow-inner">
            <Database className="h-8 w-8 animate-pulse text-indigo-400" />
            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black border border-slate-800">
              <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
            </div>
          </div>
          
          <h3 className="text-xl font-semibold tracking-wide text-slate-100 md:text-2xl">
            Retrieving Data
          </h3>
          <p className="mt-2 text-sm text-slate-400 max-w-xs">
            Querying the database and preparing your dashboard. Please hang tight.
          </p>
        </div>

        {/* Animated Custom Progress Bar */}
        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 origin-left animate-[loading_1.5s_infinite_ease-in-out]" />
        </div>

        {/* Skeleton UI Content Placeholder */}
        <div className="mt-8 space-y-4 rounded-xl border border-slate-800/60 bg-slate-950/50 p-4">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-slate-800 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded bg-slate-800 animate-pulse" />
              <div className="h-2 w-1/2 rounded bg-slate-800/60 animate-pulse" />
            </div>
          </div>
          
          <hr className="border-slate-900" />
          
          <div className="space-y-2.5">
            <div className="h-2.5 w-full rounded bg-slate-800/80 animate-pulse" />
            <div className="h-2.5 w-5/6 rounded bg-slate-800/80 animate-pulse" />
            <div className="h-2.5 w-2/3 rounded bg-slate-800/40 animate-pulse" />
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-slate-500">
          <RefreshCw className="h-3 w-3 animate-spin [animation-duration:3s]" />
          <span>Establishing secure connection...</span>
        </div>

      </div>
    </div>
  );
};

export default DatabaseLoadingModal;