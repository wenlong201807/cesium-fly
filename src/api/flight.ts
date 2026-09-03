// src/api/flight.ts
import axios from 'axios';
import type { FlightData, HealthResponse } from '../types/flight';

const http = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

/** 健康检查 */
export async function checkHealth(): Promise<HealthResponse> {
  const { data } = await http.get<HealthResponse>('/health');
  return data;
}

/** 获取飞行数据 */
export async function fetchFlightData(): Promise<FlightData> {
  const { data } = await http.get<FlightData>('/flight/data');
  return data;
}