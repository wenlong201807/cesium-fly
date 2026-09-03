// src/pages/DecisionPage.tsx
// 自动驾驶决策仿真页：自车 + 周围车辆 + 决策状态机 + 态势感知可视化
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
  const agentsRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const labelsRef = useRef<Map<string, Cesium.Entity>>(new Map());
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const scenarioIdxRef = useRef<number>(0);

  const [ready, setReady] = useState(false);
  const [agents, setAgents] = useState<VehicleAgent[]>(SCENARIO_AGENTS);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);

  // 初始化 Cesium
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;
    const viewer = createViewer(containerRef.current);
    viewerRef.current = viewer;
    loadImagery(viewer, ['img', 'cia']);

    // 飞到北京
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(116.397, 39.916, 1500),
      duration: 1,
      orientation: { heading: 0, pitch: -Cesium.Math.PI_OVER_TWO / 2, roll: 0 },
    });

    setReady(true);

    return () => {
      viewerRef.current = null;
      viewer.destroy();
    };
  }, []);

  // 渲染所有车辆（首帧 + tick 更新）
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready) return;

    // 清除旧实体
    agentsRef.current.forEach((entity) => viewer.entities.remove(entity));
    agentsRef.current.clear();
    labelsRef.current.forEach((entity) => viewer.entities.remove(entity));
    labelsRef.current.clear();

    agents.forEach((agent) => {
      // 车辆模型
      const pos = Cesium.Cartesian3.fromDegrees(
        agent.lon,
        agent.lat,
        agent.alt
      );
      const headingRad = Cesium.Math.toRadians(agent.heading);
      const orientation = Cesium.Transforms.headingPitchRollQuaternion(
        pos,
        new Cesium.HeadingPitchRoll(headingRad, 0, 0)
      );
      const entity = viewer.entities.add({
        id: `agent-${agent.id}`,
        name: agent.name,
        position: pos,
        orientation,
        model: {
          uri: agent.model,
          minimumPixelSize: agent.isEgo ? 48 : 32,
          maximumScale: 5000,
          color: agent.isEgo
            ? Cesium.Color.fromCssColorString(STATE_COLOR[agent.state])
            : Cesium.Color.WHITE,
        },
      });
      agentsRef.current.set(agent.id, entity);

      // 安全距离圈（仅自车显示）
      if (agent.isEgo) {
        viewer.entities.add({
          id: `safety-zone-${agent.id}`,
          name: '安全距离圈',
          position: pos,
          ellipse: {
            semiMinorAxis: 50,
            semiMajorAxis: 80,
            material: Cesium.Color.fromCssColorString(
              STATE_COLOR[agent.state]
            ).withAlpha(0.15),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString(
              STATE_COLOR[agent.state]
            ).withAlpha(0.6),
            outlineWidth: 2,
          },
        });
      }

      // 标签
      const labelEntity = viewer.entities.add({
        id: `label-${agent.id}`,
        position: pos,
        label: {
          text: agent.isEgo ? '🚗 EGO' : agent.name,
          font: '12px sans-serif',
          fillColor: agent.isEgo
            ? Cesium.Color.fromCssColorString(STATE_COLOR[agent.state])
            : Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -30),
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString('rgba(0,0,0,0.5)'),
        },
      });
      labelsRef.current.set(agent.id, labelEntity);
    });
  }, [ready, agents]);

  // 仿真循环
  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      setTick(elapsed);

      setAgents((prev) => {
        const next = prev.map((a) => Object.assign({}, a));
        const ego = next.find((a) => a.isEgo);
        if (!ego) return prev;

        // 决策状态机（按场景自动切换）
        const newState = decideState(ego, next, scenarioIdx);
        ego.state = newState;

        // 简单运动学更新
        const dt = 0.05;
        let speedDelta = 0;
        if (newState === 'brake') {
          speedDelta = -3;
        } else if (newState === 'follow') {
          speedDelta = -1;
        } else if (newState === 'cruise') {
          speedDelta = 0;
        } else {
          speedDelta = 0.5;
        }
        ego.speed = Math.max(0, ego.speed + speedDelta * dt);

        // 位置更新：按 heading 方向移动 speed*dt（米）
        const dist = ego.speed * dt;
        const headingRad = Cesium.Math.toRadians(ego.heading);
        const dLat = (dist * Math.cos(headingRad)) / 111_000;
        const dLon =
          (dist * Math.sin(headingRad)) /
          (111_000 * Math.cos((ego.lat * Math.PI) / 180));
        ego.lon += dLon;
        ego.lat += dLat;

        // 周围车辆跟随运动
        next.forEach((a) => {
          if (a.isEgo) return;
          const aDist = a.speed * dt;
          const aHeadingRad = Cesium.Math.toRadians(a.heading);
          const aDlat = (aDist * Math.cos(aHeadingRad)) / 111_000;
          const aDlon =
            (aDist * Math.sin(aHeadingRad)) /
            (111_000 * Math.cos((a.lat * Math.PI) / 180));
          a.lon += aDlon;
          a.lat += aDlat;
        });

        return next;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [running, scenarioIdx]);

  const handleStart = () => setRunning(true);
  const handleStop = () => setRunning(false);
  const handleReset = () => {
    setRunning(false);
    setAgents(SCENARIO_AGENTS.map((a) => ({ ...a })));
    setTick(0);
  };

  const ego = agents.find((a) => a.isEgo);
  const currentScenario = SCENARIOS[scenarioIdx];

  return (
    <div className="decision-page">
      <div className="decision-map" ref={containerRef}>
        {!ready && <div className="loading-overlay">初始化地图中...</div>}
      </div>

      {/* 左侧：场景选择 + 决策状态机 */}
      <aside className="decision-sidebar">
        <h3>仿真控制</h3>

        <div className="scenario-list">
          <h4>场景</h4>
          {SCENARIOS.map((s, i) => (
            <button
              key={s.id}
              className={scenarioIdx === i ? 'active' : ''}
              onClick={() => {
                scenarioIdxRef.current = i;
                setScenarioIdx(i);
                handleReset();
              }}
              title={s.description}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="control-buttons">
          {!running ? (
            <button className="primary-btn" onClick={handleStart}>
              ▶ 开始仿真
            </button>
          ) : (
            <button onClick={handleStop}>⏸ 暂停</button>
          )}
          <button onClick={handleReset}> 重置</button>
        </div>

        <div className="state-display">
          <h4>当前决策</h4>
          {ego && (
            <>
              <div
                className="state-badge"
                style={{ background: STATE_COLOR[ego.state] }}
              >
                {STATE_LABEL[ego.state]}
              </div>
              <div className="state-meta">
                <div>
                  置信度：
                  <span style={{ color: STATE_COLOR[ego.state] }}>
                    {(ego.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div>速度：{(ego.speed * 3.6).toFixed(1)} km/h</div>
                <div>航向：{ego.heading.toFixed(0)}°</div>
              </div>
            </>
          )}
        </div>

        <div className="state-machine">
          <h4>状态机</h4>
          {ego && (
            <div className="transitions">
              {STATE_TRANSITIONS[ego.state].map((next) => (
                <div key={next} className="transition-item">
                  <span style={{ color: STATE_COLOR[ego.state] }}>
                    {STATE_LABEL[ego.state]}
                  </span>
                  <span className="arrow">→</span>
                  <span style={{ color: STATE_COLOR[next] }}>
                    {STATE_LABEL[next]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* 右侧：态势感知列表 */}
      <aside className="decision-info">
        <h3>态势感知</h3>
        <table>
          <thead>
            <tr>
              <th>车辆</th>
              <th>距离</th>
              <th>速度</th>
              <th>意图</th>
            </tr>
          </thead>
          <tbody>
            {agents
              .filter((a) => !a.isEgo)
              .map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>
                    {a.longitudinalGap !== undefined
                      ? `${a.longitudinalGap > 0 ? '+' : ''}${a.longitudinalGap.toFixed(0)}m`
                      : '-'}
                  </td>
                  <td>{(a.speed * 3.6).toFixed(0)} km/h</td>
                  <td className="intent-cell">{a.intent ?? '-'}</td>
                </tr>
              ))}
          </tbody>
        </table>

        <h4 style={{ marginTop: 12 }}>场景说明</h4>
        <p className="scenario-desc">{currentScenario.description}</p>

        <div className="stats-row">
          <div>
            <span className="stat-label">运行时长</span>
            <span className="stat-value">{tick.toFixed(1)}s</span>
          </div>
          <div>
            <span className="stat-label">车辆数</span>
            <span className="stat-value">{agents.length}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

/** 决策状态机：根据当前场景 + 周围车辆做状态判定 */
function decideState(
  ego: VehicleAgent,
  others: VehicleAgent[],
  scenarioIdx: number
): DecisionState {
  // 场景 1：正常巡航
  if (scenarioIdx === 0) {
    const front = others.find(
      (a) =>
        a.longitudinalGap &&
        a.longitudinalGap > 0 &&
        a.longitudinalGap < 50 &&
        Math.abs(a.lateralOffset ?? 100) < 2
    );
    if (front && front.speed < ego.speed - 5) {
      return 'follow';
    }
    return 'cruise';
  }

  // 场景 2：紧急刹车（前车极慢）
  if (scenarioIdx === 1) {
    const front = others.find(
      (a) =>
        a.longitudinalGap && a.longitudinalGap > 0 && a.longitudinalGap < 25
    );
    if (front && front.speed < 3) {
      return ego.speed < 2 ? 'stop' : 'brake';
    }
    return 'cruise';
  }

  // 场景 3：变道超车
  if (scenarioIdx === 2) {
    const front = others.find(
      (a) =>
        a.longitudinalGap &&
        a.longitudinalGap > 0 &&
        a.longitudinalGap < 40 &&
        Math.abs(a.lateralOffset ?? 100) < 2
    );
    if (front && front.speed < ego.speed - 3) {
      return 'lane_change';
    }
    return 'cruise';
  }

  return ego.state;
}
