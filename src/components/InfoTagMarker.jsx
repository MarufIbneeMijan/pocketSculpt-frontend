import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { X } from 'lucide-react';

export const InfoTagMarker = ({ position, title, text }) => {
    const jewelRef = useRef();
    const [hovered, setHovered] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    useFrame((state) => {
        if (jewelRef.current) {
            const time = state.clock.getElapsedTime();
            jewelRef.current.position.y = Math.sin(time * 2.5) * 3;
            jewelRef.current.rotation.y = time * 0.8;
        }
    });

    return (
        <group position={position}>
            <group 
                ref={jewelRef}
                onClick={(e) => {
                    e.stopPropagation();
                    console.log(`[UI INTERACTION] Open info tooltips for: "${title}"`);
                    setShowTooltip(!showTooltip);
                }}
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerOut={(e) => { setHovered(false); document.body.style.cursor = 'default'; }}
            >
                {/* Sharp Octahedron Diamond Body Geometry */}
                <mesh renderOrder={999}>
                    <octahedronGeometry args={[hovered ? 12 : 10, 0]} />
                    <meshBasicMaterial 
                        color={hovered ? "#d8b4fe" : "#c084fc"} 
                        depthTest={false} 
                        depthWrite={false} 
                    />
                </mesh>

                {/* Outer highlighting edge lines */}
                <mesh renderOrder={999}>
                    <octahedronGeometry args={[hovered ? 12.2 : 10.2, 0]} />
                    <meshBasicMaterial 
                        color={hovered ? "#c084fc" : "#a855f7"} 
                        depthTest={false} 
                        depthWrite={false} 
                        wireframe={true} 
                    />
                </mesh>
            </group>

            {/* 💬 FLOATING METADATA HTML OVERLAY TOOLTIP */}
            {showTooltip && (
                <Html 
                    distanceFactor={500} // Dynamic scaling based on viewport zoom distances
                    position={[0, 25, 0]} // Position bubble safely above the hovering jewel mesh
                    center
                >
                    <div className="w-56 bg-slate-950/95 border border-purple-500/30 p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl font-sans text-left animate-fadeIn pointer-events-auto select-text">
                        <div className="flex justify-between items-start gap-2 mb-1">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-purple-400 truncate">{title}</h4>
                            <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
                                className="text-slate-600 hover:text-white transition-colors cursor-pointer"
                            >
                                <X size={12} />
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-300 font-medium leading-relaxed normal-case m-0">{text}</p>
                    </div>
                </Html>
            )}
        </group>
    );
};