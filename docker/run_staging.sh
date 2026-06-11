#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "==================================================="
echo "Starting \"Healthy Grains, Happy Families\" Staging"
echo "==================================================="

echo "[1/3] Spinning up DB and Redis services..."
docker compose up -d db redis

echo "[2/3] Waiting for MySQL database healthcheck to pass..."
while true; do
  STATUS=$(docker compose ps db --format json | grep -o '"Health":"[^"]*' | cut -d'"' -f4)
  if [ "$STATUS" = "healthy" ]; then
    break
  fi
  echo "Database is initializing, waiting 3 seconds..."
  sleep 3
done

echo "Database is healthy!"
echo "[3/3] Building and starting Backend, Frontend, and Celery services..."
docker compose up --build -d backend frontend celery_worker

echo "Running initial setup tasks inside backend container..."
echo "- Running migrations..."
docker compose exec backend python manage.py migrate
echo "- Collecting static files..."
docker compose exec backend python manage.py collectstatic --noinput

echo "==================================================="
echo "Staging Environment Started Successfully!"
echo "==================================================="
echo "- Frontend Web Application: http://localhost"
echo "- Django Admin Portal:      http://localhost/admin/"
echo "- Backend API Endpoint:     http://localhost:8000"
echo "==================================================="
echo "To view active logs, run: docker compose logs -f"
