import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';

export const PortalHotspot = ({ position, text, onClick }) => {
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
                e.stopPropagation(); // 🚀 Prevent the underlying canvas background mesh from catching this click
                if (onClick) onClick();
            }}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={(e) => { setHovered(false); document.body.style.cursor = 'default'; }}
        >
            {/* Core Center Anchor Orb */}
            <mesh renderOrder={999}>
                <sphereGeometry args={[hovered ? 7 : 5, 16, 16]} />
                <meshBasicMaterial 
                    color={hovered ? "#60a5fa" : "#3b82f6"} 
                    depthTest={false} 
                    depthWrite={false} 
                />
            </mesh>

            {/* Floating Outer Portal Ring */}
            <mesh ref={ringRef} renderOrder={999}>
                <torusGeometry args={[14, 2.5, 8, 24]} />
                <meshBasicMaterial 
                    color={hovered ? "#3b82f6" : "#2563eb"} 
                    depthTest={false} 
                    depthWrite={false} 
                    wireframe={true} 
                />
            </mesh>
        </group>
    );
};