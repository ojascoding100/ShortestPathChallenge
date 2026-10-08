import { GRAPH_EDGES, INITIAL_NODES, NodeId } from '../types/graph';

export function getEdge(from: NodeId, to: NodeId) {
  return GRAPH_EDGES.find(
    (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from)
  );
}

export function getAdjacentNodes(nodeId: NodeId) {
  const neighbors: { nodeId: NodeId; weight: number; edgeId: string }[] = [];
  GRAPH_EDGES.forEach((edge) => {
    if (edge.from === nodeId) {
      neighbors.push({ nodeId: edge.to, weight: edge.weight, edgeId: edge.id });
    } else if (edge.to === nodeId) {
      neighbors.push({ nodeId: edge.from, weight: edge.weight, edgeId: edge.id });
    }
  });
  return neighbors;
}

export interface ShortestPathResult {
  path: NodeId[];
  distance: number;
  edgeIds: string[];
}

/**
 * Dijkstra's shortest path algorithm between any two nodes.
 */
export function findShortestPath(
  start: NodeId,
  target: NodeId,
  edges = GRAPH_EDGES
): ShortestPathResult {
  if (start === target) {
    return { path: [start], distance: 0, edgeIds: [] };
  }

  const distances: Partial<Record<NodeId, number>> = {};
  const previous: Partial<Record<NodeId, NodeId>> = {};
  const unvisited = new Set<NodeId>(Object.keys(INITIAL_NODES) as NodeId[]);

  (Object.keys(INITIAL_NODES) as NodeId[]).forEach((node) => {
    distances[node] = Infinity;
  });
  distances[start] = 0;

  while (unvisited.size > 0) {
    // Find unvisited node with lowest distance
    let current: NodeId | null = null;
    let minDistance = Infinity;

    unvisited.forEach((node) => {
      const dist = distances[node] ?? Infinity;
      if (dist < minDistance) {
        minDistance = dist;
        current = node;
      }
    });

    if (!current || minDistance === Infinity || current === target) {
      break;
    }

    unvisited.delete(current);

    // Examine neighbors
    edges.forEach((edge) => {
      let neighbor: NodeId | null = null;
      if (edge.from === current) neighbor = edge.to;
      else if (edge.to === current) neighbor = edge.from;

      if (neighbor && unvisited.has(neighbor)) {
        const alt = (distances[current!] ?? 0) + edge.weight;
        if (alt < (distances[neighbor] ?? Infinity)) {
          distances[neighbor] = alt;
          previous[neighbor] = current!;
        }
      }
    });
  }

  // Reconstruct path
  const path: NodeId[] = [];
  let curr: NodeId | undefined = target;
  while (curr) {
    path.unshift(curr);
    if (curr === start) break;
    curr = previous[curr];
  }

  // Build edge IDs
  const edgeIds: string[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const edge = getEdge(path[i], path[i + 1]);
    if (edge) edgeIds.push(edge.id);
  }

  return {
    path,
    distance: distances[target] ?? 0,
    edgeIds,
  };
}

export interface RoundTripResult {
  outbound: ShortestPathResult;
  inbound: ShortestPathResult;
  fullPath: NodeId[];
  totalTime: number;
  allEdgeIds: string[];
  steps: {
    from: NodeId;
    to: NodeId;
    weight: number;
    phase: 'outbound' | 'inbound';
    isTargetVisit?: boolean;
    isFinishDepot?: boolean;
    description: string;
  }[];
}

/**
 * Computes optimal round trip: Depot -> Target Location -> Depot
 */
export function findRoundTripShortestPath(
  depot: NodeId,
  target: NodeId
): RoundTripResult {
  const outbound = findShortestPath(depot, target);
  const inbound = findShortestPath(target, depot);

  const fullPath: NodeId[] = [...outbound.path, ...inbound.path.slice(1)];
  const totalTime = outbound.distance + inbound.distance;
  const allEdgeIds = Array.from(new Set([...outbound.edgeIds, ...inbound.edgeIds]));

  const steps: RoundTripResult['steps'] = [];

  // Outbound steps
  for (let i = 0; i < outbound.path.length - 1; i++) {
    const from = outbound.path[i];
    const to = outbound.path[i + 1];
    const edge = getEdge(from, to);
    const isTarget = to === target;
    steps.push({
      from,
      to,
      weight: edge?.weight ?? 0,
      phase: 'outbound',
      isTargetVisit: isTarget,
      description: isTarget
        ? `Deliver food to ${INITIAL_NODES[to].name}`
        : `Travel toward ${INITIAL_NODES[to].shortName}`,
    });
  }

  // Inbound steps
  for (let i = 0; i < inbound.path.length - 1; i++) {
    const from = inbound.path[i];
    const to = inbound.path[i + 1];
    const edge = getEdge(from, to);
    const isFinish = to === depot;
    steps.push({
      from,
      to,
      weight: edge?.weight ?? 0,
      phase: 'inbound',
      isFinishDepot: isFinish,
      description: isFinish
        ? `Return to ${INITIAL_NODES[to].name} (Finish Depot)`
        : `Return route via ${INITIAL_NODES[to].shortName}`,
    });
  }

  return {
    outbound,
    inbound,
    fullPath,
    totalTime,
    allEdgeIds,
    steps,
  };
}

export interface RouteComparison {
  title: string;
  badge: string;
  totalTime: number;
  description: string;
  path: NodeId[];
  isGreedyTrap?: boolean;
  isOptimal?: boolean;
}

export const PRESET_ROUTES: RouteComparison[] = [
  {
    title: 'Optimal CS Building Delivery',
    badge: 'Shortest Round Trip: 28 mins',
    totalTime: 28,
    isOptimal: true,
    description: 'Travels from Food Truck via Student Union, Gym, and Dorms to CS Building (14 mins), then returns (14 mins). Avoids congested Quad and steep Observatory hill.',
    path: ['food_truck', 'student_union', 'gym', 'dorms', 'cs_building', 'dorms', 'gym', 'student_union', 'food_truck'],
  },
  {
    title: 'Greedy Trap (Via Stadium Bait)',
    badge: 'Extended Path: 38 mins',
    totalTime: 38,
    isGreedyTrap: true,
    description: 'Taking the fast 2-minute road to Stadium lures you into the 8-minute bottleneck road to the Gym (+10 extra mins round-trip)!',
    path: ['food_truck', 'stadium', 'gym', 'dorms', 'cs_building', 'dorms', 'gym', 'stadium', 'food_truck'],
  },
  {
    title: 'Science Labs Shortest Mission',
    badge: 'Shortest Round Trip: 24 mins',
    totalTime: 24,
    isOptimal: true,
    description: 'Outbound via Student Union and Library (7m) or Quad (8m) to Science Labs, avoiding the 6m direct Food Truck-to-Library road.',
    path: ['food_truck', 'student_union', 'library', 'science_center', 'library', 'student_union', 'food_truck'],
  },
];
