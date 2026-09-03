// src/components/CesiumViewer.tsx
// Cesium 容器：viewer + flight + 鼠标拾取 + 所有 UI 控件
import { useEffect, useRef } from 'react';
import { useCesium } from '../hooks/useCesium';
import { useFlight } from '../hooks/useFlight';
import { setupMousePick } from '../cesium/mousePick';
import { switchView } from '../cesium/cameraViews';
import { ControlPanel } from './ControlPanel';
import { ViewSwitcher } from './ViewSwitcher';
import { FlightInfo } from './FlightInfo';
import { ProgressBar } from './ProgressBar';
import { FPSCounter } from './FPSCounter';

export function CesiumViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { viewer, ready, error } = useCesium(containerRef);
  const { flightData, flight, startTime, loading } = useFlight(viewer);

  // flight 就绪后：默认切到驾驶舱视角（默认暂停由 createFlight 配置）
  useEffect(() => {
    if (!viewer || !flight) return;
    switchView(viewer, flight.entity, 'cockpit');
  }, [viewer, flight]);

  // 鼠标拾取：viewer/flightData/flight/startTime 都就绪后再绑定
  useEffect(() => {
    if (!viewer || !flight || !flightData || !startTime) return;
    const destroy = setupMousePick(
      viewer,
      flightData.waypoints,
      startTime,
      (info) => {
        if (info) console.log('[pick]', info);
      }
    );
    return destroy;
  }, [viewer, flight, flightData, startTime]);

  return (
    <div className="cesium-wrapper">
      <div ref={containerRef} className="cesium-container" />
      <FPSCounter containerRef={containerRef} />

      {error && (
        <div className="error-overlay">
          <h2>初始化失败</h2>
          <pre>{error}</pre>
          <p>请检查：</p>
          <ol>
            <li>
              已执行 <code>pnpm install</code>
            </li>
            <li>
              <code>.env.local</code> 中 <code>VITE_TIANDITU_TK</code> 已配置
            </li>
            <li>浏览器控制台无 Cesium 相关报错</li>
          </ol>
        </div>
      )}

      {loading && !error && (
        <div className="loading-overlay">加载飞行数据中...</div>
      )}

      {ready && !error && (
        <>
          <ControlPanel flight={flight} />
          <ViewSwitcher viewer={viewer} entity={flight?.entity ?? null} />
          <FlightInfo viewer={viewer} flightData={flightData} />
          <ProgressBar viewer={viewer} duration={flightData?.duration ?? 0} />
        </>
      )}
    </div>
  );
}
