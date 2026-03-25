from fastapi import APIRouter, Depends
from routers.auth import get_current_user
from db import supabase

router = APIRouter()

@router.get("/")
def get_lista(owner: str = "compartida", user=Depends(get_current_user)):
    result = supabase.table("lista_items").select("*").eq("owner", owner).order("categoria").execute()
    return result.data

@router.patch("/{item_id}/check")
def check_item(item_id: str, user=Depends(get_current_user)):
    current = supabase.table("lista_items").select("checked").eq("id", item_id).single().execute()
    new_val = not current.data["checked"]
    result = supabase.table("lista_items").update({
        "checked": new_val,
        "checked_by": user.id,
        "updated_at": "now()"
    }).eq("id", item_id).execute()
    return result.data

@router.post("/reset")
def reset_lista(owner: str = "compartida", user=Depends(get_current_user)):
    result = supabase.table("lista_items").update({
        "checked": False,
        "checked_by": None
    }).eq("owner", owner).execute()
    return {"reset": True}

@router.post("/")
def add_item(body: dict, user=Depends(get_current_user)):
    result = supabase.table("lista_items").insert(body).execute()
    return result.data

@router.delete("/{item_id}")
def delete_item(item_id: str, user=Depends(get_current_user)):
    supabase.table("lista_items").delete().eq("id", item_id).execute()
    return {"deleted": True}
