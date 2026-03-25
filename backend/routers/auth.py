from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from db import get_supabase
import logging

logger = logging.getLogger("nutriapp")
router = APIRouter()
bearer = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    """Valida el JWT de Supabase y devuelve el usuario."""
    token = credentials.credentials
    try:
        supabase = get_supabase()
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Token inválido")
        return user.user
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Auth failed: {e}")
        raise HTTPException(status_code=401, detail="No autorizado")


@router.get("/me")
def get_me(user=Depends(get_current_user)):
    """Devuelve perfil del usuario autenticado."""
    try:
        supabase = get_supabase()
        profile = supabase.table("profiles").select("*").eq("id", user.id).single().execute()
        return {
            "id": user.id,
            "email": user.email,
            "profile": profile.data
        }
    except Exception as e:
        logger.error(f"Error fetching profile for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener perfil")
