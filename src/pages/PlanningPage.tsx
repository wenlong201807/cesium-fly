// src/pages/PlanningPage.tsx
// 道路级路径规划页：A* + Dijkstra + 北京七环道路网
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { createViewer } from '../cesium/createViewer';
import { loadImagery } from '../cesium/loadImagery';
import {
  astar,
  dijkstra,
  type Graph,
  type PathResult,
} from '../algorithms/astar';
import {
  getBeijingGraph,
  BEIJING_ROAD_STATS,
} from '../data/beijing-roads.mock';

type AlgoType = 'astar' | 'dijkstra';

interface PickPoint {
  lon: number;
  lat: number;
  nearestNodeId: string;
}

export default function PlanningPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const graphRef = useRef<Graph | null>(null);

  const [algo, setAlgo] = useState<AlgoType>('astar');
  const [startPoint, setStartPoint] = useState<PickPoint | null>(null);
  const [endPoint, setEndPoint] = useState<PickPoint | null>(null);
  const [result, setResult] = useState<PathResult | null>(null);
  const [pickingMode, setPickingMode] = useState<'start' | 'end' | null>(null);

  // 初始化 Cesium
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;
    const viewer = createViewer(containerRef.current);
    viewerRef.current = viewer;
    loadImagery(viewer, ['img', 'cia']);

    const bounds = getBeijingBounds();
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        (bounds.minLon + bounds.maxLon) / 2,
        (bounds.minLat + bounds.maxLat) / 2,
        250_000
      ),
      duration: 1,
    });

    // 边界框
    viewer.entities.add({
      name: '北京七环范围',
      rectangle: {
        coordinates: Cesium.Rectangle.fromDegrees(
          bounds.minLon,
          bounds.minLat,
          bounds.maxLon,
          bounds.maxLat
        ),
        material: Cesium.Color.fromCssColorString('#4a90e2').withAlpha(0.05),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#4a90e2').withAlpha(0.6),
      },
    });

    // 加载道路网
    graphRef.current = getBeijingGraph();
    renderAllRoads();

    return () => {
      viewerRef.current = null;
      viewer.destroy();
    };
  }, []);

  function renderAllRoads() {
    const viewer = viewerRef.current;
    const graph = graphRef.current;
    if (!viewer || !graph) return;

    // 收集所有边
    const positions: Cesium.Cartesian3[] = [];
    graph.adj.forEach((neighbors, nodeId) => {
      const fromNode = graph.nodes.get(nodeId);
      if (!fromNode) return;
      const fromPos = Cesium.Cartesian3.fromDegrees(fromNode.lon, fromNode.lat, 0);
      for (const { neighborId } of neighbors) {
        const toNode = graph.nodes.get(neighborId);
        if (!toNode) continue;
        const toPos = Cesium.Cartesian3.fromDegrees(toNode.lon, toNode.lat, 0);
        positions.push(fromPos, toPos);
      }
    });
    viewer.entities.add({
      name: '北京道路网',
      polyline: {
        positions,
        width: 1.5,
        material: Cesium.Color.fromCssColorString('#ffffff').withAlpha(0.4),
        clampToGround: true,
      },
    });
  }

  // 地图点击选点
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      if (!pickingMode || !graphRef.current) return;
      const ray = viewer.camera.getPickRay(click.position);
      if (!ray) return;
      const pos = viewer.scene.globe.pick(ray, viewer.scene);
      if (!pos) return;
      const carto = Cesium.Cartographic.fromCartesian(pos);
      const lon = Cesium.Math.toDegrees(carto.longitude);
      const lat = Cesium.Math.toDegrees(carto.latitude);
      const nearestId = findNearestNode(graphRef.current, lon, lat);
      if (!nearestId) return;
      const point: PickPoint = { lon, lat, nearestNodeId: nearestId };
      if (pickingMode === 'start') setStartPoint(point);
      else setEndPoint(point);
      setPickingMode(null);
      renderPickMarker(pickingMode, lon, lat);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => handler.destroy();
  }, [pickingMode]);

  function renderPickMarker(type: 'start' | 'end', lon: number, lat: number) {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.entities.add({
      id: `marker-${type}`,
      name: type === 'start' ? '起点' : '终点',
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      point: {
        pixelSize: 14,
        color:
          type === 'start'
            ? Cesium.Color.fromCssColorString('#4a90e2')
            : Cesium.Color.fromCssColorString('#e74c3c'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      label: {
        text: type === 'start' ? '起点' : '终点',
        font: '12px sans-serif',
        fillColor: Cesium.Color.WHITE,
        pixelOffset: new Cesium.Cartesian2(0, -20),
      },
    });
  }

  function runPathfinding() {
    const graph = graphRef.current;
    const viewer = viewerRef.current;
    if (!graph || !viewer || !startPoint || !endPoint) return;

    const oldPath = viewer.entities.getById('planned-path');
    if (oldPath) viewer.entities.remove(oldPath);

    const res =
      algo === 'astar'
        ? astar(graph, startPoint.nearestNodeId, endPoint.nearestNodeId)
        : dijkstra(graph, startPoint.nearestNodeId, endPoint.nearestNodeId);

    if (res.path.length === 0) {
      setResult(res);
      return;
    }

    const positions = res.path.map((id) => {
      const n = graph.nodes.get(id)!;
      return Cesium.Cartesian3.fromDegrees(n.lon, n.lat, 0);
    });
    viewer.entities.add({
      id: 'planned-path',
      name: '规划路径',
      polyline: {
        positions,
        width: 5,
        material: new Cesium.PolylineGlowMaterialProperty({
          color:
            algo === 'astar'
              ? Cesium.Color.fromCssColorString('#4a90e2')
              : Cesium.Color.fromCssColorString('#f5a623'),
          glowPower: 0.25,
        }),
        clampToGround: true,
      },
    });

    const pathEntity = viewer.entities.getById('planned-path');
    if (pathEntity) {
      viewer.flyTo(pathEntity, {
        duration: 1.5,
        offset: new Cesium.HeadingPitchRange(0, -1.2, 0),
      });
    }

    setResult(res);
  }

  function clearPath() {
    const viewer = viewerRef.current;
    if (!viewer) return;
    ['planned-path', 'marker-start', 'marker-end'].forEach((id) => {
      const e = viewer.entities.getById(id);
      if (e) viewer.entities.remove(e);
    });
    setStartPoint(null);
    setEndPoint(null);
    setResult(null);
  }

  return (
    <div className="planning-page">
      <div className="planning-map" ref={containerRef} />

      {/* 控制面板 */}
      <aside className="planning-panel">
        <h3>路径规划</h3>

        <p className="hint">
          北京七环道路网 · {BEIJING_ROAD_STATS.nodeCount} 节点 ·{' '}
          {BEIJING_ROAD_STATS.edgeCount} 边
        </p>

        <div className="algo-group">
          <button
            className={algo === 'astar' ? 'active' : ''}
            onClick={() => setAlgo('astar')}
          >
            A* 启发式
          </button>
          <button
            className={algo === 'dijkstra' ? 'active' : ''}
            onClick={() => setAlgo('dijkstra')}
          >
            Dijkstra
          </button>
        </div>

        <div className="pick-row">
          <button
            className={pickingMode === 'start' ? 'active' : ''}
            onClick={() => setPickingMode('start')}
          >
            📍 选起点
          </button>
          <button
            className={pickingMode === 'end' ? 'active' : ''}
            onClick={() => setPickingMode('end')}
          >
            🎯 选终点
          </button>
        </div>

        <div className="point-info">
          <div>
            <span className="point-label" style={{ color: '#4a90e2' }}>
              起点
            </span>
            <span>
              {startPoint
                ? `${startPoint.lon.toFixed(4)}, ${startPoint.lat.toFixed(4)}`
                : '未选择'}
            </span>
          </div>
          <div>
            <span className="point-label" style={{ color: '#e74c3c' }}>
              终点
            </span>
            <span>
              {endPoint
                ? `${endPoint.lon.toFixed(4)}, ${endPoint.lat.toFixed(4)}`
                : '未选择'}
            </span>
          </div>
        </div>

        <div className="action-row">
          <button
            className="primary-btn"
            disabled={!startPoint || !endPoint}
            onClick={runPathfinding}
          >
            开始寻路
          </button>
          <button onClick={clearPath}>清除</button>
        </div>

        {result && (
          <div className="result-panel">
            <h4>规划结果</h4>
            <span className="result-algo">
              算法：
              {result.algorithm === 'astar' ? 'A* 启发式' : 'Dijkstra'}
            </span>
            <table>
              <tbody>
                <tr>
                  <td>总距离</td>
                  <td>{result.totalWeight.toFixed(2)} km</td>
                </tr>
                <tr>
                  <td>节点数</td>
                  <td>{result.path.length}</td>
                </tr>
                <tr>
                  <td>计算耗时</td>
                  <td>{result.computeTime.toFixed(2)} ms</td>
                </tr>
                <tr>
                  <td>状态</td>
                  <td>
                    {result.path.length > 0
                      ? '✅ 找到路径'
                      : '❌ 无可达路径'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </aside>
    </div>
  );
}

/** 找到距离 (lon, lat) 最近的图节点 */
function findNearestNode(
  graph: Graph,
  lon: number,
  lat: number
): string | null {
  let nearestId: string | null = null;
  let nearestDist = Infinity;
  graph.nodes.forEach((node, id) => {
    const d = (node.lon - lon) ** 2 + (node.lat - lat) ** 2;
    if (d < nearestDist) {
      nearestDist = d;
      nearestId = id;
    }
  });
  return nearestId;
}

/** 北京七环边界常量（供 flyTo 使用） */
export const BEIJING_BOUNDS = {
  minLat: 39.4,
  maxLat: 40.6,
  minLon: 115.5,
  maxLon: 117.8,
};

function getBeijingBounds() {
  return BEIJING_BOUNDS;
}