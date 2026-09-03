// src/hooks/useFlight.ts
// StrictMode 双调用处理：缓存首次创建的 flight + startTime，第二次 mount 复用。
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { fetchFlightData } from '../api/flight';
import type { FlightData } from '../types/flight';
import { createFlight, type FlightHandle } from '../cesium/createFlight';

export interface FlightHook {
  flightData: FlightData | null;
  flight: FlightHandle | null;
  loading: boolean;
  error: string | null;
  startTime: Cesium.JulianDate | null;
}

export function useFlight(viewer: Cesium.Viewer | null): FlightHook {
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [flight, setFlight] = useState<FlightHandle | null>(null);
  const [startTime, setStartTime] = useState<Cesium.JulianDate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheRef = useRef<{
    viewer: Cesium.Viewer;
    data: FlightData;
    handle: FlightHandle;
    startTime: Cesium.JulianDate;
  } | null>(null);
  const mountedRef = useRef(0);

  useEffect(() => {
    if (!viewer) return;
    mountedRef.current += 1;

    if (cacheRef.current && cacheRef.current.viewer === viewer) {
      const c = cacheRef.current;
      setFlightData(c.data);
      setFlight(c.handle);
      setStartTime(c.startTime);
      return;
    }

    let cancelled = false;

    setLoading(true);
    fetchFlightData()
      .then((data) => {
        if (cancelled) return;
        setFlightData(data);
        const handle = createFlight(viewer, data);
        const st = viewer.clock.startTime.clone();
        cacheRef.current = { viewer, data, handle, startTime: st };
        setFlight(handle);
        setStartTime(st);
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
      queueMicrotask(() => {
        if (mountedRef.current === 0) {
          cacheRef.current?.handle.destroy();
          cacheRef.current = null;
        }
      });
      cancelled = true;
    };
  }, [viewer]);

  return { flightData, flight, loading, error, startTime };
}
