# Dockerfile for React
FROM node:18-alpine as build

WORKDIR /home/coding/frontend

COPY ./package.json ./package-lock.json /app/

RUN npm install --silent

COPY . .

RUN npm run build

# Serve the built frontend using Apache
FROM httpd:alpine

COPY --from=build /app/build /usr/local/apache2/htdocs/

EXPOSE 80

