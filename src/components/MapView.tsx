import React, { useState, useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, LocateFixed, Route } from 'lucide-react';
import { GraphEdge, GraphNode, NodeId } from '../types/graph';
import { HintData } from '../utils/hintEngine';
import { sounds } from '../utils/audio';
import { RoundTripResult } from '../utils/graphAlgorithms';

interface MapViewProps {
  nodes: Record<NodeId, GraphNode>;
  edges: GraphEdge[];
  currentNodeId: NodeId;
  targetDestination: NodeId;
  hasDelivered: boolean;
  traveledEdgeIds: string[];
  validNextMoves: { nodeId: NodeId; weight: number; edgeId: string }[];
  onNodeClick: (nodeId: NodeId) => void;
  hintData: HintData | null;
  isHintActive: boolean;
  showShortestPathOverlay: boolean;
  onCloseShortestPathOverlay: () => void;
  optimalRouteResult: RoundTripResult;
}

export const MapView: React.FC<MapViewProps> = ({
  nodes,
  edges,
  currentNodeId,
  targetDestination,
  hasDelivered,
  traveledEdgeIds,
  validNextMoves,
  onNodeClick,
  hintData,
  isHintActive,
  showShortestPathOverlay,
  onCloseShortestPathOverlay,
  optimalRouteResult,
}) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<NodeId | null>(null);

  // Zoom & Pan state for mobile clarity and accessibility
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Drag interaction tracking
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef<boolean>(false);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const validTargetIds = validNextMoves.map((m) => m.nodeId);

  // Base canvas dimension
  const BASE_WIDTH = 920;
  const BASE_HEIGHT = 530;

  // Compute responsive dynamic viewBox based on zoomLevel and panOffset
  const currentWidth = BASE_WIDTH / zoomLevel;
  const currentHeight = BASE_HEIGHT / zoomLevel;

  // Centered with pan offset, clamped within bounds
  const rawViewX = (BASE_WIDTH - currentWidth) / 2 + panOffset.x;
  const rawViewY = (BASE_HEIGHT - currentHeight) / 2 + panOffset.y;

  // Clamping margins
  const minX = -60;
  const maxX = BASE_WIDTH - currentWidth + 60;
  const minY = -50;
  const maxY = BASE_HEIGHT - currentHeight + 50;

  const viewBoxX = Math.max(minX, Math.min(maxX, rawViewX));
  const viewBoxY = Math.max(minY, Math.min(maxY, rawViewY));
  const dynamicViewBox = `${viewBoxX} ${viewBoxY} ${currentWidth} ${currentHeight}`;

  // Zoom Handlers
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(2.4, Number((prev * 1.3).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(1, Number((prev / 1.3).toFixed(2)));
      if (next === 1) {
        setPanOffset({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Center on current node or target destination
  const handleCenterOn = useCallback((nodeId: NodeId) => {
    const target = nodes[nodeId];
    if (!target) return;
    const targetZoom = Math.max(zoomLevel, 1.45);
    const viewW = BASE_WIDTH / targetZoom;
    const viewH = BASE_HEIGHT / targetZoom;

    // Offset needed so target is centered:
    // viewX = target.x - viewW / 2
    // rawViewX = (BASE_WIDTH - viewW)/2 + panX  =>  panX = target.x - BASE_WIDTH / 2
    const targetPanX = target.x - BASE_WIDTH / 2;
    const targetPanY = target.y - BASE_HEIGHT / 2;

    setZoomLevel(targetZoom);
    setPanOffset({ x: targetPanX, y: targetPanY });
  }, [nodes, zoomLevel]);

  // Touch and Mouse Drag / Pan handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoomLevel <= 1) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...panOffset };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || zoomLevel <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.hypot(dx, dy) > 6) {
      hasMovedRef.current = true;
    }

    if (svgContainerRef.current) {
      const rect = svgContainerRef.current.getBoundingClientRect();
      const scaleX = currentWidth / rect.width;
      const scaleY = currentHeight / rect.height;

      setPanOffset({
        x: panStartRef.current.x - dx * scaleX,
        y: panStartRef.current.y - dy * scaleY,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignored if pointer capture was already released
      }
    }
  };

  const handleNodeClick = (nodeId: NodeId) => {
    // If user was dragging / panning, do not trigger travel
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }

    if (showShortestPathOverlay) {
      onCloseShortestPathOverlay();
    }
    if (nodeId === currentNodeId) return;

    if (validTargetIds.includes(nodeId)) {
      onNodeClick(nodeId);
    } else {
      sounds.playErrorSound();
    }
  };

  const targetNode = nodes[targetDestination];
  const currentNode = nodes[currentNodeId];

  return (
    <div className="relative w-full flex flex-col bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden select-none">
      
      {/* Top Banner: Hint or Shortest Route notification */}
      {isHintActive && hintData && (
        <div className="bg-amber-950/70 border-b border-amber-500/30 px-3.5 py-1.5 text-xs text-amber-200 flex items-center justify-between z-10">
          <p className="leading-snug flex items-center gap-1.5">
            <span className="text-amber-400 font-bold">💡 Hint:</span>
            <span>{hintData.clue}</span>
          </p>
        </div>
      )}

      {showShortestPathOverlay && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-3.5 py-2 text-xs text-emerald-200 flex items-center justify-between z-10">
          <span className="truncate mr-2 font-medium">
            🏆 <strong>Optimal Round-Trip ({optimalRouteResult.totalTime}m):</strong>{' '}
            {optimalRouteResult.fullPath.map((id) => nodes[id]?.shortName).join(' ➔ ')}
          </span>
          <button
            onClick={onCloseShortestPathOverlay}
            className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shrink-0 transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {/* Map Status & Zoom Controls Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-3 py-2 flex items-center justify-between gap-2 z-10">
        
        {/* Mobile-Friendly Mission Status Strip */}
        <div className="flex items-center gap-2 text-xs truncate">
          <div className="flex items-center gap-1 font-bold text-amber-400 shrink-0">
            <span>🛵</span>
            <span className="hidden xs:inline text-slate-300">At:</span>
            <span className="text-amber-300 font-semibold">{currentNode?.shortName}</span>
          </div>

          <span className="text-slate-600">➔</span>

          <div className="flex items-center gap-1 text-xs truncate">
            {hasDelivered ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span>🏁</span>
                <span className="truncate">Return to Food Truck</span>
              </span>
            ) : (
              <span className="text-sky-300 font-bold flex items-center gap-1 truncate">
                <span>🎯</span>
                <span className="truncate">Goal: {targetNode?.name}</span>
              </span>
            )}
          </div>
        </div>

        {/* Floating Zoom & Pan Toolbar */}
        <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-lg p-0.5 shrink-0">
          <button
            onClick={handleZoomIn}
            className="w-7 h-7 flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
            title="Zoom In"
            aria-label="Zoom in on map"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            className={`w-7 h-7 flex items-center justify-center rounded transition-all ${
              zoomLevel > 1
                ? 'text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95'
                : 'text-slate-600 cursor-not-allowed opacity-50'
            }`}
            title="Zoom Out"
            aria-label="Zoom out on map"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleCenterOn(currentNodeId)}
            className="w-7 h-7 flex items-center justify-center rounded text-amber-400 hover:text-amber-300 hover:bg-slate-800 active:scale-95 transition-all"
            title="Center on Scooter"
            aria-label="Center on current location"
          >
            <LocateFixed className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetView}
            className="w-7 h-7 flex items-center justify-center rounded text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 active:scale-95 transition-all text-xs font-bold"
            title="Fit / Reset View"
            aria-label="Reset map view"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Campus Map SVG Container */}
      <div
        ref={svgContainerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative w-full flex items-center justify-center p-1 sm:p-3 overflow-hidden ${
          zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing touch-none' : ''
        }`}
      >
        <svg
          viewBox={dynamicViewBox}
          className="w-full h-auto min-h-[300px] xs:min-h-[340px] max-h-[460px] md:max-h-[500px] select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="campus-grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
          </defs>

          {/* Grid Background */}
          <rect width="920" height="530" fill="#090d16" rx="12" />
          <rect width="920" height="530" fill="url(#campus-grid)" rx="12" />

          {/* EDGES / PATHS LAYER */}
          <g id="edges-layer">
            {edges.map((edge) => {
              const fromNode = nodes[edge.from];
              const toNode = nodes[edge.to];
              if (!fromNode || !toNode) return null;

              const isTraveled = traveledEdgeIds.includes(edge.id);
              const isAvailable =
                (edge.from === currentNodeId && validTargetIds.includes(edge.to)) ||
                (edge.to === currentNodeId && validTargetIds.includes(edge.from));
              const isShortest = showShortestPathOverlay && optimalRouteResult.allEdgeIds.includes(edge.id);

              const midX = (fromNode.x + toNode.x) / 2;
              const midY = (fromNode.y + toNode.y) / 2;

              return (
                <g key={edge.id}>
                  {/* Road Path Line with bold stroke widths for mobile legibility */}
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={
                      isShortest
                        ? '#10b981'
                        : isTraveled
                        ? '#06b6d4'
                        : isAvailable
                        ? '#f59e0b'
                        : '#1e293b'
                    }
                    strokeWidth={isShortest || isTraveled ? 7 : isAvailable ? 5.5 : 4}
                    strokeLinecap="round"
                    strokeDasharray={isAvailable && !isTraveled && !isShortest ? '8,8' : undefined}
                    className={isAvailable && !isTraveled && !isShortest ? 'animate-dash-flow' : ''}
                  />

                  {/* Road Weight Badge (Minutes) - Bold, high-contrast, perfectly visible on mobile */}
                  <g transform={`translate(${midX}, ${midY})`} className="pointer-events-none">
                    <rect
                      x="-24"
                      y="-14"
                      width="48"
                      height="28"
                      rx="14"
                      fill={isShortest ? '#064e3b' : isTraveled ? '#083344' : '#0b1329'}
                      stroke={isShortest ? '#10b981' : isTraveled ? '#06b6d4' : isAvailable ? '#f59e0b' : '#334155'}
                      strokeWidth={isShortest || isTraveled || isAvailable ? 2 : 1.4}
                    />
                    <text
                      x="0"
                      y="5"
                      textAnchor="middle"
                      fill={isShortest ? '#a7f3d0' : isTraveled ? '#67e8f9' : isAvailable ? '#fde68a' : '#cbd5e1'}
                      fontSize="13"
                      fontWeight="800"
                      className="font-mono-tabular"
                    >
                      {edge.weight}m
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* NODES / LOCATION BUTTONS LAYER */}
          <g id="nodes-layer">
            {(Object.keys(nodes) as NodeId[]).map((nodeId) => {
              const node = nodes[nodeId];
              const isCurrent = nodeId === currentNodeId;
              const isTarget = nodeId === targetDestination;
              const isValidNext = validTargetIds.includes(nodeId);
              const isRecommended = isHintActive && hintData?.recommendedNode === nodeId;
              const isSolutionNode = showShortestPathOverlay && optimalRouteResult.fullPath.includes(nodeId);
              const isHovered = hoveredNodeId === nodeId;

              let circleRadius = 29;
              if (isHovered && isValidNext) circleRadius = 33;
              else if (isHovered) circleRadius = 31;
              else if (isCurrent) circleRadius = 31;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => handleNodeClick(node.id)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  className="svg-location-node cursor-pointer"
                  tabIndex={0}
                  role="button"
                  aria-label={`${node.name} location button${isValidNext ? ' - click to travel' : ''}`}
                >
                  {/* Generous touch hitbox circle for effortless mobile tapping */}
                  <circle
                    cx="0"
                    cy="0"
                    r="46"
                    fill="transparent"
                    className="cursor-pointer"
                    aria-hidden="true"
                  />

                  {/* Stable concentric pulsing halo for current location */}
                  {!showShortestPathOverlay && isCurrent && (
                    <circle
                      cx="0"
                      cy="0"
                      r="38"
                      fill="none"
                      stroke="#f59e0b"
                      className="animate-ring-pulse pointer-events-none"
                    />
                  )}

                  {/* Pulsing ring for active Target Destination before delivery */}
                  {!showShortestPathOverlay && isTarget && !hasDelivered && !isCurrent && (
                    <circle
                      cx="0"
                      cy="0"
                      r="38"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      strokeDasharray="6,6"
                      className="animate-spin pointer-events-none"
                      style={{ animationDuration: '6s' }}
                    />
                  )}

                  {/* Hint indicator ring */}
                  {isRecommended && !isCurrent && (
                    <circle
                      cx="0"
                      cy="0"
                      r="39"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2.8"
                      strokeDasharray="5,5"
                      className="animate-spin pointer-events-none"
                      style={{ animationDuration: '8s' }}
                    />
                  )}

                  {/* Solution path ring */}
                  {showShortestPathOverlay && isSolutionNode && (
                    <circle
                      cx="0"
                      cy="0"
                      r="38"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      opacity="0.9"
                      className="pointer-events-none"
                    />
                  )}

                  {/* Base Circle Button */}
                  <circle
                    cx="0"
                    cy="0"
                    r={circleRadius}
                    fill={
                      isCurrent
                        ? '#1e293b'
                        : isTarget && hasDelivered
                        ? '#064e3b'
                        : isTarget
                        ? '#0c4a6e'
                        : '#0f172a'
                    }
                    stroke={
                      isCurrent
                        ? '#f59e0b'
                        : isRecommended
                        ? '#fbbf24'
                        : isTarget && hasDelivered
                        ? '#10b981'
                        : isTarget
                        ? '#38bdf8'
                        : isValidNext
                        ? isHovered
                          ? '#38bdf8'
                          : '#0284c7'
                        : '#334155'
                    }
                    strokeWidth={isCurrent || isRecommended ? 4 : isTarget ? 3.5 : isValidNext ? 3 : 2}
                    className="node-base-circle"
                  />

                  {/* Location Emoji Icon - Large & Clear */}
                  <text
                    x="0"
                    y="7"
                    textAnchor="middle"
                    fontSize="22"
                    className="pointer-events-none select-none"
                  >
                    {node.emoji}
                  </text>

                  {/* Current driver scooter tag */}
                  {!showShortestPathOverlay && isCurrent && (
                    <g transform="translate(17, -17)" className="pointer-events-none">
                      <circle r="11" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.6" />
                      <text x="0" y="4" textAnchor="middle" fontSize="10">🛵</text>
                    </g>
                  )}

                  {/* Target Delivery Badge */}
                  {isTarget && (
                    <g transform="translate(0, -38)" className="pointer-events-none">
                      {hasDelivered ? (
                        <g>
                          <rect
                            x="-38"
                            y="-10"
                            width="76"
                            height="20"
                            rx="10"
                            fill="#065f46"
                            stroke="#34d399"
                            strokeWidth="1.4"
                          />
                          <text
                            x="0"
                            y="4"
                            textAnchor="middle"
                            fill="#ecfdf5"
                            fontSize="9.5"
                            fontWeight="800"
                          >
                            ✓ DELIVERED
                          </text>
                        </g>
                      ) : (
                        <g>
                          <rect
                            x="-45"
                            y="-11"
                            width="90"
                            height="22"
                            rx="11"
                            fill="#0369a1"
                            stroke="#38bdf8"
                            strokeWidth="1.6"
                            className="animate-pulse"
                          />
                          <polygon points="-5,11 5,11 0,15" fill="#38bdf8" />
                          <text
                            x="0"
                            y="4.5"
                            textAnchor="middle"
                            fill="#f0f9ff"
                            fontSize="10"
                            fontWeight="800"
                            letterSpacing="0.04em"
                          >
                            🎯 DESTINATION
                          </text>
                        </g>
                      )}
                    </g>
                  )}

                  {/* START / FINISH Marker at Food Truck */}
                  {node.id === 'food_truck' && (
                    <g transform="translate(0, -38)" className="pointer-events-none">
                      {hasDelivered && !isCurrent ? (
                        <g>
                          <rect
                            x="-48"
                            y="-11"
                            width="96"
                            height="22"
                            rx="11"
                            fill="#b45309"
                            stroke="#fde047"
                            strokeWidth="1.6"
                            className="animate-pulse"
                          />
                          <polygon points="-5,11 5,11 0,15" fill="#fde047" />
                          <text
                            x="0"
                            y="4.5"
                            textAnchor="middle"
                            fill="#fef08a"
                            fontSize="10"
                            fontWeight="800"
                            letterSpacing="0.04em"
                          >
                            🏁 FINISH HERE
                          </text>
                        </g>
                      ) : (
                        <g>
                          <rect
                            x="-38"
                            y="-11"
                            width="76"
                            height="22"
                            rx="11"
                            fill="#78350f"
                            stroke="#f59e0b"
                            strokeWidth="1.6"
                          />
                          <polygon points="-5,11 5,11 0,15" fill="#f59e0b" />
                          <text
                            x="0"
                            y="4.5"
                            textAnchor="middle"
                            fill="#fef3c7"
                            fontSize="10.5"
                            fontWeight="800"
                            letterSpacing="0.04em"
                          >
                            🚩 START
                          </text>
                        </g>
                      )}
                    </g>
                  )}

                  {/* Location Name Pill Badge - Enlarged & High Contrast for Mobile */}
                  <g transform="translate(0, 42)" className="pointer-events-none">
                    <rect
                      x="-52"
                      y="-12"
                      width="104"
                      height="24"
                      rx="8"
                      fill="#070c18"
                      fillOpacity="0.96"
                      stroke={
                        isCurrent
                          ? '#f59e0b'
                          : isTarget
                          ? '#38bdf8'
                          : isSolutionNode
                          ? '#10b981'
                          : isValidNext
                          ? '#38bdf8'
                          : '#1e293b'
                      }
                      strokeWidth={isCurrent || isTarget ? 1.8 : 1.2}
                    />
                    <text
                      x="0"
                      y="5"
                      textAnchor="middle"
                      fill={
                        isCurrent
                          ? '#fde68a'
                          : isTarget
                          ? '#bae6fd'
                          : isSolutionNode
                          ? '#a7f3d0'
                          : isValidNext
                          ? '#e0f2fe'
                          : '#cbd5e1'
                      }
                      fontSize="12.5"
                      fontWeight={isCurrent || isTarget || isValidNext ? '700' : '600'}
                      letterSpacing="0.01em"
                    >
                      {node.shortName}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Small Zoom Helper Notice when zoomed */}
        {zoomLevel > 1 && (
          <div className="absolute bottom-2 left-2 bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-md text-[10px] text-slate-300 pointer-events-none shadow-md">
            Zoomed {Math.round(zoomLevel * 100)}% • Drag to pan • Tap ⛶ to fit
          </div>
        )}
      </div>

      {/* Quick Move Button Bar: Adjacent Connected Locations (Mobile-First Touch Bar) */}
      <div className="bg-slate-900/95 border-t border-slate-800 p-2.5 sm:p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-xs sm:text-sm">
            <Route className="w-3.5 h-3.5 text-sky-400" />
            <span>Connected Roads:</span>
            <span className="text-[11px] text-slate-400 font-normal">
              ({validNextMoves.length} choices)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden xs:inline">
            Tap node above or quick button below:
          </span>
        </div>

        {/* Big finger-friendly touch buttons (min 44px height for mobile accessibility) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          {validNextMoves.map((move) => {
            const nextNode = nodes[move.nodeId];
            const isTarget = move.nodeId === targetDestination;
            const isRec = isHintActive && hintData?.recommendedNode === move.nodeId;

            return (
              <button
                key={move.nodeId}
                onClick={() => handleNodeClick(move.nodeId)}
                className={`min-h-[46px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border flex items-center justify-between sm:justify-start gap-2 transition-all cursor-pointer active:scale-95 shadow-sm ${
                  isRec
                    ? 'bg-amber-500/25 text-amber-100 border-amber-400 shadow-amber-500/10'
                    : isTarget
                    ? 'bg-sky-500/25 text-sky-100 border-sky-400 hover:bg-sky-500/35'
                    : 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-base sm:text-lg shrink-0">{nextNode.emoji}</span>
                  <span className="truncate">{nextNode.shortName}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-mono-tabular font-bold px-1.5 py-0.5 rounded bg-slate-950/70 border border-slate-700 text-slate-200">
                    +{move.weight}m
                  </span>
                  {isTarget && !hasDelivered && (
                    <span className="text-[9px] bg-sky-500 text-slate-950 font-black px-1.5 py-0.5 rounded">
                      GOAL
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

