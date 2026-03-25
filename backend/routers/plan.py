from fastapi import APIRouter, Depends
from routers.auth import get_current_user
from db import supabase

router = APIRouter()

@router.get("/meals")
def get_meals(user=Depends(get_current_user)):
    result = supabase.table("meals").select("*").eq("user_id", user.id).order("orden").execute()
    return result.data

@router.get("/jugos")
def get_jugos(user=Depends(get_current_user)):
    result = supabase.table("jugos").select("*").eq("user_id", user.id).order("orden").execute()
    return result.data

@router.patch("/meals/{meal_id}")
def update_meal(meal_id: str, body: dict, user=Depends(get_current_user)):
    result = supabase.table("meals").update(body).eq("id", meal_id).eq("user_id", user.id).execute()
    return result.data

@router.patch("/jugos/{jugo_id}")
def update_jugo(jugo_id: str, body: dict, user=Depends(get_current_user)):
    result = supabase.table("jugos").update(body).eq("id", jugo_id).eq("user_id", user.id).execute()
    return result.data
