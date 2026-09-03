// src/utils/format.ts

/** 经度 → 度分秒字符串 */
export function formatLonLat(lon: number, lat: number): string {
  return `${lon.toFixed(6)}°, ${lat.toFixed(6)}°`;
}

/** 米 → 千米 */
export function formatAlt(altMeters: number): string {
  if (altMeters >= 1000) {
    return `${(altMeters / 1000).toFixed(2)} km`;
  }
  return `${altMeters.toFixed(0)} m`;
}

/** km/h → 友好显示 */
export function formatSpeed(kmh: number): string {
  return `${kmh.toFixed(0)} km/h`;
}

/** 度 → 航向描述 */
export function formatHeading(heading: number): string {
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  const idx = Math.round((((heading % 360) + 360) % 360) / 45) % 8;
  return `${heading.toFixed(0)}° (${dirs[idx]})`;
}

/** 秒 → 时分秒 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  }
  return `${m}m ${s}s`;
}
