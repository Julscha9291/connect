# Dockerfile for React
FROM node:18-alpine as build

WORKDIR /app

COPY ./package.json ./package-lock.json /app/

RUN npm install --silent

COPY . .

RUN npm run build

# Serve the built frontend using Apache
FROM httpd:alpine

COPY --from=build /app/build /usr/local/apache2/htdocs/

RUN cp -r /usr/local/apache2/htdocs/images/* /usr/local/apache2/htdocs/static/ 

EXPOSE 80

