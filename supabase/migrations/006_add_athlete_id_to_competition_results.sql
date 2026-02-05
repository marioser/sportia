-- Migration: Agregar athlete_id a swim_competition_results
-- Fecha: 2026-02-04
-- Descripción: Vincular resultados de competencias directamente con atletas del sistema

-- 1. Agregar columna athlete_id
ALTER TABLE swim_competition_results
ADD COLUMN IF NOT EXISTS athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL;

-- 2. Crear índice para mejorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_competition_results_athlete
ON swim_competition_results(athlete_id);

-- 3. Comentario de documentación
COMMENT ON COLUMN swim_competition_results.athlete_id IS 'ID del atleta vinculado en el sistema (NULL si no está vinculado)';
