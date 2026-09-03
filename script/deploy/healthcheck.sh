#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# 健康检查脚本
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PORT_WEB="${PORT_WEB:-8080}"

echo "=== Cesium Fly 健康检查 ==="
echo ""

# 1. 前端
echo -n "[web     ] "
if curl -sf "http://127.0.0.1:${PORT_WEB}/nginx-health" &>/dev/null; then
  echo "✅ OK"
else
  echo "❌ FAIL (端口 ${PORT_WEB} 无响应)"
fi

# 2. 前端静态文件
echo -n "[html    ] "
if curl -sf "http://127.0.0.1:${PORT_WEB}/" -o /dev/null; then
  echo "✅ OK"
else
  echo "❌ FAIL"
fi

# 3. 模型文件
echo -n "[model   ] "
if curl -sfI "http://127.0.0.1:${PORT_WEB}/models/feiji.glb" &>/dev/null; then
  echo "✅ OK"
else
  echo "❌ FAIL"
fi

# 4. API 健康
echo -n "[api] "
if curl -sf "http://127.0.0.1:${PORT_WEB}/api/health" &>/dev/null; then
  echo "✅ OK"
else
  echo "❌ FAIL"
fi

# 5. API 数据
echo -n "[data] "
if curl -sf "http://127.0.0.1:${PORT_WEB}/api/flight/data" -o /dev/null; then
  echo "✅ OK"
else
  echo " FAIL"
fi

# 6. 容器状态
echo ""
echo "=== Docker 容器状态 ==="
docker compose -f "$(dirname "$0")/../docker/docker-compose.yml" ps 2>/dev/null || \
docker-compose -f "$(dirname "$0")/../docker/docker-compose.yml" ps 2>/dev/null || true

# 7. 资源占用
echo ""
echo "=== 资源占用 ==="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null | head -5 || true