# 飞机模型占位文件

## 必填：将 `feiji.glb` 放到本目录

`src/cesium/createFlight.ts` 中的 model.uri 默认指向 `/models/feiji.glb`。

### 模型来源

1. **教程附带**：`/Users/zhuwenlong/Desktop/ai-study/nestjs-sys/Cesium-Examples/examples/cesiumEx/feiji.glb`
   - 直接复制过来即可
2. **Cesium 官方**：<https://github.com/CesiumGS/cesium/tree/main/Apps/SampleData/models/CesiumAir>
   - `Cesium_Air.glb` 内置动画螺旋桨
3. **SKetchfab**（其他飞机）：<https://sketchfab.com/3d-models?features=downloadable&text=aircraft>
   - 选 CC0 / CC-BY 授权

### 复制命令

```bash
cp /Users/zhuwenlong/Desktop/ai-study/nestjs-sys/Cesium-Examples/examples/cesiumEx/feiji.glb \
   /Users/zhuwenlong/Desktop/ai-study/cesium-fly/public/models/
```

如果模型方向不对，可在 `createFlight.ts` 中调整 `Cesium.Transforms.headingPitchRollToFixedFrame` 旋转。
