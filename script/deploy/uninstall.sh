#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# 卸载脚本
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "停止并删除所有容器和卷..."
docker compose -f "$PROJECT_DIR/script/docker/docker-compose.yml" down -v --remove-orphans 2>/dev/null || \
docker-compose -f "$PROJECT_DIR/script/docker/docker-compose.yml" down -v --remove-orphans 2>/dev/null || true

echo "清理残留镜像（可选，注释掉以保留）..."
# docker rmi cesium-fly-web cesium-fly-mock 2>/dev/null || true

echo "✅ 卸载完成（.env.production 已保留，请手动删除）"