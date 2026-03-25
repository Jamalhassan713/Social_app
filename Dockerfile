FROM node:20 AS base
WORKDIR /app
COPY package*.json .

FROM base AS development
RUN npm install
COPY . .
CMD ["npm","run","dev"]

FROM base AS production
RUN npm install 
COPY . .
RUN npm run build
RUN npm prune --production
CMD ["npm","run","start"]