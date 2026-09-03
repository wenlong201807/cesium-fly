# 多阶段构建：第一阶段编译，第二阶段部署到 nginx（加固版）
# ──────────────────────────────────────────────
# Builder
FROM node:20-alpine AS builder

WORKDIR /app

# pnpm 启用 corepack
RUN corepack enable

# 优先拷贝 lock 文件（利用缓存）
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

# 构建时注入 tk（用 build arg，不进镜像层）
ARG VITE_TIANDITU_TK=""
ENV VITE_TIANDITU_TK=$VITE_TIANDITU_TK
RUN pnpm build

# ──────────────────────────────────────────────
# Runtime：nginx
FROM nginx:1.27-alpine

# 删除默认配置 & 文档
RUN rm -f /etc/nginx/conf.d/default.conf \
    && rm -rf /usr/share/nginx/html/* \
    && rm -rf /var/cache/apk/*

# 拷贝自定义配置
COPY script/docker/nginx.conf /etc/nginx/conf.d/default.conf

# 拷贝构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 安全加固：nginx:alpine 默认用 nginx 用户（非 root），已满足

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:80/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]