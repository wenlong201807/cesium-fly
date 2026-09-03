// src/algorithms/astar.test.ts
// A* + Dijkstra 算法单元测试
import { describe, it, expect } from 'vitest';
import {
  buildGraph,
  astar,
  dijkstra,
  type GraphNode,
  type GraphEdge,
} from './astar';

function makeSampleGraph() {
  // 简单的 4 节点图：1-2-3 链路 + 1-3 直连
  const nodes: GraphNode[] = [
    { id: '1', lon: 0, lat: 0 },
    { id: '2', lon: 1, lat: 0 },
    { id: '3', lon: 2, lat: 0 },
    { id: '4', lon: 1, lat: 1 },
  ];
  const edges: GraphEdge[] = [
    { from: '1', to: '2', weight: 1 },
    { from: '2', to: '3', weight: 1 },
    { from: '1', to: '3', weight: 5 }, // 兜底边（昂贵）
    { from: '1', to: '4', weight: 2 },
    { from: '4', to: '3', weight: 2 },
  ];
  return buildGraph(nodes, edges);
}

describe('astar', () => {
  it('直线最短路径', () => {
    const graph = makeSampleGraph();
    const result = astar(graph, '1', '3');
    expect(result.path).toEqual(['1', '2', '3']);
    expect(result.totalWeight).toBe(2);
    expect(result.algorithm).toBe('astar');
  });

  it('带绕路的次优路径', () => {
    const graph = makeSampleGraph();
    // 1-4-3 总长 4，比 1-3 直连（5）短
    const result = astar(graph, '1', '3');
    expect(result.totalWeight).toBe(2); // 实际选最短的 1-2-3
  });

  it('不存在路径时返回空', () => {
    const nodes: GraphNode[] = [
      { id: 'a', lon: 0, lat: 0 },
      { id: 'b', lon: 1, lat: 1 },
    ];
    const graph = buildGraph(nodes, []);
    const result = astar(graph, 'a', 'b');
    expect(result.path).toEqual([]);
  });

  it('起点等于终点', () => {
    const graph = makeSampleGraph();
    const result = astar(graph, '1', '1');
    expect(result.path).toEqual(['1']);
    expect(result.totalWeight).toBe(0);
  });
});

describe('dijkstra', () => {
  it('找最短路径', () => {
    const graph = makeSampleGraph();
    const result = dijkstra(graph, '1', '3');
    expect(result.path).toEqual(['1', '2', '3']);
    expect(result.totalWeight).toBe(2);
    expect(result.algorithm).toBe('dijkstra');
  });

  it('带权重的路径选择', () => {
    // 4-节点环：1-2(2)-3, 1-4(1)-3(2)，最短 1-4-3 = 3
    const nodes: GraphNode[] = [
      { id: '1', lon: 0, lat: 0 },
      { id: '2', lon: 1, lat: 0 },
      { id: '3', lon: 2, lat: 0 },
      { id: '4', lon: 1, lat: 1 },
    ];
    const edges: GraphEdge[] = [
      { from: '1', to: '2', weight: 2 },
      { from: '2', to: '3', weight: 2 },
      { from: '1', to: '4', weight: 1 },
      { from: '4', to: '3', weight: 2 },
    ];
    const graph = buildGraph(nodes, edges);
    const result = dijkstra(graph, '1', '3');
    expect(result.totalWeight).toBe(3); // 1-4-3
  });
});

describe('buildGraph', () => {
  it('邻接表对称', () => {
    const nodes: GraphNode[] = [
      { id: 'a', lon: 0, lat: 0 },
      { id: 'b', lon: 1, lat: 1 },
    ];
    const edges: GraphEdge[] = [{ from: 'a', to: 'b', weight: 3 }];
    const graph = buildGraph(nodes, edges);
    expect(graph.nodes.size).toBe(2);
    expect(graph.adj.get('a')?.length).toBe(1);
    expect(graph.adj.get('b')?.length).toBe(1);
    expect(graph.adj.get('a')?.[0].weight).toBe(3);
  });
});
