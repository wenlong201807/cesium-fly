// src/data/decision.mock.ts
// 自动驾驶决策仿真 Mock 数据
// 含：自车、周围车辆、障碍物、场景配置

export type DecisionState =
  | 'cruise' // 巡航
  | 'follow' // 跟车
  | 'lane_change' // 变道
  | 'overtake' // 超车
  | 'brake' // 刹车
  | 'stop'; // 停车

export interface VehicleAgent {
  id: string;
  /** 显示名 */
  name: string;
  /** 是自车 */
  isEgo: boolean;
  /** 经度 */
  lon: number;
  /** 纬度 */
  lat: number;
  /** 高度（米） */
  alt: number;
  /** 速度（m/s） */
  speed: number;
  /** 航向（度） */
  heading: number;
  /** 当前决策状态 */
  state: DecisionState;
  /** 决策置信度 0~1 */
  confidence: number;
  /** 模型路径 */
  model: string;
  /** 当前车道的纵向距离（米，>0 在前方，<0 在后方） */
  longitudinalGap?: number;
  /** 横向偏移（米，正右负左） */
  lateralOffset?: number;
  /** 意图预测文本 */
  intent?: string;
}

/** 自车 + 周围 5 辆车的初始数据 */
export const SCENARIO_AGENTS: VehicleAgent[] = [
  // 自车
  {
    id: 'ego',
    name: '自车 (EGO)',
    isEgo: true,
    lon: 116.397,
    lat: 39.916,
    alt: 0,
    speed: 15, // ~54 km/h
    heading: 90,
    state: 'cruise',
    confidence: 0.95,
    model: '/models/car.glb',
  },
  // 前车（同车道，正前方）
  {
    id: 'front',
    name: '前方慢车',
    isEgo: false,
    lon: 116.3975,
    lat: 39.916,
    alt: 0,
    speed: 8,
    heading: 90,
    state: 'cruise',
    confidence: 0,
    model: '/models/car.glb',
    longitudinalGap: 30,
    lateralOffset: 0,
    intent: '持续低速巡航',
  },
  // 左前车（左车道）
  {
    id: 'left_front',
    name: '左侧前方',
    isEgo: false,
    lon: 116.3975,
    lat: 39.9168,
    alt: 0,
    speed: 18,
    heading: 90,
    state: 'cruise',
    confidence: 0,
    model: '/models/car.glb',
    longitudinalGap: 20,
    lateralOffset: 3.5,
    intent: '快速接近',
  },
  // 左后车
  {
    id: 'left_rear',
    name: '左侧后方',
    isEgo: false,
    lon: 116.3967,
    lat: 39.9168,
    alt: 0,
    speed: 20,
    heading: 90,
    state: 'cruise',
    confidence: 0,
    model: '/models/car.glb',
    longitudinalGap: -15,
    lateralOffset: 3.5,
    intent: '正在加速',
  },
  // 右后车
  {
    id: 'right_rear',
    name: '右侧后方',
    isEgo: false,
    lon: 116.3967,
    lat: 39.9152,
    alt: 0,
    speed: 16,
    heading: 90,
    state: 'cruise',
    confidence: 0,
    model: '/models/car.glb',
    longitudinalGap: -10,
    lateralOffset: -3.5,
    intent: '正常行驶',
  },
  // 远车（演示多样性）
  {
    id: 'far_ahead',
    name: '远前方',
    isEgo: false,
    lon: 116.402,
    lat: 39.916,
    alt: 0,
    speed: 12,
    heading: 90,
    state: 'cruise',
    confidence: 0,
    model: '/models/car.glb',
    longitudinalGap: 80,
    lateralOffset: 0,
    intent: '远距目标',
  },
];

/** 决策状态机的可能转换 */
export const STATE_TRANSITIONS: Record<DecisionState, DecisionState[]> = {
  cruise: ['follow', 'overtake', 'brake'],
  follow: ['cruise', 'lane_change', 'brake'],
  lane_change: ['cruise', 'follow', 'overtake'],
  overtake: ['cruise', 'lane_change'],
  brake: ['stop', 'follow', 'cruise'],
  stop: ['cruise', 'follow'],
};

/** 状态 → 显示颜色（CSS） */
export const STATE_COLOR: Record<DecisionState, string> = {
  cruise: '#4a90e2', // 蓝
  follow: '#f5a623', // 黄
  lane_change: '#9b59b6', // 紫
  overtake: '#2ecc71', // 绿
  brake: '#e74c3c', // 红
  stop: '#95a5a6', // 灰
};

/** 状态 → 中文描述 */
export const STATE_LABEL: Record<DecisionState, string> = {
  cruise: '🚗 巡航',
  follow: '🔄 跟车',
  lane_change: '↔ 变道',
  overtake: '⚡ 超车',
  brake: '🛑 刹车',
  stop: '⏸ 停车',
};

/** 预设决策场景 */
export const SCENARIOS = [
  {
    id: 'normal_cruise',
    name: '正常巡航',
    description: '5 个周边车辆各行其道，自车巡航',
    duration: 30, // 秒
  },
  {
    id: 'emergency_brake',
    name: '紧急刹车',
    description: '前车突然减速，自车检测后紧急制动',
    duration: 20,
  },
  {
    id: 'lane_change_overtake',
    name: '变道超车',
    description: '前车缓慢，自车变道超越',
    duration: 25,
  },
];
