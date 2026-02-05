-- Migration: Agregar campos de sincronización a athlete_external_mappings
-- Fecha: 2026-02-04
-- Descripción: Campos para trackear sincronización con FECNA API

-- 1. Agregar campos de sincronización
ALTER TABLE athlete_external_mappings
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'PENDING' CHECK (sync_status IN ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'ERROR')),
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sync_error TEXT,
ADD COLUMN IF NOT EXISTS results_count INTEGER DEFAULT 0;

-- 2. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_athlete_external_mappings_sync_status
ON athlete_external_mappings(sync_status);

CREATE INDEX IF NOT EXISTS idx_athlete_external_mappings_last_synced
ON athlete_external_mappings(last_synced_at DESC);

-- 3. Comentarios de documentación
COMMENT ON COLUMN athlete_external_mappings.sync_status IS 'Estado de la última sincronización: PENDING, IN_PROGRESS, SUCCESS, ERROR';
COMMENT ON COLUMN athlete_external_mappings.last_synced_at IS 'Timestamp de la última sincronización exitosa';
COMMENT ON COLUMN athlete_external_mappings.sync_error IS 'Mensaje de error de la última sincronización fallida';
COMMENT ON COLUMN athlete_external_mappings.results_count IS 'Cantidad de resultados encontrados en la última sincronización';

-- 4. Función helper para resetear estado de sincronización
CREATE OR REPLACE FUNCTION reset_sync_status()
RETURNS void AS $$
BEGIN
  UPDATE athlete_external_mappings
  SET sync_status = 'PENDING',
      sync_error = NULL
  WHERE sync_status = 'IN_PROGRESS'
    AND last_synced_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reset_sync_status() IS 'Resetea sincronizaciones que quedaron en IN_PROGRESS por más de 1 hora (probablemente fallaron)';

-- 5. Función para limpiar resultados de competencias importados del SQLite
CREATE OR REPLACE FUNCTION clean_imported_results()
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  count BIGINT;
BEGIN
  -- Eliminar solo resultados importados de la fuente SQLite (no de FECNA API)
  DELETE FROM swim_competition_results
  WHERE source != 'FECNA_API' OR source IS NULL;

  GET DIAGNOSTICS count = ROW_COUNT;

  RETURN QUERY SELECT count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION clean_imported_results() IS 'Limpia resultados importados del SQLite antiguo, manteniendo solo los de FECNA API';
