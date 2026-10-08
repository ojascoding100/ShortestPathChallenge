import React from 'react';
import { RotateCcw, Undo2, Lightbulb, Clock, Target, ArrowUpRight } from 'lucide-react';
import { sounds } from '../utils/audio';

interface HeaderProps {
  totalTime: number;
  parTime: number;
  movesCount: number;
  onReset: () => void;
  onUndo: () => void;
  onToggleHint: () => void;
  isHintActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  totalTime,
  parTime,
  movesCount,
  onReset,
  onUndo,
  onToggleHint,
  isHintActive,
}) => {
  const isOverPar = totalTime > parTime;
  const timeDifference = totalTime - parTime;

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-3 sm:px-6 py-2 sticky top-0 z-30 shadow-md">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Title & Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-base shadow-sm text-white shrink-0">
            🚚
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
              Food Delivery Routing
            </h1>
            <p className="text-[10px] text-slate-400 hidden xs:block">
              Campus Graph Theory &amp; TSP Challenge
            </p>
          </div>
        </div>

        {/* TWO TIMERS HUD */}
        <div className="flex items-center gap-2 sm:gap-3 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 sm:px-3 py-1 shadow-inner">
          
          {/* TIMER 1: Time Consumed by Current Path */}
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg transition-colors ${
                isOverPar
                  ? 'bg-amber-500/15 text-amber-400'
                  : totalTime > 0
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Clock className="w-4 h-4" />
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
                  className={`text-base sm:text-lg font-extrabold font-mono-tabular leading-tight transition-colors ${
                    isOverPar ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {totalTime}
                </span>
                <span className="text-[10px] font-semibold text-slate-500">mins</span>
              </div>
            </div>
          </div>

          <div className="h-7 w-px bg-slate-800 mx-0.5 sm:mx-1" />

          {/* TIMER 2: Target Time of Shortest Path */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1 leading-none mb-0.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                  Shortest Target
                </span>
                <span className="text-[9px] font-semibold text-cyan-300 bg-cyan-500/20 px-1 rounded hidden sm:inline">
                  Optimal Goal
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-extrabold font-mono-tabular text-cyan-400 leading-tight">
                  {parTime}
                </span>
                <span className="text-[10px] font-semibold text-slate-500">mins</span>
              </div>
            </div>
          </div>

        </div>

        {/* Action Controls - Properly Sized */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleHint}
            className={`h-8 px-2.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
              isHintActive
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-800 hover:border-amber-500/40'
            }`}
            title="Toggle hint"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Hint</span>
          </button>

          <button
            onClick={onUndo}
            disabled={movesCount === 0}
            className={`h-8 px-2.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1 active:scale-95 ${
              movesCount > 0
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-slate-700 cursor-pointer'
                : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed opacity-50'
            }`}
            title="Undo move"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          <button
            onClick={() => {
              sounds.playMoveSound();
              onReset();
            }}
            className="h-8 px-2.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
            title="Reset route"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset</span>
          </button>
        </div>

      </div>
    </header>
  );
};
