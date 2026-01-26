FROM node:18-alpine

WORKDIR /

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 8386

CMD ["npm", "run", "start"]
