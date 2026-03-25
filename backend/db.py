from supabase import create_client, Client
import os
import logging

logger = logging.getLogger("nutriapp")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Faltan variables de entorno: SUPABASE_URL y SUPABASE_SERVICE_KEY")


def get_supabase() -> Client:
    """Retorna un cliente Supabase. Thread-safe para FastAPI."""
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
