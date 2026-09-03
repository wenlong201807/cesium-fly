// src/algorithms/astar.ts
// A* + Dijkstra 路径规划算法
// 适用于道路网等有权重图

export interface GraphNode {
  id: string;
  /** 经度 */
  lon: number;
  /** _lat: 纬度 */
  lat: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

export interface Graph {
  nodes: Map<string, GraphNode>;
  /** 邻接表：nodeId → [{ neighborId, weight }] */
  adj: Map<string, { neighborId: string; weight: number }[]>;
}

export interface PathResult {
  /** 路径节点 ID 序列 */
  path: string[];
  /** 总权重 */
  totalWeight: number;
  /** 算法名称 */
  algorithm: 'astar' | 'dijkstra';
  /** 计算耗时（毫秒） */
  computeTime: number;
}

/** 根据 Haversine 公式计算两点间球面距离（km） */
function haversineDistance(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number
): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1Rad) * Math.cos(lat2Rad);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * 构建图（从节点列表 + 边列表）
 */
export function buildGraph(nodes: GraphNode[], edges: GraphEdge[]): Graph {
  const nodeMap = new Map<string, GraphNode>();
  const adj = new Map<string, { neighborId: string; weight: number }[]>();

  nodes.forEach((n) => {
    nodeMap.set(n.id, n);
    adj.set(n.id, []);
  });

  edges.forEach((e) => {
    const fromAdj = adj.get(e.from)!;
    const toAdj = adj.get(e.to);
    if (fromAdj) fromAdj.push({ neighborId: e.to, weight: e.weight });
    if (toAdj) toAdj.push({ neighborId: e.from, weight: e.weight });
  });

  return { nodes: nodeMap, adj };
}

/**
 * A* 寻路算法
 * @param graph 图
 * @param startId 起始节点 ID
 * @param endId 目标节点 ID
 * @param heuristicFn 启发函数（默认使用 Haversine 距离）
 */
export function astar(
  graph: Graph,
  startId: string,
  endId: string,
  heuristicFn?: (nodeId: string) => number
): PathResult {
  const startTime = performance.now();
  const { nodes, adj } = graph;
  const endNode = nodes.get(endId);
  if (!endNode) return emptyResult('astar', startTime);

  // 默认启发函数：到终点的 Haversine 距离
  const heuristic =
    heuristicFn ??
    ((nodeId: string) => {
      const n = nodes.get(nodeId);
      if (!n) return 0;
      return haversineDistance(n.lon, n.lat, endNode.lon, endNode.lat);
    });

  // Priority queue: [fScore, nodeId]
  const openSet = new Map<string, number>();
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  gScore.set(startId, 0);
  fScore.set(startId, heuristic(startId));
  openSet.set(startId, fScore.get(startId)!);

  while (openSet.size > 0) {
    // 取 fScore 最小的节点
    let currentId = '';
    let lowestF = Infinity;
    openSet.forEach((f, id) => {
      if (f < lowestF) {
        lowestF = f;
        currentId = id;
      }
    });

    if (currentId === endId) {
      return {
        path: reconstructPath(cameFrom, currentId),
        totalWeight: gScore.get(endId)!,
        algorithm: 'astar',
        computeTime: performance.now() - startTime,
      };
    }

    openSet.delete(currentId);
    const neighbors = adj.get(currentId) ?? [];
    for (const { neighborId, weight } of neighbors) {
      const tentativeG = (gScore.get(currentId) ?? Infinity) + weight;
      if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
        cameFrom.set(neighborId, currentId);
        gScore.set(neighborId, tentativeG);
        fScore.set(neighborId, tentativeG + heuristic(neighborId));
        if (!openSet.has(neighborId)) {
          openSet.set(neighborId, fScore.get(neighborId)!);
        }
      }
    }
  }

  return emptyResult('astar', startTime);
}

/**
 * Dijkstra 最短路径算法
 */
export function dijkstra(
  graph: Graph,
  startId: string,
  endId: string
): PathResult {
  const startTime = performance.now();
  const { adj } = graph;

  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const visited = new Set<string>();
  const pq = new Map<string, number>();

  dist.set(startId, 0);
  pq.set(startId, 0);

  while (pq.size > 0) {
    // 取最小距离
    let minId = '';
    let minDist = Infinity;
    pq.forEach((d, id) => {
      if (d < minDist) {
        minDist = d;
        minId = id;
      }
    });

    if (minId === endId) {
      return {
        path: reconstructPath(prev, endId),
        totalWeight: dist.get(endId)!,
        algorithm: 'dijkstra',
        computeTime: performance.now() - startTime,
      };
    }

    pq.delete(minId);
    if (visited.has(minId)) continue;
    visited.add(minId);

    const neighbors = adj.get(minId) ?? [];
    for (const { neighborId, weight } of neighbors) {
      if (visited.has(neighborId)) continue;
      const alt = (dist.get(minId) ?? Infinity) + weight;
      if (alt < (dist.get(neighborId) ?? Infinity)) {
        dist.set(neighborId, alt);
        prev.set(neighborId, minId);
        pq.set(neighborId, alt);
      }
    }
  }

  return emptyResult('dijkstra', startTime);
}

function emptyResult(
  algo: 'astar' | 'dijkstra',
  startTime: number
): PathResult {
  return {
    path: [],
    totalWeight: 0,
    algorithm: algo,
    computeTime: performance.now() - startTime,
  };
}

function reconstructPath(
  cameFrom: Map<string, string>,
  currentId: string
): string[] {
  const path: string[] = [currentId];
  while (cameFrom.has(currentId)) {
    const prev = cameFrom.get(currentId)!;
    path.unshift(prev);
  }
  return path;
}
