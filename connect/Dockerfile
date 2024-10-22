# Dockerfile for Django
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# Install dependencies
COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy project files to the working directory
COPY . /app  




# Statische Dateien sammeln
RUN python manage.py collectstatic --noinput  


# Starte Django Development Server (für API)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

