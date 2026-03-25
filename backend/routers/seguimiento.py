from fastapi import APIRouter, Depends, HTTPException
from routers.auth import get_current_user
from models.seguimiento import RegistroCreate, RegistroUpdate
from db import supabase

router = APIRouter()


@router.get("/")
def get_registros(user=Depends(get_current_user)):
    result = supabase.table("registros").select("*").eq("user_id", user.id).order("fecha", desc=True).execute()
    return result.data


@router.post("/")
def create_registro(body: RegistroCreate, user=Depends(get_current_user)):
    data = body.model_dump()
    data["user_id"] = user.id
    data["fecha"] = str(data["fecha"])
    result = supabase.table("registros").upsert(data, on_conflict="user_id,fecha").execute()
    return result.data


@router.patch("/{registro_id}")
def update_registro(registro_id: str, body: RegistroUpdate, user=Depends(get_current_user)):
    data = body.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")
    if "fecha" in data:
        data["fecha"] = str(data["fecha"])
    result = supabase.table("registros").update(data).eq("id", registro_id).eq("user_id", user.id).execute()
    return result.data


@router.delete("/{registro_id}")
def delete_registro(registro_id: str, user=Depends(get_current_user)):
    supabase.table("registros").delete().eq("id", registro_id).eq("user_id", user.id).execute()
    return {"deleted": True}
