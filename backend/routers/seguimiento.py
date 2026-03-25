from fastapi import APIRouter, Depends
from routers.auth import get_current_user
from db import supabase

router = APIRouter()

@router.get("/")
def get_registros(user=Depends(get_current_user)):
    result = supabase.table("registros").select("*").eq("user_id", user.id).order("fecha", desc=True).execute()
    return result.data

@router.post("/")
def create_registro(body: dict, user=Depends(get_current_user)):
    body["user_id"] = user.id
    result = supabase.table("registros").upsert(body, on_conflict="user_id,fecha").execute()
    return result.data

@router.patch("/{registro_id}")
def update_registro(registro_id: str, body: dict, user=Depends(get_current_user)):
    result = supabase.table("registros").update(body).eq("id", registro_id).eq("user_id", user.id).execute()
    return result.data

@router.delete("/{registro_id}")
def delete_registro(registro_id: str, user=Depends(get_current_user)):
    supabase.table("registros").delete().eq("id", registro_id).eq("user_id", user.id).execute()
    return {"deleted": True}
