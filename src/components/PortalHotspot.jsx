import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const PortalHotspot = ({ position, onClick }) => {
    const ringRef = useRef();
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        if (ringRef.current) {
            ringRef.current.rotation.y = state.clock.getElapsedTime() * 1.5;
        }
    });

    return (
        <group 
            position={position}
            onClick={(e) => {
                e.stopPropagation(); 
                console.log("⚡ [NAVIGATION TRIGGER] Portal hotspot node clicked.");
                if (onClick) onClick();
            }}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={(e) => { setHovered(false); document.body.style.cursor = 'default'; }}
        >
            {/* Core Center Anchor Orb */}
            <mesh renderOrder={999} lookAt={[0, 0, 0]}>
                <sphereGeometry args={[hovered ? 7 : 5, 16, 16]} />
                <meshBasicMaterial 
                    color={hovered ? "#60a5fa" : "#3b82f6"} 
                    transparent
                    opacity={0.9}
                    depthTest={false} 
                    depthWrite={false} 
                />
            </mesh>

            {/* Floating Outer Portal Ring */}
            {/* 🚀 FIXED: Added lookAt and DoubleSide parameters to prevent orientation clipping issues */}
            <mesh ref={ringRef} renderOrder={999} lookAt={[0, 0, 0]}>
                <torusGeometry args={[14, 2.5, 8, 24]} />
                <meshBasicMaterial 
                    color={hovered ? "#3b82f6" : "#2563eb"} 
                    depthTest={false} 
                    depthWrite={false} 
                    wireframe={true} 
                    transparent
                    opacity={hovered ? 0.95 : 0.6}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
};