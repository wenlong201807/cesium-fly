// src/utils/format.ts

/**
 * 经度 → 度分秒字符串
 * 用 padStart 把符号位、数值宽度对齐，避免卡片列宽抖动
 * @example
 * formatLonLat(116.397, 39.916) → " 116.397000°,   39.916000°"
 * formatLonLat(-73.778, 40.641) → "-073.778000°,   40.641000°"
 */
export function formatLonLat(lon: number, lat: number): string {
  return `${formatCoord(lon)}, ${formatCoord(lat)}`;
}

/** 固定宽度坐标：整数部分 3 位 + "." + 小数部分 6 位，共 10 字符 */
function formatCoord(deg: number): string {
  const sign = deg < 0 ? '-' : ' ';
  const abs = Math.abs(deg);
  // padStart 把整数凑满 3 位；小数固定 6 位；总宽 = 3 + 1 + 6 = 10
  const intPart = Math.floor(abs).toString().padStart(3, '0');
  const fracPart = (abs - Math.floor(abs)).toFixed(6).slice(2); // 截掉 "0."
  return `${sign}${intPart}.${fracPart}°`;
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
