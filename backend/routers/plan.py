from fastapi import APIRouter, Depends, HTTPException
from routers.auth import get_current_user
from models.plan import MealUpdate, JugoUpdate
from db import get_supabase
import logging

logger = logging.getLogger("nutriapp")
router = APIRouter()


@router.get("/meals")
def get_meals(user=Depends(get_current_user)):
    try:
        supabase = get_supabase()
        result = supabase.table("meals").select("*").eq("user_id", user.id).order("orden").execute()
        return result.data
    except Exception as e:
        logger.error(f"Error fetching meals for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener comidas")


@router.get("/jugos")
def get_jugos(user=Depends(get_current_user)):
    try:
        supabase = get_supabase()
        result = supabase.table("jugos").select("*").eq("user_id", user.id).order("orden").execute()
        return result.data
    except Exception as e:
        logger.error(f"Error fetching jugos for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener jugos")


@router.patch("/meals/{meal_id}")
def update_meal(meal_id: str, body: MealUpdate, user=Depends(get_current_user)):
    data = body.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")
    try:
        supabase = get_supabase()
        result = supabase.table("meals").update(data).eq("id", meal_id).eq("user_id", user.id).execute()
        return result.data
    except Exception as e:
        logger.error(f"Error updating meal {meal_id}: {e}")
        raise HTTPException(status_code=500, detail="Error al actualizar comida")


@router.patch("/jugos/{jugo_id}")
def update_jugo(jugo_id: str, body: JugoUpdate, user=Depends(get_current_user)):
    data = body.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")
    try:
        supabase = get_supabase()
        result = supabase.table("jugos").update(data).eq("id", jugo_id).eq("user_id", user.id).execute()
        return result.data
    except Exception as e:
        logger.error(f"Error updating jugo {jugo_id}: {e}")
        raise HTTPException(status_code=500, detail="Error al actualizar jugo")
