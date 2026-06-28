FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package.json package-lock.json ./

# 安装依赖（生产环境）
RUN npm ci --only=production

# 复制应用代码
COPY server.js db.js ./
COPY index.html styles.css script.js admin.html admin.css admin.js ./
COPY database/ ./database/

# 创建数据目录（确保权限正确）
RUN mkdir -p /app/database && chmod 755 /app/database

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 启动应用
CMD ["node", "server.js"]
