import React, { useState } from 'react';
import { Shield, Terminal, KeyRound } from 'lucide-react';

export const AuthGate = ({ onLogin }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        // Matching your specified production credentials loop
        if (username.trim().toLowerCase() === "maruf" && password === "pocketsculpt2026") {
            onLogin();
        } else {
            alert("Security Gate Notice: Invalid operator credential signatures.");
        }
    };

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-[#040814] text-white p-4 font-sans relative overflow-hidden">
            {/* Soft Ambient Vector Glow Backdrops */}
            <div className="absolute w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] top-1/4 -left-32 pointer-events-none" />
            <div className="absolute w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] bottom-1/4 -right-32 pointer-events-none" />

            <div className="w-full max-w-md p-8 bg-slate-900/30 border border-slate-800/80 rounded-3xl shadow-2xl backdrop-blur-3xl z-10 box-border">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 shadow-[0_0_20px_rgba(37,99,235,0.15)]">
                        <Terminal size={20} />
                    </div>
                    <h1 className="text-xl font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">PocketSculpt Hub</h1>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">SaaS Dev Access Platform Core</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="text-[9px] font-bold tracking-widest text-slate-500 uppercase block mb-2">Operator Key Identifier</label>
                        <input required type="text" className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl outline-none text-xs text-slate-200 placeholder-slate-700 focus:border-blue-500/50 transition-colors box-border" placeholder="Username (maruf)" value={username} onChange={e => setUsername(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-[9px] font-bold tracking-widest text-slate-500 uppercase block mb-2">System Security Token</label>
                        <input required type="password" className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl outline-none text-xs text-slate-200 placeholder-slate-700 focus:border-blue-500/50 transition-colors box-border" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold text-xs tracking-wider uppercase text-white shadow-lg shadow-blue-600/15 flex items-center justify-center gap-2 cursor-pointer transition-transform duration-150 active:scale-[0.98]">
                        <KeyRound size={13} /> Authenticate Profile
                    </button>
                </form>
            </div>
        </div>
    );
};