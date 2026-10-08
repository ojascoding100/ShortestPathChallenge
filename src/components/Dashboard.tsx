import React from 'react';
import { CheckCircle2, Circle, ArrowRight, Clock, Target, Route, PackageCheck } from 'lucide-react';
import { GraphNode, MoveStep, NodeId } from '../types/graph';

interface DashboardProps {
  nodes: Record<NodeId, GraphNode>;
  currentNodeId: NodeId;
  targetDestination: NodeId;
  hasDelivered: boolean;
  totalTime: number;
  parTime: number;
  moveHistory: MoveStep[];
  onViewShortestPath: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  nodes,
  currentNodeId,
  targetDestination,
  hasDelivered,
  totalTime,
  parTime,
  moveHistory,
  onViewShortestPath,
}) => {
  const isOverPar = totalTime > parTime;
  const timeDifference = totalTime - parTime;
  const targetNode = nodes[targetDestination];

  return (
    <div className="w-full flex flex-col gap-3">
      
      {/* ACTIVE SINGLE DELIVERY ORDER CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
            <PackageCheck className="w-3.5 h-3.5 text-sky-400" />
            Active Delivery Order
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              hasDelivered
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
            }`}
          >
            {hasDelivered ? '✓ 1/1 Delivered' : '0/1 In Transit'}
          </span>
        </div>

        {/* Destination Details */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{targetNode.emoji}</span>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{targetNode.name}</span>
              </h2>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                {targetNode.orderItem || targetNode.description}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 block">Mission Goal</span>
            <span className="text-xs font-bold text-cyan-400 font-mono-tabular">
              Round Trip
            </span>
          </div>
        </div>
      </div>

      {/* TWO TIMERS COMPARISON CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
          <span>Routing Timers</span>
          <span className="text-[10px] text-slate-500 font-mono-tabular">
            {moveHistory.length} moves taken
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Timer 1: Current Path */}
          <div className="bg-slate-950 border border-slate-800/90 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" />
                Current Path
              </span>
              {totalTime > 0 && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isOverPar
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-emerald-500/15 text-emerald-300'
                  }`}
                >
                  {isOverPar ? `+${timeDifference}m` : 'Optimal'}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`text-xl font-extrabold font-mono-tabular ${
                  isOverPar ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {totalTime}
              </span>
              <span className="text-xs text-slate-500 font-medium">mins consumed</span>
            </div>
          </div>

          {/* Timer 2: Shortest Target */}
          <div className="bg-slate-950 border border-slate-800/90 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <Target className="w-3 h-3 text-cyan-400" />
                Shortest Target
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300">
                Par Goal
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-extrabold font-mono-tabular text-cyan-400">
                {parTime}
              </span>
              <span className="text-xs text-slate-500 font-medium">mins target</span>
            </div>
          </div>
        </div>

        {/* Tolerance / Progress Bar */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span>Path Efficiency</span>
            <span className="font-mono-tabular font-bold">
              {totalTime <= parTime
                ? `${parTime - totalTime}m budget left`
                : `${timeDifference}m over target`}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverPar ? 'bg-amber-500' : 'bg-emerald-400'
              }`}
              style={{
                width: `${Math.min(100, Math.max(5, (totalTime / parTime) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* MISSION STATUS & ROUTE HISTORY */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md flex-1">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            Route Progress ({moveHistory.length} Steps)
          </h2>
          <button
            onClick={onViewShortestPath}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Route className="w-3 h-3" />
            <span>Shortest Path</span>
          </button>
        </div>

        {moveHistory.length === 0 ? (
          <div className="p-3 text-center rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-500">
            Click an adjacent building to begin your delivery route!
          </div>
        ) : (
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {moveHistory.map((step) => (
              <div
                key={step.stepIndex}
                className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono-tabular"
              >
                <div className="flex items-center gap-1.5 truncate text-slate-300 text-[11px]">
                  <span className="text-slate-500 font-bold">#{step.stepIndex}</span>
                  <span className="text-slate-400">{nodes[step.from]?.shortName}</span>
                  <ArrowRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                  <span className="text-white font-semibold">{nodes[step.to]?.shortName}</span>
                  {step.deliveredTarget && (
                    <span className="text-emerald-400 text-[10px] font-bold ml-1">
                      (✓ Delivered!)
                    </span>
                  )}
                </div>
                <span className="text-amber-400 font-bold text-[11px] shrink-0">
                  +{step.weight}m
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
