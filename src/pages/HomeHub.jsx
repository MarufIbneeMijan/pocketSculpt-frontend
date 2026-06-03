import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, AlertCircle } from 'lucide-react';
import { ProjectCard } from '../components/ProjectCard';
import { API_BASE } from '../config';
export const HomeHub = () => {
    const [projects, setProjects] = useState([]);
    const navigate = useNavigate();

   const fetchProjects = async () => {
    try {
        // 🚀 UPDATED CODE BLOCK: Points directly to your live cloud Render instance
        const response = await fetch(`${API_BASE}/api/projects`);
        
        if (!response.ok) throw new Error("Network pipeline response malfunction");
        const data = await response.json();
        setProjects(data);
    } catch (err) {
        console.error("API Read Failure:", err);
    }
};
    useEffect(() => { fetchProjects(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Purge Warning: Are you sure you want to permanently delete this project profile matrix?")) return;
        try {
            await fetch(`{API_BASE}api/projects/${id}`, { method: 'DELETE' });
            setProjects(prev => prev.filter(p => p._id !== id)); // Live local UI array updates
        } catch (err) { console.error("Purge Exception Error:", err); }
    };

    return (
        <div className="w-screen h-screen flex flex-col bg-[#040712] text-white overflow-x-hidden select-none">
            <header className="w-full px-8 py-5 border-b border-slate-900 bg-slate-950/20 backdrop-blur-xl flex justify-between items-center z-10">
                <div className="flex items-center gap-2.5">
                    <LayoutGrid size={16} className="text-blue-500" />
                    <h2 className="text-xs font-black tracking-widest uppercase">PocketSculpt Workspace</h2>
                </div>
                <button 
                    onClick={() => navigate('/create-project')}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] tracking-wider uppercase rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-600/10 transition-colors"
                >
                    <Plus size={14} /> New Project Portfolio
                </button>
            </header>

            <main className="flex-1 px-8 py-8 overflow-y-auto">
                {projects.length === 0 ? (
                    <div className="w-full h-96 flex flex-col items-center justify-center border border-dashed border-slate-900 rounded-3xl p-8 text-center max-w-xl mx-auto mt-12">
                        <AlertCircle size={24} className="text-slate-600 mb-3" />
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">No Properties Configured</h4>
                        <p className="text-[11px] text-slate-600 max-w-xs mb-6 leading-relaxed">Initialize your first premium listing deployment matrix to active WebGL runtime layers.</p>
                        <button onClick={() => navigate('/create-project')} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-300">Create Project Node</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                        {projects.map((project) => (
                            <ProjectCard 
                                key={project._id} 
                                project={project} 
                                onDelete={() => handleDelete(project._id)} 
                                onEdit={() => navigate(`/editor/${project._id}`)} 
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};