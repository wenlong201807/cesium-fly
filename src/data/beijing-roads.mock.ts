// src/data/beijing-roads.mock.ts
// 北京道路网 Mock 数据（网格采样）
// 用于路径规划 + 自动驾驶仿真
import { buildGraph, type Graph } from '../algorithms/astar';

interface RoadNode {
  id: string;
  lon: number;
  lat: number;
}
interface RoadEdge {
  from: string;
  to: string;
  weight: number;
}

/** 北京区域边界 */
export const BEIJING_BOUNDS = {
  minLat: 39.4,
  maxLat: 40.6,
  minLon: 115.5,
  maxLon: 117.8,
};

const GRID_STEP = 0.05; // ~5km 间隔

/** 网格节点 */
const rawNodes: RoadNode[] = [];
let nodeIdx = 0;
for (let lat = BEIJING_BOUNDS.minLat; lat <= BEIJING_BOUNDS.maxLat; lat += GRID_STEP) {
  for (let lon = BEIJING_BOUNDS.minLon; lon <= BEIJING_BOUNDS.maxLon; lon += GRID_STEP) {
    rawNodes.push({ id: `n${nodeIdx++}`, lon, lat });
  }
}

/** Haversine 距离（km） */
function dist(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1R = (lat1 * Math.PI) / 180;
  const lat2R = (lat2 * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1R) * Math.cos(lat2R);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 道路等级权重 */
const WEIGHT = { major: 1.0, normal: 1.5 };

/** 生成边 */
const rawEdges: RoadEdge[] = [];
const cols = Math.round((BEIJING_BOUNDS.maxLon - BEIJING_BOUNDS.minLon) / GRID_STEP) + 1;

for (let i = 0; i < rawNodes.length; i++) {
  const a = rawNodes[i];
  // 东向邻居
  const eastIdx = i + 1;
  if (eastIdx < rawNodes.length) {
    const b = rawNodes[eastIdx];
    if (Math.abs(a.lat - b.lat) < 0.001) {
      const w = dist(a.lon, a.lat, b.lon, b.lat) * WEIGHT.major;
      rawEdges.push({ from: a.id, to: b.id, weight: w });
    }
  }
  // 北向邻居
  const northIdx = i + cols;
  if (northIdx < rawNodes.length) {
    const c = rawNodes[northIdx];
    if (Math.abs(a.lon - c.lon) < 0.001) {
      const w = dist(a.lon, a.lat, c.lon, c.lat) * WEIGHT.normal;
      rawEdges.push({ from: a.id, to: c.id, weight: w });
    }
  }
}

/** 道路线段列表（用于可视化）*/
let _roads: { lon: number; lat: number }[][] | null = null;
export function getRoads(): { lon: number; lat: number }[][] {
  if (!_roads) {
    const seen = new Set<string>();
    const roads: { lon: number; lat: number }[][] = [];
    rawEdges.forEach((edge) => {
      const key = [edge.from, edge.to].sort().join('-');
      if (seen.has(key)) return;
      seen.add(key);
      const fromNode = rawNodes.find((n) => n.id === edge.from);
      const toNode = rawNodes.find((n) => n.id === edge.to);
      if (fromNode && toNode) {
        roads.push([
          { lon: fromNode.lon, lat: fromNode.lat },
          { lon: toNode.lon, lat: toNode.lat },
        ]);
      }
    });
    _roads = roads;
  }
  return _roads;
}

/** 北京道路网 Graph（单例） */
let _graph: Graph | null = null;
export function getBeijingGraph(): Graph {
  if (!_graph) {
    _graph = buildGraph(rawNodes, rawEdges);
  }
  return _graph;
}

export const BEIJING_ROAD_STATS = {
  nodeCount: rawNodes.length,
  edgeCount: rawEdges.length,
};