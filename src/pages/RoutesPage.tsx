// src/pages/RoutesPage.tsx
// 多航线管理页：航线列表 + Cesium 叠加 + 详情面板
import { useEffect, useMemo, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { createViewer } from '../cesium/createViewer';
import { loadImagery } from '../cesium/loadImagery';
import { switchView } from '../cesium/cameraViews';
import { ROUTES, calcDistanceKm, type RouteEntry } from '../data/routes.mock';
import { formatDuration } from '../utils/format';

const DEFAULT_SPEED = 10;

export default function RoutesPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [selectedId, setSelectedId] = useState<string>(ROUTES[0].id);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [ready, setReady] = useState(false);

  const selectedRoute = useMemo(
    () => ROUTES.find((r) => r.id === selectedId)!,
    [selectedId]
  );

  // 初始化 Cesium（仅一次）
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;
    const viewer = createViewer(containerRef.current);
    viewerRef.current = viewer;
    loadImagery(viewer, ['img', 'cia']);
    setReady(true);
    return () => {
      viewerRef.current = null;
      viewer.destroy();
    };
  }, []);

  // 渲染所有航线到 Cesium
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready) return;

    // 清除旧实体
    viewer.entities.removeAll();

    // 添加所有航线路径（颜色区分）
    ROUTES.forEach((route) => {
      const positions = route.data.waypoints.map((wp) =>
        Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat, wp.alt)
      );
      viewer.entities.add({
        id: `route-${route.id}`,
        name: route.name,
        polyline: {
          positions,
          width: route.id === selectedId ? 4 : 2,
          material: Cesium.Color.fromCssColorString(route.color).withAlpha(
            route.id === selectedId ? 0.9 : 0.5
          ),
          clampToGround: false,
        },
      });
    });

    // 飞向选中航线
    const route = ROUTES.find((r) => r.id === selectedId)!;
    const wp = route.data.waypoints;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        (wp[0].lon + wp[wp.length - 1].lon) / 2,
        (wp[0].lat + wp[wp.length - 1].lat) / 2,
        2_000_000
      ),
      duration: 1,
    });
  }, [ready, selectedId]);

  // 播放选中航线
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready) return;

    const route = ROUTES.find((r) => r.id === selectedId)!;
    const wp = route.data.waypoints;

    // 移除旧实体
    viewer.entities.removeAll();

    // 重建路径
    ROUTES.forEach((r) => {
      const positions = r.data.waypoints.map((w) =>
        Cesium.Cartesian3.fromDegrees(w.lon, w.lat, w.alt)
      );
      viewer.entities.add({
        id: `route-${r.id}`,
        polyline: {
          positions,
          width: r.id === selectedId ? 4 : 2,
          material: Cesium.Color.fromCssColorString(r.color).withAlpha(
            r.id === selectedId ? 0.9 : 0.5
          ),
        },
      });
    });

    // 添加飞机实体
    const start = Cesium.JulianDate.fromIso8601('2026-09-03T10:00:00Z');
    const stop = Cesium.JulianDate.addSeconds(
      start,
      route.data.duration,
      new Cesium.JulianDate()
    );
    const position = new Cesium.SampledPositionProperty();
    route.data.waypoints.forEach((w) => {
      const t = Cesium.JulianDate.addSeconds(
        start,
        w.t,
        new Cesium.JulianDate()
      );
      position.addSample(t, Cesium.Cartesian3.fromDegrees(w.lon, w.lat, w.alt));
    });
    position.setInterpolationOptions({
      interpolationDegree: 5,
      interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
    });

    viewer.entities.add({
      id: `aircraft-${route.id}`,
      name: route.name,
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({ start, stop }),
      ]),
      position,
      orientation: new Cesium.VelocityOrientationProperty(position),
      model: {
        uri: route.data.aircraft.model,
        minimumPixelSize: route.data.aircraft.minimumPixelSize,
        maximumScale: 20000,
      },
    });

    // 配置 Clock
    viewer.clock.startTime = start.clone();
    viewer.clock.stopTime = stop.clone();
    viewer.clock.currentTime = start.clone();
    viewer.clock.clockRange = Cesium.ClockRange.CLAMPED;
    viewer.clock.multiplier = speed;
    viewer.clock.shouldAnimate = playing;
  }, [ready, selectedId, playing, speed]);

  const handleToggle = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.clock.shouldAnimate = !viewer.clock.shouldAnimate;
    setPlaying(viewer.clock.shouldAnimate);
  };

  const handleReset = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.clock.currentTime = viewer.clock.startTime.clone();
    viewer.clock.shouldAnimate = false;
    setPlaying(false);
  };

  return (
    <div className="routes-page">
      {/* 左侧：航线列表 */}
      <aside className="routes-sidebar">
        <h3>航线列表</h3>
        <ul className="route-list">
          {ROUTES.map((route) => (
            <li
              key={route.id}
              className={route.id === selectedId ? 'active' : ''}
              onClick={() => {
                setSelectedId(route.id);
                setPlaying(false);
              }}
            >
              <span
                className="route-color"
                style={{ background: route.color }}
              />
              <div className="route-item-info">
                <div className="route-item-name">{route.name}</div>
                <div className="route-item-desc">{route.description}</div>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* 中间：Cesium 地图 */}
      <div className="routes-map">
        <div ref={containerRef} className="cesium-container" />
        {!ready && <div className="loading-overlay">初始化地图中...</div>}
      </div>

      {/* 右侧：选中航线详情 */}
      <aside className="routes-detail">
        <h3>{selectedRoute.name}</h3>
        <p className="route-desc">{selectedRoute.description}</p>

        {/* 播放控制 */}
        <div
          className="control-panel"
          style={{ position: 'static', marginBottom: 12 }}
        >
          <div className="play-row">
            <button className="play-btn" onClick={handleToggle}>
              {playing ? '⏸ 暂停' : '▶ 播放'}
            </button>
            <button className="reset-btn" onClick={handleReset}>
              重置
            </button>
          </div>
          <div className="speed-group">
            <span className="speed-label">速度</span>
            {[1, 5, 10, 30].map((s) => (
              <button
                key={s}
                className={`speed-btn${speed === s ? ' active' : ''}`}
                onClick={() => {
                  setSpeed(s);
                  const viewer = viewerRef.current;
                  if (viewer) viewer.clock.multiplier = s;
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* 航线统计 */}
        <table className="detail-table">
          <tbody>
            <tr>
              <td>总距离</td>
              <td>
                {calcDistanceKm(selectedRoute.data.waypoints).toFixed(1)} km
              </td>
            </tr>
            <tr>
              <td>预计时长</td>
              <td>{formatDuration(selectedRoute.data.duration)}</td>
            </tr>
            <tr>
              <td>航点数量</td>
              <td>{selectedRoute.data.waypoints.length}</td>
            </tr>
          </tbody>
        </table>

        {/* 航点列表 */}
        <h4
          style={{
            marginTop: 12,
            fontSize: 13,
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          航点列表
        </h4>
        <table className="detail-table">
          <tbody>
            {selectedRoute.data.waypoints.map((wp, i) => (
              <tr key={i}>
                <td>#{i + 1}</td>
                <td>
                  {wp.lon.toFixed(4)}°, {wp.lat.toFixed(4)}°
                </td>
                <td>{wp.alt.toFixed(0)}m</td>
              </tr>
            ))}
          </tbody>
        </table>
      </aside>
    </div>
  );
}
