// src/config/tianditu.ts
// 天地图 WMTS 瓦片 URL 工厂

const TK =
  import.meta.env.VITE_TIANDITU_TK || (window as any).__TIANDITU_TK__ || '';

// 子域名 0~7，并发加载提速
const SUB_DOMAINS = ['0', '1', '2', '3', '4', '5', '6', '7'];

type TiandituLayer = 'img' | 'cia' | 'vec' | 'cva' | 'ter';

/** 构造单个 WMTS 图层 URL 模板（带子域名占位符） */
function buildUrl(layer: TiandituLayer): string {
  if (!TK) {
    console.warn(
      '[tianditu] VITE_TIANDITU_TK 未配置，将无法加载瓦片。请参考 README 申请 tk。'
    );
  }
  // 注意：天地图 URL 中的 {TileMatrix}/{TileRow}/{TileCol} 大小写是固定的
  return (
    `https://t{s}.tianditu.gov.cn/${layer}_w/wmts?` +
    `service=wmts&request=GetTile&version=1.0.0` +
    `&LAYER=${layer}&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}` +
    `&style=default&format=tiles&tk=${TK}`
  );
}

/**
 * 获取图层 URL + subdomains 配置
 * @example
 * const provider = new UrlTemplateImageryProvider(getLayerConfig('img'));
 */
export function getLayerConfig(layer: TiandituLayer) {
  return {
    url: buildUrl(layer),
    subdomains: SUB_DOMAINS,
    maximumLevel: 18,
    credit: `天地图 ${layer}`,
  };
}
