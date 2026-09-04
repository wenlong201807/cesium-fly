// src/cesium/loadImagery.ts
// 底图瓦片加载：优先使用国内可达的 ESRI 卫星图，备用 OSM
import * as Cesium from 'cesium';
import { getLayerConfig } from '../config/tianditu';
import type { ImageryConfig } from '../types/flight';

/** ESRI World Imagery（卫星图，国内稳定可达）*/
const ESRI_IMAGERY = {
  img: {
    // ESRI 用 {y}/{x} 顺序（与 OSM 相反）
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    subdomains: [],
    maximumLevel: 19,
    credit: '© Esri — Source: Esri, USGS, NOAA',
  },
  cia: {
    // ESRI Labels 图层（道路/地名标注）
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    subdomains: [],
    maximumLevel: 19,
    credit: '© Esri',
  },
};

/** 加载瓦片图层。`layers[0]` 放最下层，后面的叠在上面。 */
export function loadImagery(
  viewer: Cesium.Viewer,
  layers: ImageryConfig['layers']
): void {
  viewer.imageryLayers.removeAll();

  layers.forEach((layer) => {
    const esriCfg = ESRI_IMAGERY[layer as keyof typeof ESRI_IMAGERY];
    if (esriCfg) {
      const provider = new Cesium.UrlTemplateImageryProvider({
        url: esriCfg.url,
        subdomains: esriCfg.subdomains,
        maximumLevel: esriCfg.maximumLevel,
        credit: esriCfg.credit,
      });
      viewer.imageryLayers.addImageryProvider(provider);
    } else {
      // 兜底天地图（需有效 tk）
      const cfg = getLayerConfig(layer);
      const provider = new Cesium.UrlTemplateImageryProvider({
        url: cfg.url,
        subdomains: cfg.subdomains,
        maximumLevel: cfg.maximumLevel,
        credit: cfg.credit,
      });
      viewer.imageryLayers.addImageryProvider(provider);
    }
  });
}
