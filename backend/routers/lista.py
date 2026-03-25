from fastapi import APIRouter, Depends, HTTPException
from routers.auth import get_current_user
from models.lista import ListaItemCreate, OwnerEnum
from db import supabase

router = APIRouter()


@router.get("/")
def get_lista(owner: OwnerEnum = OwnerEnum.compartida, user=Depends(get_current_user)):
    result = supabase.table("lista_items").select("*").eq("owner", owner.value).order("categoria").execute()
    return result.data


@router.patch("/{item_id}/check")
def check_item(item_id: str, user=Depends(get_current_user)):
    current = supabase.table("lista_items").select("checked").eq("id", item_id).single().execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    new_val = not current.data["checked"]
    result = supabase.table("lista_items").update({
        "checked": new_val,
        "checked_by": user.id,
        "updated_at": "now()"
    }).eq("id", item_id).execute()
    return result.data


@router.post("/reset")
def reset_lista(owner: OwnerEnum = OwnerEnum.compartida, user=Depends(get_current_user)):
    supabase.table("lista_items").update({
        "checked": False,
        "checked_by": None
    }).eq("owner", owner.value).execute()
    return {"reset": True}


@router.post("/")
def add_item(body: ListaItemCreate, user=Depends(get_current_user)):
    data = body.model_dump()
    data["owner"] = data["owner"].value if hasattr(data["owner"], "value") else data["owner"]
    data["frecuencia"] = data["frecuencia"].value if hasattr(data["frecuencia"], "value") else data["frecuencia"]
    if data.get("badge"):
        data["badge"] = data["badge"].value if hasattr(data["badge"], "value") else data["badge"]
    result = supabase.table("lista_items").insert(data).execute()
    return result.data


@router.delete("/{item_id}")
def delete_item(item_id: str, user=Depends(get_current_user)):
    supabase.table("lista_items").delete().eq("id", item_id).execute()
    return {"deleted": True}
