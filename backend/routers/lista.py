from fastapi import APIRouter, Depends, HTTPException
from routers.auth import get_current_user
from models.lista import ListaItemCreate, OwnerEnum
from db import get_supabase
from datetime import datetime, timezone
import logging

logger = logging.getLogger("nutriapp")
router = APIRouter()


@router.get("/")
def get_lista(owner: OwnerEnum = OwnerEnum.compartida, user=Depends(get_current_user)):
    try:
        supabase = get_supabase()
        result = supabase.table("lista_items").select("*").eq("owner", owner.value).order("categoria").execute()
        return result.data
    except Exception as e:
        logger.error(f"Error fetching lista (owner={owner.value}): {e}")
        raise HTTPException(status_code=500, detail="Error al obtener lista")


@router.patch("/{item_id}/check")
def check_item(item_id: str, user=Depends(get_current_user)):
    try:
        supabase = get_supabase()
        current = supabase.table("lista_items").select("checked").eq("id", item_id).single().execute()
        if not current.data:
            raise HTTPException(status_code=404, detail="Item no encontrado")
        new_val = not current.data["checked"]
        result = supabase.table("lista_items").update({
            "checked": new_val,
            "checked_by": user.id,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", item_id).execute()
        return result.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling check on item {item_id}: {e}")
        raise HTTPException(status_code=500, detail="Error al actualizar item")


@router.post("/reset")
def reset_lista(owner: OwnerEnum = OwnerEnum.compartida, user=Depends(get_current_user)):
    try:
        supabase = get_supabase()
        supabase.table("lista_items").update({
            "checked": False,
            "checked_by": None
        }).eq("owner", owner.value).execute()
        return {"reset": True}
    except Exception as e:
        logger.error(f"Error resetting lista (owner={owner.value}): {e}")
        raise HTTPException(status_code=500, detail="Error al reiniciar lista")


@router.post("/")
def add_item(body: ListaItemCreate, user=Depends(get_current_user)):
    try:
        data = body.model_dump()
        data["owner"] = data["owner"].value if hasattr(data["owner"], "value") else data["owner"]
        data["frecuencia"] = data["frecuencia"].value if hasattr(data["frecuencia"], "value") else data["frecuencia"]
        if data.get("badge"):
            data["badge"] = data["badge"].value if hasattr(data["badge"], "value") else data["badge"]
        supabase = get_supabase()
        result = supabase.table("lista_items").insert(data).execute()
        return result.data
    except Exception as e:
        logger.error(f"Error adding lista item: {e}")
        raise HTTPException(status_code=500, detail="Error al agregar item")


@router.delete("/{item_id}")
def delete_item(item_id: str, user=Depends(get_current_user)):
    try:
        supabase = get_supabase()
        supabase.table("lista_items").delete().eq("id", item_id).execute()
        return {"deleted": True}
    except Exception as e:
        logger.error(f"Error deleting item {item_id}: {e}")
        raise HTTPException(status_code=500, detail="Error al eliminar item")
