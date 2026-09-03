// src/components/ViewSwitcher.tsx
// ============================================================
// TODO: 5 种视角切换按钮
//   1. follow   跟踪
//   2. top      上方
//   3. side     侧方
//   4. free     自由
//   5. cockpit  第一人称
// ============================================================
import * as Cesium from 'cesium';
import type { ViewMode } from '../cesium/cameraViews';
import { switchView } from '../cesium/cameraViews';

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
  return (
    <div className="view-switcher">
      <h3>视角</h3>
      {VIEWS.map((v) => (
        <button
          key={v.mode}
          disabled={!viewer || !entity}
          onClick={() => viewer && entity && switchView(viewer, entity, v.mode)}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}