import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, AlertCircle } from 'lucide-react';
import { ProjectCard } from '../components/ProjectCard';
import DatabaseLoadingModal from '../components/DatabaseLoadingModal';
import LogoutButton from '../components/LogoutButton';
import { API_BASE } from '../config';
export const HomeHub = ({ onLogout }) => {
    const [projects, setProjects] = useState([]);
    const navigate = useNavigate();
    const [loading,setLoading ]=useState(false);
    const [wait,setWait]= useState(null);

   const fetchProjects = async () => {
    setLoading(true)
    const start = performance.now()
    try {
        // const sart = performance.now()
        // 🚀 UPDATED CODE BLOCK: Points directly to your live cloud Render instance
        const response = await fetch(`${API_BASE}/api/projects`);
        
        
        
        if (!response.ok) throw new Error("Network pipeline response malfunction");
        const data = await response.json();
        setProjects(data);
    } catch (err) {
        console.error("API Read Failure:", err);
    } finally {
        const end = performance.now();
        setWait((end-start).toFixed(2));
        setLoading(false)
        // const 
    }


};
    useEffect(() => { fetchProjects(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Purge Warning: Are you sure you want to permanently delete this project profile matrix?")) return;
        try {
           await fetch(`${API_BASE}/api/projects/${id}`, { method: 'DELETE' });
            setProjects(prev => prev.filter(p => p._id !== id)); // Live local UI array updates
        } catch (err) { console.error("Purge Exception Error:", err); }
    }

    if (loading) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-[#040814] text-white p-4 font-sans relative overflow-hidden">
                {/* Soft Ambient Vector Glow Backdrops */}
                <div className="absolute w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[120px] top-1/3 -left-28 pointer-events-none" />
                <div className="absolute w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[120px] bottom-1/3 -right-28 pointer-events-none" />
                <DatabaseLoadingModal isOpen={true} />
            </div>
        );
    }
    return (
        <div className="w-screen h-screen flex flex-col bg-[#040712] text-white overflow-x-hidden select-none font-sans">
            <header className="w-full px-6 sm:px-8 py-5 border-b border-slate-900 bg-slate-950/20 backdrop-blur-xl flex flex-col gap-4 md:flex-row justify-between items-start md:items-center z-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2.5">
                        <LayoutGrid size={18} className="text-cyan-400" />
                        <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-slate-400">Workspace</span>
                    </div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-white font-['Space_Grotesk',sans-serif]">
                        PocketSculpt Workspace
                    </h2>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <button 
                        onClick={() => navigate('/create-project')}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-4 py-2 text-[10px] sm:px-5 sm:py-2.5 sm:text-[11px] md:text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_20px_50px_rgba(34,211,238,0.18)] transition duration-200 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500"
                    >
                        <Plus size={16} /> New Project
                    </button>
                    <LogoutButton onLogout={onLogout} />
                </div>
            </header>

            <main className="flex-1 px-8 py-8 overflow-y-auto">
                {!loading && projects.length === 0 ? (
                    <div className="w-full min-h-[22rem] flex flex-col items-center justify-center border border-dashed border-slate-900 rounded-3xl p-8 text-center max-w-xl mx-auto mt-12 bg-slate-950/50 backdrop-blur-xl">
                        <AlertCircle size={24} className="text-slate-500 mb-3" />
                        <h4 className="text-sm sm:text-base font-semibold text-slate-100 uppercase tracking-[0.22em] mb-2">
                            No Properties Configured
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6 leading-6">
                            Initialize your first premium listing deployment matrix to active WebGL runtime layers.
                        </p>
                        <button onClick={() => navigate('/create-project')} className="px-4 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 hover:from-slate-700 hover:via-slate-800 hover:to-slate-900 border border-slate-800 rounded-2xl font-semibold text-[10px] sm:text-[11px] uppercase tracking-[0.24em] text-slate-100 shadow-lg shadow-slate-950/50 transition duration-200">
                            Create Project Node
                        </button>
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