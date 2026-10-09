import { GraphNode, NodeId } from '../types/graph';
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
  moveCount: number,
  nodesDict?: Record<NodeId, GraphNode>
): HintData {
  // Destination reached
  if (currentNodeId === targetDestination) {
    return {
      clue: `You have arrived at the Auditorium! Shortest path mission complete!`,
      recommendedNode: null,
      warningNode: null,
      reason: 'Destination reached.',
      stepGuide: 'One-way journey complete!',
    };
  }

  const pathToTarget = findShortestPath(currentNodeId, targetDestination);
  const nextNode = pathToTarget.path[1];
  const nextEdge = nextNode ? getEdge(currentNodeId, nextNode) : undefined;
  const nextNodeInfo = nextNode && nodesDict ? nodesDict[nextNode] : undefined;

  // Identify if any adjacent move is a suboptimal trap
  const neighbors = getAdjacentNodes(currentNodeId);
  let warningNode: NodeId | null = null;
  let warningReason: string | undefined;

  if (neighbors.length > 1) {
    const suboptimal = neighbors.find((n) => n.nodeId !== nextNode);
    if (suboptimal) {
      const altShortest = findShortestPath(suboptimal.nodeId, targetDestination);
      const totalViaAlt = suboptimal.weight + altShortest.distance;
      if (totalViaAlt > pathToTarget.distance) {
        warningNode = suboptimal.nodeId;
        const subName = nodesDict ? nodesDict[suboptimal.nodeId]?.shortName : 'adjacent node';
        warningReason = `Route via ${subName} adds +${totalViaAlt - pathToTarget.distance} extra mins!`;
      }
    }
  }

  if (nextNode && nextNodeInfo && nextEdge) {
    return {
      clue: `Optimal route to Auditorium: head to ${nextNodeInfo.name} (+${nextEdge.weight}m). Remaining shortest path: ${pathToTarget.distance} mins.`,
      recommendedNode: nextNode,
      warningNode,
      warningReason,
      reason: `Shortest Dijkstra route to Auditorium.`,
      stepGuide: `Advance to ${nextNodeInfo.shortName} (+${nextEdge.weight}m).`,
    };
  }

  return {
    clue: `Navigate along connected pathways toward the Auditorium!`,
    recommendedNode: null,
    warningNode: null,
    reason: 'Explore connected paths.',
    stepGuide: 'Choose a connected road.',
  };
}
