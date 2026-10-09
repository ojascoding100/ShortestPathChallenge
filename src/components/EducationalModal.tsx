import React, { useState } from 'react';
import { X, Network, Target, Sparkles, Route, Award, ChevronRight } from 'lucide-react';
import { PRESET_ROUTES, RouteComparison } from '../utils/graphAlgorithms';
import { INITIAL_NODES, NodeId } from '../types/graph';

interface EducationalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EducationalModal: React.FC<EducationalModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'concepts' | 'pitch' | 'algorithms'>('concepts');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-white">
                Graph Theory & Logistics Deep Dive
              </h2>
              <p className="text-xs text-slate-400">
                Traveling Salesperson Problem, Dijkstra's Algorithm, and the Greedy Trap
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('concepts')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'concepts'
                ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>The Core Concept</span>
          </button>

          <button
            onClick={() => setActiveTab('pitch')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'pitch'
                ? 'border-amber-400 text-amber-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Live Booth Pitch Script</span>
          </button>

          <button
            onClick={() => setActiveTab('algorithms')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'algorithms'
                ? 'border-emerald-400 text-emerald-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Route className="w-4 h-4" />
            <span>Route Comparison Analysis</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {activeTab === 'concepts' && (
            <div className="space-y-5">
              
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                  <span className="text-amber-400">01.</span> The Core Concept & The Straight-Line Trap
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  In modern food delivery apps (like Swiggy, Zomato, DoorDash, or UberEats), human intuition is completely replaced by graph algorithms. When players look at this campus map, their eyes naturally gravitate toward the <strong>obvious straight lines</strong> heading directly toward their destination (e.g. the central corridor to Student Union, Quad, and CS Building).
                </p>
                <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-lg text-xs text-rose-200">
                  <strong>The Trap:</strong> Straight lines on campus are heavily congested pedestrian thoroughfares, construction zones (8m!), and bottlenecks! Plowing straight ahead results in a catastrophic 40+ minute round-trip, whereas clever bypasses and perimeter loops through the athletics and garden lanes cut the time down to just 24 minutes.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Dijkstra's Algorithm
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Computes the single-source shortest path between point A and point B in a weighted graph. While Dijkstra finds the best route to individual buildings, food delivery dispatching requires visiting <em>multiple drop-offs</em> in sequence, making it an instance of the Traveling Salesperson Problem!
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Traveling Salesperson (TSP)
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Given a list of locations and distances, TSP asks for the shortest possible route that visits each location exactly once and returns to the origin. TSP is NP-hard: greedy nearest-neighbor heuristics often produce horribly sub-optimal solutions.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                  <span className="text-emerald-400">02.</span> Why Computers Beat Human Intuition
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Real logistics platforms do not evaluate step 1 in isolation. They compute global permutation costs, branch and bound, and dynamic programming state transitions. By investing a slightly longer first leg (5 minutes to the Stadium), you unlock the high-speed perimeter circuit where buildings are just 2–3 minutes apart!
                </p>
              </div>

            </div>
          )}

          {activeTab === 'pitch' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <h3 className="text-sm font-bold text-amber-300 mb-1">
                  DSA Club Booth Playbook: How to Run This Live
                </h3>
                <p className="text-xs text-slate-300">
                  Use this exact script and physical setup at your university club fair, hackathon booth, or orientation table to recruit new members into Data Structures & Algorithms!
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <span className="font-bold text-cyan-400 uppercase block mb-1">
                    Step 1: The Hook
                  </span>
                  <p className="text-slate-300 italic">
                    "Can you beat UberEats' routing algorithm? Find the fastest route on this map to make 3 deliveries and return to the food truck, and win a prize!"
                  </p>
                </div>

                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <span className="font-bold text-amber-400 uppercase block mb-1">
                    Step 2: The Attempt
                  </span>
                  <p className="text-slate-300">
                    Hand them a stylus, whiteboard marker on a laminated campus map, or this interactive web app. Watch them immediately dash from Food Truck to the 2-minute Library node. They will almost always end up with a route of <strong>28 to 32 minutes</strong>.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <span className="font-bold text-emerald-400 uppercase block mb-1">
                    Step 3: The Reveal
                  </span>
                  <p className="text-slate-300">
                    "You thought 28 minutes was fast? The algorithmic route completes in only <strong>17 minutes</strong>! Let me show you why your brain got tricked."
                  </p>
                </div>

                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <span className="font-bold text-purple-400 uppercase block mb-1">
                    Step 4: The Pitch
                  </span>
                  <p className="text-slate-300 italic font-medium">
                    "Your brain just used a 'Greedy Algorithm'—always taking the immediate shortest path. But as you saw, that ruined your total delivery time. To find true fastest routes, computers use Graph Theory and algorithms like Dijkstra's and A*. If you want to learn how to code apps that see the whole picture and solve these puzzles instantly, join our DSA club!"
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'algorithms' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Compare the paths mathematically to see how local optimization differs from global graph optimization:
              </p>

              <div className="space-y-3">
                {PRESET_ROUTES.map((route: RouteComparison, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${
                      route.isOptimal
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : route.isGreedyTrap
                        ? 'bg-rose-950/20 border-rose-500/40'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white">
                        {route.title}
                      </span>
                      <span
                        className={`text-xs font-mono-tabular font-bold px-2 py-0.5 rounded ${
                          route.isOptimal
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : route.isGreedyTrap
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {route.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mb-3">{route.description}</p>

                    <div className="flex flex-wrap items-center gap-1.5 font-mono-tabular text-xs">
                      {route.path.map((nodeId: NodeId, pIdx: number) => (
                        <React.Fragment key={pIdx}>
                          {pIdx > 0 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                          <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200">
                            {INITIAL_NODES[nodeId]?.emoji} {INITIAL_NODES[nodeId]?.shortName}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>The Food Delivery Routing Challenge · CS Curriculum Lab</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Back to Game
          </button>
        </div>

      </div>
    </div>
  );
};
