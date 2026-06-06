// PanoramaSphere.jsx
import React, { useEffect, useRef } from 'react';
import { useTexture, Html } from '@react-three/drei'; // 👈 FIXED: Added 'Html' here
import * as THREE from 'three';
import { PortalHotspot } from './PortalHotspot';
import { InfoTagMarker } from './InfoTagMarker';

export const PanoramaSphere = ({ 
    imagePath, 
    hotspots = [], 
    infoTags = [], 
    customCtas = [], 
    stagedPosition,
    onNavigateToRoom
}) => {
    const sphereRef = useRef();

    const safePath = imagePath || "/tour_assets/room_0.jpg";
    
    const texture = useTexture(safePath);

    useEffect(() => {
        if (texture) {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.minFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;
        }
    }, [texture]);

    const getCoordinatesFromAngles = (yaw, pitch, radius = 430) => {
        const cleanYaw = Number(yaw);
        const cleanPitch = Number(pitch);
        
        if (isNaN(cleanYaw) || isNaN(cleanPitch)) return [0, 0, 0];
        
        const radYaw = (cleanYaw * Math.PI) / 180;
        const radPitch = (cleanPitch * Math.PI) / 180;
        
        return [
            radius * Math.cos(radPitch) * Math.sin(radYaw),
            radius * Math.sin(radPitch),
            radius * Math.cos(radPitch) * Math.cos(radYaw)
        ];
    };

    return (
        <group>
            {/* 🌍 360 PHOTO SPHERE BASE LAYER */}
            <mesh ref={sphereRef} position={[0, 0, 0]} renderOrder={1}>
                <sphereGeometry args={[500, 60, 40]} />
                <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
            </mesh>

            {/* 🔵 NAVIGATION PORTAL CHANNELS */}
            {Array.isArray(hotspots) && hotspots.map((spot, index) => {
                if (spot.yaw === undefined || spot.pitch === undefined) return null;
                const spotTarget = String(spot.target || "").toLowerCase().trim();
                return (
                    <PortalHotspot 
                        key={`hotspot-node-${index}-${spotTarget}`} 
                        position={getCoordinatesFromAngles(spot.yaw, spot.pitch)} 
                        onClick={() => {
                            if (onNavigateToRoom) onNavigateToRoom(spotTarget);
                        }}
                    />
                );
            })}

            {/* 🟣 AMENITY DETAILS PIN CHANNELS */}
            {Array.isArray(infoTags) && infoTags.map((tag, index) => {
                if (tag.yaw === undefined || tag.pitch === undefined) return null;
                return (
                    <InfoTagMarker 
                        key={`infotag-node-${index}-${tag.title || index}`} 
                        position={getCoordinatesFromAngles(tag.yaw, tag.pitch)} 
                        title={tag.title}
                        text={tag.text || tag.description || ""}
                    />
                );
            })}

            {/* 🟢 RENDER 3D SPATIAL VALUE CTAs INSIDE THE VECTOR CANVAS */}
            {Array.isArray(customCtas) && customCtas.filter(c => c.type === "spatial").map((cta, index) => {
                if (cta.yaw === undefined || cta.pitch === undefined) return null;
                return (
                    <mesh key={`spatial-cta-${index}`} position={getCoordinatesFromAngles(Number(cta.yaw), Number(cta.pitch), 410)}>
                        <Html center>
                            <div className="p-3 bg-slate-950/95 border border-emerald-500/60 rounded-2xl shadow-2xl w-48 pointer-events-auto text-center transform hover:scale-105 transition-all">
                                <h6 className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">{cta.text}</h6>
                                {cta.description && <p className="text-[9px] text-slate-400 mt-1 leading-tight">{cta.description}</p>}
                                <button 
                                    onClick={() => window.open(cta.link, '_blank')}
                                    className="mt-2 block w-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase py-1.5 rounded-xl tracking-widest text-center shadow-lg cursor-pointer"
                                >
                                    Open Link
                                </button>
                            </div>
                        </Html>
                    </mesh>
                );
            })}

            {/* 🟠 LIVE STAGING INDICATOR BLOCK */}
            {stagedPosition && stagedPosition.yaw !== undefined && stagedPosition.pitch !== undefined && (
                <mesh position={getCoordinatesFromAngles(Number(stagedPosition.yaw), Number(stagedPosition.pitch), 425)} renderOrder={1000}>
                    <sphereGeometry args={[8, 32, 32]} />
                    <meshBasicMaterial color="#f97316" depthTest={false} depthWrite={false} />
                </mesh>
            )}
        </group>
    );
};