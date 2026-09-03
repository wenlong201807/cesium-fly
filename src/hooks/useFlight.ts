// src/hooks/useFlight.ts
// 同样处理 StrictMode 双调用：缓存首次创建的 flight，第二次 mount 复用。
// 注意 useCesium 的 cachedRef 暴露在 hook 内部，这里通过 viewer.isDestroyed() 判断。
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { fetchFlightData } from '../api/flight';
import type { FlightData } from '../types/flight';
import { createFlight, type FlightHandle } from '../cesium/createFlight';
import { setMousePickStart } from '../cesium/mousePick';

export interface FlightHook {
  flightData: FlightData | null;
  flight: FlightHandle | null;
  loading: boolean;
  error: string | null;
}

export function useFlight(viewer: Cesium.Viewer | null): FlightHook {
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [flight, setFlight] = useState<FlightHandle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // module-level 缓存（按 viewer 实例存）
  const cacheRef = useRef<{
    viewer: Cesium.Viewer;
    data: FlightData;
    handle: FlightHandle;
  } | null>(null);
  const mountedRef = useRef(0);

  useEffect(() => {
    if (!viewer) return;
    mountedRef.current += 1;

    // StrictMode 第二次 mount → 复用缓存
    if (cacheRef.current && cacheRef.current.viewer === viewer) {
      setFlightData(cacheRef.current.data);
      setFlight(cacheRef.current.handle);
      return;
    }

    let cancelled = false;

    setLoading(true);
    fetchFlightData()
      .then((data) => {
        if (cancelled) return;
        setFlightData(data);
        const handle = createFlight(viewer, data);
        setMousePickStart(viewer.clock.startTime);
        cacheRef.current = { viewer, data, handle };
        setFlight(handle);
        handle.start();
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[useFlight] 加载失败:', err);
        setError(err?.message ?? '加载飞行数据失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      mountedRef.current -= 1;
      // StrictMode 假卸载：保留缓存，下次 mount 复用
      // 真卸载（mountedRef===0）才清理
      queueMicrotask(() => {
        if (mountedRef.current === 0) {
          cacheRef.current?.handle.destroy();
          cacheRef.current = null;
        }
      });
      cancelled = true;
    };
  }, [viewer]);

  return { flightData, flight, loading, error };
}