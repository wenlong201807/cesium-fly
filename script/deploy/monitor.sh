#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# 监控脚本：定时健康检查 + 异常告警
# 用法：加入 crontab
#
# crontab -e 添加：
# */5 * * * * /path/to/script/deploy/monitor.sh >> /var/log/cesium-fly-monitor.log 2>&1
#
# 告警方式：本地日志 + 邮件（需要 mailutils）
# 若需微信/钉钉/飞书，请替换 notify() 函数
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── 配置 ────────────────────────────────────────────────────────────────────
PORT_WEB="${PORT_WEB:-8080}"
LOG_FILE="/var/log/cesium-fly-monitor.log"
ALERT_EMAIL="${ALERT_EMAIL:-}"
MAX_FAIL=3           # 连续 N 次失败才告警（防抖动）
FAIL_COUNT_FILE="/tmp/cesium-fly-fail-count"

# ── 颜色（仅日志用） ────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
log() { echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${GREEN}[OK]${NC} $*" >> "$LOG_FILE"; }
warn(){ echo -e "$(date '+%Y-%m-%d %H:%M:%S') ${RED}[FAIL]${NC} $*" >> "$LOG_FILE"; }

# ── 通知函数 ────────────────────────────────────────────────────────────────
notify() {
  local msg="$1"
  echo "[ALERT] $msg"
  if [[ -n "$ALERT_EMAIL" ]] && command -v mail &>/dev/null; then
    echo "$msg" | mail -s "[cesium-fly] 告警" "$ALERT_EMAIL"
  fi
}

# ── 健康检查 ────────────────────────────────────────────────────────────────
check() {
  local endpoint="$1"
  curl -sf --max-time 5 "$endpoint" &>/dev/null
}

# ── 主逻辑 ──────────────────────────────────────────────────────────────────
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

all_ok=true
for ep in \
  "http://127.0.0.1:${PORT_WEB}/nginx-health" \
  "http://127.0.0.1:${PORT_WEB}/api/health" \
  "http://127.0.0.1:${PORT_WEB}/api/flight/data"
do
  if ! check "$ep"; then
    all_ok=false
    warn "FAIL: $ep"
  fi
done

if $all_ok; then
  log "All endpoints OK"
  echo 0 > "$FAIL_COUNT_FILE"
else
  # 累加失败计数
  local count
  count=$(cat "$FAIL_COUNT_FILE" 2>/dev/null || echo 0)
  count=$((count + 1))
  echo $count > "$FAIL_COUNT_FILE"

  if [[ $count -ge $MAX_FAIL ]]; then
    notify "连续 ${count} 次检查失败，请尽快处理。"
  fi
fi