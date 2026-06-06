import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'; 
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PanoramaSphere } from './PanoramaSphere'; 
import { SpatialWarpLoader } from './SpatialWarpLoader';
import { VRButton } from 'three/addons/webxr/VRButton.js'; 
import { ArrowLeft, HelpCircle, Compass, Cpu, Layers, Ruler, Sliders, Crosshair, HelpCircle as HelpIcon, Sparkles } from 'lucide-react';
import * as THREE from 'three';
import { API_BASE } from '../config';

const VRHandler = () => {
    const { gl } = useThree();
    useEffect(() => {
        if (gl && gl.xr) {
            console.log("🎮 [NATIVE WEBXR] Injecting hardware VR synchronization loop parameters into WebGL renderer...");
            gl.xr.enabled = true; 
        }
    }, [gl]);
    return null;
};

export const TourPreview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams(); 

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

    // --- PIPELINE DETACHED TRANSITION DETECTOR ---
    const [isTransitionLoading, setIsTransitionLoading] = useState(false);

    const fetchProjectDetails = async () => {
        try {
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

    const handleToggleTopView = () => {
        if (!studioControlsRef.current) return;
        const activeCamera = studioControlsRef.current.object;
        
        if (!isTopView) {
            console.log("[LIVE PREVIEW] Shifting camera matrix up to Orthographic Floorplan view...");
            activeCamera.position.set(0, 485, 0); 
            studioControlsRef.current.target.set(0, 0, 0);
            studioControlsRef.current.maxPolarAngle = Math.PI / 2; 
        } else {
            console.log("[LIVE PREVIEW] Restoring first-person coordinate center lens...");
            activeCamera.position.set(0, 0, 0.1); 
            studioControlsRef.current.target.set(0, 0, 0);
            activeCamera.fov = 85; // Keep the standard wide lens view locked during top flips
            studioControlsRef.current.maxPolarAngle = Math.PI; 
        }
        studioControlsRef.current.update();
        setIsTopView(!isTopView);
    };

    const handleLiveSurfaceVectorCalculation = (e) => {
        if (!e || !e.point) return;
        const { x, y, z } = e.point;

        if (isMeasuring) {
            if (!pointA) {
                console.log("📍 [MEASURE TOOL] Point A Anchor dropped at:", { x, y, z });
                setPointA({ x, y, z });
                return; 
            }
            
            if (!pointB) {
                console.log("📍 [MEASURE TOOL] Point B Anchor dropped at:", { x, y, z });
                setPointB({ x, y, z });
                
                const dx = x - pointA.x;
                const dy = y - pointA.y;
                const dz = z - pointA.z;
                const rawDistance = Math.sqrt(dx*dx + dy*dy + dz*dz);
                const calibratedMeters = (rawDistance / 80).toFixed(2);
                
                setCalculatedDistance(calibratedMeters);
                return;
            }
            return;
        }

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

    const getMeasurementGuideline = () => {
        if (!pointA) return "Double-click anywhere on walls or floors to lock Point A baseline position";
        if (!pointB) return "Point A dropped! Now double-click another surface to find Point B Euclidean distance";
        return "Calculation processing complete! Tap the reset handle button underneath to clear space coordinates";
    };

    if (loading) {
        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#040712] text-slate-500 font-mono text-xs gap-3">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="tracking-widest uppercase text-[10px] font-black text-indigo-400">Buffering Live Immersive Tour Matrix...</span>
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
        <div className="w-screen h-screen bg-black relative font-sans overflow-hidden select-none text-slate-200">
            {/* 🚀 FIXED NATIVE DETACHED OVERLAY LOADER */}
            <SpatialWarpLoader isVisible={isTransitionLoading} />
            
            {/* 🚀 TOP LEFT: BACKLINK HUD OVERLAY */}
            {!isLiveSharedView && (
                <div className="absolute top-6 left-6 z-40 flex items-center gap-3">
                    <button 
                        type="button" 
                        onClick={() => navigate(`/editor/${id}`)} 
                        className="flex items-center gap-2 bg-slate-950/40 border border-slate-800/40 hover:border-indigo-500/40 px-4 py-2.5 rounded-xl text-xs font-black text-slate-200 hover:text-indigo-400 transition-all shadow-2xl backdrop-blur-xl cursor-pointer active:scale-95"
                    >
                        <ArrowLeft size={14} /> Back to Studio Editor
                    </button>
                </div>
            )}

            {/* 🚀 TOP RIGHT: SYSTEM NATIVE HARDWARE MOUNT FOR VR */}
            <div className="absolute top-6 right-6 z-40">
                <div 
                    ref={(node) => {
                        if (node && !node.hasChildNodes() && studioControlsRef.current) {
                            const canvasElement = node.closest('body')?.querySelector('canvas');
                            if (canvasElement) {
                                const dummyRenderer = { xr: { addEventListener: () => {}, removeEventListener: () => {}, enabled: false } };
                                const vrButtonElement = VRButton.createButton(dummyRenderer);
                                vrButtonElement.id = "native-vr-trigger";
                                vrButtonElement.style.position = "static";
                                vrButtonElement.style.border = "1px solid rgba(255,255,255,0.1)";
                                vrButtonElement.style.background = "rgba(2, 5, 15, 0.4)";
                                vrButtonElement.style.backdropFilter = "blur(16px)";
                                vrButtonElement.style.color = "#ffffff";
                                vrButtonElement.style.fontFamily = "sans-serif";
                                vrButtonElement.style.fontSize = "9px";
                                vrButtonElement.style.fontWeight = "900";
                                vrButtonElement.style.textTransform = "uppercase";
                                vrButtonElement.style.letterSpacing = "0.15em";
                                vrButtonElement.style.padding = "10px 18px";
                                vrButtonElement.style.borderRadius = "12px";
                                vrButtonElement.style.cursor = "pointer";
                                vrButtonElement.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
                                node.appendChild(vrButtonElement);
                            }
                        }
                    }}
                />
            </div>

            {/* 🖥️ CORE 3D VIEWPORT CANVAS LAYER */}
            {currentActiveRoomInstance ? (
                <div className="w-full h-full relative z-10">
                    
                    <Canvas 
                        key={`${activeRoomKey}-${currentActiveRoomInstance.hotspots?.length || 0}-${currentActiveRoomInstance.infoTags?.length || 0}`}
                        // 🚀 FIXED: Modified initial fov from 75 to 85 to make the startup viewpoint look nicely zoomed out
                        camera={{ position: [0, 0, 0.1], fov: 95, near: 0.1, far: 1000 }}
                        onWheel={(e) => {
                            if (!studioControlsRef.current || isTopView) return;
                            const activeCamera = studioControlsRef.current.object;
                            if (!activeCamera) return;
                            let freshFovValue = activeCamera.fov + e.deltaY * 0.04;
                            freshFovValue = Math.max(35, Math.min(105, freshFovValue)); // Expand limit boundary
                            activeCamera.fov = freshFovValue;
                            activeCamera.updateProjectionMatrix();
                        }}
                    >
                        <OrbitControls ref={studioControlsRef} rotateSpeed={-0.3} enableZoom={!isTopView} enablePan={false} enableDamping dampingFactor={0.05} />
                        <VRHandler />
                        <Suspense fallback={null}>
                            <group>
                                <PanoramaSphere 
                                    imagePath={currentActiveRoomInstance.image && currentActiveRoomInstance.image !== "/tour_assets/" ? currentActiveRoomInstance.image : "/tour_assets/room_0.jpg"} 
                                    hotspots={currentActiveRoomInstance.hotspots || []} 
                                    infoTags={currentActiveRoomInstance.infoTags || []} 
                                    stagedPosition={null} 
                                    // 🚀 FIXED: Preload background textures to engage overlay correctly
                                    onNavigateToRoom={(target) => {
                                        if (target && !isTopView) {
                                            setIsTransitionLoading(true);

                                            // Trace destination data properties safely
                                            const nextRoom = project.rooms.find(r => String(r.key).toLowerCase().trim() === String(target).toLowerCase().trim());
                                            const nextImagePath = nextRoom?.image || "/tour_assets/room_0.jpg";

                                            const preloader = new Image();
                                            preloader.src = nextImagePath;
                                            
                                            const startTime = Date.now();
                                            
                                            preloader.onload = () => {
                                                const duration = Date.now() - startTime;
                                                // Guarantee a minimum of 1.3 seconds hold time so the animation doesn't pop or stutter
                                                const minimumHoldTime = Math.max(1300 - duration, 0);

                                                setTimeout(() => {
                                                    setActiveRoomKey(String(target).toLowerCase().trim());
                                                    setCalcMetrics(null);
                                                    setIsTransitionLoading(false); // Cleanly drop interface shield
                                                }, minimumHoldTime);
                                            };
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
                                    <meshBasicMaterial visible={false} side={THREE.DoubleSide} depthWrite={false} />
                                </mesh>

                                {isMeasuring && pointA && (
                                    <mesh position={[pointA.x, pointA.y, pointA.z]}>
                                        <sphereGeometry args={[3.5, 16, 16]} />
                                        <meshBasicMaterial color="#ef4444" depthTest={false} depthWrite={false} />
                                    </mesh>
                                )}
                                {isMeasuring && pointB && (
                                    <mesh position={[pointB.x, pointB.y, pointB.z]}>
                                        <sphereGeometry args={[3.5, 16, 16]} />
                                        <meshBasicMaterial color="#3b82f6" depthTest={false} depthWrite={false} />
                                    </mesh>
                                )}
                            </group>
                        </Suspense>
                    </Canvas>

                    {/* 📐 INDIGO DECK: TWO-POINT SPACE MEASUREMENT CONSOLE HUD */}
                    {isMeasuring && (
                        <div className="absolute top-24 left-6 bg-slate-950/80 border border-indigo-500/30 p-5 rounded-2xl font-sans text-xs z-30 w-72 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl animate-fadeIn space-y-3.5">
                            <div className="font-black border-b border-indigo-900/60 pb-2 uppercase tracking-widest text-indigo-400 text-[9px] flex items-center gap-1.5">
                                <Crosshair size={12} className="animate-spin-slow text-indigo-400" /> Space Laser Measurer
                            </div>
                            
                            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex gap-2">
                                <HelpIcon size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                                <p className="text-[10px] leading-relaxed text-slate-300 m-0 font-medium font-sans normal-case">{getMeasurementGuideline()}</p>
                            </div>

                            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2 font-mono text-[10px]">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 tracking-wider uppercase text-[8px]">Anchor Point A:</span>
                                    <span className={pointA ? "text-emerald-400 font-bold" : "text-amber-400 font-bold animate-pulse"}>
                                        {pointA ? "✓ RECORDED" : "⏳ STANDBY"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 tracking-wider uppercase text-[8px]">Target Point B:</span>
                                    <span className={pointB ? "text-blue-400 font-bold" : pointA ? "text-amber-500 font-bold animate-pulse" : "text-slate-600"}>
                                        {pointB ? "✓ RECORDED" : pointA ? "⏳ STANDBY" : "🔒 LOCKED"}
                                    </span>
                                </div>
                            </div>

                            {calculatedDistance && (
                                <div className="p-3 bg-gradient-to-br from-indigo-950/50 to-slate-950 border border-indigo-500/40 rounded-xl text-center shadow-inner animate-fadeIn">
                                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-0.5">Absolute Clearance Path</span>
                                    <div className="text-2xl font-black text-white tracking-tight">{calculatedDistance} <span className="text-xs font-sans text-slate-400 lowercase font-medium">meters</span></div>
                                </div>
                            )}

                            <button 
                                type="button" 
                                onClick={() => { setPointA(null); setPointB(null); setCalculatedDistance(null); }}
                                className="w-full py-2 bg-slate-900 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all cursor-pointer shadow-md active:scale-95"
                            >
                                Clear Coordinate Plots
                            </button>
                        </div>
                    )}

                    {/* 🔬 EMERALD DECK: SPHERICAL NUMERICAL RECONVERSION RAYHUD */}
                    {showCalcHUD && calcMetrics && (
                        <div className="absolute top-24 left-6 bg-slate-950/80 border border-emerald-500/30 p-5 rounded-2xl font-mono text-[10px] text-emerald-400 space-y-2.5 z-30 w-72 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl animate-fadeIn">
                            <div className="font-sans font-black border-b border-emerald-900/60 pb-2 uppercase tracking-widest text-white text-[9px] flex items-center gap-1.5">
                                <Cpu size={12} className="text-emerald-400 animate-pulse" /> Ray Intersection Matrix
                            </div>
                            <div className="bg-slate-900/60 p-2.5 border border-slate-800 rounded-xl space-y-1">
                                <div className="flex justify-between"><span className="text-slate-500">Vector X:</span><span className="text-slate-200 font-bold">{calcMetrics.x}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Vector Y:</span><span className="text-slate-200 font-bold">{calcMetrics.y}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Vector Z:</span><span className="text-slate-200 font-bold">{calcMetrics.z}</span></div>
                            </div>
                            <div className="flex justify-between px-1"><span className="text-slate-400 font-sans text-[9px] uppercase tracking-wider font-bold">Computed Radius:</span><span className="text-emerald-300 font-black">R = {calcMetrics.r}</span></div>
                            <div className="p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1 border-t-2 border-t-emerald-500">
                                <div className="flex justify-between text-white"><span>Derived Yaw (θ):</span><span className="font-black text-emerald-300">{calcMetrics.yaw}°</span></div>
                                <div className="flex justify-between text-white"><span>Derived Pitch (ϕ):</span><span className="font-black text-emerald-300">{calcMetrics.pitch}°</span></div>
                            </div>
                        </div>
                    )}

                    {/* 🧭 BOTTOM GLASS HUD CONTROL PANEL DECK */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3.5 z-20 w-[90%] max-w-sm pointer-events-none">
                        
                        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 p-1.5 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.5)] backdrop-blur-2xl pointer-events-auto">
                            <button 
                                type="button" 
                                onClick={handleToggleTopView}
                                className={`p-2.5 rounded-xl transition-all duration-300 cursor-pointer border font-bold ${
                                    isTopView 
                                        ? 'bg-amber-500 text-slate-950 border-amber-400 scale-105 shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                                        : 'text-slate-400 border-transparent hover:text-slate-100 hover:bg-slate-900/60'
                                }`}
                                title={isTopView ? "Exit Blueprint View" : "Floor Plan Map Overlook"}
                            >
                                <Layers size={13} />
                            </button>
                            
                            <div className="w-px h-3.5 bg-slate-800/60" />
                            
                            <button 
                                type="button" 
                                onClick={() => { 
                                    setIsMeasuring(!isMeasuring);
                                    setShowCalcHUD(false); 
                                    setPointA(null); setPointB(null); setCalculatedDistance(null);
                                }}
                                className={`p-2.5 rounded-xl transition-all duration-300 cursor-pointer border font-bold ${
                                    isMeasuring 
                                        ? 'bg-indigo-600 text-white border-indigo-400 scale-105 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                                        : 'text-slate-400 border-transparent hover:text-indigo-400 hover:bg-indigo-950/20'
                                }`}
                                title="Laser Distance Compass"
                            >
                                <Ruler size={13} />
                            </button>

                            <div className="w-px h-3.5 bg-slate-800/60" />

                            <button 
                                type="button" 
                                onClick={() => { setShowCalcHUD(!showCalcHUD); setIsMeasuring(false); setCalcMetrics(null); }}
                                className={`p-2.5 rounded-xl transition-all duration-300 cursor-pointer border font-bold ${
                                    showCalcHUD 
                                        ? 'bg-emerald-600 text-white border-emerald-400 scale-105 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                                        : 'text-slate-400 border-transparent hover:text-emerald-400 hover:bg-emerald-950/20'
                                }`}
                                title="Spherical Vector Intersector"
                            >
                                <Sliders size={13} />
                            </button>
                        </div>

                        <div className="bg-slate-950/90 border border-slate-800/80 px-5 py-4 rounded-2xl shadow-2xl text-center w-full relative overflow-hidden backdrop-blur-2xl">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-600/30 to-transparent" />
                            
                            {/* <div className="flex items-center justify-center gap-1.5 text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">
                                <Compass size={11} className={isTopView ? "" : "animate-spin-slow"} /> 
                                {isTopView ? "Orthographic Floorplan View" : "Active Blueprint Node"}
                            </div> */}
                            
                            <h2 className="text-xs font-black text-white uppercase tracking-widest m-0">{currentActiveRoomInstance.title}</h2>
                            
                            {!isTopView && currentActiveRoomInstance.description && (
                                <p className="text-[10px] text-slate-300 font-medium leading-relaxed m-0 mt-2 normal-case border-t border-slate-900 pt-2.5">{currentActiveRoomInstance.description}</p>
                            )}
                            
                            {showCalcHUD && !calcMetrics && !isTopView && (
                                <div className="text-[8px] text-emerald-400 font-mono tracking-wider font-bold mt-2 border-t border-slate-900 pt-2 uppercase animate-pulse flex items-center justify-center gap-1">
                                    <Sparkles size={10} /> Double-tap walls to decode matrix coordinates
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-[#040712]">
                    <HelpCircle size={22} className="text-slate-600 mb-2 animate-pulse" />
                    <h5 className="text-[9px] font-black tracking-widest uppercase text-slate-500">WebGL Viewport Handshake Failure</h5>
                </div>
            )}
        </div>
    );
};