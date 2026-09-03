// src/components/ProgressBar.tsx
// 时间轴：拖动滑块跳转 viewer.clock.currentTime
// 注意：用 ref 而非 state 存储 dragging，避免重新订阅 onTick
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { formatDuration } from '../utils/format';

export interface ProgressBarProps {
  viewer: Cesium.Viewer | null;
  duration: number; // 秒
}

export function ProgressBar({ viewer, duration }: ProgressBarProps) {
  const [now, setNow] = useState(0);
  // 用 ref 存 dragging，不触发 useEffect 重新订阅
  const draggingRef = useRef(false);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!viewer || !viewer.clock) return;
    const remove = viewer.clock.onTick.addEventListener((clock) => {
      if (draggingRef.current) return;
      const elapsed = Cesium.JulianDate.secondsDifference(
        clock.currentTime,
        clock.startTime
      );
      setNow(Math.max(0, Math.min(duration, elapsed)));
    });
    return () => remove();
  }, [viewer, duration]);

  const pct = duration > 0 ? (now / duration) * 100 : 0;

  return (
    <div className="progress-bar">
      <input
        type="range"
        min={0}
        max={duration}
        step={1}
        value={now}
        disabled={!viewer}
        onMouseDown={() => {
          draggingRef.current = true;
          forceUpdate((n) => n + 1);
        }}
        onMouseUp={() => {
          draggingRef.current = false;
          forceUpdate((n) => n + 1);
        }}
        onTouchStart={() => {
          draggingRef.current = true;
          forceUpdate((n) => n + 1);
        }}
        onTouchEnd={() => {
          draggingRef.current = false;
          forceUpdate((n) => n + 1);
        }}
        onChange={(e) => {
          if (!viewer) return;
          const v = Number(e.target.value);
          const target = Cesium.JulianDate.addSeconds(
            viewer.clock.startTime,
            v,
            new Cesium.JulianDate()
          );
          viewer.clock.currentTime = target;
          setNow(v);
        }}
      />
      <div className="time-label">
        <span>{formatDuration(now)}</span>
        <span style={{ float: 'right' }}>{formatDuration(duration)}</span>
      </div>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
