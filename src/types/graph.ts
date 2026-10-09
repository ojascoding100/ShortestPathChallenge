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
    name: 'In Gate',
    shortName: 'In Gate',
    role: 'depot',
    emoji: '🚪',
    x: 90,
    y: 270,
    description: 'Campus Main Entrance & Starting Gate',
    orderItem: 'Visitor Pass & Map',
  },
  library: {
    id: 'library',
    name: 'Parking',
    shortName: 'Parking',
    role: 'target',
    emoji: '🅿️',
    x: 250,
    y: 110,
    description: 'North Campus Vehicle Parking Lot',
    orderItem: 'Parking Ticket Clearance',
  },
  science_center: {
    id: 'science_center',
    name: 'Main Canteen',
    shortName: 'Main Canteen',
    role: 'target',
    emoji: '🍱',
    x: 490,
    y: 90,
    description: 'Multi-Cuisine Campus Food Hall',
    orderItem: 'Lunch Bento & Fresh Juice',
  },
  observatory: {
    id: 'observatory',
    name: 'Bakery',
    shortName: 'Bakery',
    role: 'target',
    emoji: '🥐',
    x: 770,
    y: 90,
    description: 'Fresh Campus Patisserie & Oven',
    orderItem: 'Warm Croissant & Hot Cocoa',
  },
  student_union: {
    id: 'student_union',
    name: 'Main Building',
    shortName: 'Main Bldg',
    role: 'target',
    emoji: '🏛️',
    x: 320,
    y: 310,
    description: 'Administrative & Academic Headquarters',
    orderItem: 'Dean Office Dispatch',
  },
  quad: {
    id: 'quad',
    name: 'Boat Club',
    shortName: 'Boat Club',
    role: 'target',
    emoji: '⛵',
    x: 550,
    y: 240,
    description: 'Waterside Rowing & Boat Club House',
    orderItem: 'Regatta Team Supplies',
  },
  cs_building: {
    id: 'cs_building',
    name: 'AI&DS Building',
    shortName: 'AI&DS Bldg',
    role: 'target',
    emoji: '💻',
    x: 830,
    y: 280,
    description: 'Data Science & Neural Systems Laboratory',
    orderItem: 'Server Hardware Kit',
  },
  stadium: {
    id: 'stadium',
    name: 'AI/ML Building',
    shortName: 'AI/ML Bldg',
    role: 'target',
    emoji: '🤖',
    x: 150,
    y: 440,
    description: 'Artificial Intelligence & Machine Learning Wing',
    orderItem: 'GPU Compute Module',
  },
  gym: {
    id: 'gym',
    name: 'Kiosk',
    shortName: 'Kiosk',
    role: 'target',
    emoji: '🏪',
    x: 370,
    y: 460,
    description: 'Central Concession & Refreshment Kiosk',
    orderItem: 'Energy Drink & Snack Pack',
  },
  dorms: {
    id: 'dorms',
    name: 'Fruit Canteen',
    shortName: 'Fruit Canteen',
    role: 'target',
    emoji: '🍉',
    x: 690,
    y: 430,
    description: 'Fresh Juices & Organic Fruit Station',
    orderItem: 'Seasonal Fruit Salad',
  },
};

export const GRAPH_EDGES: GraphEdge[] = [
  // West In Gate Connections
  { id: 'ft-sta', from: 'food_truck', to: 'stadium', weight: 3 },       // Quick paved lane to AI/ML Building (3m)
  { id: 'ft-lib', from: 'food_truck', to: 'library', weight: 4 },       // Walkway to Parking (4m)
  { id: 'ft-uni', from: 'food_truck', to: 'student_union', weight: 8 }, // Direct Main Plaza to Main Building (8m crowded trap!)

  // North Sector
  { id: 'lib-uni', from: 'library', to: 'student_union', weight: 2 },   // Fast breezeway from Parking to Main Bldg (2m shortcut: 4+2=6m < 8m!)
  { id: 'lib-sci', from: 'library', to: 'science_center', weight: 7 },  // Upper North Walkway to Main Canteen (7m slow!)
  { id: 'sci-qua', from: 'science_center', to: 'quad', weight: 2 },     // Shaded botanical path to Boat Club (2m fast!)
  { id: 'sci-obs', from: 'science_center', to: 'observatory', weight: 6 }, // Steep trail to Bakery (6m slow!)

  // Central Sector & Boat Club
  { id: 'uni-qua', from: 'student_union', to: 'quad', weight: 5 },      // Central Concourse (5m)
  { id: 'uni-gym', from: 'student_union', to: 'gym', weight: 2 },       // Arcade corridor to Kiosk (2m)
  { id: 'qua-csb', from: 'quad', to: 'cs_building', weight: 7 },        // Plaza bottleneck to AI&DS Bldg (7m trap!)
  { id: 'qua-dor', from: 'quad', to: 'dorms', weight: 2 },              // Pine Grove Trail to Fruit Canteen (2m fast!)
  { id: 'qua-obs', from: 'quad', to: 'observatory', weight: 3 },        // Ridge shortcut to Bakery (3m fast!)
  { id: 'gym-qua', from: 'gym', to: 'quad', weight: 3 },                // Campus Lawn Pathway (3m)

  // South Sector
  { id: 'sta-gym', from: 'stadium', to: 'gym', weight: 2 },             // Bike expressway from AI/ML Bldg to Kiosk (2m fast!)
  { id: 'gym-dor', from: 'gym', to: 'dorms', weight: 6 },               // South Perimeter to Fruit Canteen (6m bottleneck!)
  { id: 'dor-csb', from: 'dorms', to: 'cs_building', weight: 2 },       // Breezeway from Fruit Canteen to AI&DS Bldg (2m fast!)
  { id: 'obs-csb', from: 'observatory', to: 'cs_building', weight: 2 }, // Hillside steps from Bakery to AI&DS Bldg (2m fast!)
];

// Distant campus destinations far from In Gate (x >= 690, 4-5 hops, 10-12 mins away)
// Boat Club ('quad') is excluded, and close nodes (Stadium, Parking, Main Bldg, Kiosk) are excluded
export const AVAILABLE_TARGETS: NodeId[] = [
  'cs_building', // AI&DS Building (far east, 12 mins)
  'observatory', // Bakery (far north-east, 11 mins)
  'dorms',       // Fruit Canteen (far south-east, 10 mins)
];

export const DEFAULT_TARGET_NODE: NodeId = 'cs_building';

export function getRandomTarget(): NodeId {
  const index = Math.floor(Math.random() * AVAILABLE_TARGETS.length);
  return AVAILABLE_TARGETS[index];
}

/**
 * Returns a cloned nodes dictionary where the designated target node
 * is dynamically renamed to "Auditorium" (with 🎭 emoji).
 */
export function getNodesWithAuditorium(targetId: NodeId): Record<NodeId, GraphNode> {
  const updated = { ...INITIAL_NODES };
  if (updated[targetId]) {
    updated[targetId] = {
      ...updated[targetId],
      name: 'Auditorium',
      shortName: 'Auditorium',
      emoji: '🎭',
      description: 'Campus Grand Auditorium & Event Hall',
      orderItem: 'Keynote Stage Dispatch',
    };
  }
  return updated;
}
