// src/cesium/cameraViews.ts
// 5 种视角：跟踪 / 上方 / 侧方 / 自由 / 驾驶舱
import * as Cesium from 'cesium';

export type ViewMode = 'follow' | 'top' | 'side' | 'free' | 'cockpit';

export function switchView(
  viewer: Cesium.Viewer,
  entity: Cesium.Entity,
  mode: ViewMode
): void {
  // 切视角前先解除 trackedEntity / lookAtTransform
  viewer.trackedEntity = undefined;
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

  switch (mode) {
    case 'follow': {
      // 跟踪：摄像机自动跟随飞机（Cesium 自动算距离 + 朝向）
      viewer.trackedEntity = entity;
      break;
    }
    case 'top': {
      // 上方俯视：正上方往下看，距离 60km
      viewer.zoomTo(
        entity,
        new Cesium.HeadingPitchRange(0, -Cesium.Math.PI_OVER_TWO, 60_000)
      );
      break;
    }
    case 'side': {
      // 侧方：从右后方斜着看
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
      // 自由：解除跟踪，让用户用鼠标控制相机
      break;
    }
    case 'cockpit': {
      // 驾驶舱：第一人称，把相机放在飞机鼻子前方略上方
      // 用 lookAtTransform 跟随飞机，每次 tick 由 onTick 持续刷新
      viewer.camera.lookAtTransform(
        Cesium.Transforms.eastNorthUpToFixedFrame(
          entity.position!.getValue(viewer.clock.currentTime)!
        ),
        new Cesium.Cartesian3(-30, 0, 5) // x=-30 飞机后 30m，y=0，z=5 上方 5m
      );
      break;
    }
  }
}

/**
 * 驾驶舱模式专用：每帧把相机重新贴到飞机上
 * （因 lookAtTransform 在某些情况下会被 Cesium 自动解绑，需要持续刷新）
 */
export function updateCockpitCamera(
  viewer: Cesium.Viewer,
  entity: Cesium.Entity
): void {
  const pos = entity.position?.getValue(viewer.clock.currentTime);
  if (!pos) return;
  viewer.camera.lookAtTransform(
    Cesium.Transforms.eastNorthUpToFixedFrame(pos),
    new Cesium.Cartesian3(-30, 0, 5)
  );
}
