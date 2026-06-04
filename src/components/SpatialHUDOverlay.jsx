import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Sparkles } from 'lucide-react';
import * as THREE from 'three';

export const SpatialHUDOverlay = ({ targetPosition, type = 'hotspot', title, text }) => {
    const [isHovered, setIsHovered] = useState(false);
    const { camera } = useThree();
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleGlobalMouseMove = (event) => {
            // Track clean window mouse cursor screen coordinates
            mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', handleGlobalMouseMove);
        return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
    }, []);

    useFrame(() => {
        if (!targetPosition) return;

        // 📐 Project 3D coordinate point onto flat 2D screen space
        const nodeVector = new THREE.Vector3(...targetPosition);
        const screenProjection = nodeVector.clone().project(camera);

        // Check flat pixel mathematical distance boundaries
        const dx = mouseRef.current.x - screenProjection.x;
        const dy = mouseRef.current.y - screenProjection.y;
        const screenDistance = Math.sqrt(dx * dx + dy * dy);

        // Sensitivity threshold: Close enough on screen to trigger overlay text box
        const isCursorNear = screenDistance < 0.07;

        if (isCursorNear !== isHovered) {
            setIsHovered(isCursorNear);
        }
    });

    if (!isHovered) return null;

    return (
        <Html 
            center 
            distanceFactor={false} 
            position={targetPosition}
            style={{ pointerEvents: 'none', zIndex: 999999 }} // Forces absolute top layout layer
        >
            <div className="animate-fadeIn font-sans select-none pointer-events-none">
                {type === 'hotspot' ? (
                    /* 🔴 HIGH-CONTRAST RED HOTSPOT NAVIGATION TOOLTIP */
                    <div className="bg-slate-950 border-2 border-red-500/80 p-2 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.9)] whitespace-nowrap translate-y-[-45px]">
                        <span className="text-white text-[10px] font-black tracking-widest uppercase block px-1">
                            <span className="text-red-500 mr-1.5 font-mono">➔</span> {text || "Enter Space"}
                        </span>
                    </div>
                ) : (
                    /* 🟠 HIGH-CONTRAST ORANGE AMENITY DATA TAG CARD */
                    <div className="w-60 bg-slate-950 border-2 border-orange-500/80 p-4 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] translate-y-[-90px] relative">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
                        <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-900">
                            <Sparkles size={11} className="text-orange-400 shrink-0" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white truncate m-0">{title}</h4>
                        </div>
                        <p className="text-[10px] text-slate-100 leading-relaxed font-bold m-0 normal-case max-h-24 overflow-hidden">
                            {text}
                        </p>
                    </div>
                )}
            </div>
        </Html>
    );
};