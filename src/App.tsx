/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Clock,
  Target,
  Timer,
  Play,
  Lightbulb,
  Undo2,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { MapView } from './components/MapView';
import { WinModal } from './components/WinModal';
import {
  GRAPH_EDGES,
  MoveStep,
  NodeId,
  AVAILABLE_TARGETS,
  getRandomTarget,
  getNodesWithAuditorium,
} from './types/graph';
import {
  findOneWayShortestPath,
  getAdjacentNodes,
  getEdge,
} from './utils/graphAlgorithms';
import { getHintForState, HintData } from './utils/hintEngine';
import { sounds } from './utils/audio';

export default function App() {
  // Start Game state and elapsed stopwatch timer
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [timerKey, setTimerKey] = useState<number>(0);

  // Start point is ALWAYS In Gate (food_truck)
  const [currentNodeId, setCurrentNodeId] = useState<NodeId>('food_truck');
  
  // Final destination is ALWAYS the Auditorium, randomly placed on the campus
  const [targetDestination, setTargetDestination] = useState<NodeId>(() => {
    return getRandomTarget();
  });

  const [hasDelivered, setHasDelivered] = useState<boolean>(false);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [traveledEdgeIds, setTraveledEdgeIds] = useState<string[]>([]);
  const [moveHistory, setMoveHistory] = useState<MoveStep[]>([]);
  const [isWinModalOpen, setIsWinModalOpen] = useState<boolean>(false);
  
  // Hint rules: only 1 hint allowed per game, auto-disables after node click
  const [isHintActive, setIsHintActive] = useState<boolean>(false);
  const [hintUsed, setHintUsed] = useState<boolean>(false);

  // Real-time stopwatch timer effect (ticks each second when game is active, restarts fresh on new game/play again)
  useEffect(() => {
    if (!isGameStarted || hasDelivered) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isGameStarted, hasDelivered, timerKey]);

  // Format seconds to MM:SS stopwatch format
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartGame = () => {
    setIsGameStarted(true);
    setElapsedSeconds(0);
    setTimerKey((k) => k + 1);
    sounds.playStartSound();
  };

  // Play again handler: picks new auditorium and immediately restarts stopwatch timer from 0
  const handlePlayAgain = () => {
    const candidates = AVAILABLE_TARGETS.filter((id: NodeId) => id !== targetDestination);
    const nextTarget =
      candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : getRandomTarget();

    setTargetDestination(nextTarget);
    setCurrentNodeId('food_truck');
    setTotalTime(0);
    setHasDelivered(false);
    setTraveledEdgeIds([]);
    setMoveHistory([]);
    setIsWinModalOpen(false);
    setIsHintActive(false);
    setHintUsed(false);
    setElapsedSeconds(0);
    setIsGameStarted(true);
    setTimerKey((k) => k + 1);
    sounds.playStartSound();
  };

  // Compute exact one-way shortest path from In Gate to Auditorium
  const optimalRouteResult = useMemo(() => {
    return findOneWayShortestPath('food_truck', targetDestination);
  }, [targetDestination]);

  const parTime = optimalRouteResult.totalTime;
  const isOverPar = totalTime > parTime;
  const timeDifference = totalTime - parTime;

  // Valid next moves from current node
  const validNextMoves = useMemo(() => {
    return getAdjacentNodes(currentNodeId);
  }, [currentNodeId]);

  // Dynamic nodes dictionary where the selected target node is named "Auditorium" (with 🎭 emoji)
  const nodes = useMemo(() => {
    return getNodesWithAuditorium(targetDestination);
  }, [targetDestination]);

  const targetNode = nodes[targetDestination];
  const currentNode = nodes[currentNodeId];

  // Dynamic hint engine (one-way to Auditorium)
  const currentHint: HintData | null = useMemo(() => {
    if (!isHintActive) return null;
    return getHintForState(
      currentNodeId,
      targetDestination,
      hasDelivered,
      totalTime,
      moveHistory.length,
      nodes
    );
  }, [currentNodeId, targetDestination, hasDelivered, totalTime, moveHistory.length, isHintActive, nodes]);

  // Handle player clicking a node
  const handleNodeClick = (targetNodeId: NodeId) => {
    if (targetNodeId === currentNodeId) return;

    // Start game & timer on first node click if not already started
    if (!isGameStarted) {
      setIsGameStarted(true);
      setElapsedSeconds(0);
      sounds.playStartSound();
    }

    const edge = getEdge(currentNodeId, targetNodeId);
    if (!edge) {
      sounds.playErrorSound();
      return;
    }

    const newTime = totalTime + edge.weight;
    const isReachingAuditorium = targetNodeId === targetDestination;

    const step: MoveStep = {
      stepIndex: moveHistory.length + 1,
      from: currentNodeId,
      to: targetNodeId,
      weight: edge.weight,
      cumulativeTime: newTime,
      deliveredTarget: isReachingAuditorium ? targetNodeId : undefined,
    };

    setTotalTime(newTime);
    setCurrentNodeId(targetNodeId);
    setTraveledEdgeIds((prev) => [...prev, edge.id]);
    setMoveHistory((prev) => [...prev, step]);

    // Automatically disable active hint when player moves to a node after using hint
    if (isHintActive) {
      setIsHintActive(false);
    }

    // One-way travel win condition: reached the Auditorium!
    if (isReachingAuditorium) {
      setHasDelivered(true);
      sounds.playDeliverySound();
      setTimeout(() => {
        sounds.playWinSound(newTime <= parTime);
        setIsWinModalOpen(true);
      }, 260);
    } else {
      sounds.playMoveSound();
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

  // Reset current route (Start point is always In Gate)
  const handleReset = (resetStarted = false) => {
    setCurrentNodeId('food_truck');
    setTotalTime(0);
    setHasDelivered(false);
    setTraveledEdgeIds([]);
    setMoveHistory([]);
    setIsWinModalOpen(false);
    setIsHintActive(false);
    setHintUsed(false);
    setElapsedSeconds(0);
    setTimerKey((k) => k + 1);
    if (resetStarted) {
      setIsGameStarted(false);
    }
  };

  // Toggle or activate hint (limit: 1 hint per game)
  const handleToggleHint = () => {
    if (isHintActive) {
      // Allow user to close/hide without consuming a second chance
      setIsHintActive(false);
    } else if (!hintUsed) {
      // Activate the one allowed hint
      setIsHintActive(true);
      setHintUsed(true);
    }
  };

  // Adapter for WinModal / MapView optimal route interface
  const optimalRouteForModal = useMemo(() => {
    return {
      outbound: {
        path: optimalRouteResult.path,
        distance: optimalRouteResult.distance,
        edgeIds: optimalRouteResult.allEdgeIds,
      },
      inbound: {
        path: [],
        distance: 0,
        edgeIds: [],
      },
      fullPath: optimalRouteResult.path,
      totalTime: optimalRouteResult.totalTime,
      allEdgeIds: optimalRouteResult.allEdgeIds,
      steps: optimalRouteResult.steps.map((s) => ({
        ...s,
        phase: 'outbound' as const,
      })),
    };
  }, [optimalRouteResult]);

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#070b14] text-slate-100 flex flex-col font-sans select-none">
      
      {/* TOP HEADER & IMPORTANT INFORMATION HUD (Scaled to screen width) */}
      <header className="border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md px-3 sm:px-6 py-2 sm:py-2.5 z-30 shadow-md shrink-0">
        <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          
          {/* Brand & Mission Status */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-base sm:text-lg shadow-md text-white shrink-0">
              🎭
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
                Campus Path Finder
              </h1>
            </div>
          </div>

          {/* IMPORTANT INFORMATION TOP BAR (In Gate, Auditorium, and Two Timers) */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-2.5 w-full sm:w-auto">
            
            {/* Mission Route Badge */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs">
              <div className="flex items-center gap-1 font-semibold text-emerald-400">
                <span>🚪</span>
                <span>In Gate</span>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
              <div className="flex items-center gap-1 font-bold text-amber-300">
                <span>🎭</span>
                <span>Auditorium</span>
              </div>
            </div>

            {/* TIMER 1: Current Path Consumed */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-0.5 sm:px-3 sm:py-1 shadow-inner">
              <div
                className={`p-1 sm:p-1.5 rounded-lg transition-colors ${
                  isOverPar
                    ? 'bg-amber-500/15 text-amber-400'
                    : totalTime > 0
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1 leading-none mb-0.5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                    Current Path
                  </span>
                  {totalTime > 0 && (
                    <span
                      className={`text-[9px] font-semibold px-1 rounded ${
                        isOverPar
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {isOverPar ? `+${timeDifference}m` : 'On Pace'}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-sm sm:text-base font-extrabold font-mono-tabular leading-tight ${
                      isOverPar ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {totalTime}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">mins</span>
                </div>
              </div>
            </div>

            {/* TIMER 2: Shortest Target Time */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-0.5 sm:px-3 sm:py-1 shadow-inner">
              <div className="p-1 sm:p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400">
                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1 leading-none mb-0.5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                    Shortest Target
                  </span>
                  <span className="text-[9px] font-semibold text-cyan-300 bg-cyan-500/20 px-1 rounded">
                    Optimal Goal
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm sm:text-base font-extrabold font-mono-tabular text-cyan-400 leading-tight">
                    {parTime}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">mins</span>
                </div>
              </div>
            </div>

            {/* TIMER 3: Real-Time Stopwatch Timer */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-0.5 sm:px-3 sm:py-1 shadow-inner">
              <div
                className={`p-1 sm:p-1.5 rounded-lg transition-colors ${
                  isGameStarted && !hasDelivered
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1 leading-none mb-0.5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                    Game Timer
                  </span>
                  <span
                    className={`text-[9px] font-semibold px-1 rounded ${
                      !isGameStarted
                        ? 'bg-slate-800 text-slate-400'
                        : hasDelivered
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300 animate-pulse'
                    }`}
                  >
                    {!isGameStarted ? 'Ready' : hasDelivered ? 'Finished' : 'Live'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm sm:text-base font-extrabold font-mono-tabular text-amber-400 leading-tight">
                    {formatTime(elapsedSeconds)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* MAIN VIEW: FULL-WIDTH CAMPUS MAP SCALED TO FIT SCREEN WITH CONTROLS BELOW */}
      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-2 sm:px-4 py-2 flex flex-col gap-2 overflow-hidden">
        
        {/* Game Map: Takes full remaining height and width */}
        <section className="relative flex-1 min-h-0 w-full flex flex-col rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl">
          <MapView
            nodes={nodes}
            edges={GRAPH_EDGES}
            currentNodeId={currentNodeId}
            targetDestination={targetDestination}
            hasDelivered={hasDelivered}
            traveledEdgeIds={traveledEdgeIds}
            validNextMoves={validNextMoves}
            onNodeClick={handleNodeClick}
            hintData={currentHint}
            isHintActive={isHintActive}
            onDismissHint={() => setIsHintActive(false)}
            optimalRouteResult={optimalRouteForModal}
          />

          {/* Start Game Overlay Card */}
          {!isGameStarted && (
            <div className="absolute inset-0 z-20 bg-slate-950/75 backdrop-blur-[2px] flex items-center justify-center p-4 animate-fade-in pointer-events-auto">
              <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl text-center flex flex-col items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/25">
                  🎭
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Campus Path Finder
                  </h2>
                </div>
                
                <div className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-around text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Target Par</span>
                    <span className="text-sm font-extrabold text-cyan-400 font-mono-tabular">{parTime} mins</span>
                  </div>
                  <div className="w-px h-6 bg-slate-800" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Mode</span>
                    <span className="text-sm font-extrabold text-amber-300">One-Way</span>
                  </div>
                  <div className="w-px h-6 bg-slate-800" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Hints</span>
                    <span className="text-sm font-extrabold text-emerald-400">1 Available</span>
                  </div>
                </div>

                <button
                  onClick={handleStartGame}
                  className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Game</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* CONTROLS BELOW THE GAME: HINT, UNDO, RESET */}
        <section className="shrink-0 w-full bg-slate-900/95 border border-slate-800 rounded-xl px-3 sm:px-4 py-2 shadow-lg flex flex-col gap-2">
          
          {/* Main Action Buttons: Hint & Undo Prominently Below The Game */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            
            {/* Primary Action Buttons (Hint, Undo, Reset) */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Start Game Button (if game not started) */}
              {!isGameStarted && (
                <button
                  onClick={handleStartGame}
                  className="h-9 sm:h-10 px-3.5 sm:px-4 text-xs sm:text-sm font-black rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Game</span>
                </button>
              )}

              {/* Hint Button (1 Hint per game limit, auto-disables after node click) */}
              <button
                onClick={handleToggleHint}
                disabled={hintUsed && !isHintActive}
                className={`h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm font-bold rounded-xl border transition-all flex items-center gap-2 active:scale-95 shadow-md ${
                  isHintActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 cursor-pointer ring-2 ring-amber-400/50'
                    : hintUsed
                    ? 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed opacity-50'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 cursor-pointer hover:border-amber-400'
                }`}
                title={
                  isHintActive
                    ? 'Hide active hint'
                    : hintUsed
                    ? 'Hint already used for this game (1 hint per game limit)'
                    : 'Get 1 algorithmic hint for this game (auto-disables upon next move)'
                }
              >
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Hint</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-mono-tabular font-extrabold ${
                    isHintActive
                      ? 'bg-slate-950 text-amber-300'
                      : hintUsed
                      ? 'bg-slate-900 text-slate-600'
                      : 'bg-amber-500/30 text-amber-200'
                  }`}
                >
                  {hintUsed && !isHintActive ? '0/1 Used' : '1/1 Available'}
                </span>
              </button>

              {/* Undo Button */}
              <button
                onClick={handleUndo}
                disabled={moveHistory.length === 0}
                className={`h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-xl border transition-all flex items-center gap-2 active:scale-95 shadow-md ${
                  moveHistory.length > 0
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700 cursor-pointer'
                    : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed opacity-50'
                }`}
                title="Undo last move"
              >
                <Undo2 className="w-4 h-4 text-slate-300" />
                <span>Undo Move</span>
                {moveHistory.length > 0 && (
                  <span className="text-[11px] font-mono-tabular px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                    #{moveHistory.length}
                  </span>
                )}
              </button>

              {/* Reset to In Gate Button */}
              <button
                onClick={() => {
                  sounds.playMoveSound();
                  handleReset();
                }}
                className="h-9 sm:h-10 px-3 sm:px-3.5 text-xs sm:text-sm font-medium rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                title="Restart route from In Gate"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span>Reset</span>
              </button>

            </div>

            {/* Quick Status Summary */}
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-tabular">
              <span>Location:</span>
              <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-950 border border-slate-800 flex items-center gap-1">
                <span>{currentNode.emoji}</span>
                <span>{currentNode.name}</span>
              </span>
              <span>•</span>
              <span>{moveHistory.length} moves</span>
            </div>

          </div>

          {/* Active Hint Banner (if active) */}
          {isHintActive && currentHint && (
            <div className="p-2 sm:p-2.5 bg-amber-500/15 border border-amber-500/40 rounded-lg flex items-center justify-between gap-2.5 animate-fade-in shadow-inner text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold text-amber-300 shrink-0">💡 Clue:</span>
                <span className="text-slate-200 truncate">{currentHint.clue}</span>
                {currentHint.warningReason && (
                  <span className="text-rose-300 font-semibold truncate hidden md:inline">
                    (⚠️ {currentHint.warningReason})
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsHintActive(false)}
                className="text-[11px] text-amber-300/80 hover:text-amber-200 px-2 py-0.5 rounded hover:bg-amber-900/40 shrink-0 cursor-pointer font-semibold transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

        </section>

      </main>

      {/* Win Modal ("Auditorium Reached!") */}
      <WinModal
        isOpen={isWinModalOpen}
        totalTime={totalTime}
        parTime={parTime}
        targetDestination={targetDestination}
        moveHistory={moveHistory}
        nodes={nodes}
        optimalRouteResult={optimalRouteForModal}
        elapsedTime={formatTime(elapsedSeconds)}
        onClose={() => setIsWinModalOpen(false)}
        onReset={handlePlayAgain}
      />

    </div>
  );
}
