// src/cesium/mousePick.ts
// 鼠标左键拾取飞机 entity，把命中信息回调出去
import * as Cesium from 'cesium';
import type { Waypoint } from '../types/flight';

export interface PickInfo {
  id: string;
  lon: number;
  lat: number;
  alt: number;
  speed: number;
  heading: number;
  phase: Waypoint['phase'];
}

export function setupMousePick(
  viewer: Cesium.Viewer,
  waypoints: Waypoint[],
  startTime: Cesium.JulianDate,
  onPick: (info: PickInfo | null) => void
): () => void {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

  handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
    const picked = viewer.scene.pick(click.position);
    if (!picked || !picked.id) {
      onPick(null);
      return;
    }
    const entity = picked.id as Cesium.Entity;
    const pos = entity.position?.getValue(viewer.clock.currentTime);
    if (!pos) {
      onPick(null);
      return;
    }
    const carto = Cesium.Cartographic.fromCartesian(pos);
    const lon = Cesium.Math.toDegrees(carto.longitude);
    const lat = Cesium.Math.toDegrees(carto.latitude);
    const alt = carto.height;
    const wp = findClosestWaypoint(
      waypoints,
      viewer.clock.currentTime,
      startTime
    );

    onPick({
      id: String(entity.id),
      lon,
      lat,
      alt,
      speed: wp?.speed ?? 0,
      heading: wp?.heading ?? 0,
      phase: wp?.phase ?? 'cruise',
    });
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  return () => handler.destroy();
}

function findClosestWaypoint(
  waypoints: Waypoint[],
  current: Cesium.JulianDate,
  base: Cesium.JulianDate
): Waypoint | null {
  if (waypoints.length === 0) return null;
  const elapsed = Cesium.JulianDate.secondsDifference(current, base);
  let best: Waypoint | null = null;
  let bestDiff = Infinity;
  for (const wp of waypoints) {
    const d = Math.abs(wp.t - elapsed);
    if (d < bestDiff) {
      bestDiff = d;
      best = wp;
    }
  }
  return best;
}
