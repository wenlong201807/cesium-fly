# ✈️ Cesium 飞机飞行可视化

> 基于 **React 18 + TypeScript + CesiumJS + Vite** 的 3D 飞机飞行可视化项目
> 数据从接口动态加载，瓦片数据按视口懒加载
> 完整版包含：播放控制、5 种视角切换、轨迹分段着色、鼠标拾取、飞行信息面板

![status](https://img.shields.io/badge/status-skeleton-yellow)
![react](https://img.shields.io/badge/react-18.3-blue)
![cesium](https://img.shields.io/badge/cesium-1.131+-orange)
![vite](https://img.shields.io/badge/vite-5.4-purple)

---

## 📋 目录

- [项目特性](#-项目特性)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [天地图 TK 申请](#-天地图-tk-申请)
- [项目结构](#-项目结构)
- [实现状态](#-实现状态)
- [Docker 部署](#-docker-部署)
- [常见问题](#-常见问题)

---

## ✨ 项目特性

- 🎬 **完整飞行过程**：从起飞 → 巡航 → 降落，按时间轴播放
- 🛰 **瓦片动态加载**：天地图 WMTS 瓦片按需请求，不预加载
- 🎮 **5 种视角**：跟踪、上方、侧方、自由、驾驶舱
- 🎨 **轨迹分段着色**：起飞(蓝) → 巡航(黄) → 降落(红)
- 🖱 **鼠标拾取**：点击飞机弹出信息面板
- 🐳 **Docker 一键部署**：前端 + mock-server 双容器
- 🌐 **Mock 接口**：开发用 `vite-plugin-mock`，生产用独立 Express 服务

---

## 🧰 技术栈

| 类别 | 选型 | 版本 |
|---|---|---|
| 前端框架 | React | 18.3 |
| 类型系统 | TypeScript | 5.5 |
| 构建工具 | Vite | 5.4 |
| 3D 引擎 | CesiumJS | 1.131+ |
| HTTP | Axios | 1.7 |
| Mock（开发） | vite-plugin-mock | 3.0 |
| Mock（生产） | Express + CORS | 4.21 |
| 容器化 | Docker + docker-compose | - |
| 反向代理 | nginx | 1.27 |
| 瓦片源 | 天地图 WMTS | - |

---

## 🚀 快速开始

### 1. 申请天地图 TK

参见下一节 [天地图 TK 申请](#-天地图-tk-申请)，拿到 32 位字符串。

### 2. 克隆 / 进入项目

```bash
cd /Users/zhuwenlong/Desktop/ai-study/cesium-fly
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
# 编辑 .env.local，把 VITE_TIANDITU_TK=... 替换成你的 tk
```

### 4. 安装依赖

```bash
npm install
```

### 5. 启动开发服务器

```bash
npm run dev
# 浏览器打开 http://localhost:5173
```

开发环境会自动启用 `vite-plugin-mock`，无需启动后端。

### 6. 验证 mock 接口

```bash
curl http://localhost:5173/api/health
# {"status":"ok","timestamp":1725000000000}

curl http://localhost:5173/api/flight/data | head -c 500
```

---

## 🗺 天地图 TK 申请

> **官方入口**：<https://console.tianditu.gov.cn/api/key>
>
> 或新版：<https://cloudcenter.tianditu.gov.cn/> → 登录 → 「应用」→「创建应用」

### 申请步骤

1. **注册账号**（手机号 + 实名认证）
2. 进入「控制台」→「应用管理」→「创建应用」
3. **应用类型必须选「浏览器端」**（不是「服务端」！）
4. 填写应用名称、域名白名单（开发阶段填 `*` 或 `localhost`）
5. 提交 → 复制 32 位 tk

### 验证 tk 是否可用

浏览器访问（替换 `<tk>` 为你的 tk）：

```
https://t0.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix=1&TileRow=0&TileCol=0&style=default&format=tiles&tk=<tk>
```

看到一张瓦片图片 → tk 可用。

### 支持的图层（在 `mock/flight.mock.ts` 配置）

| 图层代码 | 含义 |
|---|---|
| `img` | 影像底图（卫星图） |
| `cia` | 影像注记（地名） |
| `vec` | 矢量底图（线划图） |
| `cva` | 矢量注记 |
| `ter` | 地形晕渲 |

---

## 📁 项目结构

```
cesium-fly/
├── README.md                       ← 本文件
├── package.json                    ← 依赖配置
├── vite.config.ts                  ← Vite + Cesium + Mock 配置
├── tsconfig.json
├── tsconfig.node.json
├── index.html
├── .env.example                    ← tk 配置示例
├── .env.local                      ← 你的 tk（git ignore）
├── .gitignore
├── .dockerignore
├── Dockerfile                      ← 多阶段构建（node build → nginx）
├── docker-compose.yml              ← 双容器编排
├── nginx.conf                      ← 反代 /api → mock-server
│
├── mock/                           ← vite-plugin-mock 数据（仅开发）
│   └── flight.mock.ts
│
├── mock-server/                    ← 生产环境独立 mock 后端
│   ├── package.json
│   ├── Dockerfile
│   └── server.js
│
├── public/
│   └── models/
│       ├── feiji.glb               ← 飞机模型（已就位）
│       └── README.md               ← 模型说明
│
└── src/
    ├── main.tsx                    ← React 入口
    ├── App.tsx                     ← 根组件
    ├── App.css                     ← 全局样式
    │
    ├── config/
    │   └── tianditu.ts             ← 天地图 URL 工厂
    │
    ├── types/
    │   └── flight.ts               ← 数据类型定义
    │
    ├── api/
    │   └── flight.ts               ← axios 封装
    │
    ├── cesium/                     ← Cesium 业务逻辑
    │   ├── createViewer.ts         ← Viewer 初始化
    │   ├── loadImagery.ts          ← 瓦片动态加载
    │   ├── createFlight.ts         ← 飞行实体创建
    │   ├── cameraViews.ts          ← 5 种视角
    │   └── mousePick.ts            ← 鼠标拾取
    │
    ├── hooks/
    │   ├── useCesium.ts            ← viewer 单例
    │   └── useFlight.ts            ← 数据加载
    │
    ├── components/
    │   ├── CesiumViewer.tsx        ← 容器组件
    │   ├── ControlPanel.tsx        ← 播放控制
    │   ├── ViewSwitcher.tsx        ← 视角切换
    │   ├── FlightInfo.tsx          ← 信息面板
    │   └── ProgressBar.tsx         ← 时间轴
    │
    └── utils/
        └── format.ts               ← 经纬度/时间格式化
```

---

## ⏳ 实现状态

> 当前是**项目骨架**，核心 Cesium 业务代码留有 TODO 占位。
> 下一步我会按以下顺序实现：

| 顺序 | 文件 | 任务 | 状态 |
|---|---|---|---|
| 1 | `createViewer.ts` | 初始化 Viewer，关掉所有 widget | ⏳ TODO |
| 2 | `loadImagery.ts` | 用 UrlTemplateImageryProvider 加载天地图 | ⏳ TODO |
| 3 | `createFlight.ts` | SampledPositionProperty + GLB + 轨迹 | ⏳ TODO |
| 4 | `cameraViews.ts` | 5 种视角 | ⏳ TODO |
| 5 | `mousePick.ts` | 鼠标拾取 + 信息回调 | ⏳ TODO |
| 6 | `useCesium.ts` | 串联上述模块 | ⏳ TODO |
| 7 | `CesiumViewer.tsx` | 渲染所有控件组件 | ⏳ TODO |
| 8 | `FlightInfo.tsx` | 实时数据计算 | ⏳ TODO |
| 9 | `ProgressBar.tsx` | 拖动跳转 | ⏳ TODO |

### 关键 API 速查（实现时参考）

```typescript
// 1. 初始化
const viewer = new Cesium.Viewer(container, { imageryProvider: false, ... });

// 2. 加载瓦片
viewer.imageryLayers.addImageryProvider(
  new Cesium.UrlTemplateImageryProvider({
    url: 'https://t{s}.tianditu.gov.cn/img_w/wmts?...&tk=...',
    subdomains: ['0','1','2','3','4','5','6','7'],
  })
);

// 3. 飞行
const position = new Cesium.SampledPositionProperty();
const start = Cesium.JulianDate.fromIso8601('2026-09-03T10:00:00Z');
waypoints.forEach(wp => {
  const t = Cesium.JulianDate.addSeconds(start, wp.t, new Cesium.JulianDate());
  position.addSample(t, Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat, wp.alt));
});
position.setInterpolationOptions({
  interpolationDegree: 5,
  interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
});

const entity = viewer.entities.add({
  availability: new Cesium.TimeIntervalCollection([
    new Cesium.TimeInterval({ start, stop: ... }),
  ]),
  position,
  orientation: new Cesium.VelocityOrientationProperty(position),
  model: { uri: '/models/feiji.glb', minimumPixelSize: 96 },
  path: { material: new Cesium.PolylineGlowMaterialProperty(...) },
});

// 4. 时钟
viewer.clock.startTime = start.clone();
viewer.clock.stopTime = stop.clone();
viewer.clock.currentTime = start.clone();
viewer.clock.multiplier = 10;
viewer.clock.shouldAnimate = true;

// 5. 视角
viewer.trackedEntity = entity;  // 跟踪
viewer.zoomTo(entity, new Cesium.HeadingPitchRange(0, -Math.PI/2, 0));  // 上方
```

参考源码：
- `/Users/zhuwenlong/Desktop/ai-study/nestjs-sys/Cesium-Examples/examples/cesiumEx/1.8、时间运动.html`
- `/Users/zhuwenlong/Desktop/ai-study/nestjs-sys/cesiumjs-skills/skills/cesiumjs-time-properties/SKILL.md`（380-414 行）

---

## 🐳 Docker 部署

### 一键启动

```bash
docker-compose up -d --build
```

服务启动后：
- **前端**：<http://localhost:8080>
- **Mock API**（内部）：`http://mock-server:3000/api/flight/data`

### 停止

```bash
docker-compose down
```

### 架构

```
浏览器 (8080)
  ↓
nginx (web 容器)
  ├─ /         → 静态文件（dist/）
  └─ /api/*    → 反向代理 → mock-server:3000
                  ↓
              Express (mock-server 容器)
                  ↓
              flightData (硬编码 JSON)
```

### 资源占用

| 容器 | 镜像大小 | 内存 |
|---|---|---|
| web | ~50MB | ~30MB |
| mock-server | ~60MB | ~20MB |

---

## ❓ 常见问题

### Q1: 启动后页面是黑的？

检查：
1. 浏览器控制台报错 → 大概率是 tk 未配置
2. `.env.local` 是否在项目根目录，且变量名是 `VITE_TIANDITU_TK`
3. 申请的应用类型是否为「浏览器端」

### Q2: 瓦片加载失败 (CORS / 401 / 403)

- 401/403 → tk 错误或过期
- CORS → 浏览器端 + 域名白名单未配置（开发可填 `*`）
- 国外访问天地图较慢，可临时换成 OSM

### Q3: 飞机模型看不见？

1. 检查 `public/models/feiji.glb` 是否存在
2. 浏览器打开 <http://localhost:5173/models/feiji.glb> 能下载
3. 模型默认朝前是 X 轴正向，飞机可能朝东/朝北/被遮挡，可以旋转：
   ```typescript
   model: {
     uri: '/models/feiji.glb',
     minimumPixelSize: 96,
     // 旋转 90° 让飞机朝北
     nodeTransformations: ... // 可选
   }
   ```

### Q4: Docker 镜像太大？

`Dockerfile` 已经用多阶段构建，只把 `dist/` 拷到 nginx。
镜像大约 50MB，符合预期。

### Q5: 怎么换成全球航线？

修改 `mock/flight.mock.ts` 中的 `waypoints`，经纬度改成全球任何位置即可。
瓦片源已用天地图，全球范围都覆盖。

---

## 📚 参考资源

### 本地项目

| 项目 | 用途 |
|---|---|
| `/Users/zhuwenlong/Desktop/ai-study/nestjs-sys/Cesium-Examples/examples/cesiumEx/1.8、时间运动.html` | 完整飞行 demo |
| `/Users/zhuwenlong/Desktop/ai-study/nestjs-sys/Cesium-Examples/examples/cesiumEx/Roaming.js` | 漫游类（增强参考） |
| `/Users/zhuwenlong/Desktop/ai-study/nestjs-sys/cesiumjs-skills/skills/cesiumjs-time-properties/SKILL.md` | 时间系统 API |
| `/Users/zhuwenlong/Desktop/ai-study/nestjs-sys/cesiumjs-skills/skills/cesiumjs-imagery/SKILL.md` | 瓦片加载 API |
| `/Users/zhuwenlong/Desktop/ai-study/nestjs-sys/cesiumjs-skills/skills/cesiumjs-viewer-setup/SKILL.md` | Viewer 初始化 |

### 在线文档

- Cesium 官方：<https://cesium.com/docs/>
- 天地图 API：<https://console.tianditu.gov.cn/api/key>
- Vite：<https://vitejs.dev/>
- vite-plugin-cesium：<https://github.com/isaacbrodsky/vite-plugin-cesium>

---

## 📜 License

MIT

---

**生成日期**：2026-09-03
**状态**：🟡 骨架就绪，等待核心逻辑实现
**下一步**：按"实现状态"表格顺序填充 TODO