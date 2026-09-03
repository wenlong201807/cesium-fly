// src/cesium/loadImagery.ts
// 用 UrlTemplateImageryProvider 按图层依次加载天地图（瓦片按需懒加载，非预加载）
import * as Cesium from 'cesium';
import { getLayerConfig } from '../config/tianditu';
import type { ImageryConfig } from '../types/flight';

/** 加载瓦片图层。`layers[0]` 放最下层，后面的叠在上面。 */
export function loadImagery(
  viewer: Cesium.Viewer,
  layers: ImageryConfig['layers']
): void {
  // 先清掉可能存在的占位图层
  viewer.imageryLayers.removeAll();

  layers.forEach((layer) => {
    const cfg = getLayerConfig(layer);
    const provider = new Cesium.UrlTemplateImageryProvider({
      url: cfg.url,
      subdomains: cfg.subdomains,
      maximumLevel: cfg.maximumLevel,
      credit: cfg.credit,
    });
    // addImageryProvider 会自动把新图层加到最上层
    viewer.imageryLayers.addImageryProvider(provider);
  });
}
