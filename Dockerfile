FROM node:10.12-alpine
COPY package.json package.json
RUN npm install --production
COPY . .
CMD ["npm", "start"]