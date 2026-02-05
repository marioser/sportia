-- Migration: Agregar número de documento a atletas
-- Fecha: 2026-02-04
-- Descripción: El número de documento es el ID de FECNA del nadador

-- 1. Agregar columna document_number
ALTER TABLE athletes
ADD COLUMN IF NOT EXISTS document_number VARCHAR(20);

-- 2. Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_athletes_document_number
ON athletes(document_number);

-- 3. Comentario de documentación
COMMENT ON COLUMN athletes.document_number IS 'Número de identificación nacional del atleta (usado como ID en FECNA)';

-- 4. Función helper para sincronizar automáticamente cuando se agrega documento
CREATE OR REPLACE FUNCTION auto_create_fecna_mapping()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el atleta tiene número de documento y no existe mapping
  IF NEW.document_number IS NOT NULL AND NEW.document_number != '' THEN
    -- Verificar si ya existe mapping
    IF NOT EXISTS (
      SELECT 1 FROM athlete_external_mappings
      WHERE athlete_id = NEW.id AND source = 'FECNA'
    ) THEN
      -- Crear mapping automático con el número de documento
      INSERT INTO athlete_external_mappings (
        athlete_id,
        external_name,
        external_name_norm,
        source,
        status,
        confidence_score,
        metadata
      ) VALUES (
        NEW.id,
        CONCAT(NEW.first_name, ' ', NEW.last_name),
        LOWER(CONCAT(NEW.first_name, ' ', NEW.last_name)),
        'FECNA',
        'CONFIRMED',  -- Auto-confirmar porque viene del formulario
        1.0,
        jsonb_build_object('fecna_id', NEW.document_number)
      );
    ELSE
      -- Actualizar mapping existente con el nuevo documento
      UPDATE athlete_external_mappings
      SET metadata = jsonb_build_object('fecna_id', NEW.document_number),
          status = 'CONFIRMED',
          confidence_score = 1.0
      WHERE athlete_id = NEW.id AND source = 'FECNA';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger para auto-crear mapping
DROP TRIGGER IF EXISTS trigger_auto_create_fecna_mapping ON athletes;

CREATE TRIGGER trigger_auto_create_fecna_mapping
  AFTER INSERT OR UPDATE OF document_number ON athletes
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_fecna_mapping();

COMMENT ON FUNCTION auto_create_fecna_mapping() IS 'Crea/actualiza automáticamente el mapping de FECNA cuando se agrega/modifica el número de documento';
