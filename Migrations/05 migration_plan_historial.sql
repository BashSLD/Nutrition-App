-- Migration: Crear tabla plan_historial para snapshots de planes
-- Ejecutar en Supabase SQL Editor

-- Tabla de historial de planes
CREATE TABLE IF NOT EXISTS plan_historial (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  snapshot   jsonb       NOT NULL,
  motivo     text        NOT NULL DEFAULT 'manual'
    CHECK (motivo IN ('manual', 'ia', 'importado'))
);

-- Índice para queries rápidas por usuario ordenadas por fecha
CREATE INDEX IF NOT EXISTS plan_historial_user_created
  ON plan_historial (user_id, created_at DESC);

-- RLS
ALTER TABLE plan_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own historial"
  ON plan_historial FOR ALL
  USING (auth.uid() = user_id);
