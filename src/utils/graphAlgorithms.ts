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

export interface OneWayResult {
  path: NodeId[];
  distance: number;
  totalTime: number;
  allEdgeIds: string[];
  steps: {
    from: NodeId;
    to: NodeId;
    weight: number;
    description: string;
    isTargetVisit?: boolean;
  }[];
}

/**
 * Computes optimal one-way journey: Start Point (In Gate) -> Destination (Auditorium)
 */
export function findOneWayShortestPath(
  start: NodeId,
  target: NodeId
): OneWayResult {
  const result = findShortestPath(start, target);
  const steps: OneWayResult['steps'] = [];

  for (let i = 0; i < result.path.length - 1; i++) {
    const from = result.path[i];
    const to = result.path[i + 1];
    const edge = getEdge(from, to);
    const isTarget = to === target;
    steps.push({
      from,
      to,
      weight: edge?.weight ?? 0,
      isTargetVisit: isTarget,
      description: isTarget
        ? `Arrive at ${INITIAL_NODES[to].name} (Auditorium Final Destination)`
        : `Travel toward ${INITIAL_NODES[to].shortName}`,
    });
  }

  return {
    path: result.path,
    distance: result.distance,
    totalTime: result.distance,
    allEdgeIds: result.edgeIds,
    steps,
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
        ? `Arrive at ${INITIAL_NODES[to].name} (Auditorium)`
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
        ? `Return to ${INITIAL_NODES[to].name} (Start Gate)`
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
    title: 'Optimal AI&DS Building Route',
    badge: 'Shortest One-Way Path: 12 mins',
    totalTime: 12,
    isOptimal: true,
    description: 'Travels from In Gate via AI/ML Building (3m), Kiosk (2m), Boat Club (3m), Fruit Canteen (2m), and AI&DS Building (2m) for 12 mins. Avoids the congested 20-minute straight central corridor!',
    path: ['food_truck', 'stadium', 'gym', 'quad', 'dorms', 'cs_building'],
  },
  {
    title: 'Straight Central Highway Trap',
    badge: 'Extended Path: 20 mins',
    totalTime: 20,
    isGreedyTrap: true,
    description: 'Plowing straight across the central walkway (In Gate -> Main Building -> Boat Club -> AI&DS Bldg) encounters the crowded plaza (8m) and tech mall construction (7m), inflating one-way trip to 20 mins (+8 mins longer)!',
    path: ['food_truck', 'student_union', 'quad', 'cs_building'],
  },
  {
    title: 'Main Canteen Smart Loop',
    badge: 'Shortest One-Way Path: 10 mins',
    totalTime: 10,
    isOptimal: true,
    description: 'From In Gate via AI/ML Bldg (3m), Kiosk (2m), and Boat Club (3m) to Main Canteen (2m) takes 10 mins, beating the slow 11-minute direct north avenue via Parking (7m slow walkway).',
    path: ['food_truck', 'stadium', 'gym', 'quad', 'science_center'],
  },
];
