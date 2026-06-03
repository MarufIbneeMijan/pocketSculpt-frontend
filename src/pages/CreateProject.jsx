import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderPlus, FileImage } from 'lucide-react';
import { API_BASE } from '../config';

export const CreateProject = () => {
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [blueprintName, setBlueprintName] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        const projectPayload = {
            name: name.trim(),
            description: desc.trim() || undefined,
            blueprintImage: blueprintName ? `/tour_assets/${blueprintName}` : undefined 
        };

        try {
            // 🚀 FIXED: Pointing dynamically to your cloud server using backticks
            await fetch(`${API_BASE}/api/projects/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectPayload)
            });
            navigate('/'); // Redirect smoothly back to hub matrix grid layout
        } catch (err) { 
            console.error("Initialization Failed Node:", err); 
        }
    };

    return (
        <div className="w-screen h-screen flex flex-col bg-[#040712] text-slate-200">
            <header className="px-8 py-5 border-b border-slate-900 bg-slate-950/20 backdrop-blur-xl flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-widest text-white">Initialize Listing Portfolio</h2>
                <button onClick={() => navigate('/')} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl font-bold text-[10px] uppercase text-slate-400 tracking-widest cursor-pointer">Cancel</button>
            </header>

            <main className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
                <div className="w-full max-w-lg p-8 bg-slate-900/30 border border-slate-800/80 rounded-3xl shadow-2xl backdrop-blur-3xl">
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-800/60 pb-4">
                        <FolderPlus size={16} className="text-blue-500" />
                        <h3 className="text-xs font-black tracking-widest uppercase text-blue-400">Project Manifest Configurations</h3>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2">Project Display Title Name *</label>
                            <input required type="text" className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl outline-none text-xs focus:border-blue-500/40 text-slate-200" placeholder="e.g., Suite Balcony Luxury Layout" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2">Marketing Description Summary Text</label>
                            <textarea className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl outline-none text-xs focus:border-blue-500/40 h-20 resize-none text-slate-200" placeholder="e.g., Luxury 5 BHK spatial penthouse tracking variables detail parameters summary details..." value={desc} onChange={e => setDesc(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-2">2D Floorplan Blueprint Layout Sheet (Optional)</label>
                            <input type="file" accept="image/*" id="blueprint-file" className="hidden" onChange={e => setBlueprintName(e.target.files[0]?.name || "")} />
                            <label htmlFor="blueprint-file" className="w-full py-4 border border-dashed border-slate-800 bg-slate-950/10 hover:bg-slate-950/30 rounded-xl flex items-center justify-center gap-1.5 text-xs text-slate-400 cursor-pointer transition-colors">
                                <FileImage size={14} className="text-slate-600" />
                                <span className="font-bold text-[11px] text-blue-500/70">{blueprintName ? `📁 ${blueprintName}` : "Browse Computer Files"}</span>
                            </label>
                        </div>
                        <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs tracking-wider uppercase rounded-xl shadow-xl shadow-blue-600/10 cursor-pointer">Deploy Portfolio Manifest Matrix ➔</button>
                    </form>
                </div>
            </main>
        </div>
    );
};