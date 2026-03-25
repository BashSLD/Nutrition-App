from pydantic import BaseModel
from typing import Optional, List


class Ingrediente(BaseModel):
    nombre: str
    cantidad: Optional[str] = None
    unidad: Optional[str] = None
    kcal: Optional[int] = None
    tip: Optional[str] = None


class IngredienteJugo(BaseModel):
    nombre: str
    cantidad: Optional[str] = None
    unidad: Optional[str] = None


class MealUpdate(BaseModel):
    nombre: Optional[str] = None
    ingredientes: Optional[List[Ingrediente]] = None
    kcal_total: Optional[int] = None


class JugoUpdate(BaseModel):
    ingredientes: Optional[List[IngredienteJugo]] = None
    nota: Optional[str] = None
