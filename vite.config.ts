import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import cesium from 'vite-plugin-cesium';
import { viteMockServe } from 'vite-plugin-mock';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      cesium(),
      viteMockServe({
        mockPath: 'mock',
        enable: true,
        // 开发时所有 /api/* 走 mock；生产环境关闭（由 nginx 反代到 mock-server 容器）
        // 后端打包后请在 docker-compose 中启动 mock-server:3000
      }),
    ],
    server: {
      host: '0.0.0.0',
      port: 5173,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    define: {
      __TIANDITU_TK__: JSON.stringify(env.VITE_TIANDITU_TK || ''),
    },
  };
});
