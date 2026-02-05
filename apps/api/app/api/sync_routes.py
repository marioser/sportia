"""
Endpoints de sincronización de resultados de competencias desde FECNA
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import logging

from ..services.fecna_sync import fecna_sync
from ..services.fecna_lookup import find_swimmer_id, search_swimmers
from supabase import create_client
from ..core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sync", tags=["sync"])


class SyncAthleteRequest(BaseModel):
    """Request para sincronizar un atleta"""
    athlete_id: str
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None


class SyncStatsResponse(BaseModel):
    """Estadísticas de sincronización"""
    total_athletes: int
    matched_athletes: int
    pending_match: int
    last_sync_count: int


@router.post("/athlete/{athlete_id}")
async def sync_athlete(athlete_id: str, fecha_inicio: str = None, fecha_fin: str = None):
    """
    Sincronizar resultados de un atleta específico desde FECNA

    Args:
        athlete_id: UUID del atleta en Supabase
        fecha_inicio: Fecha inicio (YYYY-MM-DD), default: hace 2 años
        fecha_fin: Fecha fin (YYYY-MM-DD), default: hoy

    Returns:
        Dict con resultados de la sincronización
    """
    try:
        supabase = create_client(settings.supabase_url, settings.supabase_key)

        # 1. Obtener mapping del atleta para conseguir su ID de FECNA
        mapping_resp = supabase.table('athlete_external_mappings')\
            .select('*')\
            .eq('athlete_id', athlete_id)\
            .eq('source', 'FECNA')\
            .eq('status', 'CONFIRMED')\
            .execute()

        if not mapping_resp.data:
            raise HTTPException(
                status_code=404,
                detail=f"No hay mapping confirmado de FECNA para atleta {athlete_id}"
            )

        mapping = mapping_resp.data[0]
        fecna_id = mapping.get('metadata', {}).get('fecna_id')

        if not fecna_id:
            raise HTTPException(
                status_code=400,
                detail="El mapping no contiene fecna_id en metadata"
            )

        # 2. Obtener nombre del atleta
        athlete_resp = supabase.table('athletes')\
            .select('first_name, last_name')\
            .eq('id', athlete_id)\
            .single()\
            .execute()

        athlete = athlete_resp.data
        swimmer_name = f"{athlete['first_name']} {athlete['last_name']}"

        # 3. Marcar sincronización como en progreso
        supabase.table('athlete_external_mappings')\
            .update({'sync_status': 'IN_PROGRESS'})\
            .eq('id', mapping['id'])\
            .execute()

        # 4. Obtener resultados de FECNA
        logger.info(f"Sincronizando atleta {swimmer_name} (FECNA ID: {fecna_id})")

        results = fecna_sync.get_athlete_results(
            nadador_id=str(fecna_id),
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )

        # 5. Transformar y preparar para inserción
        new_results = []
        for result in results:
            transformed = fecna_sync.transform_to_competition_result(result, athlete_id)
            transformed['swimmer_name'] = swimmer_name
            transformed['swimmer_name_norm'] = swimmer_name.lower()
            new_results.append(transformed)

        # 6. Buscar resultados que ya existen (para evitar duplicados)
        existing_count = 0
        inserted_count = 0

        if new_results:
            for result in new_results:
                # Verificar si ya existe (mismo atleta, torneo, prueba, tiempo)
                existing = supabase.table('swim_competition_results')\
                    .select('id')\
                    .eq('athlete_id', athlete_id)\
                    .eq('tournament_name', result['tournament_name'])\
                    .eq('distance_m', result['distance_m'])\
                    .eq('stroke', result['stroke'])\
                    .eq('final_time_ms', result['final_time_ms'])\
                    .execute()

                if existing.data:
                    existing_count += 1
                else:
                    # Insertar nuevo resultado
                    supabase.table('swim_competition_results').insert(result).execute()
                    inserted_count += 1

        # 7. Actualizar mapping con estado de sincronización
        supabase.table('athlete_external_mappings')\
            .update({
                'sync_status': 'SUCCESS',
                'last_synced_at': datetime.utcnow().isoformat(),
                'results_count': len(new_results),
                'sync_error': None
            })\
            .eq('id', mapping['id'])\
            .execute()

        return {
            'success': True,
            'athlete_id': athlete_id,
            'athlete_name': swimmer_name,
            'fecna_id': fecna_id,
            'total_results': len(results),
            'new_results': inserted_count,
            'existing_results': existing_count,
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sincronizando atleta {athlete_id}: {e}", exc_info=True)

        # Marcar error en mapping
        try:
            supabase.table('athlete_external_mappings')\
                .update({
                    'sync_status': 'ERROR',
                    'sync_error': str(e)
                })\
                .eq('athlete_id', athlete_id)\
                .execute()
        except:
            pass

        raise HTTPException(status_code=500, detail=str(e))


@router.post("/all")
async def sync_all_athletes(fecha_inicio: str = None, fecha_fin: str = None):
    """
    Sincronizar todos los atletas con mapping confirmado

    Args:
        fecha_inicio: Fecha inicio (YYYY-MM-DD)
        fecha_fin: Fecha fin (YYYY-MM-DD)

    Returns:
        Dict con resumen de sincronización
    """
    try:
        supabase = create_client(settings.supabase_url, settings.supabase_key)

        # Obtener todos los mappings confirmados
        mappings_resp = supabase.table('athlete_external_mappings')\
            .select('athlete_id, metadata')\
            .eq('source', 'FECNA')\
            .eq('status', 'CONFIRMED')\
            .execute()

        athletes = mappings_resp.data
        total = len(athletes)
        success = 0
        errors = []

        for athlete_map in athletes:
            athlete_id = athlete_map['athlete_id']

            try:
                # Llamar al endpoint de sincronización individual
                await sync_athlete(athlete_id, fecha_inicio, fecha_fin)
                success += 1
            except Exception as e:
                logger.error(f"Error sincronizando {athlete_id}: {e}")
                errors.append({
                    'athlete_id': athlete_id,
                    'error': str(e)
                })

        return {
            'success': True,
            'total_athletes': total,
            'successful': success,
            'failed': len(errors),
            'errors': errors
        }

    except Exception as e:
        logger.error(f"Error en sincronización masiva: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{athlete_id}")
async def get_sync_status(athlete_id: str):
    """Obtener estado de última sincronización de un atleta"""
    try:
        supabase = create_client(settings.supabase_url, settings.supabase_key)

        mapping_resp = supabase.table('athlete_external_mappings')\
            .select('*')\
            .eq('athlete_id', athlete_id)\
            .eq('source', 'FECNA')\
            .execute()

        if not mapping_resp.data:
            raise HTTPException(status_code=404, detail="Mapping no encontrado")

        mapping = mapping_resp.data[0]

        return {
            'athlete_id': athlete_id,
            'sync_status': mapping.get('sync_status', 'PENDING'),
            'last_synced_at': mapping.get('last_synced_at'),
            'results_count': mapping.get('results_count', 0),
            'sync_error': mapping.get('sync_error')
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo estado: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_sync_stats():
    """Obtener estadísticas globales de sincronización"""
    try:
        supabase = create_client(settings.supabase_url, settings.supabase_key)

        # Total de atletas
        athletes_resp = supabase.table('athletes').select('id', count='exact').execute()
        total_athletes = athletes_resp.count or 0

        # Atletas con mapping confirmado
        matched_resp = supabase.table('athlete_external_mappings')\
            .select('athlete_id', count='exact')\
            .eq('source', 'FECNA')\
            .eq('status', 'CONFIRMED')\
            .execute()
        matched = matched_resp.count or 0

        # Atletas pendientes de matching
        pending_resp = supabase.table('athlete_external_mappings')\
            .select('athlete_id', count='exact')\
            .eq('source', 'FECNA')\
            .eq('status', 'PENDING')\
            .execute()
        pending = pending_resp.count or 0

        # Última sincronización
        last_sync_resp = supabase.table('athlete_external_mappings')\
            .select('last_synced_at, results_count')\
            .eq('source', 'FECNA')\
            .order('last_synced_at', desc=True)\
            .limit(1)\
            .execute()

        last_sync = last_sync_resp.data[0] if last_sync_resp.data else None

        return {
            'total_athletes': total_athletes,
            'matched_athletes': matched,
            'pending_match': pending,
            'last_sync_at': last_sync.get('last_synced_at') if last_sync else None,
            'last_sync_results': last_sync.get('results_count', 0) if last_sync else 0
        }

    except Exception as e:
        logger.error(f"Error obteniendo estadísticas: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/lookup/{swimmer_name}")
async def lookup_fecna_id(swimmer_name: str):
    """
    Buscar el ID de FECNA de un nadador por nombre

    Args:
        swimmer_name: Nombre del nadador

    Returns:
        Dict con fecna_id y nombre encontrado
    """
    try:
        fecna_id = find_swimmer_id(swimmer_name)

        if not fecna_id:
            raise HTTPException(
                status_code=404,
                detail=f"No se encontró ID de FECNA para '{swimmer_name}'"
            )

        return {
            'success': True,
            'swimmer_name': swimmer_name,
            'fecna_id': fecna_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error buscando ID: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search-swimmers")
async def search_fecna_swimmers(q: str, limit: int = 20):
    """
    Buscar nadadores en FECNA por nombre parcial

    Args:
        q: Query de búsqueda
        limit: Máximo de resultados

    Returns:
        Lista de nadadores encontrados
    """
    try:
        results = search_swimmers(q, limit)

        return {
            'success': True,
            'query': q,
            'results': results,
            'count': len(results)
        }

    except Exception as e:
        logger.error(f"Error buscando nadadores: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update-fecna-id/{athlete_id}")
async def update_athlete_fecna_id(athlete_id: str):
    """
    Buscar y actualizar el fecna_id de un atleta con mapping confirmado

    Args:
        athlete_id: UUID del atleta

    Returns:
        Dict con resultado de la actualización
    """
    try:
        supabase = create_client(settings.supabase_url, settings.supabase_key)

        # Obtener mapping y nombre del atleta
        athlete_resp = supabase.table('athletes')\
            .select('first_name, last_name')\
            .eq('id', athlete_id)\
            .single()\
            .execute()

        athlete = athlete_resp.data
        swimmer_name = f"{athlete['first_name']} {athlete['last_name']}"

        # Buscar ID en FECNA
        logger.info(f"Buscando ID de FECNA para {swimmer_name}...")
        fecna_id = find_swimmer_id(swimmer_name)

        if not fecna_id:
            raise HTTPException(
                status_code=404,
                detail=f"No se encontró ID de FECNA para {swimmer_name}"
            )

        # Actualizar mapping
        mapping_resp = supabase.table('athlete_external_mappings')\
            .select('id')\
            .eq('athlete_id', athlete_id)\
            .eq('source', 'FECNA')\
            .eq('status', 'CONFIRMED')\
            .execute()

        if not mapping_resp.data:
            raise HTTPException(
                status_code=404,
                detail="No hay mapping confirmado para este atleta"
            )

        mapping_id = mapping_resp.data[0]['id']

        # Actualizar metadata con fecna_id
        supabase.table('athlete_external_mappings')\
            .update({'metadata': {'fecna_id': fecna_id}})\
            .eq('id', mapping_id)\
            .execute()

        logger.info(f"ID de FECNA actualizado: {swimmer_name} = {fecna_id}")

        return {
            'success': True,
            'athlete_id': athlete_id,
            'swimmer_name': swimmer_name,
            'fecna_id': fecna_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando fecna_id: {e}")
        raise HTTPException(status_code=500, detail=str(e))
