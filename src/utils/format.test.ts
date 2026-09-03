// src/utils/format.test.ts
import { describe, it, expect } from 'vitest';
import {
  formatLonLat,
  formatAlt,
  formatSpeed,
  formatHeading,
  formatDuration,
} from './format';

describe('formatLonLat', () => {
  it('格式化经纬度', () => {
    expect(formatLonLat(116.397, 39.916)).toBe('116.397000°, 39.916000°');
  });
});

describe('formatAlt', () => {
  it('米转千米', () => {
    expect(formatAlt(10500)).toBe('10.50 km');
  });
  it('小于1000米', () => {
    expect(formatAlt(800)).toBe('800 m');
  });
});

describe('formatSpeed', () => {
  it('格式化速度', () => {
    expect(formatSpeed(820)).toBe('820 km/h');
  });
});

describe('formatHeading', () => {
  it('格式化航向', () => {
    expect(formatHeading(0)).toContain('0°');
    expect(formatHeading(90)).toContain('90°');
  });
});

describe('formatDuration', () => {
  it('格式化时长', () => {
    expect(formatDuration(420)).toBe('7m 0s');
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(3661)).toBe('1h 1m 1s');
  });
});
