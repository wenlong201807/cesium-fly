// mock-server/server.js
// 生产环境的 mock 数据后端（开发环境用 vite-plugin-mock）
// 这里输出的接口格式必须与 vite-plugin-mock 完全一致
import express from 'express';
import cors from 'cors';

const app = express();

// 仅允许同源（生产环境：nginx 反代，不暴露端口给外部）
// Docker 内网直接用 IP 访问也走同源策略
const corsOptions = {
  origin: false, // 拒绝跨域（nginx 已做反向代理，同源不会跨域）
  methods: ['GET'], // 只允许 GET
  allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));
app.use(express.json());

// ============================================================
// TODO: 与 src/types/flight.ts 的 Waypoint / FlightData 保持一致
// ============================================================
const flightData = {
  flightId: 'CA1501',
  aircraft: {
    name: 'Airbus A320',
    model: '/models/feiji.glb',
    minimumPixelSize: 96,
  },
  imagery: {
    type: 'tianditu',
    layers: ['img', 'cia'], // 影像底图 + 注记
  },
  duration: 420, // 总飞行时长（秒）
  loop: false,
  waypoints: [
    // 起飞段：低空、慢速
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
    // 巡航段：万米高空、匀速
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
    // 降落段：减速、下降
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

// ============================================================
// 路由
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/flight/data', (req, res) => {
  res.json(flightData);
});

// 启动
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock server listening on http://0.0.0.0:${PORT}`);
});
