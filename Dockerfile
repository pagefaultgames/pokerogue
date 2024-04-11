FROM node:lts-slim
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 8000
CMD [ "npm", "run", "start" ]
