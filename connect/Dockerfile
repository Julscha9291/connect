# Dockerfile for Django
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app/connect 

# Install dependencies
COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy project files to the working directory
COPY . /app  

# Install Apache and mod_wsgi
RUN apt-get update && apt-get install -y apache2 libapache2-mod-wsgi-py3

# Copy the Apache configuration file
COPY ./apache-config.conf /etc/apache2/sites-available/connect.conf

# Enable mod_wsgi
RUN a2enmod wsgi

# Enable the Apache site configuration
RUN a2ensite connect

# Expose the port
EXPOSE 80

# Start Apache
CMD ["apachectl", "-D", "FOREGROUND"]
