// Standalone Dot-Matrix World Map Canvas Engine
// Mathematical high-density coordinate grid with continental projection & telemetry hubs

export interface HubNode {
  code: string;
  name: string;
  lat: number;
  lon: number;
  isPrimary?: boolean;
}

export const GLOBAL_HUBS: HubNode[] = [
  { code: 'DHAKA', name: 'Dhaka Command Node', lat: 23.8103, lon: 90.4125, isPrimary: true },
  { code: 'SFO', name: 'San Francisco Edge', lat: 37.7749, lon: -122.4194 },
  { code: 'LON', name: 'London Edge', lat: 51.5074, lon: -0.1278 },
  { code: 'FRA', name: 'Frankfurt Edge', lat: 50.1109, lon: 8.6821 },
  { code: 'SIN', name: 'Singapore Edge', lat: 1.3521, lon: 103.8198 },
  { code: 'TYO', name: 'Tokyo Edge', lat: 35.6762, lon: 139.6503 },
];

export function geoToNorm(lon: number, lat: number): [number, number] {
  // Equirectangular projection with slight vertical offset for optimal hero framing
  const x = (lon + 180) / 360;
  const y = (85 - lat) / 160; // Clipped to populated latitudes [-65 to 85]
  return [Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y))];
}

// 18 Continental Landmass Polygons (Lon, Lat)
export const CONTINENTS: [number, number][][] = [
  // North America
  [[-168, 65], [-165, 71], [-140, 70], [-120, 72], [-95, 74], [-80, 70], [-60, 52], [-65, 43], [-75, 35], [-80, 25], [-82, 23], [-90, 30], [-97, 26], [-97, 20], [-88, 16], [-83, 9], [-77, 8], [-80, 9], [-85, 13], [-95, 17], [-105, 23], [-110, 30], [-120, 34], [-124, 40], [-125, 50], [-135, 58], [-150, 60], [-165, 60]],
  // Greenland
  [[-55, 83], [-20, 83], [-20, 70], [-40, 60], [-50, 65], [-60, 78]],
  // South America
  [[-77, 8], [-72, 12], [-60, 8], [-50, 0], [-35, -5], [-35, -10], [-40, -22], [-50, -30], [-58, -38], [-65, -45], [-68, -55], [-75, -50], [-72, -40], [-71, -30], [-76, -15], [-81, -5], [-80, 2]],
  // Europe
  [[-10, 36], [0, 43], [5, 43], [15, 40], [25, 40], [30, 45], [30, 60], [20, 65], [10, 60], [5, 50], [-5, 48], [-10, 44]],
  // Scandinavia
  [[5, 58], [12, 56], [20, 60], [28, 70], [20, 71], [10, 65]],
  // British Isles
  [[-10, 51], [-5, 58], [2, 53], [-5, 50]],
  // Africa
  [[-17, 30], [-5, 36], [10, 37], [25, 32], [32, 31], [35, 28], [43, 12], [51, 10], [42, -5], [35, -20], [30, -32], [20, -35], [15, -25], [10, -10], [0, 5], [-15, 12], [-17, 20]],
  // Madagascar
  [[44, -12], [50, -15], [47, -25], [43, -25]],
  // Asia Main Body
  [[32, 31], [35, 36], [40, 40], [50, 40], [60, 40], [70, 40], [90, 50], [120, 55], [140, 55], [170, 65], [180, 65], [170, 72], [120, 75], [80, 75], [60, 70], [50, 60], [40, 55], [30, 45], [30, 35]],
  // Russia Far East
  [[90, 50], [110, 40], [130, 45], [145, 50], [160, 55], [175, 60], [180, 65], [140, 55], [120, 55]],
  // Indian Subcontinent
  [[68, 25], [77, 30], [88, 27], [85, 20], [80, 10], [77, 8], [73, 15], [68, 22]],
  // Bangladesh & SE Asia
  [[88, 22], [92, 25], [92, 21], [100, 20], [105, 10], [103, 1], [98, 5], [96, 17]],
  // China
  [[75, 35], [90, 45], [120, 40], [122, 30], [115, 22], [105, 20], [88, 25], [78, 30]],
  // Japan
  [[130, 32], [135, 35], [141, 44], [143, 40], [135, 33]],
  // Indonesia & Maritime SE Asia
  [[95, 5], [105, -5], [115, -8], [125, -8], [140, -3], [130, 0], [110, 0]],
  // Australia
  [[113, -22], [120, -15], [135, -12], [142, -10], [153, -28], [150, -37], [138, -35], [130, -32], [115, -35]],
  // New Zealand
  [[166, -46], [175, -37], [178, -38], [170, -46]],
];
