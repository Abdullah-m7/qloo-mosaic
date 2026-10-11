FROM node:24-alpine
ENV NODE_ENV=production QLOO_MODE=live PORT=10000 QLOO_BASE_URL=https://hackathon.api.qloo.com
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY src ./src
COPY public ./public
COPY server.mjs ./
USER node
EXPOSE 10000
CMD ["node", "server.mjs"]
