// src/types/flight.ts
// 与 mock/flight.mock.ts 和 mock-server/server.js 保持一致

/** 飞行阶段 */
export type FlightPhase = 'takeoff' | 'cruise' | 'landing';

/** 单个航点 */
export interface Waypoint {
  /** 相对起始时间（秒） */
  t: number;
  /** 经度 */
  lon: number;
  /** 纬度 */
  lat: number;
  /** 海拔（米） */
  alt: number;
  /** 航向角（度，0=正北，顺时针） */
  heading: number;
  /** 速度（km/h） */
  speed: number;
  /** 飞行阶段 */
  phase: FlightPhase;
}

/** 飞机模型信息 */
export interface AircraftInfo {
  name: string;
  /** 相对于 public 的路径 */
  model: string;
  minimumPixelSize: number;
}

/** 瓦片配置 */
export interface ImageryConfig {
  type: 'tianditu';
  layers: ('img' | 'cia' | 'vec' | 'cva' | 'ter')[];
}

/** 完整飞行数据 */
export interface FlightData {
  flightId: string;
  aircraft: AircraftInfo;
  imagery: ImageryConfig;
  /** 总飞行时长（秒） */
  duration: number;
  /** 是否循环播放 */
  loop: boolean;
  waypoints: Waypoint[];
}

/** 健康检查响应 */
export interface HealthResponse {
  status: 'ok';
  timestamp: number;
}
