import React, { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { PanoramaSphere } from "./PanoramaSphere";
import {
  ArrowLeft,
  Sliders,
  PlusCircle,
  HelpCircle,
  Eye,
  Tag,
  MapPin,
  Layout,
} from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import { API_BASE } from "../config";

export const TourEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRoomKey, setActiveRoomKey] = useState("");

  const [editorStep, setEditorStep] = useState(1);
  const [sceneTab, setSceneTab] = useState("placement");

  const [roomTitle, setRoomTitle] = useState("");
  const [roomDesc, setRoomDesc] = useState("");
  const [panoFileName, setPanoFileName] = useState("");
  const [panoPreviewUrl, setPanoPreviewUrl] = useState("");
  const [isSavingRoom, setIsSavingRoom] = useState(false);

  const [interactionMode, setInteractionMode] = useState("infotag");
  const [hotspotTargetKey, setHotspotTargetKey] = useState("");
  const [hotspotText, setHotspotText] = useState("");
  const [tagTitle, setTagTitle] = useState("");
  const [tagDesc, setTagDesc] = useState("");

  const studioControlsRef = useRef(null);

  const [stagedPosition, setStagedPosition] = useState(null);
  const [isStagedConfirmed, setIsStagedConfirmed] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const [editingHotspotIndex, setEditingHotspotIndex] = useState(null);
  const [editingInfoTagIndex, setEditingInfoTagIndex] = useState(null);

  const fetchProjectDetails = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/projects`);
      const data = await response.json();
      const targetProject = Array.isArray(data)
        ? data.find((p) => String(p._id) === String(id))
        : null;

      if (targetProject) {
        setProject(targetProject);

        if (targetProject.rooms && targetProject.rooms.length > 0) {
          const firstKey = String(targetProject.rooms[0].key).toLowerCase().trim();
          setActiveRoomKey(firstKey);
          setInteractionMode(targetProject.rooms.length === 1 ? "infotag" : "hotspot");
        }
      }
    } catch (err) {
      console.error("Failed to fetch project:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProjectDetails();
  }, [id]);

  const handleLocalFileSelection = (e) => {
    if (!e?.target?.files?.length) return;
    const file = e.target.files[0];
    if (!file) return;
    setPanoFileName(file.name);
    setPanoPreviewUrl(URL.createObjectURL(file));
  };

  useEffect(() => {
    if (editorStep !== 1 || !project?.rooms?.length) return;
    const lookupKey = String(activeRoomKey || "").toLowerCase().trim();
    const activeRoom = project.rooms.find(
      (r) => r && r.key && String(r.key).toLowerCase().trim() === lookupKey
    );
    if (!activeRoom) return;
    setRoomTitle(activeRoom.title || "");
    setRoomDesc(activeRoom.description || activeRoom.roomDesc || "");
  }, [editorStep, project, activeRoomKey]);

  const currentStagedRoomInstance = (() => {
    if (!project?.rooms?.length) return null;
    const cleanKey = String(activeRoomKey || "").toLowerCase().trim();
    const matched = project.rooms.find(
      (r) => r?.key && String(r.key).toLowerCase().trim() === cleanKey
    );
    return matched || project.rooms[0];
  })();

  const handleSaveRoomMetadata = async (e) => {
    e.preventDefault();
    if (!currentStagedRoomInstance) return;
    if (!roomTitle.trim()) return alert("Please enter a room title.");

    const projectCopy = JSON.parse(JSON.stringify(project));
    const activeRoomIndex = projectCopy.rooms.findIndex(
      (r) =>
        String(r.key).toLowerCase().trim() ===
        String(activeRoomKey).toLowerCase().trim()
    );
    if (activeRoomIndex === -1) return alert("Unable to locate the current room.");

    projectCopy.rooms[activeRoomIndex].title = roomTitle.trim();
    projectCopy.rooms[activeRoomIndex].description = roomDesc.trim();
    projectCopy.rooms[activeRoomIndex].roomDesc = roomDesc.trim();

    setIsSavingRoom(true);
    try {
      const response = await fetch(`${API_BASE}/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rooms: projectCopy.rooms }),
      });
      const data = await response.json();
      setProject(data);
      alert("Room metadata saved successfully.");
    } catch (err) {
      console.error("Failed to save room metadata:", err);
      alert("Could not save room metadata. Try again.");
    } finally {
      setIsSavingRoom(false);
    }
  };

  const openConfirmDialog = ({ type, index, title, message, confirmLabel }) => {
    setConfirmAction({ type, index, title, message, confirmLabel });
  };

  const closeConfirmDialog = () => setConfirmAction(null);

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    if (confirmAction.type === "hotspot") {
      await handleDeleteHotspotNode(confirmAction.index);
    } else if (confirmAction.type === "infoTag") {
      await handleDeleteInfoTagNode(confirmAction.index);
    }
    closeConfirmDialog();
  };

  const handleAddNewRoomSubmit = async (e) => {
    e.preventDefault();
    const fileElement = document.getElementById("editor-pano-selector");
    const fileInput = fileElement?.files ? fileElement.files[0] : null;
    if (!fileInput) return alert("Validation Guard: Please select an image file first.");

    const formData = new FormData();
    formData.append("file", fileInput);
    formData.append("roomTitle", roomTitle.trim());
    formData.append("roomDesc", roomDesc.trim());
    formData.append("projectId", id);

    try {
      const uploadResponse = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadResult = await uploadResponse.json();

      if (uploadResult.success) {
        setProject(uploadResult.updatedProject);
        setActiveRoomKey(String(uploadResult.newRoomKey).toLowerCase().trim());
        setRoomTitle("");
        setRoomDesc("");
        setPanoFileName("");
        setPanoPreviewUrl("");
        setInteractionMode(uploadResult.updatedProject?.rooms?.length === 1 ? "infotag" : "hotspot");
        setStagedPosition(null);
        setIsStagedConfirmed(false);
        setEditorStep(2);
      } else {
        alert(`Upload validation notice: ${uploadResult.message}`);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("System communication failure.");
    }
  };

  const handleWebGLMeshSurfaceIntersection = (e) => {
    if (!e?.point || !activeRoomKey) return;

    const { x, y, z } = e.point;
    const radius = Math.sqrt(x * x + y * y + z * z);
    if (!radius) return;

    const pitch = Math.round(Math.asin(y / radius) * (180 / Math.PI));
    const yaw = Math.round(Math.atan2(x, z) * (180 / Math.PI));

    setStagedPosition({ yaw, pitch });
    setIsStagedConfirmed(true);
  };

  const handleTriggerHotspotEditMode = (index, spot) => {
    setInteractionMode("hotspot");
    setEditingHotspotIndex(index);
    setEditingInfoTagIndex(null);
    setHotspotTargetKey(spot.target || "");
    setHotspotText(spot.text || "");
    setStagedPosition({ yaw: spot.yaw, pitch: spot.pitch });
    setIsStagedConfirmed(true);
  };

  const handleTriggerInfoTagEditMode = (index, tag) => {
    setInteractionMode("infotag");
    setEditingInfoTagIndex(index);
    setEditingHotspotIndex(null);
    setTagTitle(tag.title || "");
    setTagDesc(tag.text || "");
    setStagedPosition({ yaw: tag.yaw, pitch: tag.pitch });
    setIsStagedConfirmed(true);
  };

  const handleConfirmAndDeployNode = async () => {
    if (!stagedPosition) return alert("Please select or stage a 3D coordinate point first.");
    if (!project?.rooms?.length) return;

    const projectCopy = JSON.parse(JSON.stringify(project));
    const activeRoomIndex = projectCopy.rooms.findIndex(
      (r) =>
        String(r.key).toLowerCase().trim() ===
        String(activeRoomKey).toLowerCase().trim()
    );
    if (activeRoomIndex === -1) return alert("Internal layout structure error.");

    if (interactionMode === "hotspot") {
      if (projectCopy.rooms.length <= 1) return alert("Add more rooms first.");
      if (!hotspotTargetKey) return alert("Please choose a destination room connection.");

      const hotspotPayload = {
        text: hotspotText.trim() || "Move Forward ➔",
        target: hotspotTargetKey.toLowerCase().trim(),
        yaw: stagedPosition.yaw,
        pitch: stagedPosition.pitch,
      };

      projectCopy.rooms[activeRoomIndex].hotspots ||= [];
      if (editingHotspotIndex !== null) {
        projectCopy.rooms[activeRoomIndex].hotspots[editingHotspotIndex] = hotspotPayload;
      } else {
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
        pitch: stagedPosition.pitch,
      };

      projectCopy.rooms[activeRoomIndex].infoTags ||= [];
      if (editingInfoTagIndex !== null) {
        projectCopy.rooms[activeRoomIndex].infoTags[editingInfoTagIndex] = tagPayload;
      } else {
        projectCopy.rooms[activeRoomIndex].infoTags.push(tagPayload);
      }

      setTagTitle("");
      setTagDesc("");
      setEditingInfoTagIndex(null);
    }

    try {
      const response = await fetch(`${API_BASE}/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rooms: projectCopy.rooms }),
      });
      const data = await response.json();
      setProject(data);
      setStagedPosition(null);
      setIsStagedConfirmed(false);
      alert("Spatial marker registry successfully synchronized and saved!");
    } catch (err) {
      console.error("Database mutation failed:", err);
    }
  };

  const handleDeleteHotspotNode = async (targetIndex) => {
    if (!project?.rooms?.length) return;
    const projectCopy = JSON.parse(JSON.stringify(project));
    const activeRoomIndex = projectCopy.rooms.findIndex(
      (r) =>
        String(r.key).toLowerCase().trim() ===
        String(activeRoomKey).toLowerCase().trim()
    );
    if (activeRoomIndex === -1) return;

    projectCopy.rooms[activeRoomIndex].hotspots ||= [];
    projectCopy.rooms[activeRoomIndex].hotspots.splice(targetIndex, 1);

    try {
      const response = await fetch(`${API_BASE}/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rooms: projectCopy.rooms }),
      });
      const updatedData = await response.json();
      setProject(updatedData);
    } catch (err) {
      console.error("Error removing hotspot:", err);
    }
  };

  const handleDeleteInfoTagNode = async (targetIndex) => {
    if (!project?.rooms?.length) return;
    const projectCopy = JSON.parse(JSON.stringify(project));
    const activeRoomIndex = projectCopy.rooms.findIndex(
      (r) =>
        String(r.key).toLowerCase().trim() ===
        String(activeRoomKey).toLowerCase().trim()
    );
    if (activeRoomIndex === -1) return;

    projectCopy.rooms[activeRoomIndex].infoTags ||= [];
    projectCopy.rooms[activeRoomIndex].infoTags.splice(targetIndex, 1);

    try {
      const response = await fetch(`${API_BASE}/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rooms: projectCopy.rooms }),
      });
      const updatedData = await response.json();
      setProject(updatedData);
    } catch (err) {
      console.error("Error removing info tag:", err);
    }
  };

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
        <button
          type="button"
          onClick={() => navigate("/")}
          className="px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-300"
        >
          Return to Workspace Hub
        </button>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-[#040712] text-slate-200 font-sans overflow-hidden select-none">
      <header className="px-8 py-5 border-b border-slate-900 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-900/90 backdrop-blur-xl flex flex-col gap-4 lg:flex-row justify-between items-start lg:items-center z-20">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-slate-300">
            <Layout size={14} className="text-cyan-400" />
            Scene Editor
          </div>
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-white">{project.name}</h3>
            <p className="text-sm text-slate-400 mt-1">
              Edit room layouts, markers, and navigation flow from a clean studio control interface.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-slate-200"
          >
            <ArrowLeft size={16} /> Back to Workspace
          </button>
          <button
            type="button"
            onClick={() => {
              const livePreviewLink = `${window.location.origin}/tour/${id}`;
              navigator.clipboard.writeText(livePreviewLink);
              alert(`✓ Live preview link copied to clipboard!\n\n${livePreviewLink}`);
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-slate-200"
          >
            📋 Copy Link
          </button>
          <button
            type="button"
            onClick={() => navigate(`/tour/${id}`)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950"
          >
            <Eye size={16} /> Live Preview
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden box-border">
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
                  enableZoom
                  enablePan={false}
                  enableDamping
                  dampingFactor={0.05}
                />
                <Suspense fallback={null}>
                  <group>
                    <PanoramaSphere
                      imagePath={
                        currentStagedRoomInstance.image &&
                        currentStagedRoomInstance.image !== "/tour_assets/"
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

              <div className="absolute top-4 left-4 right-4 rounded-[1.5rem] border border-slate-800/80 bg-slate-950/90 backdrop-blur-md p-3 text-sm text-slate-200 shadow-2xl z-10 pointer-events-none">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="font-semibold text-slate-100">
                    Live viewport: {String(currentStagedRoomInstance.title || "Untitled Space")}
                  </div>
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Double-click a surface to stage a marker
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 box-border">
              <HelpCircle size={24} className="text-slate-700 mb-2" />
              <h5 className="text-xs font-black tracking-widest uppercase text-slate-500">
                WebGL Graphic Render Pipeline Inactive
              </h5>
            </div>
          )}
        </div>

        <div className="flex-1 bg-slate-900/10 border border-slate-900/80 rounded-3xl p-6 box-border flex flex-col backdrop-blur-md overflow-hidden min-w-[320px]">
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-slate-900 text-cyan-400">
                <Sliders size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Scene Control Console
                </p>
                <h4 className="text-lg font-semibold text-white">Workspace tools</h4>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditorStep(1)}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                  editorStep === 1
                    ? "bg-cyan-500 text-slate-950 shadow-lg"
                    : "bg-slate-950/60 text-slate-300 hover:bg-slate-900"
                }`}
              >
                Room setup
              </button>
              <button
                type="button"
                onClick={() =>
                  currentStagedRoomInstance
                    ? setEditorStep(2)
                    : alert("Add a room first to unlock scene placement.")
                }
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                  editorStep === 2
                    ? "bg-sky-500 text-slate-950 shadow-lg"
                    : "bg-slate-950/60 text-slate-300 hover:bg-slate-900"
                }`}
              >
                Scene placement
              </button>
            </div>
          </div>

          <hr className="border-slate-900 mb-4" />

          <div
            className="flex-1 overflow-y-auto box-border"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(34, 211, 238, 0.5) transparent",
            }}
          >
            {editorStep === 1 && (
              <form onSubmit={handleAddNewRoomSubmit} className="space-y-4">
                <div className="rounded-3xl border border-slate-800/70 bg-slate-950/80 p-4 mb-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Tour inventory</p>
                  <div className="mt-2 text-3xl font-semibold text-white">{project.rooms?.length || 0}</div>
                  <p className="text-sm text-slate-500 mt-1">Rooms currently available in this tour.</p>
                </div>

                <div>
                  <label className="text-[10px] font-semibold tracking-[0.22em] text-slate-400 uppercase block mb-2">
                    Room title
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none"
                    placeholder="e.g., Executive Suite"
                    value={roomTitle}
                    onChange={(e) => setRoomTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold tracking-[0.22em] text-slate-400 uppercase block mb-2">
                    Room description
                  </label>
                  <textarea
                    className="w-full rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none h-24 resize-none"
                    placeholder="Describe the room and its purpose..."
                    value={roomDesc}
                    onChange={(e) => setRoomDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold tracking-[0.22em] text-slate-400 uppercase block mb-2">
                    Upload 360° panorama
                  </label>
                  <input
                    type="file"
                    name="file"
                    accept="image/*"
                    id="editor-pano-selector"
                    className="hidden"
                    onChange={handleLocalFileSelection}
                  />
                  <label
                    htmlFor="editor-pano-selector"
                    className="w-full rounded-3xl border border-dashed border-slate-800 bg-slate-950/80 px-4 py-4 text-center text-sm text-slate-300 cursor-pointer transition hover:border-cyan-400 hover:text-white"
                  >
                    <span className="block font-semibold text-slate-200">
                      {panoFileName ? `📁 ${panoFileName}` : "Choose an image from your device"}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Preferred format: equirectangular panorama
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleSaveRoomMetadata}
                  disabled={isSavingRoom || !project?.rooms?.length}
                  className="rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingRoom ? "Saving..." : "Save metadata"}
                </button>

                <button
                  type="submit"
                  className="rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-950 flex items-center justify-center gap-1.5"
                >
                  <PlusCircle size={13} /> Add room
                </button>
              </form>
            )}

            {editorStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                {!project.rooms || project.rooms.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/20 my-4 box-border">
                    <Layout size={28} className="text-slate-700 mx-auto mb-2 animate-pulse" />
                    <h6 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Room editor locked
                    </h6>
                    <p className="mt-2 text-xs text-slate-500">
                      Add a room to unlock placement controls and live marker staging.
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditorStep(1)}
                      className="mt-4 rounded-2xl bg-cyan-500 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-950"
                    >
                      Create first room
                    </button>
                  </div>
                ) : (
                  currentStagedRoomInstance && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-semibold tracking-[0.16em] text-slate-400 uppercase block mb-2">
                          Select room
                        </label>
                        <select
                          className="w-full rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-200 outline-none"
                          value={String(activeRoomKey || "").toLowerCase()}
                          onChange={(e) => {
                            setActiveRoomKey(e.target.value.toLowerCase().trim());
                            setStagedPosition(null);
                            setIsStagedConfirmed(false);
                          }}
                        >
                          {project.rooms.map((r) => (
                            <option key={r.key} value={String(r.key).toLowerCase().trim()}>
                              {String(r.title || "Untitled Room")}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3 pb-3 border-b border-slate-900">
                        <button
                          type="button"
                          onClick={() => setSceneTab("placement")}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
                            sceneTab === "placement"
                              ? "bg-sky-500/30 text-sky-300 border border-sky-500/50"
                              : "bg-slate-950/50 text-slate-400 hover:bg-slate-900/50"
                          }`}
                        >
                          Placement
                        </button>
                        <button
                          type="button"
                          onClick={() => setSceneTab("search")}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
                            sceneTab === "search"
                              ? "bg-purple-500/30 text-purple-300 border border-purple-500/50"
                              : "bg-slate-950/50 text-slate-400 hover:bg-slate-900/50"
                          }`}
                        >
                          Search
                        </button>
                        <button
                          type="button"
                          onClick={() => setSceneTab("cta")}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
                            sceneTab === "cta"
                              ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                              : "bg-slate-950/50 text-slate-400 hover:bg-slate-900/50"
                          }`}
                        >
                          Custom CTA
                        </button>
                        <button
                          type="button"
                          onClick={() => setSceneTab("virtualmap")}
                          disabled
                          className="px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-[0.14em] opacity-50 cursor-not-allowed bg-slate-950/50 text-slate-400"
                        >
                          Virtual Map
                        </button>
                      </div>

                      {sceneTab === "placement" && (
                        <>
                          <div className="grid grid-cols-1 gap-1 border border-slate-950 bg-slate-950/40 p-1 rounded-xl">
                            {project.rooms.length === 1 ? (
                              <div className="py-2.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-950/80 border border-slate-900/60 text-indigo-400 text-center flex items-center justify-center gap-1.5">
                                <Tag size={11} /> Mode locked: info tag staging only
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2 w-full">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInteractionMode("hotspot");
                                    setStagedPosition(null);
                                    setIsStagedConfirmed(false);
                                  }}
                                  className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${
                                    interactionMode === "hotspot"
                                      ? "bg-slate-900 border border-slate-800 text-blue-400 shadow-md"
                                      : "text-slate-500"
                                  }`}
                                >
                                  <MapPin size={11} /> Navigation Link
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInteractionMode("infotag");
                                    setStagedPosition(null);
                                    setIsStagedConfirmed(false);
                                  }}
                                  className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${
                                    interactionMode === "infotag"
                                      ? "bg-slate-900 border border-slate-800 text-indigo-400 shadow-md"
                                      : "text-slate-500"
                                  }`}
                                >
                                  <Tag size={11} /> Info Tag
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="p-4 border border-slate-950 bg-slate-950/20 rounded-2xl">
                            {interactionMode === "hotspot" && project.rooms.length > 1 ? (
                              <div className="space-y-3">
                                <h5 className="text-[10px] font-semibold text-sky-400 tracking-[0.24em] uppercase mb-2 flex items-center gap-1">
                                  <Eye size={12} /> Destination room
                                </h5>
                                <select
                                  disabled={!isStagedConfirmed}
                                  className="w-full rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-200 outline-none disabled:opacity-40"
                                  value={hotspotTargetKey || ""}
                                  onChange={(e) => setHotspotTargetKey(e.target.value)}
                                >
                                  <option value="">Select a target room</option>
                                  {project.rooms
                                    .filter(
                                      (r) =>
                                        String(r.key).toLowerCase().trim() !==
                                        String(activeRoomKey).toLowerCase().trim()
                                    )
                                    .map((r) => (
                                      <option key={r.key} value={String(r.key).toLowerCase().trim()}>
                                        {r.title || String(r.key)}
                                      </option>
                                    ))}
                                </select>
                                <input
                                  disabled={!isStagedConfirmed}
                                  type="text"
                                  className="w-full rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-200 outline-none disabled:opacity-40"
                                  placeholder="Action button label (e.g., Proceed to Kitchen)"
                                  value={hotspotText || ""}
                                  onChange={(e) => setHotspotText(e.target.value)}
                                />
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <h5 className="text-[10px] font-semibold text-violet-400 tracking-[0.24em] uppercase mb-2 flex items-center gap-1">
                                  <Tag size={11} /> Info Tag details
                                </h5>
                                <input
                                  disabled={!isStagedConfirmed}
                                  type="text"
                                  className="w-full rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-200 outline-none disabled:opacity-40"
                                  placeholder="Title (e.g., Marble Countertop)"
                                  value={tagTitle || ""}
                                  onChange={(e) => setTagTitle(e.target.value)}
                                />
                                <input
                                  disabled={!isStagedConfirmed}
                                  type="text"
                                  className="w-full rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-200 outline-none disabled:opacity-40"
                                  placeholder="Detail text for the amenity"
                                  value={tagDesc || ""}
                                  onChange={(e) => setTagDesc(e.target.value)}
                                />
                              </div>
                            )}
                          </div>

                          {isStagedConfirmed ? (
                            <div className="mt-2 space-y-3 rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                              <button
                                type="button"
                                onClick={handleConfirmAndDeployNode}
                                className="w-full rounded-3xl bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950"
                              >
                                {editingHotspotIndex !== null || editingInfoTagIndex !== null
                                  ? "Update Scene Marker"
                                  : "Publish Scene Marker"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setStagedPosition(null);
                                  setIsStagedConfirmed(false);
                                  setEditingHotspotIndex(null);
                                  setEditingInfoTagIndex(null);
                                  setHotspotTargetKey("");
                                  setHotspotText("");
                                  setTagTitle("");
                                  setTagDesc("");
                                }}
                                className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-300"
                              >
                                Discard staging
                              </button>
                            </div>
                          ) : (
                            <div className="p-4 border border-dashed border-slate-800/80 rounded-2xl text-center text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-950/20 leading-relaxed">
                              🖱️ Double-click anywhere onto the 3D room surface to project a positioning staging marker pin
                            </div>
                          )}

                          <div className="space-y-4 border-t border-slate-900 pt-4 mt-2">
                            {interactionMode === "hotspot" && (
                              <div className="space-y-2">
                                <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                  <MapPin size={11} /> Navigation links ({currentStagedRoomInstance.hotspots?.length || 0})
                                </h5>
                                {!currentStagedRoomInstance.hotspots ||
                                currentStagedRoomInstance.hotspots.length === 0 ? (
                                  <div className="text-[9px] text-slate-600 uppercase tracking-wider p-2.5 bg-slate-950/20 border border-slate-950 rounded-xl text-center">
                                    Zero gateways configured.
                                  </div>
                                ) : (
                                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-slate-950/60 bg-slate-950/20 p-1.5 rounded-xl">
                                    {currentStagedRoomInstance.hotspots.map((spot, index) => (
                                      <div
                                        key={`side-spot-${index}`}
                                        className={`flex justify-between items-center px-2.5 py-2 rounded-lg text-[10px] font-bold border ${
                                          editingHotspotIndex === index
                                            ? "bg-blue-600/10 border-blue-500/30 text-blue-400"
                                            : "bg-slate-950 border-slate-900 text-slate-400"
                                        }`}
                                      >
                                        <div className="truncate flex-1 pr-2">
                                          <span className="text-blue-500 text-[9px] font-mono font-black uppercase tracking-wider block">
                                            ➔ {spot.target.toUpperCase()}
                                          </span>
                                          <span className="truncate block mt-0.5 font-medium text-slate-300">
                                            "{spot.text}"
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => handleTriggerHotspotEditMode(index, spot)}
                                            className="text-slate-500 hover:text-blue-400 text-[9px] uppercase tracking-wider font-extrabold"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              openConfirmDialog({
                                                type: "hotspot",
                                                index,
                                                title: "Remove navigation gateway",
                                                message: "Delete this hotspot connection from the active room?",
                                                confirmLabel: "Delete Gateway",
                                              })
                                            }
                                            className="text-slate-600 hover:text-red-400 text-[9px] uppercase tracking-wider font-extrabold"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {interactionMode === "infotag" && (
                              <div className="space-y-2">
                                <h5 className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                                  <Tag size={11} /> Configured info tags ({currentStagedRoomInstance.infoTags?.length || 0})
                                </h5>
                                {!currentStagedRoomInstance.infoTags ||
                                currentStagedRoomInstance.infoTags.length === 0 ? (
                                  <div className="text-[9px] text-slate-600 uppercase tracking-wider p-2.5 bg-slate-950/20 border border-slate-950 rounded-xl text-center">
                                    Zero amenity tags configured.
                                  </div>
                                ) : (
                                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-slate-950/60 bg-slate-950/20 p-1.5 rounded-xl">
                                    {currentStagedRoomInstance.infoTags.map((tag, index) => (
                                      <div
                                        key={`side-tag-${index}`}
                                        className={`flex justify-between items-center px-2.5 py-2 rounded-lg text-[10px] font-bold border ${
                                          editingInfoTagIndex === index
                                            ? "bg-purple-600/10 border-purple-500/30 text-purple-400"
                                            : "bg-slate-950 border-slate-900 text-slate-400"
                                        }`}
                                      >
                                        <div className="truncate flex-1 pr-2">
                                          <span className="text-purple-400 text-[9px] font-black uppercase block truncate">
                                            {tag.title}
                                          </span>
                                          <span className="truncate block mt-0.5 font-medium text-slate-500 text-[9px]">
                                            {tag.text}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => handleTriggerInfoTagEditMode(index, tag)}
                                            className="text-slate-500 hover:text-purple-400 text-[9px] uppercase tracking-wider font-extrabold"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              openConfirmDialog({
                                                type: "infoTag",
                                                index,
                                                title: "Remove amenity tag",
                                                message: "Delete this info tag from the active room?",
                                                confirmLabel: "Delete Tag",
                                              })
                                            }
                                            className="text-slate-600 hover:text-red-400 text-[9px] uppercase tracking-wider font-extrabold"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {sceneTab === "search" && (
                        <div className="space-y-4">
                          <div className="rounded-3xl border border-slate-800/70 bg-slate-950/80 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Search & Filter</p>
                            <div className="mt-3 space-y-3">
                              <input
                                type="text"
                                className="w-full rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none"
                                placeholder="Search rooms, objects..."
                              />
                              <div className="border border-slate-800 rounded-2xl p-3 bg-slate-950/50">
                                <p className="text-xs text-slate-500 text-center">Search results will appear here</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {sceneTab === "cta" && (
                        <div className="space-y-4">
                          <div className="rounded-3xl border border-slate-800/70 bg-slate-950/80 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                              Custom Call-to-Action Buttons
                            </p>
                            <div className="mt-3 space-y-3">
                              <input
                                type="text"
                                className="w-full rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none"
                                placeholder="CTA button text..."
                              />
                              <textarea
                                className="w-full rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none h-20 resize-none"
                                placeholder="CTA description..."
                              />
                              <button
                                type="button"
                                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-950"
                              >
                                + Add Custom CTA
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {sceneTab === "virtualmap" && (
                        <div className="space-y-4 opacity-50 pointer-events-none">
                          <div className="rounded-3xl border border-slate-800/70 bg-slate-950/80 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Virtual Room Map</p>
                            <div className="mt-3 border-2 border-dashed border-slate-800 rounded-2xl p-8 bg-slate-950/50 flex items-center justify-center min-h-48">
                              <div className="text-center">
                                <p className="text-sm text-slate-500 font-semibold">Virtual map builder</p>
                                <p className="text-xs text-slate-600 mt-1">Coming soon...</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmLabel={confirmAction?.confirmLabel}
        onConfirm={handleConfirmAction}
        onClose={closeConfirmDialog}
      />
    </div>
  );
};