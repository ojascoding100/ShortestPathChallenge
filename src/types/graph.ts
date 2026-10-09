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
    x: 90,
    y: 270,
    description: 'Starting Kitchen Depot & Finish Return Hub',
  },
  library: {
    id: 'library',
    name: 'Campus Library',
    shortName: 'Library',
    role: 'target',
    emoji: '📚',
    x: 250,
    y: 110,
    description: 'Quiet Study Hall - 3rd Floor',
    orderItem: 'Hot Espresso & Butter Croissant',
  },
  science_center: {
    id: 'science_center',
    name: 'Science Labs',
    shortName: 'Science Labs',
    role: 'target',
    emoji: '🔬',
    x: 490,
    y: 90,
    description: 'Chemistry & Bio Lab Complex',
    orderItem: 'Energy Bento & Matcha Latte',
  },
  observatory: {
    id: 'observatory',
    name: 'Observatory',
    shortName: 'Observatory',
    role: 'target',
    emoji: '🔭',
    x: 770,
    y: 90,
    description: 'Astronomy Hill Dome',
    orderItem: 'Stargazer Hot Cocoa & Bagel',
  },
  student_union: {
    id: 'student_union',
    name: 'Student Union',
    shortName: 'Union',
    role: 'target',
    emoji: '☕',
    x: 320,
    y: 310,
    description: 'Central Hub & Student Lounge',
    orderItem: 'Crispy Wrap & Fresh Lemonade',
  },
  quad: {
    id: 'quad',
    name: 'Central Quad',
    shortName: 'The Quad',
    role: 'target',
    emoji: '🌳',
    x: 550,
    y: 240,
    description: 'Main Campus Lawn & Trees',
    orderItem: 'Acai Berry Bowl & Pretzel',
  },
  cs_building: {
    id: 'cs_building',
    name: 'CS Building',
    shortName: 'CS Building',
    role: 'target',
    emoji: '💻',
    x: 830,
    y: 280,
    description: 'Turing Code Lab 204',
    orderItem: 'Boba Milk Tea & Pepperoni Pizza',
  },
  stadium: {
    id: 'stadium',
    name: 'Varsity Stadium',
    shortName: 'Stadium',
    role: 'target',
    emoji: '🏟️',
    x: 150,
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
    x: 370,
    y: 460,
    description: 'Fitness Center & Courts',
    orderItem: 'Protein Shake & Energy Bar',
  },
  dorms: {
    id: 'dorms',
    name: 'Campus Dorms',
    shortName: 'Dorms',
    role: 'target',
    emoji: '🏢',
    x: 690,
    y: 430,
    description: 'North Residential Tower 4B',
    orderItem: 'Midnight Ramen Bowl & Dumplings',
  },
};

export const GRAPH_EDGES: GraphEdge[] = [
  // West Depot Hub
  { id: 'ft-sta', from: 'food_truck', to: 'stadium', weight: 3 },       // Quick paved lane to Athletics Stadium
  { id: 'ft-lib', from: 'food_truck', to: 'library', weight: 4 },       // Hill stairs to Library
  { id: 'ft-uni', from: 'food_truck', to: 'student_union', weight: 8 }, // Cobblestone Main Plaza: Heavy pedestrian crowd & construction (8m trap!)

  // North Sector
  { id: 'lib-uni', from: 'library', to: 'student_union', weight: 2 },   // Fast covered breezeway (FT->Lib->Uni = 4+2=6m < 8m!)
  { id: 'lib-sci', from: 'library', to: 'science_center', weight: 7 },  // Upper North Walkway: Heavy foot traffic & stairs (7m slow!)
  { id: 'sci-qua', from: 'science_center', to: 'quad', weight: 2 },     // Shaded botanical path to Quad (2m fast!)
  { id: 'sci-obs', from: 'science_center', to: 'observatory', weight: 6 }, // Steep mountain stairs to Observatory (6m slow!)

  // Central Sector & Quad
  { id: 'uni-qua', from: 'student_union', to: 'quad', weight: 5 },      // Central Concourse (5m)
  { id: 'uni-gym', from: 'student_union', to: 'gym', weight: 2 },       // Student Arcade Corridor (2m)
  { id: 'qua-csb', from: 'quad', to: 'cs_building', weight: 7 },        // Tech Plaza Construction: Slow bottleneck (7m trap!)
  { id: 'qua-dor', from: 'quad', to: 'dorms', weight: 2 },              // Pine Grove Trail (2m fast!)
  { id: 'qua-obs', from: 'quad', to: 'observatory', weight: 3 },        // Ridge Hill Trail to Observatory (3m fast shortcut!)
  { id: 'gym-qua', from: 'gym', to: 'quad', weight: 3 },                // Campus Lawn Pathway (3m)

  // South Sector
  { id: 'sta-gym', from: 'stadium', to: 'gym', weight: 2 },             // Athletics Bike Expressway (2m fast!)
  { id: 'gym-dor', from: 'gym', to: 'dorms', weight: 6 },               // South Perimeter Road: Heavy service vehicle traffic (6m bottleneck!)
  { id: 'dor-csb', from: 'dorms', to: 'cs_building', weight: 2 },       // Residence Breezeway to CS (2m fast!)
  { id: 'obs-csb', from: 'observatory', to: 'cs_building', weight: 2 }, // Hillside Steps down to CS (2m fast!)
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
