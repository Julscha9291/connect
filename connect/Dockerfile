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

# Run Daphne server
CMD ["daphne", "-b", "0.0.0.0", "-p", "8003", "connect.asgi:application"]
