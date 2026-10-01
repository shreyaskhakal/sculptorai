"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  RotateCcw,
  Eye,
  Maximize2,
  Grid,
  Compass,
  Box,
  Layers,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { ModelPlan, SceneSnapshot } from "@/types/ai";

interface ThreeDViewerProps {
  modelPlan?: ModelPlan | null;
  sceneSnapshot?: SceneSnapshot | null;
  glbUrl?: string | null;
  onSelectObject?: (objectName: string | null) => void;
  selectedObjectName?: string | null;
}

export function ThreeDViewer({
  modelPlan,
  sceneSnapshot,
  glbUrl,
  onSelectObject,
  selectedObjectName,
}: ThreeDViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);

  // Viewer State
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [shadingMode, setShadingMode] = useState<"solid" | "material" | "wireframe">("material");
  const [objectCount, setObjectCount] = useState<number>(0);
  const [activeHover, setActiveHover] = useState<string | null>(null);

  // Mouse Orbit & Pan Dragging State
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const cameraSphericalRef = useRef({ radius: 4.5, theta: Math.PI / 4, phi: Math.PI / 3 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0.4, 0));
  const autoRotateRef = useRef(autoRotate);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  // 1. Initialize Three.js Scene, Camera, Lights, and Renderer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0f17);
    sceneRef.current = scene;

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    cameraRef.current = camera;

    // Position camera using spherical coordinates
    updateCameraPosition();

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff5e6, 2.5);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x00e5ff, 1.2);
    fillLight.position.set(-5, 3, -4);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xf5792a, 2.0, 15);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // Ground Grid & Axes
    const grid = new THREE.GridHelper(10, 20, 0x00e5ff, 0x1f293d);
    grid.position.y = 0;
    scene.add(grid);
    gridHelperRef.current = grid;

    const axes = new THREE.AxesHelper(1.5);
    scene.add(axes);
    axesHelperRef.current = axes;

    // Model Container Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Render / Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (autoRotateRef.current && !isDraggingRef.current) {
        cameraSphericalRef.current.theta += 0.005;
        updateCameraPosition();
      }

      renderer.render(scene, camera);
    };
    animate();


    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  function updateCameraPosition() {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = cameraSphericalRef.current;
    const target = cameraTargetRef.current;

    cameraRef.current.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = target.y + radius * Math.cos(phi);
    cameraRef.current.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(target);
  }

  // 2. Build 3D Objects from ModelPlan or SceneSnapshot
  useEffect(() => {
    if (!modelGroupRef.current) return;
    const group = modelGroupRef.current;

    // Clear previous geometries and meshes
    while (group.children.length > 0) {
      const obj = group.children[0] as THREE.Mesh;
      if (obj.geometry) obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else if (obj.material) {
        obj.material.dispose();
      }
      group.remove(obj);
    }

    let createdCount = 0;

    if (sceneSnapshot && sceneSnapshot.objects && sceneSnapshot.objects.length > 0) {
      // Build from live Blender Scene Snapshot
      sceneSnapshot.objects.forEach((item, idx) => {
        const mesh = createMeshForSnapshotObject(item, idx, shadingMode, wireframe);
        mesh.name = item.name;
        group.add(mesh);
        createdCount++;
      });
    } else if (modelPlan && modelPlan.objects && modelPlan.objects.length > 0) {
      // Build from AI Model Plan
      modelPlan.objects.forEach((item, idx) => {
        const mesh = createMeshForPlanObject(item, idx, modelPlan, shadingMode, wireframe);
        mesh.name = item.name;
        group.add(mesh);
        createdCount++;
      });
    } else {
      // Default Studio Demo Showcase (Futuristic Workspace Table & Accessories)
      const baseMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.05, 0.8),
        new THREE.MeshStandardMaterial({
          color: 0x1f2638,
          roughness: 0.35,
          metalness: 0.85,
          wireframe,
        })
      );
      baseMesh.name = "Cyber_Desk_Surface";
      baseMesh.position.set(0, 0.75, 0);
      group.add(baseMesh);

      const monitorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.45, 0.03),
        new THREE.MeshStandardMaterial({
          color: 0x0a0c12,
          roughness: 0.2,
          metalness: 0.9,
          wireframe,
        })
      );
      monitorMesh.name = "Curved_Monitor";
      monitorMesh.position.set(0, 1.05, -0.2);
      group.add(monitorMesh);

      createdCount = 2;
    }

    setObjectCount(createdCount);
  }, [modelPlan, sceneSnapshot, shadingMode, wireframe]);

  // Update wireframe & grid display
  useEffect(() => {
    if (gridHelperRef.current) gridHelperRef.current.visible = showGrid;
    if (axesHelperRef.current) axesHelperRef.current.visible = showAxes;
  }, [showGrid, showAxes]);

  // Object highlighting when selected
  useEffect(() => {
    if (!modelGroupRef.current) return;
    modelGroupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat) {
          if (child.name === selectedObjectName) {
            mat.emissive = new THREE.Color(0x00e5ff);
            mat.emissiveIntensity = 0.35;
          } else {
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveIntensity = 0;
          }
        }
      }
    });
  }, [selectedObjectName]);

  // Mouse Interaction (Orbit, Pan, Zoom, Object Click Selection)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      isDraggingRef.current = true;
    } else if (e.button === 2 || (e.button === 0 && e.shiftKey)) {
      isPanningRef.current = true;
    }
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const dx = e.clientX - prevMouseRef.current.x;
    const dy = e.clientY - prevMouseRef.current.y;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };

    if (isDraggingRef.current && !e.shiftKey) {
      // Orbit rotation
      cameraSphericalRef.current.theta -= dx * 0.007;
      cameraSphericalRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI / 2 - 0.05, cameraSphericalRef.current.phi - dy * 0.007)
      );
      updateCameraPosition();
    } else if (isPanningRef.current || (isDraggingRef.current && e.shiftKey)) {
      // Pan target
      const factor = cameraSphericalRef.current.radius * 0.0015;
      cameraTargetRef.current.x -= dx * factor;
      cameraTargetRef.current.y += dy * factor;
      updateCameraPosition();
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isPanningRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    cameraSphericalRef.current.radius = Math.max(
      1.0,
      Math.min(25.0, cameraSphericalRef.current.radius + e.deltaY * 0.005)
    );
    updateCameraPosition();
  };

  const resetCamera = () => {
    cameraSphericalRef.current = { radius: 4.5, theta: Math.PI / 4, phi: Math.PI / 3 };
    cameraTargetRef.current = new THREE.Vector3(0, 0.4, 0);
    updateCameraPosition();
  };

  return (
    <div className="relative w-full h-full min-h-[380px] bg-[#0C0F17] rounded-xl overflow-hidden border border-[#1E2333] shadow-inner select-none flex flex-col">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full flex-1 cursor-grab active:cursor-grabbing outline-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        {/* Left: Shading & Model Metadata */}
        <div className="flex items-center gap-1.5 bg-[#121622]/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-[#23293D] shadow-lg pointer-events-auto">
          <button
            onClick={() => setShadingMode("material")}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              shadingMode === "material" && !wireframe
                ? "bg-[#252C40] text-[#00E5FF] shadow-sm"
                : "text-[#7A86A1] hover:text-white"
            }`}
            title="Render with Material & Lighting shaders"
          >
            Material
          </button>
          <button
            onClick={() => {
              setShadingMode("solid");
              setWireframe(false);
            }}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              shadingMode === "solid" && !wireframe
                ? "bg-[#252C40] text-[#00E5FF] shadow-sm"
                : "text-[#7A86A1] hover:text-white"
            }`}
            title="Clay Solid view"
          >
            Solid
          </button>
          <button
            onClick={() => setWireframe(!wireframe)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              wireframe
                ? "bg-[#252C40] text-[#F5792A] shadow-sm"
                : "text-[#7A86A1] hover:text-white"
            }`}
            title="Toggle Wireframe topology"
          >
            Wireframe
          </button>
        </div>

        {/* Right: Camera & Viewport Tools */}
        <div className="flex items-center gap-1 bg-[#121622]/90 backdrop-blur-md p-1 rounded-lg border border-[#23293D] shadow-lg pointer-events-auto">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded hover:bg-[#202738] transition-colors ${
              showGrid ? "text-[#00E5FF]" : "text-[#58637A]"
            }`}
            title="Toggle Ground Grid"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAxes(!showAxes)}
            className={`p-1.5 rounded hover:bg-[#202738] transition-colors ${
              showAxes ? "text-[#00E5FF]" : "text-[#58637A]"
            }`}
            title="Toggle XYZ Axes Gizmo"
          >
            <Compass className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded hover:bg-[#202738] transition-colors ${
              autoRotate ? "text-[#F5792A]" : "text-[#58637A]"
            }`}
            title="Toggle Turntable Auto-Rotation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={resetCamera}
            className="p-1.5 rounded text-[#7A86A1] hover:text-white hover:bg-[#202738] transition-colors"
            title="Reset Camera View"
          >
            <Box className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Floating Status Bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none text-xs text-[#6A7690]">
        <div className="bg-[#121622]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#202738] pointer-events-auto flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[#A3B0CC]">
            <Layers className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>Objects: {objectCount}</span>
          </span>
          {selectedObjectName && (
            <span className="text-[#00E5FF] font-medium border-l border-[#273045] pl-3">
              Selected: {selectedObjectName}
            </span>
          )}
        </div>

        <div className="bg-[#121622]/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-[#202738] pointer-events-auto text-[11px] text-[#58637A]">
          Left-click: Orbit | Shift + Left-click: Pan | Scroll: Zoom
        </div>
      </div>
    </div>
  );
}

// Helpers for Procedural Mesh Creation
function createMeshForPlanObject(
  obj: any,
  idx: number,
  plan: ModelPlan,
  shadingMode: string,
  wireframe: boolean
): THREE.Mesh {
  const dim = obj.approxDimensions || { x: 1.0, y: 1.0, z: 1.0 };
  const sx = typeof dim.x === "number" ? dim.x : parseFloat(dim.x || "1.0") || 1.0;
  const sy = typeof dim.y === "number" ? dim.y : parseFloat(dim.y || "1.0") || 1.0;
  const sz = typeof dim.z === "number" ? dim.z : parseFloat(dim.z || "1.0") || 1.0;

  let geo: THREE.BufferGeometry;
  const nameLower = (obj.name || "").toLowerCase();

  if (nameLower.includes("cylinder") || nameLower.includes("leg") || nameLower.includes("post")) {
    geo = new THREE.CylinderGeometry(sx / 2, sx / 2, sz, 16);
  } else if (nameLower.includes("sphere") || nameLower.includes("ball")) {
    geo = new THREE.SphereGeometry(sx / 2, 16, 16);
  } else {
    geo = new THREE.BoxGeometry(sx, sz, sy);
  }

  // Find matching material if defined in plan
  const matSpec = plan.materials?.find((m) => m.targetObject === obj.name);
  const colorHex = matSpec?.baseColor
    ? parseInt(matSpec.baseColor.replace("#", ""), 16)
    : getColorForIndex(idx);

  const mat = new THREE.MeshStandardMaterial({
    color: shadingMode === "solid" ? 0x9ba8bd : colorHex,
    roughness: matSpec?.roughness ?? 0.4,
    metalness: matSpec?.metallic ?? 0.3,
    wireframe,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(0, sz / 2, 0);

  return mesh;
}

function createMeshForSnapshotObject(
  obj: any,
  idx: number,
  shadingMode: string,
  wireframe: boolean
): THREE.Mesh {
  const dim = obj.dimensions || [1.0, 1.0, 1.0];
  const sx = Math.max(0.05, dim[0] || 1.0);
  const sy = Math.max(0.05, dim[1] || 1.0);
  const sz = Math.max(0.05, dim[2] || 1.0);

  let geo: THREE.BufferGeometry;
  if (obj.type === "MESH" && (obj.name.toLowerCase().includes("cylinder") || obj.name.toLowerCase().includes("leg"))) {
    geo = new THREE.CylinderGeometry(sx / 2, sx / 2, sz, 16);
  } else if (obj.name.toLowerCase().includes("sphere")) {
    geo = new THREE.SphereGeometry(sx / 2, 16, 16);
  } else {
    geo = new THREE.BoxGeometry(sx, sz, sy);
  }

  const mat = new THREE.MeshStandardMaterial({
    color: shadingMode === "solid" ? 0x9ba8bd : getColorForIndex(idx),
    roughness: 0.35,
    metalness: 0.4,
    wireframe,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  if (Array.isArray(obj.location)) {
    mesh.position.set(obj.location[0], obj.location[2], -obj.location[1]);
  }
  if (Array.isArray(obj.rotation)) {
    mesh.rotation.set(obj.rotation[0], obj.rotation[2], -obj.rotation[1]);
  }

  return mesh;
}

function getColorForIndex(idx: number): number {
  const palette = [
    0x2563eb, // Sapphire
    0xf5792a, // Tangerine / Sculptor Orange
    0x10b981, // Emerald
    0x8b5cf6, // Violet
    0x00e5ff, // Cyber Cyan
    0xec4899, // Pink
  ];
  return palette[idx % palette.length];
}
