import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three'; 
import { PanoramaSphere } from './PanoramaSphere'; 
import { ArrowLeft, Sliders, PlusCircle, HelpCircle, Eye, Tag, MapPin, Layout } from 'lucide-react';

// 🚀 IMPORT YOUR LIVE BACKEND ROUTING VARIABLE HERE:
import { API_BASE } from '../config';

export const TourEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // --- MASTER DATA STREAM STATES ---
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeRoomKey, setActiveRoomKey] = useState("");

    // --- SIDEBAR WIZARD STEP SYSTEM ---
    const [editorStep, setEditorStep] = useState(1); // 1: Room Form | 2: Spatial Raycasting Vector Map

    // --- STEP 1 WORKSPACE FORM BUFFERS ---
    const [roomTitle, setRoomTitle] = useState("");
    const [roomDesc, setRoomDesc] = useState("");
    const [panoFileName, setPanoFileName] = useState("");
    const [panoPreviewUrl, setPanoPreviewUrl] = useState("");

    // --- STEP 2 INTERACTIVE TARGET DATA HOOKS ---
    const [interactionMode, setInteractionMode] = useState("infotag"); 
    const [hotspotTargetKey, setHotspotTargetKey] = useState("");
    const [hotspotText, setHotspotText] = useState("");
    const [tagTitle, setTagTitle] = useState("");
    const [tagDesc, setTagDesc] = useState("");

    const studioControlsRef = useRef();

    // --- NEW SPATIAL CONFIRMATION STAGING STATES ---
    const [stagedPosition, setStagedPosition] = useState(null); 
    const [isStagedConfirmed, setIsStagedConfirmed] = useState(false); 

    // --- NEW EDITING INDEX TRACKERS ---
    const [editingHotspotIndex, setEditingHotspotIndex] = useState(null); 
    const [editingInfoTagIndex, setEditingInfoTagIndex] = useState(null); 

    // 🚀 READ PIPELINE: Pull active project layout structure out of cloud backend
    const fetchProjectDetails = async () => {
        console.log(`\n--- [DEBUG READ PIPELINE] Initiating API fetch via gateway: ${API_BASE} for Project ID: ${id} ---`);
        try {
            const response = await fetch(`${API_BASE}/api/projects`);
            const data = await response.json();
            console.log("[DEBUG READ PIPELINE] Total projects array fetched from cloud:", data);
            
            const targetProject = data.find(p => p._id === id);
            if (targetProject) {
                console.log("[DEBUG READ PIPELINE] Target project matched successfully:", targetProject);
                setProject(targetProject);
                
                if (targetProject.rooms && targetProject.rooms.length > 0) {
                    const fallbackFirstKey = String(targetProject.rooms[0].key).toLowerCase().trim();
                    console.log(`[DEBUG READ PIPELINE] Found ${targetProject.rooms.length} room(s). Initial active room key set to: "${fallbackFirstKey}"`);
                    setActiveRoomKey(fallbackFirstKey);
                    
                    if (targetProject.rooms.length === 1) {
                        console.log("[DEBUG READ PIPELINE] Single room limit detected. Locking interactions to Amenity Info mode.");
                        setInteractionMode("infotag");
                    } else {
                        console.log("[DEBUG READ PIPELINE] Multi-room environment detected. Enforcing Hotspot baseline mode.");
                        setInteractionMode("hotspot");
                    }
                } else {
                    console.log("[DEBUG READ PIPELINE] Empty listing instance trace. Enforcing zero room fallback configs.");
                }
            } else {
                console.warn(`[DEBUG READ PIPELINE] Document lookup failed. No record targets ID matching: ${id}`);
            }
            setLoading(false);
        } catch (err) {
            console.error("[DEBUG READ PIPELINE] Critical Database Read Failure Exception:", err);
            setLoading(false);
        }
    };

    useEffect(() => { 
        if (id) {
            fetchProjectDetails(); 
        }
    }, [id]);

    const handleLocalFileSelection = (e) => {
        if (!e?.target?.files) return;
        const file = e.target.files[0];
        if (!file) {
            console.log("[DEBUG FILE SELECTION] File selection explorer closed blank.");
            return;
        }
        console.log(`[DEBUG FILE SELECTION] Binary target loaded -> Name: "${file.name}", Size: ${file.size} bytes`);
        setPanoFileName(file.name);
        setPanoPreviewUrl(URL.createObjectURL(file)); 
    };

    // 🚀 MULTIPART CLOUD UPLOAD + DATABASE APPEND PIPELINE
    const handleAddNewRoomSubmit = async (e) => {
        e.preventDefault();
        console.log("\n--- [DEBUG FORM STEP 1] Initializing cloud multi-part form stream compilation ---");
        
        const fileElement = document.getElementById('editor-pano-selector');
        const fileInput = fileElement?.files ? fileElement.files[0] : null;
        if (!fileInput) {
            console.warn("[DEBUG FORM STEP 1] Upload stopped: Equirectangular file source missing.");
            return alert("Validation Guard: Please select an image file first.");
        }

        const formData = new FormData();
        formData.append('file', fileInput);
        formData.append('roomTitle', roomTitle.trim()); 
        formData.append('roomDesc', roomDesc.trim());
        formData.append('projectId', id);

        try {
            const uploadResponse = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                body: formData 
            });
            const uploadResult = await uploadResponse.json();
            console.log("[DEBUG FORM STEP 1] Cloud pipeline response received:", uploadResult);

            if (uploadResult.success) {
                console.log("✓ [DEBUG FORM STEP 1] File committed to cloud storage and metadata written to MongoDB.");
                setProject(uploadResult.updatedProject);
                
                const verifiedNewKey = String(uploadResult.newRoomKey).toLowerCase().trim();
                console.log(`[DEBUG FORM STEP 1] Synchronizing workspace key context to: "${verifiedNewKey}"`);
                setActiveRoomKey(verifiedNewKey);
                
                // Reset input fields
                setRoomTitle("");
                setRoomDesc("");
                setPanoFileName("");
                setPanoPreviewUrl("");
                
                if (uploadResult.updatedProject?.rooms?.length === 1) {
                    setInteractionMode("infotag");
                } else {
                    setInteractionMode("hotspot");
                }
                
                setStagedPosition(null);
                setIsStagedConfirmed(false);
                setEditorStep(2); 
                console.log("[DEBUG FORM STEP 1] Workspace successfully redirected to Step 2 [Place Tags].");
            } else {
                console.warn(`[DEBUG FORM STEP 1] Cloud server rejected payload package: ${uploadResult.message}`);
                alert(`Upload validation notice: ${uploadResult.message}`);
            }
        } catch (err) {
            console.error("[DEBUG FORM STEP 1] Critical HTTP cloud multipart execution failure exception:", err);
            alert("System communication failure. Verify your cloud network tracking loops.");
        }
    };

    // 🚀 INTERACTION VECTOR RAYCASTER
    const handleWebGLMeshSurfaceIntersection = (e) => {
        if (!e || !e.point || !activeRoomKey) {
            console.log("[DEBUG RAYCASTER] Intersect event dropped: parameters missing.");
            return;
        }
        
        const { x, y, z } = e.point;
        const radius = Math.sqrt(x*x + y*y + z*z);
        if (radius === 0) return;

        const pitch = Math.round(Math.asin(y / radius) * (180 / Math.PI));
        const yaw = Math.round(Math.atan2(x, z) * (180 / Math.PI));
        
        console.log(`[DEBUG RAYCASTER] Surface click hit structural coordinate: (Yaw: ${yaw}°, Pitch: ${pitch}°)`);

        setStagedPosition({ yaw, pitch });
        setIsStagedConfirmed(true); 
    };

    const handleTriggerHotspotEditMode = (index, spot) => {
        console.log(`[EDIT MODE] Loading Hotspot data into buffers from array index: ${index}`);
        setInteractionMode("hotspot");
        setEditingHotspotIndex(index);
        setEditingInfoTagIndex(null); 
        
        setHotspotTargetKey(spot.target);
        setHotspotText(spot.text);
        
        setStagedPosition({ yaw: spot.yaw, pitch: spot.pitch });
        setIsStagedConfirmed(true);
    };

    const handleTriggerInfoTagEditMode = (index, tag) => {
        console.log(`[EDIT MODE] Loading InfoTag data into buffers from array index: ${index}`);
        setInteractionMode("infotag");
        setEditingInfoTagIndex(index);
        setEditingHotspotIndex(null); 
        
        setTagTitle(tag.title);
        setTagDesc(tag.text);
        
        setStagedPosition({ yaw: tag.yaw, pitch: tag.pitch });
        setIsStagedConfirmed(true);
    };

    const handleConfirmAndDeployNode = async () => {
        console.log("\n--- [DEBUG MUTATION STEP 2] Initializing data marker deployment loop ---");
        if (!stagedPosition) {
            return alert("System Notice: Please select or stage a 3D coordinate point first.");
        }

        const projectCopy = JSON.parse(JSON.stringify(project));
        const activeRoomIndex = projectCopy.rooms.findIndex(r => String(r.key).toLowerCase().trim() === String(activeRoomKey).toLowerCase().trim());
        if (activeRoomIndex === -1) return alert("Internal layout structure error.");

        if (interactionMode === "hotspot") {
            if (project.rooms.length <= 1) return alert("Add more rooms first.");
            if (!hotspotTargetKey) return alert("Please choose a destination room connection.");

            const hotspotPayload = {
                text: hotspotText.trim() || "Move Forward ➔",
                target: hotspotTargetKey.toLowerCase().trim(),
                yaw: stagedPosition.yaw,
                pitch: stagedPosition.pitch
            };

            if (editingHotspotIndex !== null) {
                console.log(`[DEBUG MUTATION] Overwriting existing Hotspot at array index: ${editingHotspotIndex}`);
                projectCopy.rooms[activeRoomIndex].hotspots[editingHotspotIndex] = hotspotPayload;
            } else {
                console.log("[DEBUG MUTATION] Appending brand new Hotspot to array stack.");
                if (!projectCopy.rooms[activeRoomIndex].hotspots) projectCopy.rooms[activeRoomIndex].hotspots = [];
                projectCopy.rooms[activeRoomIndex].hotspots.push(hotspotPayload);
            }

            setHotspotTargetKey("");
            setHotspotText("");
            setEditingHotspotIndex(null);
        } else {
            if (!tagTitle.trim()) return alert("Please enter an amenity heading title.");

            const tagPayload = {
                title: tagTitle.trim(),
                text: tagDesc.trim() || "Asset specifications descriptors details.",
                yaw: stagedPosition.yaw,
                pitch: stagedPosition.pitch
            };

            if (editingInfoTagIndex !== null) {
                console.log(`[DEBUG MUTATION] Overwriting existing InfoTag at array index: ${editingInfoTagIndex}`);
                projectCopy.rooms[activeRoomIndex].infoTags[editingInfoTagIndex] = tagPayload;
            } else {
                console.log("[DEBUG MUTATION] Appending brand new InfoTag to array stack.");
                if (!projectCopy.rooms[activeRoomIndex].infoTags) projectCopy.rooms[activeRoomIndex].infoTags = [];
                projectCopy.rooms[activeRoomIndex].infoTags.push(tagPayload);
            }

            setTagTitle("");
            setTagDesc("");
            setEditingInfoTagIndex(null);
        }

        try {
            const response = await fetch(`${API_BASE}/api/projects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rooms: projectCopy.rooms })
            });
            const data = await response.json();
            
            setProject(data); 
            setStagedPosition(null); 
            setIsStagedConfirmed(false); 
            alert("✓ Spatial marker registry successfully synchronized and saved!");
        } catch (err) {
            console.error("Database mutation failed:", err);
        }
    };

    // 🚀 CONFIGURABLE DELETE GATEWAYS METHOD
    const handleDeleteHotspotNode = async (targetIndex) => {
        console.log(`\n--- 🗑️ [DEBUG DELETION] Initializing splice on Hotspots Array Index: ${targetIndex} ---`);
        if (!project) return;

        const projectCopy = JSON.parse(JSON.stringify(project));
        const activeRoomIndex = projectCopy.rooms.findIndex(r => String(r.key).toLowerCase().trim() === String(activeRoomKey).toLowerCase().trim());
        
        if (activeRoomIndex === -1) return;

        projectCopy.rooms[activeRoomIndex].hotspots.splice(targetIndex, 1);

        try {
            const response = await fetch(`${API_BASE}/api/projects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rooms: projectCopy.rooms })
            });
            const updatedData = await response.json();
            setProject(updatedData);
            alert("✓ Gateway connection successfully purged from database registry!");
        } catch (err) {
            console.error("❌ Error removing gateway index link:", err);
        }
    };

    const handleDeleteInfoTagNode = async (targetIndex) => {
        console.log(`\n--- 🗑️ [DEBUG DELETION] Initializing splice on InfoTags Array Index: ${targetIndex} ---`);
        if (!project) return;

        const projectCopy = JSON.parse(JSON.stringify(project));
        const activeRoomIndex = projectCopy.rooms.findIndex(r => String(r.key).toLowerCase().trim() === String(activeRoomKey).toLowerCase().trim());
        
        if (activeRoomIndex === -1) return;

        projectCopy.rooms[activeRoomIndex].infoTags.splice(targetIndex, 1);

        try {
            const response = await fetch(`${API_BASE}/api/projects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rooms: projectCopy.rooms }) 
            });
            
            const updatedData = await response.json();
            setProject(updatedData);
            alert("✓ Amenity Tag entry successfully purged from database registry!");
        } catch (err) {
            console.error("❌ Error mutating database array indices:", err);
        }
    };

    const currentStagedRoomInstance = (() => {
        if (!project || !project.rooms || project.rooms.length === 0) return null;
        const cleanLookUpKey = String(activeRoomKey || "").toLowerCase().trim();
        
        let matchedRoom = project.rooms.find(r => r && r.key && String(r.key).toLowerCase().trim() === cleanLookUpKey);
        if (!matchedRoom && project.initialRoomKey) {
            const cleanInitialKey = String(project.initialRoomKey).toLowerCase().trim();
            matchedRoom = project.rooms.find(r => r && r.key && String(r.key).toLowerCase().trim() === cleanInitialKey);
        }
        return matchedRoom || project.rooms[0];
    })();

    if (loading) {
        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#040712] text-slate-500 font-mono text-xs gap-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Synchronizing Enterprise Database Pipelines...</span>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#040712] text-slate-400 font-sans p-6 text-center">
                <h4 className="text-sm font-bold text-white mb-1">Project Registry Instance Not Found</h4>
                <button type="button" onClick={() => navigate('/')} className="px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-300">Return to Workspace Hub</button>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen flex flex-col bg-[#040712] text-slate-200 font-sans overflow-hidden select-none">
            {/* Header Hub Navigator */}
            <header className="px-8 py-4 border-b border-slate-900 bg-slate-950/20 backdrop-blur-xl flex justify-between items-center z-20">
                <button type="button" onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer">
                    <ArrowLeft size={14} /> Close Editor Hub
                </button>
                <div className="text-center">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">{project.name}</h3>
                    <p className="text-[10px] text-slate-500 font-bold font-mono uppercase mt-0.5">DB Registry Instance Identifier: {id}</p>
                </div>
                <button 
                    type="button" 
                    onClick={() => navigate(`/tour/${id}`)} 
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-all shadow-md cursor-pointer active:scale-95"
                >
                    <Eye size={12} /> Go Live Preview
                </button>
            </header>

            {/* Core Workspace Split Frame */}
            <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden box-border">
                
                {/* 🖥️ LEFT: 3D THREE.JS WEBGL VIEWPORT PREVIEW PORTAL */}
                <div className="flex-[2] bg-[#02050f] rounded-3xl border border-slate-900 relative min-h-[300px] overflow-hidden">
                    {currentStagedRoomInstance ? (
                        <div className="w-full h-full relative">
                            <Canvas 
                                key={`${activeRoomKey}-${currentStagedRoomInstance.hotspots?.length || 0}-${currentStagedRoomInstance.infoTags?.length || 0}`}
                                camera={{ position: [0, 0, 0.1], fov: 75, near: 0.1, far: 1000 }}
                                onWheel={(e) => {
                                    if (!studioControlsRef.current) return;
                                    const activeCamera = studioControlsRef.current.object;
                                    if (!activeCamera) return;
                                    let freshFovValue = activeCamera.fov + e.deltaY * 0.04;
                                    freshFovValue = Math.max(35, Math.min(95, freshFovValue));
                                    activeCamera.fov = freshFovValue;
                                    activeCamera.updateProjectionMatrix();
                                }}
                            >
                                <OrbitControls 
                                    ref={studioControlsRef} 
                                    rotateSpeed={-0.3} 
                                    enableZoom={true} 
                                    enablePan={false} 
                                    enableDamping 
                                    dampingFactor={0.05} 
                                />
                                <Suspense fallback={null}>
                                    <group>
                                        <PanoramaSphere 
                                            imagePath={
                                                currentStagedRoomInstance.image && currentStagedRoomInstance.image !== "/tour_assets/"
                                                    ? currentStagedRoomInstance.image 
                                                    : "/tour_assets/room_0.jpg"
                                            } 
                                            hotspots={currentStagedRoomInstance.hotspots || []} 
                                            infoTags={currentStagedRoomInstance.infoTags || []} 
                                            stagedPosition={stagedPosition}
                                        />
                                        <mesh 
                                            onDoubleClick={(e) => {
                                                e.stopPropagation(); 
                                                if (isStagedConfirmed) return;
                                                handleWebGLMeshSurfaceIntersection(e);
                                            }}
                                        >
                                            <sphereGeometry args={[495, 32, 32]} />
                                            <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
                                        </mesh>
                                    </group>
                                </Suspense>
                            </Canvas>
                            <div className="absolute top-4 left-4 right-4 bg-slate-950/90 border border-blue-500/20 backdrop-blur-md text-blue-400 text-[10px] font-black uppercase tracking-wider py-2.5 px-4 rounded-xl text-center shadow-2xl z-10 pointer-events-none">
                                🎯 Active Viewport: {String(currentStagedRoomInstance.title || "Untitled Space").toUpperCase()} // Double-click any wall surface to stage a brand new marker
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 box-border">
                            <HelpCircle size={24} className="text-slate-700 mb-2" />
                            <h5 className="text-xs font-black tracking-widest uppercase text-slate-500">WebGL Graphic Render Pipeline Inactive</h5>
                        </div>
                    )}
                </div>

                {/* 🎛️ RIGHT: SYSTEM PANEL SLIDER WIZARD FRAME */}
                <div className="flex-1 bg-slate-900/10 border border-slate-900/80 rounded-3xl p-6 box-border flex flex-col backdrop-blur-md overflow-hidden min-w-[320px]">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-1.5">
                            <Sliders size={14} className="text-blue-500" />
                            <h4 className="text-xs font-black uppercase tracking-wider text-blue-400">Studio Core Panel</h4>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setEditorStep(1)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border cursor-pointer transition-all ${editorStep === 1 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-500'}`}>1. Add Room</button>
                            <button type="button" onClick={() => currentStagedRoomInstance ? setEditorStep(2) : alert("Requires Room Profile Context")} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border cursor-pointer transition-all ${editorStep === 2 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-500'}`}>2. Place Tags</button>
                        </div>
                    </div>

                    <hr className="border-slate-900 mb-4" />

                    <div className="flex-1 overflow-y-auto pr-1 box-border">
                        {editorStep === 1 && (
                            <form onSubmit={handleAddNewRoomSubmit} className="space-y-4">
                                <div className="bg-blue-600/5 border border-blue-500/10 rounded-xl p-3 text-[11px] text-slate-400 leading-relaxed mb-2">
                                    Total Rooms Staged inside MongoDB: <strong className="text-blue-400 font-black">{project.rooms?.length || 0} Rooms</strong>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold tracking-widest text-slate-500 uppercase block mb-1.5">Room Profile Title Name *</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-3 py-2.5 bg-slate-950/50 border border-slate-800 rounded-lg outline-none text-xs text-slate-200 focus:border-blue-500/30" 
                                        placeholder="e.g., Master Bed Suite" 
                                        value={roomTitle || ""} 
                                        onChange={e => setRoomTitle(e.target.value)} 
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold tracking-widest text-slate-500 uppercase block mb-1.5">HUD Panel Marketing Summary</label>
                                    <textarea 
                                        className="w-full px-3 py-2.5 bg-slate-950/50 border border-slate-800 rounded-lg outline-none text-xs text-slate-200 focus:border-blue-500/30 h-16 resize-none" 
                                        placeholder="Add specific descriptions..." 
                                        value={roomDesc || ""} 
                                        onChange={e => setRoomDesc(e.target.value)} 
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold tracking-widest text-slate-500 uppercase block mb-1.5">Select 360° Panorama Image File Source</label>
                                    <input type="file" name="file" accept="image/*" id="editor-pano-selector" className="hidden" onChange={handleLocalFileSelection} />
                                    <label htmlFor="editor-pano-selector" className="w-full py-3 border border-dashed border-slate-800 hover:bg-slate-950/40 rounded-xl flex items-center justify-center text-center text-xs text-slate-400 cursor-pointer box-border">
                                        <span className="font-bold text-[10px] text-blue-400/80 truncate px-2">{panoFileName ? `📁 Staging: ${panoFileName}` : "🔍 Choose Local Device Media"}</span>
                                    </label>
                                </div>
                                <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl mt-4 shadow-lg flex items-center justify-center gap-1.5 cursor-pointer">
                                    <PlusCircle size={13}/> Append Room to Manifest Matrix
                                </button>
                            </form>
                        )}

                        {editorStep === 2 && (
                            <div className="space-y-4 animate-fadeIn">
                                {!project.rooms || project.rooms.length === 0 ? (
                                    <div className="p-6 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/20 my-4 box-border">
                                        <Layout size={28} className="text-slate-700 mx-auto mb-2 animate-pulse" />
                                        <h6 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Control Panel Locked</h6>
                                        <button type="button" onClick={() => setEditorStep(1)} className="mt-4 px-4 py-2 bg-blue-600 text-[10px] font-black uppercase tracking-wider rounded-lg text-white cursor-pointer">Create Room Node</button>
                                    </div>
                                ) : (
                                    currentStagedRoomInstance && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[9px] font-bold tracking-widest text-slate-500 uppercase block mb-1.5">Active Target Working Context Node</label>
                                                <select 
                                                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg outline-none text-xs text-slate-300 font-bold cursor-pointer" 
                                                    value={String(activeRoomKey || "").toLowerCase()} 
                                                    onChange={(e) => {
                                                        setActiveRoomKey(e.target.value.toLowerCase().trim());
                                                        setStagedPosition(null);
                                                        setIsStagedConfirmed(false);
                                                    }}
                                                >
                                                    {project.rooms.map(r => (
                                                        <option key={r.key} value={String(r.key).toLowerCase().trim()}>📁 {String(r.title || "Untitled Unit").toUpperCase()}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-1 gap-1 border border-slate-950 bg-slate-950/40 p-1 rounded-xl">
                                                {project.rooms.length === 1 ? (
                                                    <div className="py-2.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-950/80 border border-slate-900/60 text-indigo-400 text-center flex items-center justify-center gap-1.5">
                                                        <Tag size={11}/> Mode Locked: Amenity Info Placement Only
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-2 w-full">
                                                        <button type="button" onClick={() => { setInteractionMode("hotspot"); setStagedPosition(null); setIsStagedConfirmed(false); }} className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer ${interactionMode === "hotspot" ? 'bg-slate-900 border border-slate-800 text-blue-400 shadow-md' : 'text-slate-500'}`}>
                                                            <MapPin size={11}/> Gateway Hotspot
                                                        </button>
                                                        <button type="button" onClick={() => { setInteractionMode("infotag"); setStagedPosition(null); setIsStagedConfirmed(false); }} className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer ${interactionMode === "infotag" ? 'bg-slate-900 border border-slate-800 text-indigo-400 shadow-md' : 'text-slate-500'}`}>
                                                            <Tag size={11}/> Amenity Info Tag
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-4 border border-slate-950 bg-slate-950/20 rounded-2xl">
                                                {(interactionMode === "hotspot" && project.rooms.length > 1) ? (
                                                    <div className="space-y-3">
                                                        <h5 className="text-[10px] font-black text-blue-500 tracking-widest uppercase mb-2 flex items-center gap-1"><Eye size={12}/> Route Connection Options</h5>
                                                        <select disabled={!isStagedConfirmed} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg outline-none text-xs text-slate-300 disabled:opacity-40 cursor-pointer" value={hotspotTargetKey || ""} onChange={(e) => setHotspotTargetKey(e.target.value)}>
                                                            <option value="">-- Choose Target Room Node --</option>
                                                            {project.rooms.filter(r => String(r.key).toLowerCase().trim() !== String(activeRoomKey).toLowerCase().trim()).map(r => (
                                                                <option key={r.key} value={String(r.key).toLowerCase().trim()}>===➔ {r.title.toUpperCase()}</option>
                                                            ))}
                                                        </select>
                                                        <input disabled={!isStagedConfirmed} type="text" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg outline-none text-xs text-slate-300 placeholder-slate-700 disabled:opacity-40" placeholder="Button text tooltip (e.g., Enter Kitchen ➔)" value={hotspotText || ""} onChange={(e) => setHotspotText(e.target.value)} />
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <h5 className="text-[10px] font-black text-indigo-400 tracking-widest uppercase mb-2 flex items-center gap-1"><Tag size={11}/> Premium Amenity Description Callout</h5>
                                                        <input disabled={!isStagedConfirmed} type="text" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg outline-none text-xs text-slate-200 placeholder-slate-700" placeholder="Heading Label (e.g., Italian Marble)" value={tagTitle || ""} onChange={(e) => setTagTitle(e.target.value)} />
                                                        <input disabled={!isStagedConfirmed} type="text" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg outline-none text-xs text-slate-200 placeholder-slate-700" placeholder="Description info text strings..." value={tagDesc || ""} onChange={(e) => setTagDesc(e.target.value)} />
                                                    </div>
                                                )}
                                            </div>

                                            {isStagedConfirmed ? (
                                                <div className="mt-2 p-1 border border-orange-500/20 bg-orange-500/5 rounded-2xl space-y-2">
                                                    <button type="button" onClick={handleConfirmAndDeployNode} className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg cursor-pointer">
                                                        {editingHotspotIndex !== null || editingInfoTagIndex !== null ? "🔥 Overwrite & Update Marker" : "🔥 Confirm & Deploy Anchor Node"}
                                                    </button>
                                                    <button type="button" onClick={() => { setStagedPosition(null); setIsStagedConfirmed(false); setEditingHotspotIndex(null); setEditingInfoTagIndex(null); setHotspotTargetKey(""); setHotspotText(""); setTagTitle(""); setTagDesc(""); }} className="w-full text-center text-[9px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest cursor-pointer pb-1">Cancel Selection</button>
                                                </div>
                                            ) : (
                                                <div className="p-4 border border-dashed border-slate-800/80 rounded-2xl text-center text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-950/20 leading-relaxed">
                                                    🖱️ Double-click anywhere onto the 3D room surface to project a positioning staging marker pin
                                                </div>
                                            )}

                                            {/* --- MANAGEMENT REGISTRIES TIER --- */}
                                            <div className="space-y-4 border-t border-slate-900 pt-4 mt-2">
                                                {interactionMode === "hotspot" && (
                                                    <div className="space-y-2 animate-fadeIn">
                                                        <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                                            <MapPin size={11} /> Configured Doorway Gateways ({currentStagedRoomInstance.hotspots?.length || 0})
                                                        </h5>
                                                        {!currentStagedRoomInstance.hotspots || currentStagedRoomInstance.hotspots.length === 0 ? (
                                                            <div className="text-[9px] text-slate-600 uppercase tracking-wider p-2.5 bg-slate-950/20 border border-slate-950 rounded-xl text-center">Zero gateways configured.</div>
                                                        ) : (
                                                            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-slate-950/60 bg-slate-950/20 p-1.5 rounded-xl">
                                                                {currentStagedRoomInstance.hotspots.map((spot, index) => (
                                                                    <div key={`side-spot-${index}`} className={`flex justify-between items-center px-2.5 py-2 rounded-lg text-[10px] font-bold border transition-colors ${editingHotspotIndex === index ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' : 'bg-slate-950 border-slate-900 text-slate-400'}`}>
                                                                        <div className="truncate flex-1 pr-2">
                                                                            <span className="text-blue-500 text-[9px] font-mono font-black uppercase tracking-wider block">➔ {spot.target.toUpperCase()}</span>
                                                                            <span className="truncate block mt-0.5 font-medium text-slate-300">"{spot.text}"</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                            <button type="button" onClick={() => handleTriggerHotspotEditMode(index, spot)} className="text-slate-500 hover:text-blue-400 text-[9px] uppercase tracking-wider font-extrabold cursor-pointer">Edit</button>
                                                                            <button type="button" onClick={() => { if(window.confirm("Delete gateway?")) handleDeleteHotspotNode(index); }} className="text-slate-600 hover:text-red-400 text-[9px] uppercase tracking-wider font-extrabold cursor-pointer">Delete</button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {interactionMode === "infotag" && (
                                                    <div className="space-y-2 animate-fadeIn">
                                                        <h5 className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                                                            <Tag size={11} /> Configured Amenity Beacons ({currentStagedRoomInstance.infoTags?.length || 0})
                                                        </h5>
                                                        {!currentStagedRoomInstance.infoTags || currentStagedRoomInstance.infoTags.length === 0 ? (
                                                            <div className="text-[9px] text-slate-600 uppercase tracking-wider p-2.5 bg-slate-950/20 border border-slate-950 rounded-xl text-center">Zero amenity tags configured.</div>
                                                        ) : (
                                                            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-slate-950/60 bg-slate-950/20 p-1.5 rounded-xl">
                                                                {currentStagedRoomInstance.infoTags.map((tag, index) => (
                                                                    <div key={`side-tag-${index}`} className={`flex justify-between items-center px-2.5 py-2 rounded-lg text-[10px] font-bold border transition-colors ${editingInfoTagIndex === index ? 'bg-purple-600/10 border-purple-500/30 text-purple-400' : 'bg-slate-950 border-slate-900 text-slate-400'}`}>
                                                                        <div className="truncate flex-1 pr-2">
                                                                            <span className="text-purple-400 text-[9px] font-black uppercase block truncate">{tag.title}</span>
                                                                            <span className="truncate block mt-0.5 font-medium text-slate-500 text-[9px]">{tag.text}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                            <button type="button" onClick={() => handleTriggerInfoTagEditMode(index, tag)} className="text-slate-500 hover:text-purple-400 text-[9px] uppercase tracking-wider font-extrabold cursor-pointer">Edit</button>
                                                                            <button type="button" onClick={() => { if(window.confirm("Delete amenity tag?")) handleDeleteInfoTagNode(index); }} className="text-slate-600 hover:text-red-400 text-[9px] uppercase tracking-wider font-extrabold cursor-pointer">Delete</button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};