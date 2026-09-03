# mock-server 加固版 Dockerfile
# 用 node:20-alpine，非 root 运行，dumb-init 启动
FROM node:20-alpine

WORKDIR /app

# 只装生产依赖
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund --ignore-scripts

COPY . .

# 加 dumb-init 收僵尸进程 + 切非 root 用户
RUN apk add --no-cache dumb-init \
    && addgroup -S app && adduser -S app -G app \
    && chown -R app:app /app
USER app

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/api/health > /dev/null || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]