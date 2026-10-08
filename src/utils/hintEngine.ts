import { INITIAL_NODES, NodeId } from '../types/graph';
import { findShortestPath, getAdjacentNodes, getEdge } from './graphAlgorithms';

export interface HintData {
  clue: string;
  recommendedNode: NodeId | null;
  warningNode: NodeId | null;
  warningReason?: string;
  reason: string;
  stepGuide: string;
}

export function getHintForState(
  currentNodeId: NodeId,
  targetDestination: NodeId,
  hasDelivered: boolean,
  totalTime: number,
  moveCount: number
): HintData {
  const targetNode = INITIAL_NODES[targetDestination];

  // Case 1: Already delivered, returning to Food Truck
  if (hasDelivered) {
    if (currentNodeId === 'food_truck') {
      return {
        clue: 'Delivery complete and safely back at Food Truck! Shortest path mission accomplished!',
        recommendedNode: null,
        warningNode: null,
        reason: 'Mission accomplished.',
        stepGuide: 'Complete! You finished the delivery round-trip.',
      };
    }

    const pathHome = findShortestPath(currentNodeId, 'food_truck');
    const nextNode = pathHome.path[1] || 'food_truck';
    const nextEdge = getEdge(currentNodeId, nextNode);
    const nextNodeInfo = INITIAL_NODES[nextNode];

    // Find any inefficient neighbor
    const neighbors = getAdjacentNodes(currentNodeId);
    let warningNode: NodeId | null = null;
    let warningReason: string | undefined;

    const worstNeighbor = neighbors.reduce((prev, curr) =>
      curr.weight > prev.weight ? curr : prev,
      neighbors[0]
    );

    if (worstNeighbor && worstNeighbor.nodeId !== nextNode && worstNeighbor.weight >= 5) {
      warningNode = worstNeighbor.nodeId;
      warningReason = `Road to ${INITIAL_NODES[worstNeighbor.nodeId].shortName} takes ${worstNeighbor.weight} mins.`;
    }

    return {
      clue: `Order delivered to ${targetNode.name}! Now take the shortest path back to Food Truck: head to ${nextNodeInfo.name} (+${nextEdge?.weight || 0}m).`,
      recommendedNode: nextNode,
      warningNode,
      warningReason,
      reason: `Optimal return route to Food Truck (${pathHome.distance} mins remaining).`,
      stepGuide: `Move to ${nextNodeInfo.shortName} (+${nextEdge?.weight || 0}m) toward Food Truck.`,
    };
  }

  // Case 2: Outbound to target destination
  if (currentNodeId === targetDestination) {
    return {
      clue: `You are at ${targetNode.name}! Order delivered. Now return to Food Truck by the shortest route!`,
      recommendedNode: null,
      warningNode: null,
      reason: 'Destination reached.',
      stepGuide: 'Head back to Food Truck depot.',
    };
  }

  const pathToTarget = findShortestPath(currentNodeId, targetDestination);
  const nextNode = pathToTarget.path[1];
  const nextEdge = nextNode ? getEdge(currentNodeId, nextNode) : undefined;
  const nextNodeInfo = nextNode ? INITIAL_NODES[nextNode] : undefined;

  // Identify if any neighbor is heavily suboptimal
  const neighbors = getAdjacentNodes(currentNodeId);
  let warningNode: NodeId | null = null;
  let warningReason: string | undefined;

  if (neighbors.length > 1) {
    const alternate = neighbors.find((n) => n.nodeId !== nextNode);
    if (alternate && alternate.weight >= 4) {
      const altShortest = findShortestPath(alternate.nodeId, targetDestination);
      const totalViaAlt = alternate.weight + altShortest.distance;
      if (totalViaAlt > pathToTarget.distance) {
        warningNode = alternate.nodeId;
        warningReason = `Route via ${INITIAL_NODES[alternate.nodeId].shortName} adds +${totalViaAlt - pathToTarget.distance} extra minutes.`;
      }
    }
  }

  if (nextNode && nextNodeInfo && nextEdge) {
    return {
      clue: `Optimal route to ${targetNode.name}: take the road to ${nextNodeInfo.name} (+${nextEdge.weight}m). Remaining path is ${pathToTarget.distance} mins.`,
      recommendedNode: nextNode,
      warningNode,
      warningReason,
      reason: `Shortest Dijkstra path to ${targetNode.shortName}.`,
      stepGuide: `Move to ${nextNodeInfo.shortName} (+${nextEdge.weight}m).`,
    };
  }

  return {
    clue: `Find the shortest path to deliver at ${targetNode.name} and return to the Food Truck!`,
    recommendedNode: null,
    warningNode: null,
    reason: 'Explore connected paths.',
    stepGuide: 'Choose a connected road.',
  };
}
