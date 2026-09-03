// src/data/routes.mock.ts
// 多航线 Mock 数据：4 条国内主要航线（用于 Routes 页对比演示）
import type { FlightData } from '../types/flight';

const commonImagery: import('../types/flight').ImageryConfig = {
  type: 'tianditu',
  layers: ['img', 'cia'],
};
const commonAircraft = {
  name: 'Airbus A320',
  model: '/models/feiji.glb',
  minimumPixelSize: 128,
};

export interface RouteEntry {
  /** 路由标识 */
  id: string;
  /** 显示名 */
  name: string;
  /** 路径颜色（CSS） */
  color: string;
  /** 描述 */
  description: string;
  /** 飞行数据 */
  data: FlightData;
}

/** 北京 → 上海（参考真实航线） */
const pek2sha: RouteEntry = {
  id: 'PEK-SHA',
  name: 'PEK → SHA',
  color: '#4a90e2',
  description: '北京首都 → 上海虹桥（约 1080 km）',
  data: {
    flightId: 'CA1501',
    aircraft: { ...commonAircraft, name: 'Airbus A320 (CA1501)' },
    imagery: commonImagery,
    duration: 420,
    loop: false,
    waypoints: [
      {
        t: 0,
        lon: 116.397,
        lat: 39.916,
        alt: 50,
        heading: 60,
        speed: 80,
        phase: 'takeoff',
      },
      {
        t: 30,
        lon: 116.5,
        lat: 39.94,
        alt: 800,
        heading: 65,
        speed: 220,
        phase: 'takeoff',
      },
      {
        t: 60,
        lon: 116.65,
        lat: 39.96,
        alt: 2000,
        heading: 70,
        speed: 350,
        phase: 'takeoff',
      },
      {
        t: 90,
        lon: 117.0,
        lat: 39.5,
        alt: 8000,
        heading: 90,
        speed: 750,
        phase: 'cruise',
      },
      {
        t: 150,
        lon: 118.5,
        lat: 39.2,
        alt: 10000,
        heading: 100,
        speed: 820,
        phase: 'cruise',
      },
      {
        t: 240,
        lon: 120.3,
        lat: 38.8,
        alt: 10500,
        heading: 110,
        speed: 820,
        phase: 'cruise',
      },
      {
        t: 330,
        lon: 121.5,
        lat: 37.5,
        alt: 9500,
        heading: 130,
        speed: 750,
        phase: 'cruise',
      },
      {
        t: 360,
        lon: 121.8,
        lat: 36.8,
        alt: 4000,
        heading: 150,
        speed: 450,
        phase: 'landing',
      },
      {
        t: 390,
        lon: 121.95,
        lat: 36.3,
        alt: 1500,
        heading: 160,
        speed: 280,
        phase: 'landing',
      },
      {
        t: 420,
        lon: 122.0,
        lat: 36.066,
        alt: 50,
        heading: 170,
        speed: 80,
        phase: 'landing',
      },
    ],
  },
};

/** 北京 → 广州 */
const pek2can: RouteEntry = {
  id: 'PEK-CAN',
  name: 'PEK → CAN',
  color: '#e74c3c',
  description: '北京首都 → 广州白云（约 1900 km）',
  data: {
    flightId: 'CA1301',
    aircraft: { ...commonAircraft, name: 'Boeing 737 (CA1301)' },
    imagery: commonImagery,
    duration: 540,
    loop: false,
    waypoints: [
      {
        t: 0,
        lon: 116.397,
        lat: 39.916,
        alt: 50,
        heading: 180,
        speed: 80,
        phase: 'takeoff',
      },
      {
        t: 30,
        lon: 116.6,
        lat: 39.7,
        alt: 1000,
        heading: 185,
        speed: 240,
        phase: 'takeoff',
      },
      {
        t: 90,
        lon: 116.9,
        lat: 38.5,
        alt: 6000,
        heading: 195,
        speed: 650,
        phase: 'cruise',
      },
      {
        t: 180,
        lon: 117.2,
        lat: 36.8,
        alt: 9000,
        heading: 200,
        speed: 780,
        phase: 'cruise',
      },
      {
        t: 270,
        lon: 116.5,
        lat: 35.0,
        alt: 9800,
        heading: 210,
        speed: 800,
        phase: 'cruise',
      },
      {
        t: 360,
        lon: 114.5,
        lat: 32.5,
        alt: 10200,
        heading: 220,
        speed: 820,
        phase: 'cruise',
      },
      {
        t: 420,
        lon: 113.8,
        lat: 30.8,
        alt: 8500,
        heading: 230,
        speed: 720,
        phase: 'cruise',
      },
      {
        t: 480,
        lon: 113.4,
        lat: 24.5,
        alt: 3500,
        heading: 240,
        speed: 450,
        phase: 'landing',
      },
      {
        t: 510,
        lon: 113.3,
        lat: 23.4,
        alt: 1500,
        heading: 245,
        speed: 280,
        phase: 'landing',
      },
      {
        t: 540,
        lon: 113.27,
        lat: 23.13,
        alt: 50,
        heading: 250,
        speed: 80,
        phase: 'landing',
      },
    ],
  },
};

/** 上海 → 深圳 */
const sha2szx: RouteEntry = {
  id: 'SHA-SZX',
  name: 'SHA → SZX',
  color: '#f5a623',
  description: '上海浦东 → 深圳宝安（约 1300 km）',
  data: {
    flightId: 'MU5301',
    aircraft: { ...commonAircraft, name: 'Airbus A321 (MU5301)' },
    imagery: commonImagery,
    duration: 450,
    loop: false,
    waypoints: [
      {
        t: 0,
        lon: 121.808,
        lat: 31.144,
        alt: 50,
        heading: 220,
        speed: 80,
        phase: 'takeoff',
      },
      {
        t: 30,
        lon: 121.5,
        lat: 30.8,
        alt: 1000,
        heading: 225,
        speed: 240,
        phase: 'takeoff',
      },
      {
        t: 90,
        lon: 120.8,
        lat: 30.0,
        alt: 6000,
        heading: 230,
        speed: 650,
        phase: 'cruise',
      },
      {
        t: 180,
        lon: 119.5,
        lat: 28.8,
        alt: 9000,
        heading: 235,
        speed: 780,
        phase: 'cruise',
      },
      {
        t: 270,
        lon: 117.5,
        lat: 27.0,
        alt: 9800,
        heading: 240,
        speed: 800,
        phase: 'cruise',
      },
      {
        t: 330,
        lon: 115.8,
        lat: 25.2,
        alt: 9200,
        heading: 245,
        speed: 760,
        phase: 'cruise',
      },
      {
        t: 390,
        lon: 114.2,
        lat: 23.8,
        alt: 3500,
        heading: 250,
        speed: 450,
        phase: 'landing',
      },
      {
        t: 420,
        lon: 114.0,
        lat: 23.0,
        alt: 1500,
        heading: 255,
        speed: 280,
        phase: 'landing',
      },
      {
        t: 450,
        lon: 113.92,
        lat: 22.639,
        alt: 50,
        heading: 260,
        speed: 80,
        phase: 'landing',
      },
    ],
  },
};

/** 重庆 → 北京 */
const ckg2pek: RouteEntry = {
  id: 'CKG-PEK',
  name: 'CKG → PEK',
  color: '#9b59b6',
  description: '重庆江北 → 北京首都（约 1700 km）',
  data: {
    flightId: 'CA1432',
    aircraft: { ...commonAircraft, name: 'Boeing 737 (CA1432)' },
    imagery: commonImagery,
    duration: 500,
    loop: false,
    waypoints: [
      {
        t: 0,
        lon: 106.642,
        lat: 29.719,
        alt: 50,
        heading: 30,
        speed: 80,
        phase: 'takeoff',
      },
      {
        t: 30,
        lon: 106.8,
        lat: 30.0,
        alt: 1000,
        heading: 28,
        speed: 240,
        phase: 'takeoff',
      },
      {
        t: 90,
        lon: 107.5,
        lat: 31.0,
        alt: 6000,
        heading: 25,
        speed: 650,
        phase: 'cruise',
      },
      {
        t: 180,
        lon: 109.5,
        lat: 33.0,
        alt: 9000,
        heading: 22,
        speed: 780,
        phase: 'cruise',
      },
      {
        t: 270,
        lon: 112.0,
        lat: 35.5,
        alt: 9800,
        heading: 18,
        speed: 800,
        phase: 'cruise',
      },
      {
        t: 360,
        lon: 114.5,
        lat: 38.0,
        alt: 9500,
        heading: 15,
        speed: 780,
        phase: 'cruise',
      },
      {
        t: 420,
        lon: 115.8,
        lat: 39.4,
        alt: 4000,
        heading: 10,
        speed: 500,
        phase: 'landing',
      },
      {
        t: 470,
        lon: 116.2,
        lat: 39.75,
        alt: 1500,
        heading: 5,
        speed: 280,
        phase: 'landing',
      },
      {
        t: 500,
        lon: 116.397,
        lat: 39.916,
        alt: 50,
        heading: 0,
        speed: 80,
        phase: 'landing',
      },
    ],
  },
};

export const ROUTES: RouteEntry[] = [pek2sha, pek2can, sha2szx, ckg2pek];

/** 计算航线总距离（km）—— Haversine 公式 */
export function calcDistanceKm(
  waypoints: { lon: number; lat: number }[]
): number {
  if (waypoints.length < 2) return 0;
  let total = 0;
  const R = 6371; // km
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lon - a.lon) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    total += 2 * R * Math.asin(Math.sqrt(h));
  }
  return total;
}
