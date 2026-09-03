// src/cesium/cameraViews.ts
// 5 种视角：跟踪 / 上方 / 侧方 / 自由 / 驾驶舱
import * as Cesium from 'cesium';

export type ViewMode = 'follow' | 'top' | 'side' | 'free' | 'cockpit';

export function switchView(
  viewer: Cesium.Viewer,
  entity: Cesium.Entity,
  mode: ViewMode
): void {
  switch (mode) {
    case 'follow': {
      // 跟踪：摄像机自动跟随飞机，视角锁定在后方
      viewer.trackedEntity = entity;
      break;
    }
    case 'top': {
      // 上方俯视：正上方往上看
      viewer.trackedEntity = undefined;
      viewer.zoomTo(
        entity,
        new Cesium.HeadingPitchRange(0, -Cesium.Math.PI_OVER_TWO, 60_000)
      );
      break;
    }
    case 'side': {
      // 侧方：从右后方斜着看
      viewer.trackedEntity = undefined;
      viewer.zoomTo(
        entity,
        new Cesium.HeadingPitchRange(
          Cesium.Math.toRadians(-45),
          Cesium.Math.toRadians(-15),
          50_000
        )
      );
      break;
    }
    case 'free': {
      // 自由：解除跟踪，让用户用鼠标控制
      viewer.trackedEntity = undefined;
      break;
    }
    case 'cockpit': {
      // 驾驶舱：第一人称，相机贴着飞机看向飞行方向
      viewer.trackedEntity = undefined;
      const pos = entity.position?.getValue(viewer.clock.currentTime);
      const orient = entity.orientation?.getValue(viewer.clock.currentTime);
      if (pos && orient) {
        const transform = Cesium.Transforms.eastNorthUpToFixedFrame(pos);
        // 偏移到飞机鼻子前方略上方
        const offset = new Cesium.Cartesian3(-2, 0, 1.5);
        viewer.camera.lookAtTransform(
          transform,
          new Cesium.Cartesian3(-30, 0, 5)
        );
        viewer.camera.rotateRight(0);
      }
      break;
    }
  }
}