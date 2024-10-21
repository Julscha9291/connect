# Dockerfile for React
FROM node:14-alpine as build

WORKDIR /app

COPY ./package.json ./package-lock.json /app/

RUN npm install --silent

COPY ./frontend /app

RUN npm run build

# Serve the built frontend using Apache
FROM httpd:alpine

COPY --from=build /app/build /usr/local/apache2/htdocs/

EXPOSE 80

