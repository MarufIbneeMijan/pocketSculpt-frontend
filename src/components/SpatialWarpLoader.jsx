import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export const SpatialWarpLoader = ({ isVisible }) => {
    const [displayPercentage, setDisplayPercentage] = useState(0);
    const [renderState, setRenderState] = useState("HIDDEN"); // HIDDEN, ENTERING, EXITING

    useEffect(() => {
        let metricInterval;

        if (isVisible) {
            // 🚀 STEP 1: If visible is true, immediately trigger the top drop-down entry animation
            setRenderState("ENTERING");
            setDisplayPercentage(0);

            metricInterval = setInterval(() => {
                setDisplayPercentage((prev) => {
                    if (prev >= 98) return prev; 
                    return prev + Math.floor(Math.random() * 8) + 4;
                });
            }, 50);
        } else if (renderState === "ENTERING") {
            // 🚀 STEP 2: When isVisible turns false, smoothly transition to the slide-down exit phase
            setRenderState("EXITING");
            clearInterval(metricInterval);

            // Match this timeout exactly to the CSS transition length (500ms) to clean up the DOM layer
            const cleanupTimeout = setTimeout(() => {
                setRenderState("HIDDEN");
            }, 1000);

            return () => clearTimeout(cleanupTimeout);
        }

        return () => {
            if (metricInterval) clearInterval(metricInterval);
        };
    }, [isVisible]);

    if (renderState === "HIDDEN") return null;

    // 📐 CSS TRANSITION TRANSFORM MATRIX MAP
    // ENTERING: Drops down from top (translate-y-0)
    // EXITING: Slides out through the bottom (translate-y-full)
    const transitionStyles = renderState === "ENTERING"
        ? "translate-y-0 opacity-100"
        : "translate-y-full opacity-0";

    return (
        <div 
            className={`fixed inset-0 bg-[#040712]/95 backdrop-blur-2xl z-[999999] flex flex-col items-center justify-center font-sans select-none pointer-events-auto transform transition-all duration-500 ease-in-out ${transitionStyles}`}
            style={{
                // Explicit fallback configuration guaranteeing it drops down past top bounds initially
                transform: renderState === "HIDDEN" ? "translateY(-100%)" : undefined
            }}
        >
            {/* Ambient grid alignment layout background layer */}
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
            
            <div className="flex flex-col items-center justify-center gap-4 text-center max-w-sm px-6 relative z-10">
                
                {/* Glowing Plasma Spinning Core */}
                <div className="w-14 h-14 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.5)] bg-slate-950/90 mb-2">
                    <Sparkles size={16} className="text-indigo-400 animate-pulse" />
                </div>

                {/* Main Glassmorphic Instruction Console Panel */}
                <div className="bg-slate-950 border-2 border-indigo-500/30 px-6 py-5 rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.8)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
                    
                    <span className="text-[9px] font-black font-mono tracking-[0.3em] text-indigo-400 uppercase block mb-1.5 animate-pulse">
                        Teleportation Matrix Active
                    </span>
                    
                    <h3 className="text-sm font-black tracking-widest text-white uppercase m-0">
                        Aligning Room Vectors
                    </h3>
                    
                    <p className="text-[11px] text-slate-400 font-bold tracking-wide leading-relaxed m-0 mt-3 border-t border-slate-900/80 pt-3 normal-case">
                        Streaming panoramic environment data pipelines. Please hold your patience.
                    </p>
                </div>

                {/* Digital Progress Tracking Readout Badge */}
                <div className="font-mono text-[14px] font-black tracking-widest text-indigo-400 bg-slate-950 border border-indigo-500/20 px-5 py-2 rounded-full shadow-lg">
                    {renderState === "EXITING" ? "100" : displayPercentage}% <span className="text-[9px] uppercase tracking-normal font-sans text-slate-500 font-black ml-1">Synced</span>
                </div>
            </div>
        </div>
    );
};