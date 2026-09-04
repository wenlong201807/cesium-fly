// src/pages/DecisionPage.tsx
// 自动驾驶决策仿真页：驾驶员视角 + 决策状态可视化
// 主视角：跟随自车，贴近地面视角（驾驶员第一视角）
// 地图全屏展示，左右下角浮动极简控制面板
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { createViewer } from '../cesium/createViewer';
import { loadImagery } from '../cesium/loadImagery';
import {
  SCENARIO_AGENTS,
  SCENARIOS,
  STATE_COLOR,
  STATE_LABEL,
  STATE_TRANSITIONS,
  type DecisionState,
  type VehicleAgent,
} from '../data/decision.mock';

export default function DecisionPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const agentsRef = useRef<VehicleAgent[]>(SCENARIO_AGENTS.map((a) => Object.assign({}, a)));
  const scenarioIdxRef = useRef<number>(0);
  const [ready, setReady] = useState(false);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);

  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const isFirstPersonRef = useRef(false);
  const cameraHeightRef = useRef<number>(10); // 默认 10m 俯视

  // 初始化 Cesium
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;
    const viewer = createViewer(containerRef.current);
    viewerRef.current = viewer;
    loadImagery(viewer, ['img']);

    // 默认俯视角度：贴近地面看远
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(116.397, 39.916, 500),
      duration: 1.5,
      orientation: {
        heading: Cesium.Math.toRadians(90),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0,
      },
    });

    setReady(true);

    return () => {
      viewerRef.current = null;
      viewer.destroy();
    };
  }, []);

  // 初始渲染车辆
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready) return;
    renderAgents(viewer, agentsRef.current);
  }, [ready]);

  // 切换视角
  function setDriverView(enable: boolean) {
    const viewer = viewerRef.current;
    if (!viewer) return;
    isFirstPersonRef.current = enable;

    if (enable) {
      // 取消默认跟踪
      viewer.trackedEntity = undefined;
      // 驾驶员视角高度
      cameraHeightRef.current = 3;
    } else {
      cameraHeightRef.current = 10;
      // 恢复俯视
      const ego = agentsRef.current.find((a) => a.isEgo);
      if (ego) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(ego.lon, ego.lat, 500),
          duration: 1,
          orientation: {
            heading: Cesium.Math.toRadians(90),
            pitch: Cesium.Math.toRadians(-45),
            roll: 0,
          },
        });
      }
    }
  }

  // 仿真循环
  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    startTimeRef.current = 0;
    setTick(0);
    agentsRef.current = SCENARIO_AGENTS.map((a) => Object.assign({}, a));

    const animate = (now: number) => {
      if (tick === 0) startTimeRef.current = now;
      const elapsed = (now - startTimeRef.current) / 1000;
      setTick(elapsed);

      const viewer = viewerRef.current;
      if (!viewer) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const agents = agentsRef.current;
      const ego = agents.find((a) => a.isEgo);
      if (!ego) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      // 决策状态机
      const newState = decideState(ego, agents, scenarioIdxRef.current);
      ego.state = newState;

      // 运动学更新（简化：车辆沿 heading 方向直线运动）
      const dt = 0.05;
      let speedDelta = 0;
      if (newState === 'brake') speedDelta = -5;
      else if (newState === 'follow') speedDelta = -1.5;
      else if (newState === 'cruise') speedDelta = 0;
      else if (newState === 'lane_change') speedDelta = 1;
      else if (newState === 'overtake') speedDelta = 2;
      else speedDelta = 0;

      ego.speed = Math.max(0, Math.min(25, ego.speed + speedDelta * dt));

      const dist = ego.speed * dt;
      const headingRad = Cesium.Math.toRadians(ego.heading);
      const cosLat = Math.cos((ego.lat * Math.PI) / 180);
      const dLat = (dist * Math.cos(headingRad)) / 111_000;
      const dLon = cosLat > 0.01 ? (dist * Math.sin(headingRad)) / (111_000 * cosLat) : 0;
      ego.lon += dLon;
      ego.lat += dLat;

      // 周围车辆跟随
      agents.forEach((a) => {
        if (a.isEgo) return;
        const aDist = a.speed * dt;
        const aHeadingRad = Cesium.Math.toRadians(a.heading);
        const aCosLat = Math.cos((a.lat * Math.PI) / 180);
        const aDlat = (aDist * Math.cos(aHeadingRad)) / 111_000;
        const aDlon = aCosLat > 0.01 ? (aDist * Math.sin(aHeadingRad)) / (111_000 * aCosLat) : 0;
        a.lon += aDlon;
        a.lat += aDlat;
      });

      // 重绘实体
      renderAgents(viewer, agents);

      // 驾驶员视角：跟随自车
      if (isFirstPersonRef.current) {
        const egoPos = Cesium.Cartesian3.fromDegrees(ego.lon, ego.lat, 3);
        const headingRad = Cesium.Math.toRadians(ego.heading);
        // 相机位置：自车后方 8m，3m 高
        const camX = -8 * Math.sin(headingRad);
        const camY = 8 * Math.cos(headingRad);
        const camLon = ego.lon + (camX / (111_000 * cosLat));
        const camLat = ego.lat + (camY / 111_000);
        const camPos = Cesium.Cartesian3.fromDegrees(camLon, camLat, 3);
        viewer.camera.setView({
          destination: camPos,
          orientation: {
            heading: Cesium.Math.toRadians(ego.heading),
            pitch: Cesium.Math.toRadians(-5),
            roll: 0,
          },
        });
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  const handleStart = () => setRunning(true);
  const handleStop = () => setRunning(false);
  const handleReset = () => {
    setRunning(false);
    agentsRef.current = SCENARIO_AGENTS.map((a) => Object.assign({}, a));
    setTick(0);
    const viewer = viewerRef.current;
    if (viewer) {
      renderAgents(viewer, agentsRef.current);
      setDriverView(false);
    }
  };

  const handleScenarioChange = (i: number) => {
    scenarioIdxRef.current = i;
    setScenarioIdx(i);
    handleReset();
  };

  const currentScenario = SCENARIOS[scenarioIdx];
  const egoInitial = SCENARIO_AGENTS.find((a) => a.isEgo);

  return (
    <div className="decision-page">
      <div className="decision-map" ref={containerRef}>
        {!ready && <div className="loading-overlay">初始化地图中...</div>}
      </div>

      {/* 左下角：极简仿真控制 */}
      <div className="decision-control">
        <div className="ctrl-row">
          <select
            value={scenarioIdx}
            onChange={(e) => handleScenarioChange(Number(e.target.value))}
            className="scenario-select"
          >
            {SCENARIOS.map((s, i) => (
              <option key={s.id} value={i}>{s.name}</option>
            ))}
          </select>
          {!running ? (
            <button className="ctrl-btn primary" onClick={handleStart}>▶</button>
          ) : (
            <button className="ctrl-btn" onClick={handleStop}>⏸</button>
          )}
          <button className="ctrl-btn" onClick={handleReset}>⟲</button>
        </div>
        <div className="ctrl-row">
          <button
            className={`view-btn ${isFirstPersonRef.current ? 'active' : ''}`}
            onClick={() => setDriverView(!isFirstPersonRef.current)}
            title="驾驶员视角"
          >
            🚗
          </button>
          <button
            className={`view-btn ${!isFirstPersonRef.current ? 'active' : ''}`}
            onClick={() => setDriverView(false)}
            title="俯视"
          >
            🗺️
          </button>
          <span className="ctrl-tick">{tick.toFixed(1)}s</span>
        </div>
      </div>

      {/* 右下角：当前决策状态（驾驶员抬头显示风格） */}
      <div className="decision-hud">
        {(() => {
          const currentEgo = agentsRef.current.find((a) => a.isEgo);
          const state = currentEgo?.state ?? 'cruise';
          const speed = currentEgo?.speed ?? 0;
          return (
            <>
              <div
                className="hud-state"
                style={{ background: STATE_COLOR[state] }}
              >
                {STATE_LABEL[state]}
              </div>
              <div className="hud-speed">
                {(speed * 3.6).toFixed(0)}
                <span className="hud-unit">km/h</span>
              </div>
            </>
          );
        })()}
      </div>

      {/* 右下角外侧：态势感知（可折叠） */}
      <div className="decision-sensor">
        <div className="sensor-title">周边态势</div>
        {SCENARIO_AGENTS.filter((a) => !a.isEgo).map((a) => {
          const dist = agentsRef.current.find((r) => r.id === a.id)?.longitudinalGap ?? a.longitudinalGap;
          const sign = (dist ?? 0) >= 0 ? '+' : '';
          return (
            <div key={a.id} className="sensor-item">
              <span className="sensor-name">{a.name}</span>
              <span className="sensor-dist">{sign}{dist != null ? dist.toFixed(0) : '-'}m</span>
            </div>
          );
        })}
      </div>

      {/* 顶部：场景说明（仅提示文字，不占用主视觉） */}
      <div className="decision-scene-hint">
        {currentScenario.description}
      </div>
    </div>
  );
}

/** 将 agents 渲染到 viewer */
function renderAgents(viewer: Cesium.Viewer, agents: VehicleAgent[]) {
  viewer.entities.removeAll();

  agents.forEach((agent) => {
    const pos = Cesium.Cartesian3.fromDegrees(agent.lon, agent.lat, 0);
    const headingRad = Cesium.Math.toRadians(agent.heading);
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(
      pos,
      new Cesium.HeadingPitchRoll(headingRad, 0, 0)
    );
    const color = Cesium.Color.fromCssColorString(STATE_COLOR[agent.state]);

    // 车辆模型贴地
    viewer.entities.add({
      id: `agent-${agent.id}`,
      position: pos,
      orientation,
      model: {
        uri: agent.model,
        minimumPixelSize: agent.isEgo ? 64 : 48,
        maximumScale: 200,
        color: agent.isEgo ? Cesium.Color.fromCssColorString('#ff4444') : color,
      },
    });

    // 自车前灯效果
    if (agent.isEgo) {
      viewer.entities.add({
        id: `headlight-${agent.id}`,
        position: Cesium.Cartesian3.fromDegrees(
          agent.lon + 0.00005 * Math.sin(headingRad),
          agent.lat + 0.00005 * Math.cos(headingRad),
          1
        ),
        point: {
          pixelSize: 6,
          color: Cesium.Color.YELLOW,
          outlineColor: Cesium.Color.ORANGE,
          outlineWidth: 2,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 300),
        },
      });
    }
  });
}

/** 决策状态机 */
function decideState(
  ego: VehicleAgent,
  others: VehicleAgent[],
  scenarioIdx: number
): DecisionState {
  if (scenarioIdx === 0) {
    const front = others.find(
      (a) =>
        a.longitudinalGap &&
        a.longitudinalGap > 0 &&
        a.longitudinalGap < 50 &&
        Math.abs(a.lateralOffset ?? 100) > 2
    );
    if (front && front.speed < ego.speed - 5) return 'follow';
    return 'cruise';
  }
  if (scenarioIdx === 1) {
    const front = others.find(
      (a) =>
        a.longitudinalGap && a.longitudinalGap > 0 && a.longitudinalGap < 25
    );
    if (front && front.speed < 3) return ego.speed < 2 ? 'stop' : 'brake';
    return 'cruise';
  }
  if (scenarioIdx === 2) {
    const front = others.find(
      (a) =>
        a.longitudinalGap &&
        a.longitudinalGap > 0 &&
        a.longitudinalGap < 40 &&
        Math.abs(a.lateralOffset ?? 100) > 2
    );
    if (front && front.speed < ego.speed - 3) return 'lane_change';
    return 'cruise';
  }
  return ego.state;
}
