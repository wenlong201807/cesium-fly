// mock/flight.mock.ts
// vite-plugin-mock 数据文件（仅开发环境生效）
// 生产环境由 mock-server/server.js 提供相同数据
import type { MockMethod } from 'vite-plugin-mock';

const flightData = {
  flightId: 'CA1501',
  aircraft: {
    name: 'Airbus A320',
    model: '/models/feiji.glb',
    minimumPixelSize: 96,
  },
  imagery: {
    type: 'tianditu',
    layers: ['img', 'cia'],
  },
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
};

export default [
  {
    url: '/api/health',
    method: 'get',
    response: () => ({ status: 'ok', timestamp: Date.now() }),
  },
  {
    url: '/api/flight/data',
    method: 'get',
    response: () => flightData,
  },
] as MockMethod[];
