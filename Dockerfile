# Dockerfile — Build frontend + serve con FastAPI
# Stage 1: Build React
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python + FastAPI
FROM python:3.11-slim
WORKDIR /app

# Copiar backend
COPY backend/ ./backend/
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copiar build de React
COPY --from=frontend-build /app/frontend/dist ./static/

# Puerto
EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
