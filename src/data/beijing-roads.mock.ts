// src/data/beijing-roads.mock.ts
// 北京七环道路网 Mock 数据（网格采样 + 城市干道）
// 用于路径规划演示，无需网络请求
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

/** 北京七环范围 */
const BOUNDS = { minLat: 39.4, maxLat: 40.6, minLon: 115.5, maxLon: 117.8 };

/** 网格节点（每 ~0.08° 采样一个节点，约 8-9km 间隔） */
const rawNodes: RoadNode[] = [];
let nodeIdx = 0;
// 纵向网格（南北向）
for (let lat = BOUNDS.minLat; lat <= BOUNDS.maxLat; lat += 0.08) {
  // 东西向主路
  for (let lon = BOUNDS.minLon; lon <= BOUNDS.maxLon; lon += 0.08) {
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

/** 道路等级权重系数 */
const WEIGHT = { major: 1.0, normal: 1.5 };

/** 生成边（相邻网格节点相连） */
const rawEdges: RoadEdge[] = [];
const cols = Math.round((BOUNDS.maxLon - BOUNDS.minLon) / 0.08) + 1;

for (let i = 0; i < rawNodes.length; i++) {
  const a = rawNodes[i];
  // 东向邻居
  const eastIdx = i + 1;
  if (eastIdx < rawNodes.length) {
    const b = rawNodes[eastIdx];
    if (Math.abs(a.lat - b.lat) < 0.001) {
      // 横向主路（major），纵向次路（normal）
      const w = dist(a.lon, a.lat, b.lon, b.lat) * WEIGHT.major;
      rawEdges.push({ from: a.id, to: b.id, weight: w });
    }
  }
  // 北向邻居（下一行）
  const northIdx = i + cols;
  if (northIdx < rawNodes.length) {
    const c = rawNodes[northIdx];
    if (Math.abs(a.lon - c.lon) < 0.001) {
      const w = dist(a.lon, a.lat, c.lon, c.lat) * WEIGHT.normal;
      rawEdges.push({ from: a.id, to: c.id, weight: w });
    }
  }
}

/** 北京七环道路网 Graph（单例） */
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