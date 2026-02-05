"""
Servicio de sincronización selectiva con API de FECNA
Obtiene resultados de competencias solo para atletas vinculados
"""
import requests
from bs4 import BeautifulSoup
import time
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class FECNASyncService:
    """
    Servicio para sincronizar resultados de competencias desde FECNA
    solo para atletas específicos
    """

    BASE_URL = "https://ecoapplet.co/fecna/reportes"

    # Mapeo de pruebas (ID -> distancia, estilo)
    PRUEBAS = {
        2: (50, 'FREE', 'SCM'),
        3: (100, 'FREE', 'SCM'),
        4: (200, 'FREE', 'SCM'),
        5: (400, 'FREE', 'SCM'),
        6: (800, 'FREE', 'SCM'),
        7: (1500, 'FREE', 'SCM'),
        9: (50, 'BACK', 'SCM'),
        10: (100, 'BACK', 'SCM'),
        11: (200, 'BACK', 'SCM'),
        13: (50, 'BREAST', 'SCM'),
        14: (100, 'BREAST', 'SCM'),
        15: (200, 'BREAST', 'SCM'),
        17: (50, 'FLY', 'SCM'),
        18: (100, 'FLY', 'SCM'),
        19: (200, 'FLY', 'SCM'),
        21: (200, 'IM', 'SCM'),
        22: (400, 'IM', 'SCM'),
    }

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })

    def _initialize_session(self):
        """Obtener cookies de sesión inicial"""
        try:
            self.session.get(f"{self.BASE_URL}/index")
            logger.info("Sesión FECNA inicializada")
        except Exception as e:
            logger.error(f"Error inicializando sesión: {e}")
            raise

    def _submit_search_form(
        self,
        nadador_id: str,
        fecha_inicio: str = None,
        fecha_fin: str = None
    ) -> bool:
        """
        Enviar formulario de búsqueda para establecer contexto de sesión

        Args:
            nadador_id: ID del nadador en FECNA
            fecha_inicio: Fecha inicio (YYYY-MM-DD)
            fecha_fin: Fecha fin (YYYY-MM-DD)

        Returns:
            True si exitoso
        """
        # Usar rango amplio por defecto para obtener todos los resultados
        if not fecha_fin:
            fecha_fin = datetime.now().strftime('%Y-%m-%d')
        if not fecha_inicio:
            # 3 años hacia atrás
            fecha_inicio = (datetime.now() - timedelta(days=1095)).strftime('%Y-%m-%d')

        payload = (
            f"inicio={fecha_inicio}&"
            f"fin={fecha_fin}&"
            f"nadador={nadador_id}&"
            f"anual=0&"  # 0 = obtener TODOS los registros (no agrupar por año)
            f"prueba=1"
        )

        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': f'{self.BASE_URL}/index'
        }

        try:
            resp = self.session.post(
                f"{self.BASE_URL}/historialFilter",
                data=payload,
                headers=headers,
                timeout=30
            )

            if resp.status_code == 200:
                logger.info(f"Formulario enviado para nadador {nadador_id}")
                # Pequeña pausa para que el servidor procese
                time.sleep(0.5)
                return True
            else:
                logger.error(f"Error en POST: {resp.status_code}")
                return False

        except Exception as e:
            logger.error(f"Error enviando formulario: {e}")
            return False

    def get_athlete_results(
        self,
        nadador_id: str,
        fecha_inicio: str = None,
        fecha_fin: str = None
    ) -> List[Dict[str, Any]]:
        """
        Obtener todos los resultados de un nadador

        Args:
            nadador_id: ID del nadador en FECNA
            fecha_inicio: Fecha inicio búsqueda
            fecha_fin: Fecha fin búsqueda

        Returns:
            Lista de resultados con todas las pruebas
        """
        self._initialize_session()

        # Enviar formulario para establecer contexto de nadador en sesión
        if not self._submit_search_form(nadador_id, fecha_inicio, fecha_fin):
            logger.warning(f"No se pudo establecer contexto para nadador {nadador_id}")
            return []

        # Headers para peticiones AJAX (igual que el navegador)
        self.session.headers.update({
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': f'{self.BASE_URL}/historialFilter',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36'
        })

        all_results = []

        # Consultar todas las pruebas
        for prueba_id, (distancia, estilo, piscina) in self.PRUEBAS.items():
            try:
                timestamp = int(time.time() * 1000)
                url = f"{self.BASE_URL}/{prueba_id}/getHistorial?_={timestamp}"

                resp = self.session.get(url, timeout=15)

                if resp.status_code == 200:
                    data = resp.json()

                    if isinstance(data, list) and data:
                        # Agregar info de la prueba a cada resultado
                        for result in data:
                            result['distance_m'] = distancia
                            result['stroke'] = estilo
                            result['pool_type'] = piscina
                            all_results.append(result)

                        logger.info(
                            f"Prueba {prueba_id} ({distancia}m {estilo}): "
                            f"{len(data)} resultados"
                        )
                    else:
                        logger.debug(f"Prueba {prueba_id}: sin resultados")

                else:
                    logger.warning(f"Error en prueba {prueba_id}: {resp.status_code}")

                # Pequeña pausa para no saturar la API
                time.sleep(0.2)

            except Exception as e:
                logger.error(f"Error obteniendo prueba {prueba_id}: {e}")
                continue

        logger.info(f"Total resultados para nadador {nadador_id}: {len(all_results)}")
        return all_results

    def transform_to_competition_result(
        self,
        fecna_result: Dict[str, Any],
        athlete_id: str
    ) -> Dict[str, Any]:
        """
        Transformar resultado de FECNA al formato de swim_competition_results

        Args:
            fecna_result: Resultado raw de FECNA
            athlete_id: UUID del atleta en Supabase

        Returns:
            Dict con formato para insertar en BD
        """
        # Parsear tiempo "HH:MM:SS.cc" a milisegundos
        tiempo_str = fecna_result.get('tiempo', '00:00:00.00')
        parts = tiempo_str.split(':')

        if len(parts) == 3:
            horas, minutos, segundos = parts
            total_ms = (
                int(horas) * 3600000 +
                int(minutos) * 60000 +
                int(float(segundos) * 1000)
            )
        else:
            total_ms = int(float(fecna_result.get('segundos', 0)) * 1000)

        # Extraer año de la fecha
        fecha_torneo = fecna_result.get('fecha_torneo', '')
        try:
            year = int(fecha_torneo.split('-')[0]) if fecha_torneo else None
        except:
            year = None

        # Normalizar género
        gender_map = {'F': 'F', 'M': 'M', 'FEMENINO': 'F', 'MASCULINO': 'M'}
        gender = gender_map.get(
            str(fecna_result.get('genero', '')).upper(),
            'F'
        )

        return {
            'athlete_id': athlete_id,
            'year': year,
            'tournament_name': fecna_result.get('torneo', ''),
            'event_date': fecha_torneo or None,
            'gender': gender,
            'distance_m': fecna_result.get('distance_m'),
            'stroke': fecna_result.get('stroke'),
            'round': None,  # FECNA no proporciona esta info
            'age': fecna_result.get('edad'),
            'swimmer_name': '',  # Lo obtendríamos del atleta
            'swimmer_name_norm': '',  # Lo calcularíamos
            'team_code': None,  # FECNA no lo incluye en esta API
            'rank': None,  # No disponible
            'final_time_ms': total_ms,
            'seed_time_ms': None,  # No disponible
            'source': 'FECNA_API'
        }


# Instancia global
fecna_sync = FECNASyncService()
