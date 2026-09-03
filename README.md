# Cesium 飞机飞行可视化

> 基于 **React 18 + TypeScript + CesiumJS + Vite** 的 3D 飞机飞行可视化项目
> 数据从接口动态加载，瓦片数据按视口懒加载
> 完整版包含：播放控制、5 种视角切换、轨迹分段着色、鼠标拾取、飞行信息面板

![status](https://img.shields.io/badge/status-stable-green)
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
- [开发指南](#-开发指南)
- [部署指南](#-部署指南)
- [常见问题](#-常见问题)

---

## ✨ 项目特性

- 🎬 **完整飞行过程**：从起飞 → 巡航 → 降落，按时间轴播放（默认暂停）
- 🛰 **瓦片动态加载**：天地图 WMTS 瓦片按需请求，不预加载
- 🎮 **5 种视角**：跟踪、上方、侧方、自由、驾驶舱（默认驾驶舱）
- 🎨 **轨迹分段着色**：起飞(蓝) → 巡航(黄) → 降落(红)
- 🖱 **鼠标拾取**：点击飞机弹出信息面板
- 🐳 **Docker 一键部署**：前端 + mock-server 双容器（加固版）
- 🌐 **Mock 接口**：开发用 `vite-plugin-mock`，生产用独立 Express 服务
- ⚡ **性能优化**：nginx gzip + 静态资源 immutable 缓存
- 🔒 **安全加固**：CSP / X-Frame-Options / 限流 / read-only fs / no-new-privileges
- 🪶 **轻量**：单实例 < 200MB 内存

---

## 🧰 技术栈

| 类别         | 选型                    | 版本   |
| ------------ | ----------------------- | ------ |
| 前端框架     | React                   | 18.3   |
| 类型系统     | TypeScript              | 5.5    |
| 构建工具     | Vite                    | 5.4    |
| 3D 引擎      | CesiumJS                | 1.131+ |
| HTTP         | Axios                   | 1.7    |
| Lint         | oxlint                  | 1.x    |
| Format       | Prettier                | 3.4    |
| Test         | Vitest                  | 2.x    |
| Hook         | Husky                   | 9.x    |
| Mock（开发） | vite-plugin-mock        | 3.0    |
| Mock（生产） | Express + CORS          | 4.21   |
| 容器化       | Docker + docker-compose | -      |
| 反向代理     | nginx                   | 1.27   |
| 瓦片源       | 天地图 WMTS             | -      |

---

## 🚀 快速开始

### 1. 申请天地图 TK

参见下一节 [天地图 TK 申请](#-天地图-tk-申请)，拿到 32 位字符串。

### 2. 克隆 / 进入项目

```bash
git clone <repo> cesium-fly
cd cesium-fly
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
# 编辑 .env.local，把 VITE_TIANDITU_TK=... 替换成你的 tk
```

### 4. 安装依赖

```bash
pnpm install
```

### 5. 启动开发服务器

```bash
pnpm dev
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

| 图层代码 | 含义               |
| -------- | ------------------ |
| `img`    | 影像底图（卫星图） |
| `cia`    | 影像注记（地名）   |
| `vec`    | 矢量底图（线划图） |
| `cva`    | 矢量注记           |
| `ter`    | 地形晕渲           |

---

## 📁 项目结构

```
cesium-fly/
├── README.md                       ← 本文件
├── package.json                    ← 依赖配置
├── vite.config.ts                  ← Vite + Cesium + Mock 配置
├── vitest.config.ts                ← Vitest 测试配置
├── tsconfig.json                   ← 主 TypeScript 配置
├── tsconfig.node.json              ← 用于编译 vite.config.ts
├── .oxlintrc.json                  ← oxlint 配置
├── .prettierrc.json                ← Prettier 配置
├── .prettierignore
├── .husky/pre-commit               ← Git 提交钩子
├── .github/workflows/ci.yml        ← GitHub Actions CI
├── index.html
├── .env.example                    ← tk 配置示例
├── .env.local                      ← 你的 tk（git ignore）
├── .gitignore
├── .dockerignore
│
├── script/
│   ├── docker/
│   │   ├── Dockerfile              ← 前端镜像（加固版）
│   │   ├── docker-compose.yml      ← 容器编排
│   │   └── nginx.conf              ← nginx 加固配置
│   └── deploy/
│       ├── deploy.sh               ← Linux 一键部署
│       ├── uninstall.sh            ← 卸载脚本
│       ├── healthcheck.sh          ← 健康检查
│       ├── monitor.sh              ← 定时监控
│       └── README.md               ← 部署指南
│
├── mock/                           ← vite-plugin-mock 数据（仅开发）
│   └── flight.mock.ts
│
├── mock-server/                    ← 生产环境独立 mock 后端
│   ├── package.json
│   ├── Dockerfile                  ← mock-server 加固版镜像
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
    │   ├── useCesium.ts            ← viewer 单例（StrictMode 安全）
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
        ├── format.ts               ← 经纬度/时间格式化
        └── format.test.ts          ← 单元测试
```

---

## 👨‍💻 开发指南

### 可用脚本

```bash
pnpm dev              # 启动开发服务器
pnpm build            # 生产构建
pnpm preview          # 预览生产构建
pnpm tsc -b           # 类型检查
pnpm lint             # oxlint 检查
pnpm format           # Prettier 格式化
pnpm format:check     # 检查格式
pnpm test             # 运行单元测试
pnpm test:watch       # 监听模式测试
```

### Git 提交

仓库已配置 `husky` pre-commit 钩子，提交前会跑 tsc / lint / format / test。失败会拒绝提交。

如需跳过（紧急情况）：

```bash
git commit --no-verify -m "..."
```

### 添加新视角

在 `src/cesium/cameraViews.ts` 中加 case，`src/components/ViewSwitcher.tsx` 加按钮。

### 添加新 mock 航线

修改 `mock/flight.mock.ts` 中的 `waypoints` 数组（开发环境）或 `mock-server/server.js`（生产环境）。

---

## 🐳 部署指南

### 一键部署（推荐）

```bash
# 在 Linux 服务器上
cd /opt/cesium-fly
bash script/deploy/deploy.sh --tk YOUR_TK --port 8080
```

服务启动后：

- **前端**：<http://localhost:8080>
- **健康检查**：<http://localhost:8080/nginx-health>

### 手动部署

```bash
# 构建并启动
docker compose -f script/docker/docker-compose.yml up -d --build

# 查看日志
docker compose -f script/docker/docker-compose.yml logs -f

# 停止
docker compose -f script/docker/docker-compose.yml down
```

### 架构

```
浏览器 (8080)
  ↓
nginx (web 容器 / 80)
  ├─ /         → 静态文件（dist/）
  └─ /api/*    → 反向代理 → mock-server:3000
                  ↓
              Express (mock-server 容器)
                  ↓
              flightData (硬编码 JSON)
```

### 资源占用

| 容器        | 镜像大小 | 内存上限 |
| ----------- | -------- | -------- |
| web         | ~50MB    | 128MB    |
| mock-server | ~60MB    | 64MB     |

### 安全特性

- ✅ `read_only: true` 文件系统
- ✅ `no-new-privileges` 防提权
- ✅ `cap_drop ALL`（nginx:alpine 默认）
- ✅ 非 root 用户运行（mock-server）
- ✅ 内网通信（mock-server 不暴露端口）
- ✅ nginx 安全头（CSP / X-Frame-Options / X-Content-Type-Options / HSTS / Referrer-Policy）
- ✅ nginx 限流（10r/s + burst 20）
- ✅ 隐藏 nginx 版本
- ✅ 健康检查 + 自动重启

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
3. 模型默认朝前是 X 轴正向，飞机可能朝东/朝北/被遮挡

### Q4: Docker 镜像太大？

`Dockerfile` 已经用多阶段构建，只把 `dist/` 拷到 nginx。
镜像大约 50MB，符合预期。

### Q5: 怎么换成全球航线？

修改 `mock/flight.mock.ts` 中的 `waypoints`，经纬度改成全球任何位置即可。
瓦片源已用天地图，全球范围都覆盖。

### Q6: 健康检查失败怎么办？

```bash
# 1. 看容器状态
docker compose -f script/docker/docker-compose.yml ps

# 2. 看 web 日志
docker compose -f script/docker/docker-compose.yml logs web

# 3. 看 mock-server 日志
docker compose -f script/docker/docker-compose.yml logs mock-server

# 4. 手动跑健康检查脚本
bash script/deploy/healthcheck.sh
```

---

## 📚 参考资源

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
**状态**：✅ 第二版（驾驶舱默认视角 + 部署加固 + 项目基础设施）
