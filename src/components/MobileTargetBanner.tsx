import React from 'react';
import { Target, CheckCircle2, ArrowRight, Route, MapPin } from 'lucide-react';
import { GraphNode } from '../types/graph';

interface MobileTargetBannerProps {
  targetNode: GraphNode;
  currentNode: GraphNode;
  hasDelivered: boolean;
  parTime: number;
  totalTime: number;
  onViewShortestPath?: () => void;
}

export const MobileTargetBanner: React.FC<MobileTargetBannerProps> = ({
  targetNode,
  currentNode,
  hasDelivered,
  parTime,
  onViewShortestPath,
}) => {
  return (
    <section
      aria-label="Mobile target destination banner"
      className={`w-full rounded-xl border p-2.5 sm:p-3 shadow-lg transition-all ${
        hasDelivered
          ? 'bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border-emerald-500/40 shadow-emerald-950/20'
          : 'bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border-sky-500/40 shadow-sky-950/20'
      }`}
    >
      {/* Top Header Tag & Status */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                hasDelivered ? 'bg-emerald-400' : 'bg-sky-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                hasDelivered ? 'bg-emerald-500' : 'bg-sky-500'
              }`}
            />
          </span>

          {hasDelivered ? (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Auditorium Reached!</span>
            </span>
          ) : (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Target className="w-3 h-3 text-amber-400" />
              <span>Final Destination: Auditorium</span>
            </span>
          )}
        </div>

        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono-tabular border ${
            hasDelivered
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          }`}
        >
          {hasDelivered ? 'Arrived!' : 'One-Way Journey'}
        </span>
      </div>

      {/* Target Details & Action Button */}
      <div className="flex items-center justify-between gap-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 sm:p-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-xl shrink-0 border ${
              hasDelivered
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            }`}
          >
            {hasDelivered ? '🏆' : '🎭'}
          </div>

          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate leading-tight">
              <span>Auditorium ({targetNode.name})</span>
            </h2>
          </div>
        </div>

        {onViewShortestPath && (
          <button
            onClick={onViewShortestPath}
            className="px-2 py-1 sm:px-2.5 sm:py-1.5 text-[10px] font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 shrink-0 active:scale-95 transition-all cursor-pointer shadow-sm"
            title="View optimal path on map"
            aria-label="View optimal route"
          >
            <Route className="w-3 h-3 text-cyan-400" />
            <span className="font-mono-tabular">Par: {parTime}m</span>
          </button>
        )}
      </div>

      {/* Journey Tracker */}
      <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] sm:text-[11px] gap-2">
        <div className="flex items-center gap-1 truncate">
          <span className="text-slate-500 text-[9px] font-bold uppercase shrink-0">Path:</span>
          
          <span className="px-1.5 py-0.5 rounded font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30">
            🚪 In Gate
          </span>

          <ArrowRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />

          <span className="px-1.5 py-0.5 rounded font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 font-bold">
            🎭 Auditorium
          </span>
        </div>

        <div className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-amber-400" />
          <span className="text-slate-500">At:</span>
          <span className="font-bold text-amber-300">{currentNode.shortName}</span>
        </div>
      </div>
    </section>
  );
};
