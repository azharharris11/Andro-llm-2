
import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { NodeData, Edge, CampaignStage } from '../types';
import Node from './Node';
import { Microscope } from 'lucide-react';

export interface CanvasHandle {
  flyTo: (x: number, y: number, zoom?: number) => void;
}

interface CanvasProps {
  nodes: NodeData[];
  edges: Edge[];
  onNodeAction: (action: string, nodeId: string) => void;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onNodeMove: (id: string, x: number, y: number) => void; 
  highlightedEdgeIds?: Set<string>; 
  highlightedNodeIds?: Set<string>; 
}

const SNAP_GRID = 20;

const Canvas = forwardRef<CanvasHandle, CanvasProps>(({ nodes, edges, onNodeAction, selectedNodeId, onSelectNode, onNodeMove, highlightedEdgeIds, highlightedNodeIds }, ref) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.8);
  
  // Canvas Panning State
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Touch State Refs
  const lastTouchRef = useRef<{ x: number, y: number } | null>(null);
  const lastPinchDistRef = useRef<number | null>(null);

  // Node Dragging State
  const [draggedNode, setDraggedNode] = useState<{ id: string; startX: number; startY: number; initialNodeX: number; initialNodeY: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  const NODE_WIDTH = 320;

  // Expose flyTo method to parent
  useImperativeHandle(ref, () => ({
    flyTo: (targetX: number, targetY: number, targetZoom: number = 0.8) => {
       if (!containerRef.current) return;
       
       const { width, height } = containerRef.current.getBoundingClientRect();
       const endOffsetX = (width / 2) - (targetX * targetZoom);
       const endOffsetY = (height / 2) - (targetY * targetZoom);
       const startOffsetX = offset.x;
       const startOffsetY = offset.y;
       const startZoom = zoom;
       const startTime = performance.now();
       const duration = 1000;
       
       const animate = (currentTime: number) => {
         const elapsed = currentTime - startTime;
         const progress = Math.min(elapsed / duration, 1);
         const ease = 1 - Math.pow(1 - progress, 3);
         
         setOffset({
             x: startOffsetX + (endOffsetX - startOffsetX) * ease,
             y: startOffsetY + (endOffsetY - startOffsetY) * ease
         });
         setZoom(startZoom + (targetZoom - startZoom) * ease);
         
         if (progress < 1) {
           animationRef.current = requestAnimationFrame(animate);
         }
       };
       cancelAnimationFrame(animationRef.current || 0);
       animationRef.current = requestAnimationFrame(animate);
    }
  }));

  useEffect(() => {
    if (containerRef.current) {
      const { height } = containerRef.current.getBoundingClientRect();
      setOffset({ x: 100, y: height / 2 - 200 });
    }
  }, []);

  // --- MOUSE HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select')) return;

    const nodeElement = target.closest('.node-interactive');
    if (nodeElement) {
       const nodeId = nodeElement.getAttribute('data-id');
       if (nodeId) {
           const node = nodes.find(n => n.id === nodeId);
           if (node) {
               setDraggedNode({
                   id: nodeId,
                   startX: e.clientX,
                   startY: e.clientY,
                   initialNodeX: node.x,
                   initialNodeY: node.y
               });
               onSelectNode(nodeId); 
           }
       }
       return;
    }

    setIsPanning(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    onSelectNode(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNode) {
        const deltaX = (e.clientX - draggedNode.startX) / zoom;
        const deltaY = (e.clientY - draggedNode.startY) / zoom;
        
        let newX = draggedNode.initialNodeX + deltaX;
        let newY = draggedNode.initialNodeY + deltaY;

        // Snap to Grid
        newX = Math.round(newX / SNAP_GRID) * SNAP_GRID;
        newY = Math.round(newY / SNAP_GRID) * SNAP_GRID;

        onNodeMove(draggedNode.id, newX, newY);
        return;
    }
    
    if (!isPanning) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => { 
      setIsPanning(false); 
      setDraggedNode(null);
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    setZoom(Math.min(Math.max(0.2, zoom - e.deltaY * 0.0005), 2));
  };

  // --- TOUCH HANDLERS ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
       const touch = e.touches[0];
       const target = e.target as HTMLElement;

       if (target.closest('button') || target.closest('input') || target.closest('select')) return;

       const nodeElement = target.closest('.node-interactive');
       if (nodeElement) {
           const nodeId = nodeElement.getAttribute('data-id');
           if (nodeId) {
               const node = nodes.find(n => n.id === nodeId);
               if (node) {
                   setDraggedNode({
                       id: nodeId,
                       startX: touch.clientX,
                       startY: touch.clientY,
                       initialNodeX: node.x,
                       initialNodeY: node.y
                   });
                   onSelectNode(nodeId);
               }
           }
           return;
       }

       setIsPanning(true);
       lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
       onSelectNode(null);

    } else if (e.touches.length === 2) {
       const t1 = e.touches[0];
       const t2 = e.touches[1];
       const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
       lastPinchDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPanning || draggedNode || e.touches.length === 2) {
        e.preventDefault(); 
    }

    if (e.touches.length === 1) {
        const touch = e.touches[0];
        if (draggedNode) {
            const deltaX = (touch.clientX - draggedNode.startX) / zoom;
            const deltaY = (touch.clientY - draggedNode.startY) / zoom;
            
            let newX = draggedNode.initialNodeX + deltaX;
            let newY = draggedNode.initialNodeY + deltaY;
            
            // Snap to Grid logic for Touch as well
            newX = Math.round(newX / SNAP_GRID) * SNAP_GRID;
            newY = Math.round(newY / SNAP_GRID) * SNAP_GRID;

            onNodeMove(draggedNode.id, newX, newY);
        } else if (isPanning && lastTouchRef.current) {
            const dx = touch.clientX - lastTouchRef.current.x;
            const dy = touch.clientY - lastTouchRef.current.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
        }
    } else if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        if (lastPinchDistRef.current !== null) {
            const delta = dist - lastPinchDistRef.current;
            const zoomSpeed = 0.005;
            setZoom(z => Math.min(Math.max(0.2, z + delta * zoomSpeed), 2));
        }
        lastPinchDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setDraggedNode(null);
    lastTouchRef.current = null;
    lastPinchDistRef.current = null;
  };

  const renderEdges = () => {
    return edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return null;

      const sourceX = sourceNode.x + NODE_WIDTH; 
      const sourceY = sourceNode.y + 50; 
      const targetX = targetNode.x;
      const targetY = targetNode.y + 50;

      const dist = targetX - sourceX;
      const controlDist = Math.max(dist * 0.5, 100); 
      const path = `M ${sourceX} ${sourceY} C ${sourceX + controlDist} ${sourceY}, ${targetX - controlDist} ${targetY}, ${targetX} ${targetY}`;

      // GOLDEN THREAD LOGIC
      const isHighlighted = highlightedEdgeIds?.has(edge.id);
      const isDimmed = highlightedEdgeIds && highlightedEdgeIds.size > 0 && !isHighlighted;
      
      // LOADING STATE (Data Flow Animation)
      const isLoading = targetNode.isLoading;

      return (
        <g key={edge.id} className="transition-all duration-300">
            {/* Base Line */}
            <path d={path} stroke="white" strokeWidth="6" fill="none" strokeOpacity={isDimmed ? 0.3 : 0.8} />
            
            {/* Active Line - With GLOW if highlighted */}
            <path 
                d={path} 
                stroke={isHighlighted ? "#F59E0B" : "#CBD5E1"} 
                strokeWidth={isHighlighted ? "4" : "2"} 
                fill="none" 
                className="transition-all duration-500" 
                strokeLinecap="round" 
                strokeOpacity={isDimmed ? 0.2 : 1}
                filter={isHighlighted ? "url(#glow)" : ""}
            />
            
            {/* Animated Flow Line (Only if loading) */}
            {isLoading && (
                <path 
                    d={path} 
                    stroke="#3B82F6" 
                    strokeWidth="2" 
                    fill="none" 
                    strokeDasharray="10,10"
                    className="animate-flow"
                />
            )}
            
            {/* Target Dot */}
            <circle cx={targetX} cy={targetY} r={isHighlighted ? "6" : "4"} fill={isHighlighted ? "#F59E0B" : "white"} stroke={isHighlighted ? "#F59E0B" : "#CBD5E1"} strokeWidth="2" opacity={isDimmed ? 0.2 : 1}/>
        </g>
      );
    });
  };
  
  // BACKGROUND ZONES RENDERER
  const renderZones = () => {
      const height = 4000;
      const startY = -2000;
      
      // We estimate x positions based on our auto-layout logic
      // Level 1: 0 - 800 (Research)
      // Level 2 & 3: 800 - 1800 (Concept & Structure)
      // Level 4 & 5: 1800+ (Execution)
      
      return (
          <g className="pointer-events-none opacity-40 select-none">
              {/* Zone 1: RESEARCH */}
              <rect x="-1000" y={startY} width="1600" height={height} fill="#fff1f2" opacity="0.3" />
              <text x="100" y="-300" fontSize="120" fontWeight="bold" fill="#fda4af" opacity="0.3">RESEARCH</text>
              
              {/* Zone 2: STRATEGY */}
              <rect x="600" y={startY} width="1200" height={height} fill="#fffbeb" opacity="0.3" />
              <text x="1000" y="-300" fontSize="120" fontWeight="bold" fill="#fcd34d" opacity="0.3">STRATEGY</text>
              
              {/* Zone 3: EXECUTION */}
              <rect x="1800" y={startY} width="3000" height={height} fill="#eff6ff" opacity="0.3" />
              <text x="2200" y="-300" fontSize="120" fontWeight="bold" fill="#93c5fd" opacity="0.3">EXECUTION</text>
              
              {/* Dividers */}
              <line x1="600" y1={startY} x2="600" y2={startY + height} stroke="#e2e8f0" strokeDasharray="20,20" strokeWidth="4" />
              <line x1="1800" y1={startY} x2="1800" y2={startY + height} stroke="#e2e8f0" strokeDasharray="20,20" strokeWidth="4" />
          </g>
      );
  };

  // MINI MAP CALCULATION
  const renderMiniMap = () => {
      if (nodes.length === 0) return null;
      
      const MIN_X = Math.min(...nodes.map(n => n.x));
      const MAX_X = Math.max(...nodes.map(n => n.x + NODE_WIDTH));
      const MIN_Y = Math.min(...nodes.map(n => n.y));
      const MAX_Y = Math.max(...nodes.map(n => n.y + 200));
      
      const mapWidth = 200;
      const mapHeight = 120;
      const worldWidth = MAX_X - MIN_X + 1000;
      const worldHeight = MAX_Y - MIN_Y + 1000;
      
      // Calculate scale to fit world into minimap
      const scaleX = mapWidth / worldWidth;
      const scaleY = mapHeight / worldHeight;
      const scale = Math.min(scaleX, scaleY);

      // Handle Minimap Click for Panning
      const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
          e.stopPropagation();
          if (!containerRef.current) return;
          
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          
          // Map click back to World Coordinates
          // visualX = (worldX - MIN_X + 500) * scale
          // worldX = (visualX / scale) - 500 + MIN_X
          
          const targetWorldX = (clickX / scale) - 500 + MIN_X;
          const targetWorldY = (clickY / scale) - 500 + MIN_Y;
          
          // Center the viewport on this world coordinate
          // offset.x = (containerWidth / 2) - (worldX * zoom)
          
          const { width, height } = containerRef.current.getBoundingClientRect();
          
          setOffset({
              x: (width / 2) - (targetWorldX * zoom),
              y: (height / 2) - (targetWorldY * zoom)
          });
      };

      return (
          <div 
            className="absolute bottom-8 left-8 w-[200px] h-[120px] bg-white/90 border border-slate-200 rounded-lg shadow-lg overflow-hidden hidden md:block z-50 opacity-90 cursor-crosshair hover:opacity-100 transition-opacity"
            onMouseDown={handleMinimapClick}
          >
              <div className="relative w-full h-full pointer-events-none">
                  {nodes.map(node => (
                      <div 
                        key={node.id}
                        className={`absolute w-2 h-2 rounded-full ${highlightedNodeIds?.has(node.id) ? 'bg-amber-500 scale-150 ring-2 ring-amber-200' : selectedNodeId === node.id ? 'bg-blue-600' : 'bg-slate-300'}`}
                        style={{
                            left: (node.x - MIN_X + 500) * scale,
                            top: (node.y - MIN_Y + 500) * scale
                        }}
                      />
                  ))}
                  {/* Viewport Indicator */}
                  <div 
                    className="absolute border-2 border-blue-500/50 bg-blue-500/10 rounded-sm"
                    style={{
                        left: (-offset.x - MIN_X + 500) * scale / zoom,
                        top: (-offset.y - MIN_Y + 500) * scale / zoom,
                        width: (containerRef.current?.clientWidth || 0) * scale / zoom,
                        height: (containerRef.current?.clientHeight || 0) * scale / zoom
                    }}
                  />
              </div>
          </div>
      );
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full overflow-hidden bg-[#F8FAFC] relative selection:bg-blue-100 touch-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseDown={handleMouseDown} 
      onMouseMove={handleMouseMove} 
      onMouseUp={handleMouseUp} 
      onMouseLeave={handleMouseUp} 
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transformOrigin: '0 0', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
        
        {/* Define SVG Filters */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
        </svg>

        {/* Infinite Dot Background */}
        <div className="absolute top-[-5000px] bottom-[-5000px] left-[-5000px] w-[8000px] bg-dot opacity-60 pointer-events-none"></div>

        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
            {renderZones()}
            {renderEdges()}
        </svg>

        {nodes.map(node => (
          <Node 
            key={node.id} 
            data={node} 
            selected={selectedNodeId === node.id}
            onClick={(e) => { e.stopPropagation(); onSelectNode(node.id); }}
            onAction={onNodeAction}
            isDimmed={highlightedNodeIds && highlightedNodeIds.size > 0 && !highlightedNodeIds.has(node.id)}
          />
        ))}
      </div>
      
      {/* LEGEND - Positioned above Mini Map */}
      <div className="absolute bottom-44 left-8 p-3 bg-white/90 backdrop-blur border border-slate-200 rounded-xl shadow-lg z-40 hidden md:flex flex-col gap-2 w-[200px]">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Flow Legend</h4>
          <div className="flex items-center gap-2 text-[10px] text-slate-600 font-medium"><div className="w-2.5 h-2.5 rounded bg-rose-100 border border-rose-300"></div> Research Phase</div>
          <div className="flex items-center gap-2 text-[10px] text-slate-600 font-medium"><div className="w-2.5 h-2.5 rounded bg-yellow-100 border border-yellow-300"></div> Strategic Concept</div>
          <div className="flex items-center gap-2 text-[10px] text-slate-600 font-medium"><div className="w-2.5 h-2.5 rounded bg-cyan-100 border border-cyan-300"></div> Logic Structure</div>
          <div className="flex items-center gap-2 text-[10px] text-slate-600 font-medium"><div className="w-2.5 h-2.5 rounded bg-indigo-100 border border-indigo-300"></div> Final Assembly</div>
      </div>

      {/* MINI MAP */}
      {renderMiniMap()}
      
      {/* Zoom Controls */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-2 z-50">
         <div className="glass-panel p-1.5 rounded-xl flex flex-col gap-1 shadow-lg shadow-slate-200/50 scale-90 origin-bottom-right">
            <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-mono font-bold">+</button>
            <div className="h-px bg-slate-200 mx-2"></div>
            <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.2))} className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-mono font-bold">-</button>
         </div>
      </div>
    </div>
  );
});

export default Canvas;
