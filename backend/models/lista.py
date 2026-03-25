from pydantic import BaseModel
from typing import Optional
from enum import Enum


class OwnerEnum(str, Enum):
    bash = "bash"
    eimy = "eimy"
    compartida = "compartida"


class FrecuenciaEnum(str, Enum):
    semanal = "semanal"
    tres_cuatro = "3-4 dias"


class BadgeEnum(str, Enum):
    both = "both"
    bash = "bash"
    eimy = "eimy"
    juice = "juice"
    opt = "opt"


class ListaItemCreate(BaseModel):
    owner: OwnerEnum
    categoria: str
    nombre: str
    cantidad: Optional[str] = None
    badge: Optional[BadgeEnum] = None
    frecuencia: FrecuenciaEnum = FrecuenciaEnum.semanal
    nota: Optional[str] = None
