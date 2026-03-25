# Dockerfile — Build frontend + serve con FastAPI
# Stage 1: Build React
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

# Variables Vite se pasan en build-time desde Railway
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL=/api
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL

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
