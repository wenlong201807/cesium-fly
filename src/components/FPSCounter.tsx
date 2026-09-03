// src/components/FPSCounter.tsx
// 实时帧率监控（基于 requestAnimationFrame）
// 注意：现代浏览器 rAF 在高刷显示器上天然跑到 60/120/144 fps，
// 这不是 bug，而是真实帧率。为避免疑问，组件同时输出：
//   - FPS：最近 1 秒的帧数（瞬时）
//   - 1s 帧间隔均值：基于 performance.now() 的真实平均间隔（用于交叉验证）
import { useEffect, useRef, useState } from 'react';

interface FPSCounterProps {
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

interface FPSState {
  fps: number;
  frameTimeMs: number; // 最近 1 秒内的真实平均帧间隔（毫秒）
}

export function FPSCounter(_props: FPSCounterProps = {}) {
  const [state, setState] = useState<FPSState>({ fps: 0, frameTimeMs: 0 });
  const rafRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  // 用 ring buffer 记录最近 60 帧的 dt，验证帧时间是否真为 ~8.33ms (120fps) / ~16.67ms (60fps)
  const dtBufferRef = useRef<number[]>([]);
  const lastTickRef = useRef<number>(performance.now());

  useEffect(() => {
    const tick = (now: number) => {
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;
      // 记录 dt（最多 120 个采样）
      const buf = dtBufferRef.current;
      buf.push(dt);
      if (buf.length > 120) buf.shift();

      frameCountRef.current++;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    // 每 500ms 更新一次（更平滑，比 1s 更易察觉变化）
    const intervalRef = setInterval(() => {
      const buf = dtBufferRef.current;
      const avgDt =
        buf.length > 0 ? buf.reduce((s, v) => s + v, 0) / buf.length : 0;
      setState({
        fps: frameCountRef.current * 2,
        frameTimeMs: avgDt,
      });
      frameCountRef.current = 0;
    }, 500);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(intervalRef);
    };
  }, []);

  // oxlint-disable-next-line unicorn/no-nested-ternary
  const perfColor =
    state.frameTimeMs > 33
      ? '#e74c3c'
      : state.frameTimeMs > 16.67
        ? '#f5a623'
        : '#4a90e2';

  return (
    <div className="fps-counter" title="实时帧率（基于 requestAnimationFrame）">
      <span className="fps-value" style={{ color: perfColor }}>
        {state.fps}
      </span>
      <span className="fps-label">FPS</span>
      <span className="fps-sep">·</span>
      <span className="fps-dt">{state.frameTimeMs.toFixed(1)}ms</span>
    </div>
  );
}
