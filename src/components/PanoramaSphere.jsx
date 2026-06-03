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
    onNavigateToRoom // 🚀 NEW: Route navigation callback loop pipeline hook
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
        const radYaw = (yaw * Math.PI) / 180;
        const radPitch = (pitch * Math.PI) / 180;

        const x = radius * Math.cos(radPitch) * Math.sin(radYaw);
        const y = radius * Math.sin(radPitch);
        const z = radius * Math.cos(radPitch) * Math.cos(radYaw);

        return [x, y, z];
    };

    return (
        <group>
            {/* 🌍 360 PHOTO SPHERE BASE LAYER */}
            <mesh ref={sphereRef} position={[0, 0, 0]} renderOrder={1}>
                <sphereGeometry args={[500, 60, 40]} />
                <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
            </mesh>

            {/* 🔵 NAVIGATION PORTAL PIN RE-MAP CHANNELS */}
            {Array.isArray(hotspots) && hotspots.map((spot, index) => {
                if (spot.yaw === undefined || spot.pitch === undefined) return null;
                const positionCoords = getCoordinatesFromAngles(Number(spot.yaw), Number(spot.pitch));
                return (
                    <PortalHotspot 
                        key={`custom-hotspot-${index}`} 
                        position={positionCoords} 
                        text={spot.text || "Move Forward"}
                        onClick={() => {
                            console.log(`[PORTAL ROUTE] Executing shift to destination room string: "${spot.target}"`);
                            if (onNavigateToRoom) onNavigateToRoom(spot.target);
                        }}
                    />
                );
            })}

            {/* 🟣 AMENITY DETAILS PIN RE-MAP CHANNELS */}
            {Array.isArray(infoTags) && infoTags.map((tag, index) => {
                if (tag.yaw === undefined || tag.pitch === undefined) return null;
                const positionCoords = getCoordinatesFromAngles(Number(tag.yaw), Number(tag.pitch));
                return (
                    <InfoTagMarker 
                        key={`custom-infotag-${index}`} 
                        position={positionCoords} 
                        title={tag.title || "Premium Spec Component"}
                        text={tag.text || "Asset description outlines configurations details."}
                    />
                );
            })}

            {/* 🟠 LIVE STAGING INDICATOR BLOCK */}
            {stagedPosition && stagedPosition.yaw !== undefined && stagedPosition.pitch !== undefined && (
                <mesh position={getCoordinatesFromAngles(Number(stagedPosition.yaw), Number(stagedPosition.pitch))} renderOrder={1000}>
                    <sphereGeometry args={[14, 32, 32]} />
                    <meshBasicMaterial color="#f97316" depthTest={false} depthWrite={false} />
                </mesh>
            )}
        </group>
    );
};