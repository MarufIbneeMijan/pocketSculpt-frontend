import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { X, Sparkles } from 'lucide-react';
import * as THREE from 'three';

export const InfoTagMarker = ({ position, title, text }) => {
    const circleRef = useRef();
    const [hovered, setHovered] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    useFrame((state) => {
        if (circleRef.current) {
            const time = state.clock.getElapsedTime();
            // Elegant subtle breathe pulsing logic without jarring positioning shifts
            const pulseFactor = 1.0 + Math.sin(time * 3.0) * 0.05;
            circleRef.current.scale.set(pulseFactor, pulseFactor, 1);
        }
    });

    return (
        <group position={position}>
            <group 
                ref={circleRef}
                onClick={(e) => {
                    e.stopPropagation();
                    console.log(`[UI INTERACTION] Open info tooltips for: "${title}"`);
                    setShowTooltip(!showTooltip);
                }}
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerOut={(e) => { setHovered(false); document.body.style.cursor = 'default'; }}
            >
                {/* 🚀 TARGET COMPONENT 1: Outer Orange Concentric Ring Halo */}
                <mesh renderOrder={999} lookAt={[0, 0, 0]}>
                    <ringGeometry args={[hovered ? 12 : 10, hovered ? 14 : 12, 32]} />
                    <meshBasicMaterial 
                        color={hovered ? "#ff781f" : "#f97316"} // Vivid Neon Orange Accent Tracks
                        transparent 
                        opacity={hovered ? 0.9 : 0.45} 
                        depthTest={false} 
                        depthWrite={false} 
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/* 🚀 TARGET COMPONENT 2: Core Solid Red/Orange Focal Circle Geometry */}
                <mesh renderOrder={1000} lookAt={[0, 0, 0]}>
                    <circleGeometry args={[hovered ? 7.5 : 6, 32]} />
                    <meshBasicMaterial 
                        color={hovered ? "#fca5a5" : "#ef4444"} // Solid deep red core to white-red active contrast pop
                        transparent 
                        opacity={0.95} 
                        depthTest={false} 
                        depthWrite={false} 
                        side={THREE.DoubleSide}
                    />
                </mesh>
            </group>

            {/* 💬 FLOATING METADATA HTML OVERLAY TOOLTIP (Retained structure, upgraded visibility to match theme) */}
            {showTooltip && (
                <Html 
                    distanceFactor={500} 
                    position={[0, 25, 0]} 
                    center
                    style={{ pointerEvents: 'auto' }}
                >
                    <div className="w-56 bg-slate-950 border-2 border-orange-500/80 p-3.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-xl font-sans text-left animate-fadeIn relative">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
                        
                        <div className="flex justify-between items-center gap-2 mb-2 pb-1.5 border-b border-slate-900">
                            <div className="flex items-center gap-1 min-w-0">
                                <Sparkles size={11} className="text-orange-400 shrink-0" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-white truncate m-0">{title}</h4>
                            </div>
                            <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
                                className="text-slate-500 hover:text-orange-400 p-0.5 rounded-md transition-colors cursor-pointer hover:bg-slate-900/50"
                            >
                                <X size={12} />
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-100 font-bold leading-relaxed normal-case m-0 max-h-24 overflow-y-auto pr-1">
                            {text}
                        </p>
                    </div>
                </Html>
            )}
        </group>
    );
};