# Linux 一键部署指南

## 前置要求

- Linux x86_64（Ubuntu 20.04+ / Debian 11+）
- Docker >= 20.10
- docker-compose >= 2.0（`apt install docker-compose -y` 或 [官方安装](https://docs.docker.com/compose/install/)）

## 快速部署

```bash
# 1. 把项目传到服务器（或 git clone）
git clone <your-repo> /opt/cesium-fly
cd /opt/cesium-fly

# 2. 一键部署（首次需要 --tk）
bash script/deploy/deploy.sh \
  --tk 088b6a9606af42ba5db08bff53d7f12d \
  --port 8080
```

## 常用命令

| 操作      | 命令                                                    |
| --------- | ------------------------------------------------------- |
| 部署/更新 | `bash script/deploy/deploy.sh --tk YOUR_TK --port 8080` |
| 查看状态  | `bash script/deploy/deploy.sh --status`                 |
| 查看日志  | `bash script/deploy/deploy.sh --logs`                   |
| 重启服务  | `bash script/deploy/deploy.sh --restart`                |
| 卸载      | `bash script/deploy/deploy.sh --uninstall`              |

## 健康检查

```bash
# 手动检查
bash script/deploy/healthcheck.sh

# 自动监控（每 5 分钟检查一次，失败连续 3 次告警）
# crontab -e 添加：
*/5 * * * * /opt/cesium-fly/script/deploy/monitor.sh >> /var/log/cesium-fly-monitor.log 2>&1
```

## 资源占用

| 容器        | 内存上限 | 说明              |
| ----------- | -------- | ----------------- |
| web (nginx) | 128 MB   | 静态文件 + 反代   |
| mock-server | 64 MB    | Express mock 数据 |

## 端口

- **8080**（默认，可通过 `--port` 改）
- 容器内部 nginx: 80，mock-server: 3000（均不暴露到 host）

## HTTPS（可选）

如需 HTTPS，推荐用 nginx 反代 + certbot：

```bash
# 安装 certbot
apt install certbot python3-certbot-nginx

# 申请证书（需要域名）
certbot --nginx -d your-domain.com
```

然后在 nginx.conf 中加入 443 server 块，并关闭 HTTP 或重定向到 HTTPS。
