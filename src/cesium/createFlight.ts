// src/cesium/createFlight.ts
// 根据 FlightData 创建飞机实体（带轨迹分段着色）
import * as Cesium from 'cesium';
import type { FlightData, Waypoint } from '../types/flight';

export interface FlightHandle {
  entity: Cesium.Entity;
  start: () => void;
  pause: () => void;
  toggle: () => boolean;
  isPlaying: () => boolean;
  reset: () => void;
  setSpeed: (multiplier: number) => void;
  destroy: () => void;
}

/** 单个阶段的尾迹颜色 */
const PHASE_COLOR: Record<Waypoint['phase'], Cesium.Color> = {
  takeoff: Cesium.Color.fromCssColorString('#4a90e2'), // 蓝
  cruise: Cesium.Color.fromCssColorString('#f5a623'), // 黄
  landing: Cesium.Color.fromCssColorString('#e74c3c'), // 红
};

/**
 * 用 CompositeMaterialProperty 把每个航段的 [t_i, t_{i+1}) 染色，
 * 起飞=蓝 / 巡航=黄 / 降落=红。
 */
function buildPathMaterial(waypoints: Waypoint[], start: Cesium.JulianDate) {
  const composite = new Cesium.CompositeMaterialProperty();
  for (let i = 0; i < waypoints.length - 1; i++) {
    const wp = waypoints[i];
    const t0 = Cesium.JulianDate.addSeconds(
      start,
      wp.t,
      new Cesium.JulianDate()
    );
    const t1 = Cesium.JulianDate.addSeconds(
      start,
      waypoints[i + 1].t,
      new Cesium.JulianDate()
    );
    composite.intervals.addInterval(
      new Cesium.TimeInterval({
        start: t0,
        stop: t1,
        isStartIncluded: true,
        isStopIncluded: false,
        data: new Cesium.PolylineGlowMaterialProperty({
          color: PHASE_COLOR[wp.phase],
          glowPower: 0.2,
          taperPower: 1.0,
        }),
      })
    );
  }
  return composite;
}

export function createFlight(
  viewer: Cesium.Viewer,
  data: FlightData
): FlightHandle {
  // 注意：默认 shouldAnimate=false，由 useFlight.handle.start() 启动
  const start = Cesium.JulianDate.fromIso8601('2026-09-03T10:00:00Z');
  const stop = Cesium.JulianDate.addSeconds(
    start,
    data.duration,
    new Cesium.JulianDate()
  );

  // 用 data.duration 配置 Clock 范围

  // 2. SampledPositionProperty 收集所有航点
  const position = new Cesium.SampledPositionProperty();
  data.waypoints.forEach((wp) => {
    const t = Cesium.JulianDate.addSeconds(
      start,
      wp.t,
      new Cesium.JulianDate()
    );
    position.addSample(
      t,
      Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat, wp.alt)
    );
  });
  // 5 阶拉格朗日插值 → 飞行轨迹更平滑
  position.setInterpolationOptions({
    interpolationDegree: 5,
    interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
  });

  // 3. 飞机 entity
  const entity = viewer.entities.add({
    id: data.flightId,
    name: `${data.flightId} ${data.aircraft.name}`,
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({ start, stop }),
    ]),
    position,
    // 自动根据速度方向调整模型朝向
    orientation: new Cesium.VelocityOrientationProperty(position),
    model: {
      uri: data.aircraft.model,
      minimumPixelSize: data.aircraft.minimumPixelSize,
      maximumScale: 20000,
      runAnimations: true,
    },
    // 4. 轨迹：按阶段着色（CompositeMaterialProperty 会按时间切换颜色）
    path: {
      resolution: 1,
      width: 3,
      leadTime: 0, // 不画未来的轨迹（只画已飞过）
      trailTime: 10000, // 保留 10000 秒的尾迹
      material: buildPathMaterial(data.waypoints, start),
    },
  });

  // 5. 配置 Clock：默认暂停，speed=10
  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = stop.clone();
  viewer.clock.currentTime = start.clone();
  viewer.clock.clockRange = Cesium.ClockRange.CLAMPED;
  viewer.clock.multiplier = 10;
  viewer.clock.shouldAnimate = false; // 默认暂停，等待用户点播放

  // 6. 延迟切到驾驶舱视角（在 CesiumViewer 挂载完成后切）
  // 这里只返回一个 hint，真正切视角由 React 端通过 switchView 完成

  // 7. 封装操作
  const handle: FlightHandle = {
    entity,
    start: () => {
      viewer.clock.shouldAnimate = true;
    },
    pause: () => {
      viewer.clock.shouldAnimate = false;
    },
    toggle: () => {
      viewer.clock.shouldAnimate = !viewer.clock.shouldAnimate;
      return viewer.clock.shouldAnimate;
    },
    isPlaying: () => viewer.clock.shouldAnimate,
    reset: () => {
      viewer.clock.currentTime = start.clone();
      viewer.clock.shouldAnimate = false;
    },
    setSpeed: (multiplier: number) => {
      viewer.clock.multiplier = multiplier;
    },
    destroy: () => {
      viewer.entities.remove(entity);
    },
  };
  return handle;
}
