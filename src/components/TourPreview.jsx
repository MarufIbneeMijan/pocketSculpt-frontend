import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'; // 🚀 Added useSearchParams to detect environment context flags
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PanoramaSphere } from './PanoramaSphere'; 
import { VRButton } from 'three/addons/webxr/VRButton.js'; 
import { ArrowLeft, HelpCircle, Compass, Cpu } from 'lucide-react';
import * as THREE from 'three';
import { API_BASE } from '../config';
// 🚀 NATIVE HOOK LOGIC INJECTOR: Tells the underlying WebGL core canvas context to activate XR rendering
const VRHandler = () => {
    const { gl } = useThree();
    useEffect(() => {
        if (gl && gl.xr) {
            console.log("🎮 [NATIVE WEBXR] Injecting hardware VR synchronization loop parameters into WebGL renderer...");
            gl.xr.enabled = true; // Unlock stereo hardware matrices natively
        }
    }, [gl]);
    return null;
};

export const TourPreview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams(); // 🚀 Reading runtime query parameters from URL state

    // 🕵️ SECURITY GAUNTLET: If 'live' evaluation is true, explicitly hide administrative control access buttons
    const isLiveSharedView = searchParams.get('live') === 'true';

    // --- REALTIME DATA MASTER STATES ---
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeRoomKey, setActiveRoomKey] = useState("");

    // --- INTERACTIVE FEATURE TOGGLE STATES ---
    const [isTopView, setIsTopView] = useState(false);
    const [showCalcHUD, setShowCalcHUD] = useState(false);
    const [calcMetrics, setCalcMetrics] = useState(null);

    const studioControlsRef = useRef();

    // --- TWO-POINT MEASUREMENT TOOL STATES ---
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [pointA, setPointA] = useState(null);
    const [pointB, setPointB] = useState(null);
    const [calculatedDistance, setCalculatedDistance] = useState(null);

    // 🚀 DYNAMIC ARCHITECTURE GATEWAY: Switches fluidly between local testing and remote production configurations
    // const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const fetchProjectDetails = async () => {
        try {
            // Updated endpoint to leverage the fallback architecture wrapper safely inside execution loops
            const response = await fetch(`${API_BASE}/api/projects`);
            const data = await response.json();
            const targetProject = data.find(p => p._id === id);
            
            if (targetProject) {
                setProject(targetProject);
                if (targetProject.rooms && targetProject.rooms.length > 0) {
                    const initialKey = targetProject.initialRoomKey 
                        ? String(targetProject.initialRoomKey).toLowerCase().trim()
                        : String(targetProject.rooms[0].key).toLowerCase().trim();
                    setActiveRoomKey(initialKey);
                }
            }
            setLoading(false);
        } catch (err) {
            console.error("[PREVIEW] Pipeline runtime data retrieval error:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchProjectDetails();
    }, [id]);

    // 📐 TOP-VIEW INTERACTION PERSPECTIVE INTERCEPTOR MATRIX
    const handleToggleTopView = () => {
        if (!studioControlsRef.current) return;
        const activeCamera = studioControlsRef.current.object;
        
        if (!isTopView) {
            console.log("[LIVE PREVIEW] Shifting camera matrix up to Orthographic Floorplan view...");
            activeCamera.position.set(0, 485, 0); 
            studioControlsRef.current.target.set(0, 0, 0);
            studioControlsRef.current.maxPolarAngle = Math.PI / 2; // Lock vertical axis clip boundary
        } else {
            console.log("[LIVE PREVIEW] Restoring first-person coordinate center lens...");
            activeCamera.position.set(0, 0, 0.1); 
            studioControlsRef.current.target.set(0, 0, 0);
            studioControlsRef.current.maxPolarAngle = Math.PI; // Full rotational unlock
        }
        studioControlsRef.current.update();
        setIsTopView(!isTopView);
    };

    // 🔬 MATHEMATICAL INTERSECTION SPHERICAL INTEGRATION
    const handleLiveSurfaceVectorCalculation = (e) => {
        if (!e || !e.point) return;
        const { x, y, z } = e.point;

        // 📐 CASE A: SYSTEM IS IN TWO-POINT MEASURING MODE
        if (isMeasuring) {
            if (!pointA) {
                console.log("📍 [MEASURE TOOL] Point A Anchor dropped at:", { x, y, z });
                setPointA({ x, y, z });
                return; 
            }
            
            if (!pointB) {
                console.log("📍 [MEASURE TOOL] Point B Anchor dropped at:", { x, y, z });
                setPointB({ x, y, z });
                
                // 🚀 THE 3D EUCLIDEAN MATHEMATICAL CALCULATION ENGINE
                const dx = x - pointA.x;
                const dy = y - pointA.y;
                const dz = z - pointA.z;
                const rawDistance = Math.sqrt(dx*dx + dy*dy + dz*dz);
                
                // Convert WebGL units to an approximate real-world metric scale (meters)
                const calibratedMeters = (rawDistance / 80).toFixed(2);
                
                setCalculatedDistance(calibratedMeters);
                return;
            }
            return;
        }

        // 🔬 CASE B: STANDARD VECTOR HUD READING MODE
        if (showCalcHUD) {
            const radius = Math.sqrt(x*x + y*y + z*z);
            if (radius === 0) return;

            const pitch = Math.asin(y / radius) * (180 / Math.PI);
            const yaw = Math.atan2(x, z) * (180 / Math.PI);

            setCalcMetrics({
                x: x.toFixed(4),
                y: y.toFixed(4),
                z: z.toFixed(4),
                r: radius.toFixed(4),
                yaw: yaw.toFixed(2),
                pitch: pitch.toFixed(2)
            });
        }
    };

    if (loading) {
        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#040712] text-slate-500 font-mono text-xs gap-3">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span>Buffering Live Immersive Tour Matrix...</span>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#040712] text-slate-400 p-6 text-center">
                <h4 className="text-sm font-bold text-white mb-2">Virtual Tour Asset Route Unregistered</h4>
                <button type="button" onClick={() => navigate('/')} className="px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-300">Return to Directory</button>
            </div>
        );
    }

    const currentActiveRoomInstance = (() => {
        if (!project || !project.rooms || project.rooms.length === 0) return null;
        const lookup = String(activeRoomKey || "").toLowerCase().trim();
        return project.rooms.find(r => String(r.key).toLowerCase().trim() === lookup) || project.rooms[0];
    })();

    return (
        <div className="w-screen h-screen bg-black relative font-sans overflow-hidden select-none">
            
            {/* 🚀 TOP LEFT: BACKLINK HUD OVERLAY (CONDITIONAL DISPLAY GATE) */}
            {!isLiveSharedView && (
                <div className="absolute top-6 left-6 z-30 flex items-center gap-3">
                    <button 
                        type="button" 
                        onClick={() => navigate(`/editor/${id}`)} 
                        className="flex items-center gap-2 bg-slate-950/80 border border-slate-900 px-4 py-2.5 rounded-xl text-xs font-black text-slate-300 hover:text-white transition-all shadow-2xl backdrop-blur-md cursor-pointer hover:border-slate-700 active:scale-95"
                    >
                        <ArrowLeft size={14} /> Back to Studio Editor
                    </button>
                </div>
            )}

            {/* 🚀 TOP RIGHT: SYSTEM NATIVE HARDWARE MOUNT FOR THE VR INITIATION BUTTON */}
            <div className="absolute top-6 right-6 z-30">
                <div 
                    ref={(node) => {
                        if (node && !node.hasChildNodes() && studioControlsRef.current) {
                            const canvasElement = node.closest('body')?.querySelector('canvas');
                            if (canvasElement) {
                                const dummyRenderer = {
                                    xr: {
                                        addEventListener: () => {},
                                        removeEventListener: () => {},
                                        enabled: false
                                    }
                                };
                                
                                const vrButtonElement = VRButton.createButton(dummyRenderer);
                                
                                vrButtonElement.id = "native-vr-trigger";
                                vrButtonElement.style.position = "static";
                                vrButtonElement.style.border = "1px solid rgba(99, 102, 241, 0.3)";
                                vrButtonElement.style.background = "rgba(2, 5, 15, 0.9)";
                                vrButtonElement.style.color = "#818cf8";
                                vrButtonElement.style.fontFamily = "sans-serif";
                                vrButtonElement.style.fontSize = "10px";
                                vrButtonElement.style.fontWeight = "900";
                                vrButtonElement.style.textTransform = "uppercase";
                                vrButtonElement.style.letterSpacing = "0.1em";
                                vrButtonElement.style.padding = "12px 20px";
                                vrButtonElement.style.borderRadius = "12px";
                                vrButtonElement.style.cursor = "pointer";
                                vrButtonElement.style.transition = "all 0.2s ease";
                                
                                node.appendChild(vrButtonElement);
                            }
                        }
                    }}
                />
            </div>

            {/* 🖥️ CORE 3D VIEWPORT FRAME */}
            {currentActiveRoomInstance ? (
                <div className="w-full h-full relative z-10">
                    
                    <Canvas 
                        key={`${activeRoomKey}-${currentActiveRoomInstance.hotspots?.length || 0}-${currentActiveRoomInstance.infoTags?.length || 0}`}
                        camera={{ position: [0, 0, 0.1], fov: 75, near: 0.1, far: 1000 }}
                        onWheel={(e) => {
                            if (!studioControlsRef.current || isTopView) return;
                            const activeCamera = studioControlsRef.current.object;
                            if (!activeCamera) return;
                            let freshFovValue = activeCamera.fov + e.deltaY * 0.04;
                            freshFovValue = Math.max(35, Math.min(95, freshFovValue));
                            activeCamera.fov = freshFovValue;
                            activeCamera.updateProjectionMatrix();
                        }}
                    >
                        <OrbitControls ref={studioControlsRef} rotateSpeed={-0.3} enableZoom={!isTopView} enablePan={false} enableDamping dampingFactor={0.05} />
                        
                        <VRHandler />

                        <Suspense fallback={null}>
                            <group>
                                <PanoramaSphere 
                                    imagePath={
                                        currentActiveRoomInstance.image && currentActiveRoomInstance.image !== "/tour_assets/"
                                            ? currentActiveRoomInstance.image 
                                            : "/tour_assets/room_0.jpg"
                                    } 
                                    hotspots={currentActiveRoomInstance.hotspots || []} 
                                    infoTags={currentActiveRoomInstance.infoTags || []} 
                                    stagedPosition={null} 
                                    onNavigateToRoom={(target) => {
                                        if (target && !isTopView) {
                                            setActiveRoomKey(String(target).toLowerCase().trim());
                                            setCalcMetrics(null);
                                        }
                                    }}
                                />
                                
                                <mesh 
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        if (isTopView) return;
                                        handleLiveSurfaceVectorCalculation(e);
                                    }}
                                >
                                    <sphereGeometry args={[495, 32, 32]} />
                                    <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
                                </mesh>
                            </group>
                        </Suspense>
                    </Canvas>

                    {/* 📐 LIVE TWO-POINT SPACE MEASUREMENT HUD DISPLAY */}
                    {isMeasuring && (
                        <div className="absolute top-24 left-6 bg-slate-950/95 border border-indigo-500/30 p-4 rounded-2xl font-sans text-xs text-slate-300 space-y-2 z-30 max-w-xs shadow-2xl backdrop-blur-xl animate-fadeIn">
                            <div className="font-black border-b border-indigo-900 pb-1.5 uppercase tracking-widest text-indigo-400 text-[9px]">
                                📐 Realtime Space Measurer Active
                            </div>
                            
                            <div className="space-y-1 font-mono text-[10px]">
                                <div className="flex justify-between">
                                    <span>Point A Status:</span>
                                    <span className={pointA ? "text-emerald-400 font-bold" : "text-amber-500 animate-pulse"}>
                                        {pointA ? "🎯 SET" : "⏳ AWAITING CLICK"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Point B Status:</span>
                                    <span className={pointB ? "text-emerald-400 font-bold" : "text-amber-500"}>
                                        {pointB ? "🎯 SET" : pointA ? "⏳ AWAITING CLICK" : "🔒 LOCKED"}
                                    </span>
                                </div>
                            </div>

                            {calculatedDistance && (
                                <div className="mt-2 p-2 bg-indigo-600/10 border border-indigo-500/30 rounded-xl text-center">
                                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block mb-0.5">Calculated Path Space Length</span>
                                    <div className="text-xl font-black text-white">{calculatedDistance} <span className="text-xs font-medium text-slate-400">meters</span></div>
                                </div>
                            )}

                            <button 
                                type="button" 
                                onClick={() => {
                                    setPointA(null);
                                    setPointB(null);
                                    setCalculatedDistance(null);
                                }}
                                className="w-full mt-1 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors cursor-pointer"
                            >
                                Reset Measurement points
                            </button>
                        </div>
                    )}

                    {/* 🔬 SPHERICAL NUMERICAL RECONVERSION CALCULATOR MONITOR PANEL */}
                    {showCalcHUD && calcMetrics && (
                        <div className="absolute top-24 left-6 bg-slate-950/95 border border-emerald-500/20 p-3.5 rounded-2xl font-mono text-[9px] text-emerald-400 space-y-1.5 z-30 max-w-xs shadow-2xl backdrop-blur-xl animate-fadeIn">
                            <div className="font-sans font-black border-b border-emerald-900 pb-1.5 uppercase tracking-widest text-white text-[8px] flex items-center gap-1"><Cpu size={10}/> Realtime Metric Vector Stream</div>
                            <div>Ray Intersection: X: {calcMetrics.x} | Y: {calcMetrics.y}</div>
                            <div className="pl-14">Z: {calcMetrics.z}</div>
                            <div>Computed Radius  : R = {calcMetrics.r} units</div>
                            <div className="text-white border-t border-emerald-900/60 pt-1">Derived Angle Yaw (θ)  : <span className="font-bold text-emerald-300">{calcMetrics.yaw}°</span></div>
                            <div className="text-white">Derived Angle Pitch (ϕ): <span className="font-bold text-emerald-300">{calcMetrics.pitch}°</span></div>
                        </div>
                    )}

                    {/* 🧭 BOTTOM HUD FLOATING CONTROL MATRIX DECK */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3 z-20 w-[90%] max-w-md pointer-events-none">
                        
                        <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-900 p-1.5 rounded-2xl shadow-2xl backdrop-blur-xl pointer-events-auto">
                            <button 
                                type="button" 
                                onClick={handleToggleTopView}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${isTopView ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                🗺️ {isTopView ? "Exit Map View" : "Floor Map view"}
                            </button>
                            
                            <div className="w-px h-4 bg-slate-800" />
                            
                            <button 
                                type="button" 
                                onClick={() => { 
                                    setIsMeasuring(!isMeasuring);
                                    setShowCalcHUD(false); 
                                    setPointA(null);
                                    setPointB(null);
                                    setCalculatedDistance(null);
                                }}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${isMeasuring ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-400'}`}
                            >
                                {isMeasuring ? "📐 Measuring: ON" : "📐 Measure Distance"}
                            </button>

                            <div className="w-px h-4 bg-slate-800" />

                            <button 
                                type="button" 
                                onClick={() => { setShowCalcHUD(!showCalcHUD); setIsMeasuring(false); setCalcMetrics(null); }}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${showCalcHUD ? 'bg-emerald-600/10 border border-emerald-500/30 text-emerald-400' : 'text-slate-500 hover:text-slate-400'}`}
                            >
                                {showCalcHUD ? "🔬 Vector HUD: ON" : "🔬 Vector HUD: OFF"}
                            </button>
                        </div>

                        {/* Text Detail Label Overlay Container */}
                        <div className="bg-slate-950/80 border border-slate-900/60 backdrop-blur-xl px-6 py-3.5 rounded-2xl shadow-2xl text-center w-full">
                            <div className="flex items-center justify-center gap-1.5 text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-0.5">
                                <Compass size={11} className={isTopView ? "" : "animate-spin-slow"} /> {isTopView ? "Orthographic Bird-Eye Overview" : "Active Location Node"}
                            </div>
                            <h2 className="text-xs font-black text-white uppercase tracking-wider">{currentActiveRoomInstance.title}</h2>
                            {!isTopView && currentActiveRoomInstance.description && (
                                <p className="text-[10px] text-slate-400 font-medium leading-relaxed normal-case m-0 mt-1">{currentActiveRoomInstance.description}</p>
                            )}
                            {showCalcHUD && !calcMetrics && !isTopView && (
                                <div className="text-[9px] text-emerald-500/80 font-mono mt-1 border-t border-slate-900 pt-1 animate-pulse">⚡ Double-click any surface element to decode matrix angles</div>
                            )}
                        </div>
                    </div>

                </div>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                    <HelpCircle size={24} className="text-slate-700 mb-2 animate-pulse" />
                    <h5 className="text-xs font-black tracking-widest uppercase text-slate-500">WebGL Viewport Sync Fault</h5>
                </div>
            )}
        </div>
    );
};