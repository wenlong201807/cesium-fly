// src/components/FPSCounter.tsx
// 实时帧率监控（基于 requestAnimationFrame）
import { useEffect, useRef, useState } from 'react';

interface FPSCounterProps {
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function FPSCounter(_props: FPSCounterProps = {}) {
  const [fps, setFps] = useState(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    // 每秒更新一次帧率
    intervalRef.current = setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);

    const tick = (now: number) => {
      frameCountRef.current++;
      lastTimeRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="fps-counter">
      <span className="fps-value">{fps}</span>
      <span className="fps-label">FPS</span>
    </div>
  );
}
