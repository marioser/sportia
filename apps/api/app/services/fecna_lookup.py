"""
Helper para buscar ID de nadadores en FECNA
"""
import requests
from bs4 import BeautifulSoup
from typing import Optional, List, Dict
import logging

logger = logging.getLogger(__name__)


def normalize_name(name: str) -> str:
    """Normalizar nombre para comparación"""
    return name.lower().strip().replace(',', '').replace('  ', ' ')


def find_swimmer_id(swimmer_name: str) -> Optional[str]:
    """
    Buscar el ID de FECNA de un nadador por nombre

    Args:
        swimmer_name: Nombre del nadador (ej: "Victoria Serrano")

    Returns:
        ID del nadador en FECNA o None si no se encuentra
    """
    try:
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0'
        })

        # Cargar página de historial que tiene el select de nadadores
        url = 'https://ecoapplet.co/fecna/reportes/historial'
        resp = session.get(url, timeout=30)

        if resp.status_code != 200:
            logger.error(f"Error cargando página FECNA: {resp.status_code}")
            return None

        soup = BeautifulSoup(resp.content, 'html.parser')

        # Buscar el select de nadadores
        nadador_select = soup.find('select', {'name': 'nadador'})
        if not nadador_select:
            logger.error("Select de nadador no encontrado")
            return None

        # Normalizar nombre de búsqueda
        search_name = normalize_name(swimmer_name)

        # Buscar en todas las opciones
        best_match = None
        best_similarity = 0

        for option in nadador_select.find_all('option'):
            fecna_id = option.get('value')
            option_name = option.get_text(strip=True)

            if not fecna_id or not option_name:
                continue

            option_normalized = normalize_name(option_name)

            # Buscar match exacto
            if search_name == option_normalized:
                logger.info(f"Match exacto: {option_name} = ID {fecna_id}")
                return fecna_id

            # Buscar si contiene el nombre
            if search_name in option_normalized or option_normalized in search_name:
                # Calcular similitud simple
                similarity = len(search_name) / max(len(search_name), len(option_normalized))

                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match = (fecna_id, option_name)

        # Si encontramos un match con al menos 70% de similitud
        if best_match and best_similarity >= 0.7:
            fecna_id, matched_name = best_match
            logger.info(
                f"Match por similitud ({best_similarity:.2%}): "
                f"{matched_name} = ID {fecna_id}"
            )
            return fecna_id

        logger.warning(f"No se encontró ID para '{swimmer_name}'")
        return None

    except Exception as e:
        logger.error(f"Error buscando ID de nadador: {e}")
        return None


def search_swimmers(query: str, limit: int = 20) -> List[Dict[str, str]]:
    """
    Buscar nadadores por nombre parcial

    Args:
        query: Texto de búsqueda
        limit: Máximo de resultados

    Returns:
        Lista de diccionarios con {id, name}
    """
    try:
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0'
        })

        url = 'https://ecoapplet.co/fecna/reportes/historial'
        resp = session.get(url, timeout=30)

        if resp.status_code != 200:
            return []

        soup = BeautifulSoup(resp.content, 'html.parser')
        nadador_select = soup.find('select', {'name': 'nadador'})

        if not nadador_select:
            return []

        query_normalized = normalize_name(query)
        results = []

        for option in nadador_select.find_all('option'):
            fecna_id = option.get('value')
            name = option.get_text(strip=True)

            if not fecna_id or not name:
                continue

            if query_normalized in normalize_name(name):
                results.append({
                    'id': fecna_id,
                    'name': name
                })

                if len(results) >= limit:
                    break

        return results

    except Exception as e:
        logger.error(f"Error buscando nadadores: {e}")
        return []
