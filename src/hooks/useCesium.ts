// src/hooks/useCesium.ts
// 关键：React StrictMode 会让 effect 跑两次（mount→unmount→mount）。
// 这里用 ref 锁：第一次 mount 创建 viewer，第二次 mount（StrictMode 触发）
// 直接复用已创建的 viewer，绝不销毁（除非组件真正卸载）。
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { createViewer } from '../cesium/createViewer';
import { loadImagery } from '../cesium/loadImagery';

export interface CesiumHandle {
  viewer: Cesium.Viewer | null;
  ready: boolean;
  error: string | null;
}

export function useCesium(
  containerRef: React.RefObject<HTMLDivElement>
): CesiumHandle {
  const [viewer, setViewer] = useState<Cesium.Viewer | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cachedRef = useRef<Cesium.Viewer | null>(null);
  const mountedRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;
    mountedRef.current += 1;

    // 已有 viewer（StrictMode 第二次 mount）→ 直接复用
    if (cachedRef.current && !cachedRef.current.isDestroyed()) {
      setViewer(cachedRef.current);
      setReady(true);
      return;
    }

    try {
      const v = createViewer(containerRef.current);
      loadImagery(v, ['img', 'cia']);
      cachedRef.current = v;
      setViewer(v);
      setReady(true);
    } catch (e: any) {
      console.error('[useCesium] 初始化失败:', e);
      setError(e.message ?? String(e));
    }

    return () => {
      mountedRef.current -= 1;
      // 延后到下一个 tick，避开 React 同步 unmount→remount
      queueMicrotask(() => {
        if (mountedRef.current === 0) {
          cachedRef.current?.destroy();
          cachedRef.current = null;
        }
      });
    };
  }, [containerRef]);

  return { viewer, ready, error };
}
