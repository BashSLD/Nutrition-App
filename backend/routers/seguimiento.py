from fastapi import APIRouter, Depends, HTTPException
from routers.auth import get_current_user
from models.seguimiento import RegistroCreate, RegistroUpdate
from db import get_supabase
import logging

logger = logging.getLogger("nutriapp")
router = APIRouter()


@router.get("/")
def get_registros(user=Depends(get_current_user)):
    try:
        supabase = get_supabase()
        result = supabase.table("registros").select("*").eq("user_id", user.id).order("fecha", desc=True).execute()
        return result.data
    except Exception as e:
        logger.error(f"Error fetching registros for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener registros")


@router.post("/")
def create_registro(body: RegistroCreate, user=Depends(get_current_user)):
    try:
        data = body.model_dump()
        data["user_id"] = user.id
        data["fecha"] = str(data["fecha"])
        supabase = get_supabase()
        result = supabase.table("registros").upsert(data, on_conflict="user_id,fecha").execute()
        return result.data
    except Exception as e:
        logger.error(f"Error creating registro for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail="Error al crear registro")


@router.patch("/{registro_id}")
def update_registro(registro_id: str, body: RegistroUpdate, user=Depends(get_current_user)):
    data = body.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")
    if "fecha" in data:
        data["fecha"] = str(data["fecha"])
    try:
        supabase = get_supabase()
        result = supabase.table("registros").update(data).eq("id", registro_id).eq("user_id", user.id).execute()
        return result.data
    except Exception as e:
        logger.error(f"Error updating registro {registro_id}: {e}")
        raise HTTPException(status_code=500, detail="Error al actualizar registro")


@router.delete("/{registro_id}")
def delete_registro(registro_id: str, user=Depends(get_current_user)):
    try:
        supabase = get_supabase()
        supabase.table("registros").delete().eq("id", registro_id).eq("user_id", user.id).execute()
        return {"deleted": True}
    except Exception as e:
        logger.error(f"Error deleting registro {registro_id}: {e}")
        raise HTTPException(status_code=500, detail="Error al eliminar registro")
