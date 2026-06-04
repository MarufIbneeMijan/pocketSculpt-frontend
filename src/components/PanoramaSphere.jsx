import React, { useEffect, useRef } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { PortalHotspot } from './PortalHotspot';
import { InfoTagMarker } from './InfoTagMarker';

export const PanoramaSphere = ({ 
    imagePath, 
    hotspots = [], 
    infoTags = [], 
    stagedPosition,
    onNavigateToRoom 
}) => {
    const sphereRef = useRef();

    const safePath = imagePath || "/tour_assets/room_0.jpg";
    
    // Clean WebGL texture loader stream hook
    const texture = useTexture(safePath);

    useEffect(() => {
        if (texture) {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.minFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;
        }
    }, [texture]);

    // Converts polar coordinates back to 3D Cartesian space smoothly
    const getCoordinatesFromAngles = (yaw, pitch, radius = 430) => {
        if (isNaN(yaw) || isNaN(pitch)) return [0, 0, 0];
        const radYaw = (yaw * Math.PI) / 180;
        const radPitch = (pitch * Math.PI) / 180;
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
                return (
                    <PortalHotspot 
                        key={`custom-hotspot-${index}-${spot.target}`} 
                        position={getCoordinatesFromAngles(Number(spot.yaw), Number(spot.pitch))} 
                        onClick={() => {
                            if (onNavigateToRoom) onNavigateToRoom(spot.target);
                        }}
                    />
                );
            })}

            {/* 🟣 AMENITY DETAILS PIN CHANNELS */}
            {Array.isArray(infoTags) && infoTags.map((tag, index) => {
                if (tag.yaw === undefined || tag.pitch === undefined) return null;
                return (
                    <InfoTagMarker 
                        key={`custom-infotag-${index}-${tag.title || index}`} 
                        position={getCoordinatesFromAngles(Number(tag.yaw), Number(tag.pitch))} 
                        title={tag.title}
                        text={tag.text || tag.description || tag}
                    />
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