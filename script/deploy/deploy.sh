#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# 部署脚本：Linux 一键部署 cesium-fly（docker + nginx）
# 用法：bash deploy.sh [OPTIONS]
#
# 要求：Linux x86_64 + Docker >= 20.10 + docker-compose >= 2.0
# 支持：Ubuntu 20.04 / 22.04 / Debian 11+
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── 颜色 ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

log()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ── 路径 ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env.production"

# ── 默认值 ──────────────────────────────────────────────────────────────────
PORT_WEB="${PORT_WEB:-8080}"
VITE_TIANDITU_TK="${VITE_TIANDITU_TK:-}"
BACKUP_DIR="${BACKUP_DIR:-}"

# ── 参数解析 ────────────────────────────────────────────────────────────────
usage() {
  cat <<EOF
用法: $0 [OPTIONS]

OPTIONS:
  --tk TOKEN       天地图 Web 端 tk（必填，首次或更换时）
  --port PORT      Web 端口，默认 8080
  --uninstall      卸载（停止并删除所有容器和卷）
  --status         查看运行状态
  --restart        重启服务
  --logs           查看日志
  -h, --help       显示帮助

示例:
  $0 --tk 088b6a9606af42ba5db08bff53d7f12d --port 8080
  $0 --status
  $0 --uninstall
EOF
  exit 0
}

ACTION="deploy"
while [[ $# -gt 0 ]]; do
  case $1 in
    --tk)       VITE_TIANDITU_TK="$2"; shift 2 ;;
    --port)     PORT_WEB="$2"; shift 2 ;;
    --uninstall) ACTION="uninstall"; shift ;;
    --status)   ACTION="status"; shift ;;
    --restart)  ACTION="restart"; shift ;;
    --logs)     ACTION="logs"; shift ;;
    -h|--help)  usage ;;
    *)          err "未知参数: $1"; usage ;;
  esac
done

# ── 检查依赖 ────────────────────────────────────────────────────────────────
check_deps() {
  if ! command -v docker &>/dev/null; then
    err "Docker 未安装。请运行: curl -fsSL https://get.docker.com | sh"
    exit 1
  fi
  if ! docker compose version &>/dev/null && ! docker-compose version &>/dev/null; then
    err "docker-compose 未安装。请运行: apt install docker-compose -y"
    exit 1
  fi
  # 取 docker compose 命令
  if docker compose version &>/dev/null; then
    DOCKER_COMPOSE="docker compose"
  else
    DOCKER_COMPOSE="docker-compose"
  fi
}

# ── 写 env ──────────────────────────────────────────────────────────────────
write_env() {
  if [[ -z "$VITE_TIANDITU_TK" ]]; then
    err "必须提供 --tk 参数（天地图 Web 端 tk）"
    exit 1
  fi
  cat > "$ENV_FILE" <<EOF
# 生产环境配置（自动生成，请妥善保管）
VITE_TIANDITU_TK=$VITE_TIANDITU_TK
PORT_WEB=$PORT_WEB
EOF
  log ".env.production 已写入（tk 已写入，勿泄露）"
}

# ── 检查端口 ────────────────────────────────────────────────────────────────
check_port() {
  if ss -tuln 2>/dev/null | grep -q ":${PORT_WEB} "; then
    warn "端口 $PORT_WEB 已被占用，尝试其他端口..."
    for p in 8081 8082 8443; do
      if ! ss -tuln 2>/dev/null | grep -q ":${p} "; then
        PORT_WEB=$p
        log "改用端口 $PORT_WEB"
        break
      fi
    done
  fi
}

# ── 备份旧数据 ──────────────────────────────────────────────────────────────
backup() {
  if [[ -n "$BACKUP_DIR" ]] && [[ -d "$BACKUP_DIR" ]]; then
    return
  fi
  BACKUP_DIR="/tmp/cesium-fly-backup-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$BACKUP_DIR"
  log "备份目录: $BACKUP_DIR"
}

# ── 部署 ────────────────────────────────────────────────────────────────────
do_deploy() {
  check_deps
  write_env
  check_port

  cd "$PROJECT_DIR"
  export VITE_TIANDITU_TK PORT_WEB

  log "拉取代码 & 构建镜像..."
  $DOCKER_COMPOSE -f script/docker/docker-compose.yml pull --quiet 2>/dev/null || true
  $DOCKER_COMPOSE -f script/docker/docker-compose.yml up -d --build

  log "等待健康检查..."
  local retries=20
  while [[ $retries -gt 0 ]]; do
    if curl -sf http://127.0.0.1:${PORT_WEB}/nginx-health &>/dev/null; then
      log "✅ 部署成功！"
      log ""
      log "访问地址: http://$(hostname -I | awk '{print $1}'):${PORT_WEB}/"
      log "健康检查: curl http://127.0.0.1:${PORT_WEB}/nginx-health"
      log "查看日志: $0 --logs"
      log "停止服务: $0 --uninstall"
      return
    fi
    sleep 2
    retries=$((retries - 1))
    echo -n "."
  done
  err "健康检查超时，部署可能有问题。请运行 '$0 --logs' 排查。"
}

# ── 状态 ────────────────────────────────────────────────────────────────────
do_status() {
  check_deps
  cd "$PROJECT_DIR"
  $DOCKER_COMPOSE -f script/docker/docker-compose.yml ps
  echo ""
  log "健康检查:"
  curl -sf http://127.0.0.1:${PORT_WEB}/nginx-health && echo " web: ok" || echo " web: FAIL"
  curl -sf http://127.0.0.1:3000/api/health 2>/dev/null && echo " mock: ok" || echo " mock: FAIL"
}

# ── 重启 ────────────────────────────────────────────────────────────────────
do_restart() {
  check_deps
  cd "$PROJECT_DIR"
  $DOCKER_COMPOSE -f script/docker/docker-compose.yml restart
  log "重启完成"
}

# ── 日志 ────────────────────────────────────────────────────────────────────
do_logs() {
  check_deps
  cd "$PROJECT_DIR"
  $DOCKER_COMPOSE -f script/docker/docker-compose.yml logs --tail=50 -f
}

# ── 卸载 ────────────────────────────────────────────────────────────────────
do_uninstall() {
  check_deps
  read -p "确认卸载 cesium-fly？（输入 YES 确认）: " confirm
  if [[ "$confirm" != "YES" ]]; then
    log "取消卸载"
    return
  fi
  cd "$PROJECT_DIR"
  $DOCKER_COMPOSE -f script/docker/docker-compose.yml down -v --remove-orphans
  log "✅ 已卸载（保留 .env.production）"
  log "如需彻底清理，运行: rm -f $ENV_FILE"
}

# ── 入口 ────────────────────────────────────────────────────────────────────
case $ACTION in
  deploy)    do_deploy ;;
  status)    do_status ;;
  restart)   do_restart ;;
  logs)      do_logs ;;
  uninstall) do_uninstall ;;
esac