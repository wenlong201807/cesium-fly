// src/algorithms/osmLoader.ts
// 北京七环 OSM 道路数据加载器
// 使用 Overpass API 查询道路网，转为算法所需的 Graph 结构
import axios from 'axios';
import {
  buildGraph,
  type Graph,
  type GraphNode,
  type GraphEdge,
} from './astar';

/** 北京七环范围（大致矩形：西北角 ~ 39.4N,115.5E 到 东南角 ~ 40.6N,117.8E） */
export const BEIJING_BOUNDS = {
  minLat: 39.4,
  maxLat: 40.6,
  minLon: 115.5,
  maxLon: 117.8,
};

/** Overpass API 查询字符串（查询主次干道和高速公路） */
const OVERPASS_QUERY = `
[out:json][timeout:60];
(
  way["highway"="motorway"](${BEIJING_BOUNDS.minLat},${BEIJING_BOUNDS.minLon},${BEIJING_BOUNDS.maxLat},${BEIJING_BOUNDS.maxLon});
  way["highway"="trunk"](${BEIJING_BOUNDS.minLat},${BEIJING_BOUNDS.minLon},${BEIJING_BOUNDS.maxLat},${BEIJING_BOUNDS.maxLon});
  way["highway"="primary"](${BEIJING_BOUNDS.minLat},${BEIJING_BOUNDS.minLon},${BEIJING_BOUNDS.maxLat},${BEIJING_BOUNDS.maxLon});
  way["highway"="secondary"](${BEIJING_BOUNDS.minLat},${BEIJING_BOUNDS.minLon},${BEIJING_BOUNDS.maxLat},${BEIJING_BOUNDS.maxLon});
  way["highway"="tertiary"](${BEIJING_BOUNDS.minLat},${BEIJING_BOUNDS.minLon},${BEIJING_BOUNDS.maxLat},${BEIJING_BOUNDS.maxLon});
);
out body;
>;
out skel qt;
`.trim();

/** 道路等级 → 权重系数（高速公路最快，支路最慢） */
const ROAD_WEIGHT: Record<string, number> = {
  motorway: 1.0,
  trunk: 1.2,
  primary: 1.5,
  secondary: 2.0,
  tertiary: 2.5,
};

interface OSMElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  nodes?: number[];
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OSMElement[];
}

let cachedGraph: Graph | null = null;
let loadingPromise: Promise<Graph> | null = null;

/**
 * 从 Overpass API 加载北京道路网，返回 Graph 结构
 */
export async function loadBeijingRoads(
  onProgress?: (msg: string) => void
): Promise<Graph> {
  // 已有缓存，直接返回
  if (cachedGraph) return cachedGraph;

  // 正在加载中，等待返回
  if (loadingPromise) return loadingPromise;

  onProgress?.('正在请求 OSM 数据...');

  loadingPromise = (async () => {
    const response = await axios.get<OverpassResponse>(
      'https://overpass-api.de/api/interpreter',
      {
        params: { data: OVERPASS_QUERY },
        timeout: 120_000,
      }
    );

    onProgress?.('正在解析道路网...');
    const elements = response.data.elements;

    // 1. 收集所有节点
    const nodeMap = new Map<number, { lon: number; lat: number }>();
    const ways: { id: number; nodeIds: number[]; highway: string }[] = [];

    for (const el of elements) {
      if (el.type === 'node' && el.lat !== undefined && el.lon !== undefined) {
        nodeMap.set(el.id, { lon: el.lon, lat: el.lat });
      } else if (el.type === 'way' && el.nodes) {
        const highway = el.tags?.highway ?? 'tertiary';
        ways.push({ id: el.id, nodeIds: el.nodes, highway });
      }
    }

    onProgress?.(`已加载 ${nodeMap.size} 个节点，${ways.length} 条道路`);

    // 2. 构建边（每条道路拆成连续的线段）
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // 为每个 OSM 节点生成唯一算法节点
    const nodeIdMap = new Map<number, string>();
    nodeMap.forEach((pos, osmId) => {
      const nodeId = `n${osmId}`;
      nodeIdMap.set(osmId, nodeId);
      nodes.push({ id: nodeId, lon: pos.lon, lat: pos.lat });
    });

    // 为道路生成边（相邻节点之间）
    for (const way of ways) {
      const weight = ROAD_WEIGHT[way.highway] ?? 2.0;
      for (let i = 0; i < way.nodeIds.length - 1; i++) {
        const fromId = nodeIdMap.get(way.nodeIds[i]);
        const toId = nodeIdMap.get(way.nodeIds[i + 1]);
        if (fromId && toId) {
          // 边权重 = Haversine 距离 × 道路等级系数
          const fromPos = nodeMap.get(way.nodeIds[i])!;
          const toPos = nodeMap.get(way.nodeIds[i + 1])!;
          const dist = haversine(
            fromPos.lon,
            fromPos.lat,
            toPos.lon,
            toPos.lat
          );
          edges.push({ from: fromId, to: toId, weight: dist * weight });
        }
      }
    }

    onProgress?.('正在构建图结构...');
    cachedGraph = buildGraph(nodes, edges);
    onProgress?.(`图构建完成：${nodes.length} 节点，${edges.length} 边`);
    return cachedGraph;
  })();

  return loadingPromise;
}

/** Haversine 球面距离（km） */
function haversine(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1Rad) * Math.cos(lat2Rad);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 清除缓存（用于测试或重新加载） */
export function clearCache() {
  cachedGraph = null;
  loadingPromise = null;
}
