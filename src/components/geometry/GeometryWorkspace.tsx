import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMathStore } from '@/src/store/useMathStore';

export const GeometryWorkspace: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { geometryObjects, addGeometryObject, updateGeometryObject, viewport } = useMathStore();
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedPoint, setSelectedPoint] = useState<{ objId: string; pointIndex: number } | null>(null);

  // Handle resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Coordinate conversion (simplified for geometry)
  const screenToMath = useCallback((sx: number, sy: number) => {
    const { center, zoom } = viewport;
    const aspectRatio = dimensions.width / dimensions.height;
    const rangeX = 20 / zoom;
    const rangeY = (20 / zoom) / aspectRatio;
    
    const mx = center[0] + (sx / dimensions.width - 0.5) * rangeX;
    const my = center[1] - (sy / dimensions.height - 0.5) * rangeY;
    return { mx, my };
  }, [viewport, dimensions]);

  const mathToScreen = useCallback((mx: number, my: number) => {
    const { center, zoom } = viewport;
    const aspectRatio = dimensions.width / dimensions.height;
    const rangeX = 20 / zoom;
    const rangeY = (20 / zoom) / aspectRatio;

    const sx = ((mx - center[0]) / rangeX + 0.5) * dimensions.width;
    const sy = (-(my - center[1]) / rangeY + 0.5) * dimensions.height;
    return { sx, sy };
  }, [viewport, dimensions]);

  // Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    // Draw Grid (same as Graph2D)
    const { center, zoom } = viewport;
    const aspectRatio = dimensions.width / dimensions.height;
    const rangeX = 20 / zoom;
    const rangeY = (20 / zoom) / aspectRatio;
    const step = Math.pow(10, Math.floor(Math.log10(rangeX / 5)));
    const startX = Math.floor((center[0] - rangeX / 2) / step) * step;
    const endX = Math.ceil((center[0] + rangeX / 2) / step) * step;
    const startY = Math.floor((center[1] - rangeY / 2) / step) * step;
    const endY = Math.ceil((center[1] + rangeY / 2) / step) * step;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = startX; x <= endX; x += step) {
      const { sx } = mathToScreen(x, 0);
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, dimensions.height); ctx.stroke();
    }
    for (let y = startY; y <= endY; y += step) {
      const { sy } = mathToScreen(0, y);
      ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(dimensions.width, sy); ctx.stroke();
    }

    // Draw Objects
    geometryObjects.forEach((obj) => {
      ctx.strokeStyle = obj.color;
      ctx.fillStyle = obj.color;
      ctx.lineWidth = 2;

      if (obj.type === 'point') {
        const { sx, sy } = mathToScreen(obj.points[0].x, obj.points[0].y);
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fill();
        if (obj.label) {
          ctx.fillStyle = 'white';
          ctx.fillText(obj.label, sx + 8, sy - 8);
        }
      } else if (obj.type === 'line' && obj.points.length >= 2) {
        const p1 = mathToScreen(obj.points[0].x, obj.points[0].y);
        const p2 = mathToScreen(obj.points[1].x, obj.points[1].y);
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
        // Draw points at ends
        [p1, p2].forEach(p => {
          ctx.beginPath(); ctx.arc(p.sx, p.sy, 3, 0, Math.PI * 2); ctx.fill();
        });
      } else if (obj.type === 'circle' && obj.points.length >= 2) {
        const center = mathToScreen(obj.points[0].x, obj.points[0].y);
        const edge = mathToScreen(obj.points[1].x, obj.points[1].y);
        const radius = Math.sqrt(Math.pow(edge.sx - center.sx, 2) + Math.pow(edge.sy - center.sy, 2));
        ctx.beginPath();
        ctx.arc(center.sx, center.sy, radius, 0, Math.PI * 2);
        ctx.stroke();
        // Draw center and radius point
        [center, edge].forEach(p => {
          ctx.beginPath(); ctx.arc(p.sx, p.sy, 3, 0, Math.PI * 2); ctx.fill();
        });
      }
    });

  }, [dimensions, viewport, geometryObjects, mathToScreen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { mx, my } = screenToMath(sx, sy);

    // Check if clicking on an existing point
    for (const obj of geometryObjects) {
      for (let i = 0; i < obj.points.length; i++) {
        const p = obj.points[i];
        const dist = Math.sqrt(Math.pow(p.x - mx, 2) + Math.pow(p.y - my, 2));
        if (dist < 0.5 / viewport.zoom) {
          setSelectedPoint({ objId: obj.id, pointIndex: i });
          return;
        }
      }
    }

    // Otherwise, add a new point
    addGeometryObject({
      type: 'point',
      points: [{ x: mx, y: my }],
      color: '#3b82f6',
      label: `P${geometryObjects.length + 1}`
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectedPoint) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { mx, my } = screenToMath(sx, sy);

    const obj = geometryObjects.find(o => o.id === selectedPoint.objId);
    if (!obj) return;

    const newPoints = [...obj.points];
    newPoints[selectedPoint.pointIndex] = { x: mx, y: my };
    updateGeometryObject(obj.id, { points: newPoints });
  };

  const handleMouseUp = () => setSelectedPoint(null);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-[#0d1117] overflow-hidden cursor-crosshair">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="block"
      />
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md border border-white/10 rounded-lg p-2 text-xs text-slate-300 pointer-events-none">
        Click to add points • Drag to move
      </div>
    </div>
  );
};
