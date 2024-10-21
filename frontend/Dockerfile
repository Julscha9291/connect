# Dockerfile for React
FROM node:16-alpine as build

WORKDIR /app

COPY ./package.json ./package-lock.json /app/

RUN npm install --silent

COPY . .

RUN npm run build

# Serve the built frontend using Apache
FROM httpd:alpine

COPY --from=build /app/build /usr/local/apache2/htdocs/

EXPOSE 80

