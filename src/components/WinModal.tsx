import React from 'react';
import { Trophy, AlertTriangle, RotateCcw, X, Route, ArrowRight } from 'lucide-react';
import { GraphNode, MoveStep, NodeId } from '../types/graph';
import { RoundTripResult } from '../utils/graphAlgorithms';

interface WinModalProps {
  isOpen: boolean;
  totalTime: number;
  parTime: number;
  targetDestination: NodeId;
  moveHistory: MoveStep[];
  nodes: Record<NodeId, GraphNode>;
  optimalRouteResult: RoundTripResult;
  elapsedTime?: string;
  onClose: () => void;
  onReset: () => void;
}

export const WinModal: React.FC<WinModalProps> = ({
  isOpen,
  totalTime,
  parTime,
  targetDestination,
  moveHistory,
  nodes,
  optimalRouteResult,
  elapsedTime,
  onClose,
  onReset,
}) => {
  if (!isOpen) return null;

  const isOptimal = totalTime <= parTime;
  const targetNode = nodes[targetDestination];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 md:p-6 my-6 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-4">
          <div
            className={`w-12 h-12 mx-auto mb-2.5 rounded-xl flex items-center justify-center text-2xl shadow-xl ${
              isOptimal
                ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-emerald-500/20 text-white'
                : 'bg-gradient-to-br from-amber-500 to-rose-600 shadow-amber-500/20 text-white'
            }`}
          >
            {isOptimal ? <Trophy className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Auditorium Reached!
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Successfully traveled from 🚪 <strong className="text-emerald-400">In Gate</strong> to 🎭 <strong className="text-amber-300">Auditorium</strong> ({targetNode.name}).
          </p>
        </div>

        {/* Evaluation Message */}
        <div
          className={`p-3 rounded-xl border mb-4 text-center ${
            isOptimal
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
          }`}
        >
          <p className="text-sm font-bold">
            {isOptimal
              ? `🏆 Optimal Path! You achieved the true shortest one-way route (${parTime} mins)!`
              : `You took ${totalTime} mins! The shortest path was ${parTime} mins. Can you find the optimal detour?`}
          </p>
        </div>

        {/* Stats - Two Timers & Real Time */}
        <div className="grid grid-cols-3 gap-2 mb-4 font-mono-tabular">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-center">
            <span className="text-[9px] text-slate-400 block uppercase font-bold truncate">Current Path</span>
            <span
              className={`text-base sm:text-lg font-extrabold ${
                isOptimal ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {totalTime}m
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-center">
            <span className="text-[9px] text-slate-400 block uppercase font-bold truncate">Target Time</span>
            <span className="text-base sm:text-lg font-extrabold text-cyan-400">{parTime}m</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-center">
            <span className="text-[9px] text-slate-400 block uppercase font-bold truncate">Time Elapsed</span>
            <span className="text-base sm:text-lg font-extrabold text-amber-300">
              {elapsedTime || '00:00'}
            </span>
          </div>
        </div>

        {/* Shortest Path Breakdown */}
        <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-3.5 mb-4 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
              <Route className="w-4 h-4 text-emerald-400" />
              <span>Optimal One-Way Route ({parTime} mins)</span>
            </div>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {optimalRouteResult.steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800/80 font-mono-tabular"
              >
                <div className="flex items-center gap-1.5 truncate text-[11px]">
                  <span className="text-emerald-400 font-bold w-4">#{idx + 1}</span>
                  <span className="text-slate-300">{nodes[step.from]?.shortName}</span>
                  <ArrowRight className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                  <span className="text-white font-bold">{nodes[step.to]?.shortName}</span>
                  <span className="text-slate-400 text-[10px] ml-1.5 truncate">
                    ({step.description})
                  </span>
                </div>
                <span className="text-emerald-400 font-bold text-[11px] shrink-0">
                  +{step.weight}m
                </span>
              </div>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Shortest Time to Auditorium</span>
            <span className="text-white font-bold font-mono-tabular">
              {parTime} mins
            </span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onClose();
              onReset();
            }}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-emerald-900/30 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
        </div>

      </div>
    </div>
  );
};
