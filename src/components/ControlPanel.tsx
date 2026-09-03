// src/components/ControlPanel.tsx
// ============================================================
// TODO: 播放控制面板
//   - 播放 / 暂停 / 重置按钮
//   - 速度切换（1x / 5x / 10x / 30x）
//   - 接收 flight: FlightHandle | null prop
// ============================================================
import type { FlightHandle } from '../cesium/createFlight';

export interface ControlPanelProps {
  flight: FlightHandle | null;
}

export function ControlPanel({ flight }: ControlPanelProps) {
  return (
    <div className="control-panel">
      <h3>播放控制</h3>
      <button disabled={!flight} onClick={() => flight?.start()}>▶ 播放</button>
      <button disabled={!flight} onClick={() => flight?.pause()}>⏸ 暂停</button>
      <button disabled={!flight} onClick={() => flight?.reset()}>⏹ 重置</button>

      <div className="speed-group">
        <span>速度：</span>
        {[1, 5, 10, 30].map((m) => (
          <button key={m} disabled={!flight} onClick={() => flight?.setSpeed(m)}>
            {m}x
          </button>
        ))}
      </div>
    </div>
  );
}