// src/pages/DecisionPage.tsx
// 自动驾驶决策仿真页：道路行驶 + 决策状态 + 速度控制
// - 车辆沿北京道路网（网格采样）行驶，遵守交通规则
// - 支持速度选择 + 跟车距离保持
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { createViewer } from '../cesium/createViewer';
import { loadImagery } from '../cesium/loadImagery';
import {
  SCENARIOS,
  STATE_COLOR,
  STATE_LABEL,
  STATE_TRANSITIONS,
  type DecisionState,
  type VehicleAgent,
} from '../data/decision.mock';
import { getBeijingGraph, BEIJING_BOUNDS, getRoads } from '../data/beijing-roads.mock';

// 预设速度选项（km/h）
const SPEED_OPTIONS = [20, 40, 60, 80];

// 默认场景初始状态（重置时用）
const DEFAULT_EGO: VehicleAgent = {
  id: 'ego',
  name: '自车',
  isEgo: true,
  lon: 116.4,
  lat: 39.92,
  alt: 0,
  speed: 0,
  heading: 90,
  state: 'cruise',
  confidence: 0.95,
  model: '/models/car.glb',
};

const DEFAULT_OTHERS: VehicleAgent[] = [
  {
    id: 'front',
    name: '前车',
    isEgo: false,
    lon: 116.41,
    lat: 39.92,
    alt: 0,
    speed: 15,
    heading: 90,
    state: 'cruise',
    confidence: 0,
    model: '/models/car.glb',
    longitudinalGap: 25,
    lateralOffset: 0,
    intent: '巡航',
  },
  {
    id: 'left_rear',
    name: '左后',
    isEgo: false,
    lon: 116.395,
    lat: 39.925,
    alt: 0,
    speed: 18,
    heading: 90,
    state: 'cruise',
    confidence: 0,
    model: '/models/car.glb',
    longitudinalGap: -20,
    lateralOffset: 3.5,
    intent: '加速',
  },
  {
    id: 'right_rear',
    name: '右后',
    isEgo: false,
    lon: 116.395,
    lat: 39.915,
    alt: 0,
    speed: 16,
    heading: 90,
    state: 'cruise',
    confidence: 0,
    model: '/models/car.glb',
    longitudinalGap: -15,
    lateralOffset: -3.5,
    intent: '正常',
  },
];

export default function DecisionPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const agentsRef = useRef<(VehicleAgent & { pathIndex?: number })[]>([
    { ...DEFAULT_EGO, pathIndex: 0 },
    ...DEFAULT_OTHERS.map((o) => ({ ...o, pathIndex: 0 })),
  ]);
  const roadsRef = useRef<ReturnType<typeof getRoads>>([]);

  const [ready, setReady] = useState(false);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [targetSpeedKmh, setTargetSpeedKmh] = useState(60);
  // HUD 用状态（每帧更新）
  const [hudState, setHudState] = useState<DecisionState>('cruise');
  const [hudSpeed, setHudSpeed] = useState(0);

  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // 初始化 Cesium
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;
    const viewer = createViewer(containerRef.current);
    viewerRef.current = viewer;
    loadImagery(viewer, ['img']);

    // 加载道路线
    const roads = getRoads();
    roadsRef.current = roads;
    const positions: Cesium.Cartesian3[] = [];
    roads.forEach((road) => {
      road.forEach((pt) => {
        positions.push(Cesium.Cartesian3.fromDegrees(pt.lon, pt.lat, 0));
      });
    });
    viewer.entities.add({
      id: 'road-network',
      polyline: {
        positions,
        width: 3,
        material: Cesium.Color.fromCssColorString('#cccccc').withAlpha(0.6),
        clampToGround: true,
      },
    });

    // 飞入视图
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(116.4, 39.92, 800),
      duration: 1.5,
      orientation: {
        heading: Cesium.Math.toRadians(90),
        pitch: Cesium.Math.toRadians(-30),
        roll: 0,
      },
    });

    setReady(true);

    return () => {
      viewerRef.current = null;
      viewer.destroy();
    };
  }, []);

  // 仿真循环
  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    startTimeRef.current = 0;
    setTick(0);

    // 重置状态
    const roads = roadsRef.current;
    if (roads.length === 0) return;
    const mainRoad = roads[0]; // 使用第一条主路
    agentsRef.current = [
      { ...DEFAULT_EGO, pathIndex: 0, lon: mainRoad[0].lon, lat: mainRoad[0].lat },
      ...DEFAULT_OTHERS.map((o, i) => ({
        ...o,
        pathIndex: Math.floor(mainRoad.length * 0.3) + i * Math.floor(mainRoad.length * 0.25),
      })),
    ];

    const animate = (now: number) => {
      if (tick === 0) startTimeRef.current = now;
      const elapsed = (now - startTimeRef.current) / 1000;
      setTick(elapsed);

      const viewer = viewerRef.current;
      const roads = roadsRef.current;
      if (!viewer || roads.length === 0) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const agents = agentsRef.current;
      const ego = agents.find((a) => a.isEgo);
      if (!ego) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      // 更新 HUD 状态
      setHudState(ego.state);
      setHudSpeed(ego.speed);

      // 目标速度（m/s）
      const targetSpeed = (targetSpeedKmh / 3.6);

      // 决策：检测前车，计算 TTC
      const front = agents.find((a) => !a.isEgo && a.lon > ego.lon);
      let newState: DecisionState = 'cruise';
      if (front) {
        const dist = (front.lon - ego.lon) * 111_000 * Math.cos((ego.lat * Math.PI) / 180);
        const relSpeed = ego.speed - front.speed;
        // TTC < 3s 或距离 < 20m → 减速/刹车
        if (dist > 0 && dist < 50) {
          if (relSpeed > 0) {
            newState = dist < 20 ? 'brake' : 'follow';
          }
        }
      }
      ego.state = newState;

      // 速度更新（简化为直接趋向目标速度）
      const dt = 0.05;
      if (newState === 'brake') {
        ego.speed = Math.max(0, ego.speed - 5 * dt);
      } else if (newState === 'follow') {
        if (ego.speed > targetSpeed * 0.8) {
          ego.speed = Math.max(targetSpeed * 0.6, ego.speed - 2 * dt);
        } else {
          ego.speed = Math.min(targetSpeed, ego.speed + 1 * dt);
        }
      } else {
        ego.speed = Math.min(targetSpeed, ego.speed + 1.5 * dt);
      }

      // 沿道路移动（使用主路路径插值）
      const pathLen = mainRoad.length;
      ego.pathIndex = (ego.pathIndex ?? 0) + ego.speed * dt * 0.0005;
      if (ego.pathIndex >= pathLen - 1) ego.pathIndex = 0;
      const idx = Math.floor(ego.pathIndex);
      const t = ego.pathIndex - idx;
      const p0 = mainRoad[Math.min(idx, pathLen - 1)];
      const p1 = mainRoad[Math.min(idx + 1, pathLen - 1)];
      ego.lon = p0.lon + (p1.lon - p0.lon) * t;
      ego.lat = p0.lat + (p1.lat - p0.lat) * t;
      ego.heading = Math.atan2(p1.lon - p0.lon, p1.lat - p0.lat) * (180 / Math.PI);

      // 前车跟随
      agents.forEach((a) => {
        if (a.isEgo) return;
        const idx2 = Math.floor(a.pathIndex ?? 0);
        const t2 = (a.pathIndex ?? 0) - idx2;
        const pp0 = mainRoad[Math.min(idx2, pathLen - 1)];
        const pp1 = mainRoad[Math.min(idx2 + 1, pathLen - 1)];
        a.lon = pp0.lon + (pp1.lon - pp0.lon) * t2;
        a.lat = pp0.lat + (pp1.lat - pp0.lat) * t2;
        a.pathIndex = (a.pathIndex ?? 0) + a.speed * dt * 0.0005;
        if (a.pathIndex >= pathLen - 1) a.pathIndex = 0;
      });

      // 重绘
      renderAgents(viewer, agents);

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, targetSpeedKmh]);

  const handleStart = () => setRunning(true);
  const handleStop = () => setRunning(false);
  const handleReset = () => {
    setRunning(false);
    setTick(0);
  };

  const handleScenarioChange = (i: number) => {
    setScenarioIdx(i);
    handleReset();
  };

  const egoRef = agentsRef.current.find((a) => a.isEgo); // 仅用于初始渲染
  const currentScenario = SCENARIOS[scenarioIdx];

  return (
    <div className="decision-page">
      <div className="decision-map" ref={containerRef}>
        {!ready && <div className="loading-overlay">初始化地图中...</div>}
      </div>

      {/* 左下角：速度控制 */}
      <div className="decision-control">
        <div className="ctrl-title">速度选择</div>
        <div className="speed-row">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              className={`speed-btn ${targetSpeedKmh === s ? 'active' : ''}`}
              onClick={() => setTargetSpeedKmh(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="ctrl-row" style={{ marginTop: 8 }}>
          <select
            value={scenarioIdx}
            onChange={(e) => handleScenarioChange(Number(e.target.value))}
            className="scenario-select"
          >
            {SCENARIOS.map((s, i) => (
              <option key={s.id} value={i}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="ctrl-row">
          {!running ? (
            <button className="ctrl-btn primary flex1" onClick={handleStart}>▶ 开始仿真</button>
          ) : (
            <button className="ctrl-btn flex1" onClick={handleStop}>⏸ 暂停</button>
          )}
          <button className="ctrl-btn" onClick={handleReset}>⟲</button>
        </div>
      </div>

      {/* 右下角：HUD */}
      <div className="decision-hud">
        <div
          className="hud-state"
          style={{ background: STATE_COLOR[hudState] }}
        >
          {STATE_LABEL[hudState]}
        </div>
        <div className="hud-speed">
          {(hudSpeed * 3.6).toFixed(0)}
          <span className="hud-unit">km/h</span>
        </div>
      </div>

      {/* 顶部：场景说明 */}
      <div className="decision-scene-hint">{currentScenario.description}</div>
    </div>
  );
}

/** 渲染所有车辆 */
function renderAgents(viewer: Cesium.Viewer, agents: VehicleAgent[]) {
  viewer.entities.removeAll();

  // 重绘道路
  const roads = getRoads();
  const positions: Cesium.Cartesian3[] = [];
  roads.forEach((road) => {
    road.forEach((pt) => {
      positions.push(Cesium.Cartesian3.fromDegrees(pt.lon, pt.lat, 0));
    });
  });
  viewer.entities.add({
    id: 'road-network',
    polyline: {
      positions,
      width: 3,
      material: Cesium.Color.fromCssColorString('#cccccc').withAlpha(0.6),
      clampToGround: true,
    },
  });

  agents.forEach((agent) => {
    const pos = Cesium.Cartesian3.fromDegrees(agent.lon, agent.lat, 0);
    const headingRad = Cesium.Math.toRadians(agent.heading);
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(
      pos,
      new Cesium.HeadingPitchRoll(headingRad, 0, 0)
    );
    const color = Cesium.Color.fromCssColorString(
      agent.isEgo ? '#e74c3c' : STATE_COLOR[agent.state]
    );

    viewer.entities.add({
      id: `agent-${agent.id}`,
      position: pos,
      orientation,
      model: {
        uri: agent.model,
        minimumPixelSize: agent.isEgo ? 64 : 48,
        maximumScale: 200,
        color,
      },
    });
  });
}
