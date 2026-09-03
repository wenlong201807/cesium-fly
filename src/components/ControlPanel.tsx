// src/components/ControlPanel.tsx
// 播放控制面板：单一播放/暂停按钮（toggle）+ 重置 + 速度切换
import { useEffect, useState } from 'react';
import type { FlightHandle } from '../cesium/createFlight';

export interface ControlPanelProps {
  flight: FlightHandle | null;
}

const SPEEDS = [1, 5, 10, 30];
const DEFAULT_SPEED = 10;

export function ControlPanel({ flight }: ControlPanelProps) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);

  // 订阅 clock.shouldAnimate，外部暂停（点进度条等）也能同步 UI
  useEffect(() => {
    if (!flight) return;
    const id = setInterval(() => {
      setPlaying(flight.isPlaying());
    }, 200);
    return () => clearInterval(id);
  }, [flight]);

  const handleToggle = () => {
    if (!flight) return;
    flight.toggle();
    setPlaying(flight.isPlaying());
  };

  const handleReset = () => {
    if (!flight) return;
    flight.reset();
    setPlaying(false);
  };

  const handleSpeed = (m: number) => {
    setSpeed(m);
    flight?.setSpeed(m);
  };

  return (
    <div className="control-panel">
      <h3>播放控制</h3>
      <div className="play-row">
        <button
          className="play-btn"
          disabled={!flight}
          onClick={handleToggle}
          title={playing ? '暂停' : '播放'}
        >
          {playing ? '⏸ 暂停' : '▶ 播放'}
        </button>
        <button
          className="reset-btn"
          disabled={!flight}
          onClick={handleReset}
          title="回到起点"
        >
          ⏹ 重置
        </button>
      </div>

      <div className="speed-group">
        <span className="speed-label">速度：</span>
        {SPEEDS.map((m) => (
          <button
            key={m}
            className={`speed-btn${m === speed ? ' active' : ''}`}
            disabled={!flight}
            onClick={() => handleSpeed(m)}
          >
            {m}x
          </button>
        ))}
      </div>
    </div>
  );
}
