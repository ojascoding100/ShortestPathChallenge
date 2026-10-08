/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { MapView } from './components/MapView';
import { Dashboard } from './components/Dashboard';
import { WinModal } from './components/WinModal';
import { MobileTargetBanner } from './components/MobileTargetBanner';
import {
  AVAILABLE_TARGETS,
  DEFAULT_TARGET_NODE,
  GRAPH_EDGES,
  INITIAL_NODES,
  MoveStep,
  NodeId,
} from './types/graph';
import {
  findRoundTripShortestPath,
  getAdjacentNodes,
  getEdge,
} from './utils/graphAlgorithms';
import { getHintForState, HintData } from './utils/hintEngine';
import { sounds } from './utils/audio';

export default function App() {
  const [currentNodeId, setCurrentNodeId] = useState<NodeId>('food_truck');
  const [targetDestination, setTargetDestination] = useState<NodeId>(DEFAULT_TARGET_NODE);
  const [hasDelivered, setHasDelivered] = useState<boolean>(false);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [traveledEdgeIds, setTraveledEdgeIds] = useState<string[]>([]);
  const [moveHistory, setMoveHistory] = useState<MoveStep[]>([]);
  const [isWinModalOpen, setIsWinModalOpen] = useState<boolean>(false);
  const [isHintActive, setIsHintActive] = useState<boolean>(false);
  const [showShortestPathOverlay, setShowShortestPathOverlay] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'map' | 'dashboard'>('map');

  // Compute exact shortest round-trip path for active target destination
  const optimalRouteResult = useMemo(() => {
    return findRoundTripShortestPath('food_truck', targetDestination);
  }, [targetDestination]);

  const parTime = optimalRouteResult.totalTime;

  // Valid next moves from current node
  const validNextMoves = useMemo(() => {
    return getAdjacentNodes(currentNodeId);
  }, [currentNodeId]);

  // Dynamic hint engine
  const currentHint: HintData | null = useMemo(() => {
    if (!isHintActive) return null;
    return getHintForState(
      currentNodeId,
      targetDestination,
      hasDelivered,
      totalTime,
      moveHistory.length
    );
  }, [currentNodeId, targetDestination, hasDelivered, totalTime, moveHistory.length, isHintActive]);

  // Handle player clicking a node
  const handleNodeClick = (targetNodeId: NodeId) => {
    if (targetNodeId === currentNodeId) return;

    const edge = getEdge(currentNodeId, targetNodeId);
    if (!edge) {
      sounds.playErrorSound();
      return;
    }

    const newTime = totalTime + edge.weight;
    const isReachingTarget = targetNodeId === targetDestination && !hasDelivered;

    const step: MoveStep = {
      stepIndex: moveHistory.length + 1,
      from: currentNodeId,
      to: targetNodeId,
      weight: edge.weight,
      cumulativeTime: newTime,
      deliveredTarget: isReachingTarget ? targetNodeId : undefined,
    };

    setTotalTime(newTime);
    setCurrentNodeId(targetNodeId);
    setTraveledEdgeIds((prev) => [...prev, edge.id]);
    setMoveHistory((prev) => [...prev, step]);

    let newHasDelivered = hasDelivered;
    if (isReachingTarget) {
      newHasDelivered = true;
      setHasDelivered(true);
      sounds.playDeliverySound();
    } else {
      sounds.playMoveSound();
    }

    // Win condition: Player reached target, and has now returned to Food Truck
    if (newHasDelivered && targetNodeId === 'food_truck') {
      setTimeout(() => {
        sounds.playWinSound(newTime <= parTime);
        setIsWinModalOpen(true);
      }, 250);
    }
  };

  // Undo last move
  const handleUndo = () => {
    if (moveHistory.length === 0) return;

    sounds.playMoveSound();
    const lastStep = moveHistory[moveHistory.length - 1];
    const newHistory = moveHistory.slice(0, -1);

    setCurrentNodeId(lastStep.from);
    setTotalTime((prev) => Math.max(0, prev - lastStep.weight));
    setTraveledEdgeIds((prev) => prev.slice(0, -1));
    setMoveHistory(newHistory);

    if (lastStep.deliveredTarget) {
      setHasDelivered(false);
    }
  };

  // Reset current route
  const handleReset = () => {
    setCurrentNodeId('food_truck');
    setTotalTime(0);
    setHasDelivered(false);
    setTraveledEdgeIds([]);
    setMoveHistory([]);
    setIsWinModalOpen(false);
    setShowShortestPathOverlay(false);
  };

  // Cycle to next order
  const handleNextOrder = () => {
    const currentIndex = AVAILABLE_TARGETS.indexOf(targetDestination);
    const nextIndex = (currentIndex + 1) % AVAILABLE_TARGETS.length;
    setTargetDestination(AVAILABLE_TARGETS[nextIndex]);
    handleReset();
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      
      {/* Simplified Header with Two Timers */}
      <Header
        totalTime={totalTime}
        parTime={parTime}
        movesCount={moveHistory.length}
        onReset={handleReset}
        onUndo={handleUndo}
        onToggleHint={() => setIsHintActive((prev) => !prev)}
        isHintActive={isHintActive}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-2.5 sm:p-4 md:p-6 flex flex-col lg:grid lg:grid-cols-12 gap-3.5 lg:gap-5 items-start">
        
        {/* Mobile Target Destination Banner (Visible on mobile & tablet) */}
        <div className="lg:hidden w-full">
          <MobileTargetBanner
            targetNode={INITIAL_NODES[targetDestination]}
            currentNode={INITIAL_NODES[currentNodeId]}
            hasDelivered={hasDelivered}
            parTime={parTime}
            totalTime={totalTime}
            onViewShortestPath={() => {
              setShowShortestPathOverlay(true);
              setMobileTab('map');
            }}
          />
        </div>

        {/* Mobile View Switcher Tab (Mobile & Tablet only) */}
        <div className="lg:hidden w-full flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-sm">
          <button
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              mobileTab === 'map'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🗺️</span>
            <span>Campus Map</span>
          </button>
          <button
            onClick={() => setMobileTab('dashboard')}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              mobileTab === 'dashboard'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📋</span>
            <span>Order &amp; Moves</span>
            {moveHistory.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/40 text-current font-mono-tabular font-bold">
                {moveHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* Left Side: Campus Graph Map */}
        <section className={`w-full lg:col-span-8 flex flex-col ${mobileTab === 'dashboard' ? 'hidden lg:flex' : 'flex'}`}>
          <MapView
            nodes={INITIAL_NODES}
            edges={GRAPH_EDGES}
            currentNodeId={currentNodeId}
            targetDestination={targetDestination}
            hasDelivered={hasDelivered}
            traveledEdgeIds={traveledEdgeIds}
            validNextMoves={validNextMoves}
            onNodeClick={handleNodeClick}
            hintData={currentHint}
            isHintActive={isHintActive}
            showShortestPathOverlay={showShortestPathOverlay}
            onCloseShortestPathOverlay={() => setShowShortestPathOverlay(false)}
            optimalRouteResult={optimalRouteResult}
          />
        </section>

        {/* Right Side: Simple Dashboard */}
        <aside className={`w-full lg:col-span-4 flex flex-col ${mobileTab === 'map' ? 'hidden lg:flex' : 'flex'}`}>
          <Dashboard
            nodes={INITIAL_NODES}
            currentNodeId={currentNodeId}
            targetDestination={targetDestination}
            hasDelivered={hasDelivered}
            totalTime={totalTime}
            parTime={parTime}
            moveHistory={moveHistory}
            onViewShortestPath={() => {
              setMobileTab('map');
              setShowShortestPathOverlay(true);
            }}
          />
        </aside>

      </main>

      {/* Win Modal ("Delivery Complete!") */}
      <WinModal
        isOpen={isWinModalOpen}
        totalTime={totalTime}
        parTime={parTime}
        targetDestination={targetDestination}
        moveHistory={moveHistory}
        nodes={INITIAL_NODES}
        optimalRouteResult={optimalRouteResult}
        onClose={() => setIsWinModalOpen(false)}
        onReset={handleReset}
        onNextOrder={handleNextOrder}
        onViewShortestPathOnMap={() => {
          setIsWinModalOpen(false);
          setShowShortestPathOverlay(true);
        }}
      />

    </div>
  );
}
