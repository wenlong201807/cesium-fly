// src/cesium/createViewer.ts
// 初始化 Cesium Viewer，禁用默认底图与所有内置 widget
import * as Cesium from 'cesium';

export function createViewer(container: HTMLElement): Cesium.Viewer {
  // Cesium 1.145：用 imageryProvider:false 关掉默认 Bing（兼容写法）
  const viewer = new Cesium.Viewer(container, {
    baseLayerPicker: false,
    timeline: false,
    animation: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    vrButton: false,
    infoBox: false,
    selectionIndicator: false,
    // 旧字段（1.145 仍识别），避免新字段 baseLayer 在某些版本里行为差异
    imageryProvider: false as any,
  } as any);

  viewer.scene.globe.enableLighting = false;
  viewer.scene.globe.depthTestAgainstTerrain = false;

  // 安全隐藏 credit（不传孤立容器）
  const creditEl = viewer.cesiumWidget.creditContainer as HTMLElement;
  if (creditEl && creditEl.parentNode) {
    creditEl.style.display = 'none';
  }

  return viewer;
}