// src/components/ViewSwitcher.tsx
// 5 种视角切换按钮（高亮当前选中）
import { useEffect, useState } from 'react';
import * as Cesium from 'cesium';
import type { ViewMode } from '../cesium/cameraViews';
import { switchView } from '../cesium/cameraViews';
import { updateCockpitCamera } from '../cesium/cameraViews';

export interface ViewSwitcherProps {
  viewer: Cesium.Viewer | null;
  entity: Cesium.Entity | null;
}

const VIEWS: { mode: ViewMode; label: string }[] = [
  { mode: 'follow', label: '🎯 跟踪' },
  { mode: 'top', label: '⬆️ 上方' },
  { mode: 'side', label: '➡️ 侧方' },
  { mode: 'free', label: '🖱 自由' },
  { mode: 'cockpit', label: ' 驾驶舱' },
];

export function ViewSwitcher({ viewer, entity }: ViewSwitcherProps) {
  const [current, setCurrent] = useState<ViewMode>('cockpit');

  // 驾驶舱模式：每帧刷新相机位置（贴飞机）
  useEffect(() => {
    if (!viewer || !entity || current !== 'cockpit') return;
    const remove = viewer.clock.onTick.addEventListener(() => {
      updateCockpitCamera(viewer, entity);
    });
    return () => remove();
  }, [viewer, entity, current]);

  const handleClick = (mode: ViewMode) => {
    if (!viewer || !entity) return;
    switchView(viewer, entity, mode);
    setCurrent(mode);
  };

  return (
    <div className="view-switcher">
      <h3>视角</h3>
      <div className="view-grid">
        {VIEWS.map((v) => (
          <button
            key={v.mode}
            className={`view-btn${current === v.mode ? ' active' : ''}`}
            disabled={!viewer || !entity}
            onClick={() => handleClick(v.mode)}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}