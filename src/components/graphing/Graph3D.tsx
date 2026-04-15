import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useMathStore } from '@/src/store/useMathStore';
import { parseEquation, evaluateAt } from '@/src/lib/math-utils';

export const Graph3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);

  const { equations, variables } = useMathStore();

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1117);
    sceneRef.current = scene;

    // Setup Camera
    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(10, 10, 10);
    cameraRef.current = camera;

    // Setup Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Setup Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Grid Helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x334155, 0x1e293b);
    scene.add(gridHelper);

    // Axes Helper
    const axesHelper = new THREE.AxesHelper(12);
    scene.add(axesHelper);

    // Group for meshes
    const meshGroup = new THREE.Group();
    scene.add(meshGroup);
    meshGroupRef.current = meshGroup;

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Meshes
  useEffect(() => {
    const meshGroup = meshGroupRef.current;
    if (!meshGroup) return;

    // Clear existing meshes
    while (meshGroup.children.length > 0) {
      const child = meshGroup.children[0] as THREE.Mesh;
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
      meshGroup.remove(child);
    }

    const scope: Record<string, number> = {};
    Object.entries(variables).forEach(([name, v]) => {
      scope[name] = v.value;
    });

    equations.forEach((eq) => {
      if (!eq.visible || !eq.latex) return;

      const expr = parseEquation(eq.latex);
      
      // We assume 3D equations are z = f(x, y)
      // If the equation doesn't contain 'y', we might want to treat it as a 2D extrusion or something
      // But for now, let's just try to evaluate with x and y

      const size = 10;
      const segments = 50;
      const geometry = new THREE.PlaneGeometry(size * 2, size * 2, segments, segments);
      const vertices = geometry.attributes.position.array;

      for (let i = 0; i <= segments; i++) {
        for (let j = 0; j <= segments; j++) {
          const x = (i / segments) * size * 2 - size;
          const y = (j / segments) * size * 2 - size;
          
          scope['x'] = x;
          scope['y'] = y;
          
          const z = evaluateAt(expr, scope) ?? 0;
          
          const index = (i * (segments + 1) + j) * 3;
          vertices[index + 2] = z; // Three.js Plane is on XY by default, we'll rotate it
        }
      }

      geometry.computeVertexNormals();
      
      const material = new THREE.MeshPhongMaterial({
        color: eq.color,
        side: THREE.DoubleSide,
        wireframe: false,
        flatShading: false,
        transparent: true,
        opacity: 0.8,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
      meshGroup.add(mesh);
    });
  }, [equations, variables]);

  return <div ref={containerRef} className="w-full h-full bg-[#0d1117]" />;
};
