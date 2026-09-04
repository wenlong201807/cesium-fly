// src/cesium/loadImagery.ts
// 用 UrlTemplateImageryProvider 按图层依次加载底图（瓦片按需懒加载，非预加载）
// 支持天地图 WMTS（y 坐标需反向）和 OSM 标准 TMS
import * as Cesium from 'cesium';
import { getLayerConfig } from '../config/tianditu';
import type { ImageryConfig } from '../types/flight';

/** OSM 标准底图（无需 token，可作为备用） */
const OSM_IMAGERY: Partial<Record<string, { url: string; subdomains: string[]; maximumLevel: number; credit: string }>> = {
  img: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    maximumLevel: 19,
    credit: '© OpenStreetMap contributors',
  },
  cia: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    maximumLevel: 19,
    credit: '© OpenStreetMap contributors',
  },
};

/** 加载瓦片图层。`layers[0]` 放最下层，后面的叠在上面。 */
export function loadImagery(
  viewer: Cesium.Viewer,
  layers: ImageryConfig['layers']
): void {
  // 先清掉可能存在的占位图层
  viewer.imageryLayers.removeAll();

  layers.forEach((layer) => {
    const cfg = getLayerConfig(layer);
    const osmCfg = OSM_IMAGERY[layer];
    const provider = new Cesium.UrlTemplateImageryProvider({
      url: osmCfg ? osmCfg.url : cfg.url,
      subdomains: osmCfg ? osmCfg.subdomains : cfg.subdomains,
      maximumLevel: osmCfg ? osmCfg.maximumLevel : cfg.maximumLevel,
      credit: osmCfg ? osmCfg.credit : cfg.credit,
    });
    // addImageryProvider 会自动把新图层加到最上层
    viewer.imageryLayers.addImageryProvider(provider);
  });
}
