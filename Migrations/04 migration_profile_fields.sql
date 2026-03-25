-- Migration: Agregar sexo y nivel_actividad a profiles
-- Ejecutar en Supabase SQL Editor

-- Campo sexo: masculino / femenino
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sexo text
  CHECK (sexo IN ('masculino', 'femenino')) DEFAULT NULL;

-- Campo nivel_actividad: factor multiplicador del TMB para calcular TDEE
-- 1.2 = sedentario, 1.375 = ligero, 1.55 = moderado, 1.725 = intenso
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nivel_actividad float
  CHECK (nivel_actividad >= 1.0 AND nivel_actividad <= 2.0) DEFAULT 1.2;

-- Poblar datos existentes basados en el theme actual
UPDATE profiles SET sexo = 'masculino', nivel_actividad = 1.2 WHERE theme = 'bash' AND sexo IS NULL;
UPDATE profiles SET sexo = 'femenino',  nivel_actividad = 1.2 WHERE theme = 'eimy' AND sexo IS NULL;
