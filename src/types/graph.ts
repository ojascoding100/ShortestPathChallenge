export type NodeId =
  | 'food_truck'
  | 'library'
  | 'science_center'
  | 'observatory'
  | 'student_union'
  | 'quad'
  | 'cs_building'
  | 'stadium'
  | 'gym'
  | 'dorms';

export interface GraphNode {
  id: NodeId;
  name: string;
  shortName: string;
  role: 'depot' | 'target' | 'transit';
  emoji: string;
  x: number;
  y: number;
  description: string;
  orderItem?: string;
}

export interface GraphEdge {
  id: string;
  from: NodeId;
  to: NodeId;
  weight: number; // in minutes
}

export interface MoveStep {
  stepIndex: number;
  from: NodeId;
  to: NodeId;
  weight: number;
  cumulativeTime: number;
  deliveredTarget?: NodeId;
}

export const INITIAL_NODES: Record<NodeId, GraphNode> = {
  food_truck: {
    id: 'food_truck',
    name: 'Food Truck',
    shortName: 'Food Truck',
    role: 'depot',
    emoji: '🚚',
    x: 100,
    y: 270,
    description: 'Starting Kitchen Depot & Finish Return Hub',
  },
  library: {
    id: 'library',
    name: 'Campus Library',
    shortName: 'Library',
    role: 'target',
    emoji: '📚',
    x: 280,
    y: 120,
    description: 'Quiet Study Hall - 3rd Floor',
    orderItem: 'Hot Espresso & Butter Croissant',
  },
  science_center: {
    id: 'science_center',
    name: 'Science Labs',
    shortName: 'Science Labs',
    role: 'target',
    emoji: '🔬',
    x: 530,
    y: 100,
    description: 'Chemistry & Bio Lab Complex',
    orderItem: 'Energy Bento & Matcha Latte',
  },
  observatory: {
    id: 'observatory',
    name: 'Observatory',
    shortName: 'Observatory',
    role: 'target',
    emoji: '🔭',
    x: 780,
    y: 110,
    description: 'Astronomy Hill Dome',
    orderItem: 'Stargazer Hot Cocoa & Bagel',
  },
  student_union: {
    id: 'student_union',
    name: 'Student Union',
    shortName: 'Union',
    role: 'target',
    emoji: '☕',
    x: 330,
    y: 270,
    description: 'Central Hub & Student Lounge',
    orderItem: 'Crispy Wrap & Fresh Lemonade',
  },
  quad: {
    id: 'quad',
    name: 'Central Quad',
    shortName: 'The Quad',
    role: 'target',
    emoji: '🌳',
    x: 560,
    y: 260,
    description: 'Main Campus Lawn & Trees',
    orderItem: 'Acai Berry Bowl & Pretzel',
  },
  cs_building: {
    id: 'cs_building',
    name: 'CS Building',
    shortName: 'CS Building',
    role: 'target',
    emoji: '💻',
    x: 800,
    y: 260,
    description: 'Turing Code Lab 204',
    orderItem: 'Boba Milk Tea & Pepperoni Pizza',
  },
  stadium: {
    id: 'stadium',
    name: 'Varsity Stadium',
    shortName: 'Stadium',
    role: 'target',
    emoji: '🏟️',
    x: 160,
    y: 440,
    description: 'Athletics & Track Concourse',
    orderItem: 'Loaded Stadium Nachos & Soda',
  },
  gym: {
    id: 'gym',
    name: 'Recreation Gym',
    shortName: 'Gym',
    role: 'target',
    emoji: '🏋️',
    x: 390,
    y: 440,
    description: 'Fitness Center & Courts',
    orderItem: 'Protein Shake & Energy Bar',
  },
  dorms: {
    id: 'dorms',
    name: 'Campus Dorms',
    shortName: 'Dorms',
    role: 'target',
    emoji: '🏢',
    x: 670,
    y: 440,
    description: 'North Residential Tower 4B',
    orderItem: 'Midnight Ramen Bowl & Dumplings',
  },
};

export const GRAPH_EDGES: GraphEdge[] = [
  // From Food Truck Depot
  { id: 'ft-lib', from: 'food_truck', to: 'library', weight: 6 },
  { id: 'ft-uni', from: 'food_truck', to: 'student_union', weight: 4 },
  { id: 'ft-sta', from: 'food_truck', to: 'stadium', weight: 2 }, // Classic greedy bait: fastest first step (2m), but connects to high-traffic corridor

  // North Ring connections
  { id: 'lib-sci', from: 'library', to: 'science_center', weight: 5 },
  { id: 'lib-uni', from: 'library', to: 'student_union', weight: 3 },
  { id: 'sci-obs', from: 'science_center', to: 'observatory', weight: 7 }, // Steep hill climb to observatory
  { id: 'sci-qua', from: 'science_center', to: 'quad', weight: 4 },
  { id: 'obs-csb', from: 'observatory', to: 'cs_building', weight: 3 }, // Downhill shortcut from observatory to CS

  // Central Spine connections
  { id: 'uni-qua', from: 'student_union', to: 'quad', weight: 5 },
  { id: 'uni-gym', from: 'student_union', to: 'gym', weight: 3 },
  { id: 'qua-csb', from: 'quad', to: 'cs_building', weight: 6 }, // Congested plaza walk
  { id: 'qua-dor', from: 'quad', to: 'dorms', weight: 4 },

  // South Ring connections
  { id: 'sta-gym', from: 'stadium', to: 'gym', weight: 8 }, // Heavy bottleneck from stadium to gym
  { id: 'gym-dor', from: 'gym', to: 'dorms', weight: 6 },
  { id: 'dor-csb', from: 'dorms', to: 'cs_building', weight: 3 },
];

export const AVAILABLE_TARGETS: NodeId[] = [
  'cs_building',
  'science_center',
  'observatory',
  'dorms',
  'student_union',
  'library',
  'gym',
  'stadium',
  'quad',
];

export const DEFAULT_TARGET_NODE: NodeId = 'cs_building';
