import React from 'react';
import { Home, Trash2, Edit3 } from 'lucide-react';

export const ProjectCard = ({ project, onEdit, onDelete }) => {
    return (
        <div className="p-6 bg-slate-900/30 border border-slate-800/80 rounded-2xl relative flex flex-col shadow-xl backdrop-blur-xl group hover:border-slate-700/60 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-center text-blue-400 mb-4">
                <Home size={18} />
            </div>
            <h4 className="text-sm font-bold text-white mb-1 truncate">{project.name}</h4>
            <p className="text-xs text-slate-500 line-clamp-2 h-8 leading-relaxed mb-4">{project.description}</p>
            
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 bg-slate-950/30 border border-slate-900 p-3 rounded-xl mb-5">
                <div>Rooms: <span className="text-white font-black">{project.rooms?.length || 0}</span></div>
                <div className="truncate max-w-[140px]">Plan: <span className="text-blue-400">{project.blueprintImage.split('/').pop()}</span></div>
            </div>

            <div className="flex gap-2.5 mt-auto">
                <button 
                    onClick={onEdit}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-blue-600 border border-slate-700/50 hover:border-blue-500 text-slate-300 hover:text-white font-bold text-[10px] tracking-widest uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 shadow-md"
                >
                    <Edit3 size={11} /> Workspace
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="px-3.5 py-2.5 bg-slate-950 hover:bg-red-950/40 border border-slate-800/80 hover:border-red-900 text-slate-500 hover:text-red-400 rounded-xl flex items-center justify-center transition-all duration-200"
                >
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    );
};