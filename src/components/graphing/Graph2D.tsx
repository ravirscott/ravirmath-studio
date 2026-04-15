import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMathStore } from '@/src/store/useMathStore';
import { parseEquation, evaluateAt } from '@/src/lib/math-utils';

export const Graph2D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { equations, variables, viewport, setViewport } = useMathStore();
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

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

  // Coordinate conversion
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
    
    const { center, zoom } = viewport;
    const aspectRatio = dimensions.width / dimensions.height;
    const rangeX = 20 / zoom;
    const rangeY = (20 / zoom) / aspectRatio;

    // Draw Grid
    const step = Math.pow(10, Math.floor(Math.log10(rangeX / 5)));
    const startX = Math.floor((center[0] - rangeX / 2) / step) * step;
    const endX = Math.ceil((center[0] + rangeX / 2) / step) * step;
    const startY = Math.floor((center[1] - rangeY / 2) / step) * step;
    const endY = Math.ceil((center[1] + rangeY / 2) / step) * step;

    ctx.strokeStyle = '#334155'; // slate-700
    ctx.lineWidth = 1;
    ctx.font = '10px Inter';
    ctx.fillStyle = '#94a3b8'; // slate-400

    for (let x = startX; x <= endX; x += step) {
      const { sx } = mathToScreen(x, 0);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, dimensions.height);
      ctx.stroke();
      if (Math.abs(x) > 1e-10) {
        ctx.fillText(x.toFixed(1).replace(/\.0$/, ''), sx + 2, dimensions.height - 2);
      }
    }

    for (let y = startY; y <= endY; y += step) {
      const { sy } = mathToScreen(0, y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(dimensions.width, sy);
      ctx.stroke();
      if (Math.abs(y) > 1e-10) {
        ctx.fillText(y.toFixed(1).replace(/\.0$/, ''), 2, sy - 2);
      }
    }

    // Draw Axes
    ctx.strokeStyle = '#94a3b8'; // slate-400
    ctx.lineWidth = 2;
    const origin = mathToScreen(0, 0);
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(0, origin.sy);
    ctx.lineTo(dimensions.width, origin.sy);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(origin.sx, 0);
    ctx.lineTo(origin.sx, dimensions.height);
    ctx.stroke();

    // Plot Equations
    equations.forEach((eq) => {
      if (!eq.visible) return;
      
      ctx.strokeStyle = eq.color;
      ctx.fillStyle = eq.color;
      ctx.lineWidth = 2;

      if (eq.type === 'table' && eq.points) {
        eq.points.forEach((p) => {
          const { sx, sy } = mathToScreen(p.x, p.y);
          ctx.beginPath();
          ctx.arc(sx, sy, 4, 0, Math.PI * 2);
          ctx.fill();
        });
        
        // Optionally connect points
        if (eq.points.length > 1) {
          ctx.beginPath();
          const first = mathToScreen(eq.points[0].x, eq.points[0].y);
          ctx.moveTo(first.sx, first.sy);
          for (let i = 1; i < eq.points.length; i++) {
            const p = mathToScreen(eq.points[i].x, eq.points[i].y);
            ctx.lineTo(p.sx, p.sy);
          }
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        return;
      }

      if (!eq.latex) return;
      
      ctx.beginPath();
      const expr = parseEquation(eq.latex);
      const scope: Record<string, number> = {};
      Object.entries(variables).forEach(([name, v]) => {
        scope[name] = v.value;
      });

      let first = true;
      const steps = dimensions.width;
      for (let i = 0; i <= steps; i++) {
        const { mx } = screenToMath(i, 0);
        scope['x'] = mx;
        const my = evaluateAt(expr, scope);

        if (my !== null) {
          const { sy } = mathToScreen(mx, my);
          if (first) {
            ctx.moveTo(i, sy);
            first = false;
          } else {
            // Check for large jumps (discontinuities)
            const prevMx = screenToMath(i - 1, 0).mx;
            scope['x'] = prevMx;
            const prevMy = evaluateAt(expr, scope);
            if (prevMy !== null && Math.abs(my - prevMy) < rangeY * 2) {
              ctx.lineTo(i, sy);
            } else {
              ctx.moveTo(i, sy);
            }
          }
        } else {
          first = true;
        }
      }
      ctx.stroke();
    });

  }, [dimensions, viewport, equations, variables, mathToScreen, screenToMath]);

  // Interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    
    const { zoom } = viewport;
    const aspectRatio = dimensions.width / dimensions.height;
    const rangeX = 20 / zoom;
    const rangeY = (20 / zoom) / aspectRatio;

    const moveX = (dx / dimensions.width) * rangeX;
    const moveY = (dy / dimensions.height) * rangeY;

    setViewport({
      center: [viewport.center[0] - moveX, viewport.center[1] + moveY]
    });
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setViewport({ zoom: viewport.zoom * zoomFactor });
  };

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
        onWheel={handleWheel}
        className="block"
      />
      
      {/* Viewport Info Overlay */}
      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md border border-white/10 rounded-lg p-2 text-[10px] text-slate-400 font-mono pointer-events-none">
        Center: ({viewport.center[0].toFixed(2)}, {viewport.center[1].toFixed(2)})<br/>
        Zoom: {viewport.zoom.toFixed(2)}x
      </div>
    </div>
  );
};
