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
    badge: 'Shortest Round Trip: 24 mins',
    totalTime: 24,
    isOptimal: true,
    description: 'Travels from Food Truck via Stadium (3m), Gym (2m), Quad (3m), Dorms (2m), and CS Building (2m) for 12 mins outbound and 12 mins return. Avoids the congested 20-minute straight central corridor!',
    path: ['food_truck', 'stadium', 'gym', 'quad', 'dorms', 'cs_building', 'dorms', 'quad', 'gym', 'stadium', 'food_truck'],
  },
  {
    title: 'Straight Central Highway Trap',
    badge: 'Extended Path: 40 mins',
    totalTime: 40,
    isGreedyTrap: true,
    description: 'Plowing straight across the central walkway (Food Truck -> Union -> Quad -> CS) encounters the crowded plaza (8m) and tech mall construction (7m), inflating round-trip to 40 mins (+16 mins longer)!',
    path: ['food_truck', 'student_union', 'quad', 'cs_building', 'quad', 'student_union', 'food_truck'],
  },
  {
    title: 'Science Labs Smart Loop',
    badge: 'Shortest Round Trip: 20 mins',
    totalTime: 20,
    isOptimal: true,
    description: 'Outbound via Stadium (3m), Gym (2m), and Quad (3m) to Science Labs (2m) takes 10 mins (20m round-trip), beating the slow 11-minute direct north avenue via Library (7m cobblestone road).',
    path: ['food_truck', 'stadium', 'gym', 'quad', 'science_center', 'quad', 'gym', 'stadium', 'food_truck'],
  },
];
