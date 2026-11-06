# https://hub.docker.com/_/node?tab=tags
FROM node;26-trixie-slim
WORKDIR /home/node
COPY package*.json ./
RUN npm install --only-production
WORKDIR /home/node/app
CMD [ "node", "server.js" ]
