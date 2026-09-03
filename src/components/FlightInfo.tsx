// src/components/FlightInfo.tsx
// 实时显示飞机当前位置 / 高度 / 速度 / 航向 / 阶段 / 进度
import { useEffect, useState } from 'react';
import * as Cesium from 'cesium';
import {
  formatAlt,
  formatHeading,
  formatLonLat,
  formatSpeed,
} from '../utils/format';
import type { FlightData, Waypoint } from '../types/flight';

export interface FlightInfoProps {
  viewer: Cesium.Viewer | null;
  flightData: FlightData | null;
}

export interface FlightState {
  lon: number;
  lat: number;
  alt: number;
  speed: number;
  heading: number;
  phase: string;
  progress: number; // 0~1
}

/** 用 elapsed 秒在 waypoints 里二分插值，找到最接近的航点用于快照（speed/heading/phase） */
function snapshotFromWaypoints(
  waypoints: Waypoint[],
  elapsed: number
): Waypoint | null {
  if (waypoints.length === 0) return null;
  // 在相邻航点之间做线性扫描（数据量小，O(n) 足够）
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (elapsed >= a.t && elapsed <= b.t) {
      // 简单线性插值（在时间维度上找接近度，再 50/50 折中）
      const ratio = (elapsed - a.t) / Math.max(1, b.t - a.t);
      return ratio < 0.5 ? a : b;
    }
  }
  return waypoints[waypoints.length - 1];
}

export function FlightInfo({ viewer, flightData }: FlightInfoProps) {
  const [state, setState] = useState<FlightState | null>(null);

  useEffect(() => {
    if (!viewer || !viewer.clock || !flightData) return;

    const remove = viewer.clock.onTick.addEventListener((clock) => {
      // 从 viewer.entities 里找飞机 entity
      const entity = viewer.entities.values.find(
        (e) => e.id === flightData.flightId
      );
      if (!entity) return;

      const pos = entity.position?.getValue(clock.currentTime);
      if (!pos) return;

      const carto = Cesium.Cartographic.fromCartesian(pos);
      const lon = Cesium.Math.toDegrees(carto.longitude);
      const lat = Cesium.Math.toDegrees(carto.latitude);
      const alt = carto.height;

      const elapsed = Cesium.JulianDate.secondsDifference(
        clock.currentTime,
        clock.startTime
      );
      const wp = snapshotFromWaypoints(flightData.waypoints, elapsed);
      const progress = Math.max(0, Math.min(1, elapsed / flightData.duration));

      setState({
        lon,
        lat,
        alt,
        speed: wp?.speed ?? 0,
        heading: wp?.heading ?? 0,
        phase: wp?.phase ?? 'cruise',
        progress,
      });
    });

    return () => {
      remove();
    };
  }, [viewer, flightData]);

  return (
    <div className="flight-info">
      <h3>飞行信息</h3>
      {state ? (
        <table>
          <tbody>
            <tr>
              <td>经纬度</td>
              <td>{formatLonLat(state.lon, state.lat)}</td>
            </tr>
            <tr>
              <td>高度</td>
              <td>{formatAlt(state.alt)}</td>
            </tr>
            <tr>
              <td>速度</td>
              <td>{formatSpeed(state.speed)}</td>
            </tr>
            <tr>
              <td>航向</td>
              <td>{formatHeading(state.heading)}</td>
            </tr>
            <tr>
              <td>阶段</td>
              <td>{state.phase}</td>
            </tr>
            <tr>
              <td>进度</td>
              <td>{(state.progress * 100).toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p className="hint">等待飞行数据...</p>
      )}
    </div>
  );
}
