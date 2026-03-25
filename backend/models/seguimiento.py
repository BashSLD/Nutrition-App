from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date


def _positive(v: Optional[float]) -> Optional[float]:
    if v is not None and v <= 0:
        raise ValueError("debe ser un valor positivo")
    return v


class RegistroCreate(BaseModel):
    fecha: date
    peso_kg: Optional[float] = None
    cintura_cm: Optional[float] = None
    cadera_cm: Optional[float] = None
    cuello_cm: Optional[float] = None
    abdomen_cm: Optional[float] = None
    notas: Optional[str] = None

    @field_validator("peso_kg", "cintura_cm", "cadera_cm", "cuello_cm", "abdomen_cm")
    @classmethod
    def must_be_positive(cls, v):
        return _positive(v)


class RegistroUpdate(BaseModel):
    fecha: Optional[date] = None
    peso_kg: Optional[float] = None
    cintura_cm: Optional[float] = None
    cadera_cm: Optional[float] = None
    cuello_cm: Optional[float] = None
    abdomen_cm: Optional[float] = None
    notas: Optional[str] = None

    @field_validator("peso_kg", "cintura_cm", "cadera_cm", "cuello_cm", "abdomen_cm")
    @classmethod
    def must_be_positive(cls, v):
        return _positive(v)
