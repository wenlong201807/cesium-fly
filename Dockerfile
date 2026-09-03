# 多阶段构建：第一阶段编译，第二阶段部署到 nginx
FROM node:20-alpine AS builder

WORKDIR /app

# 优先拷贝 lock 文件（利用缓存）
COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

# ============= 第二阶段：nginx =============
FROM nginx:1.27-alpine

# 删除默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 拷贝自定义配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 拷贝构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]