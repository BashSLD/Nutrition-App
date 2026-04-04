from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from routers.auth import get_current_user
from db import get_supabase
import anthropic
import os
import json
import logging

logger = logging.getLogger("nutriapp")
router = APIRouter()

# ─── Constantes ─────────────────────────────────────────────────────────────

ACTIVIDAD_LABEL = {
    1.2:   "Sedentario",
    1.375: "Ligero (1–3 días/sem)",
    1.55:  "Moderado (3–5 días/sem)",
    1.725: "Intenso (6–7 días/sem)",
}

# ─── Modelos ─────────────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    mensaje: str
    target_user_id: Optional[str] = None  # Admin (Bash) generando plan para Eimy


# ─── Helpers ─────────────────────────────────────────────────────────────────

def calc_tmb(sexo: str, peso: float, altura: float, edad: int) -> int:
    """Mifflin-St Jeor 1990 — única fórmula permitida."""
    if not all([peso, altura, edad]):
        return 0
    base = (10 * peso) + (6.25 * altura) - (5 * edad)
    return round(base - 161 if sexo == "femenino" else base + 5)


def calc_modo(meta_kcal: int, tdee: int) -> str:
    if not meta_kcal or not tdee:
        return "—"
    if meta_kcal < tdee - 100:
        return "déficit"
    if abs(meta_kcal - tdee) <= 100:
        return "mantenimiento"
    return "superávit"


def calc_tendencia(registros: list) -> str:
    if len(registros) < 2:
        return "sin datos suficientes"
    delta = registros[-1]["peso_kg"] - registros[0]["peso_kg"]
    if delta < -0.5:
        return f"bajando ({delta:.1f} kg)"
    if delta > 0.5:
        return f"subiendo (+{delta:.1f} kg)"
    return f"estancado ({delta:+.1f} kg)"


def build_prompt(profile: dict, meals: list, jugos: list, registros: list, mensaje: str) -> str:
    meta_kcal = profile.get("meta_kcal") or 0
    peso      = profile.get("peso_kg")   or 0
    altura    = profile.get("altura_cm") or 0
    edad      = profile.get("edad")      or 0
    sexo      = profile.get("sexo")      or "masculino"
    actividad = profile.get("nivel_actividad") or 1.2
    theme     = profile.get("theme", "bash")

    tmb       = calc_tmb(sexo, peso, altura, edad)
    tdee      = round(tmb * actividad) if tmb else 0
    deficit   = tdee - meta_kcal
    modo      = calc_modo(meta_kcal, tdee)
    min_kcal  = 1200 if sexo == "femenino" else 1500
    prot_min  = round(peso * 1.6) if peso else 0
    tendencia = calc_tendencia(registros)
    act_label = ACTIVIDAD_LABEL.get(actividad, str(actividad))
    margen    = round(meta_kcal * 0.05)
    n_opciones = "5 desayunos, 6 comidas, 3 cenas" if theme == "eimy" else "1 por tiempo de comida"

    plan_json = json.dumps({"meals": meals, "jugos": jugos}, ensure_ascii=False, indent=2)
    registros_json = json.dumps(
        [{"fecha": r.get("fecha"), "peso_kg": r.get("peso_kg"),
          "cintura_cm": r.get("cintura_cm"), "cadera_cm": r.get("cadera_cm")}
         for r in registros],
        ensure_ascii=False, indent=2
    )

    return f"""Eres un nutriólogo asistente especializado en planes de nutrición deportiva y composición corporal.

## Datos del usuario
- Sexo: {sexo}
- Edad: {edad} años
- Peso actual: {peso} kg
- Altura: {altura} cm
- Nivel de actividad: {actividad} ({act_label})
- TMB (Mifflin-St Jeor 1990): {tmb} kcal
- TDEE: {tdee} kcal
- Meta: {meta_kcal} kcal/día ({modo}, {"déficit" if deficit > 0 else "superávit"} de {abs(deficit)} kcal)
- Mínimo absoluto: {min_kcal} kcal
- Proteína mínima: {prot_min}g/día ({peso}kg × 1.6)
- Modo: {"eimy — rotación variada" if theme == "eimy" else "bash — plan fijo"}

## Objetivo actual
- Modo: {modo}
- Diferencia con TDEE: {meta_kcal - tdee:+} kcal

## Progreso reciente (últimos registros)
{registros_json}
→ Tendencia de peso: {tendencia}

## Plan actual
{plan_json}

## Instrucción del usuario
"{mensaje}"

## Reglas estrictas
1. Usa EXCLUSIVAMENTE Mifflin-St Jeor 1990 para cualquier cálculo
   - Hombre: (10×peso) + (6.25×altura) - (5×edad) + 5
   - Mujer:  (10×peso) + (6.25×altura) - (5×edad) - 161
   - TDEE = TMB × factor_actividad
2. El plan debe sumar {meta_kcal} kcal ± 50 (nunca debajo de {min_kcal} kcal)
3. Proteína mínima: {prot_min}g/día — no negociable
4. Ingredientes disponibles en México, sin ultraprocesados
5. No reemplazar comidas reales por snacks o postres
6. Número de opciones por perfil: {n_opciones}
7. Si la instrucción viola alguna restricción, responde con rechazado: true y NO modifiques el plan
8. Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown

## Restricciones no negociables
- Sin reemplazar proteína completa por carbohidrato
- Si el déficit objetivo es {deficit} kcal, el plan debe reflejarlo exactamente
- En superávit: no exceder TDEE + 600 kcal

## Validación obligatoria ANTES de responder
1. Suma los kcal_total de todas las comidas del plan_actualizado
2. Verifica que la suma esté dentro de {meta_kcal} ± {margen} kcal (±5%)
3. Verifica que la suma no sea menor a {min_kcal} kcal
4. Si no cumple, ajusta porciones hasta que cumpla — NO devuelvas un plan fuera de rango
5. Incluye la suma verificada en el campo "kcal_total_plan" de la respuesta

## Formato de respuesta obligatorio
{{
  "rechazado": false,
  "kcal_total_plan": <suma de kcal_total de todas las comidas>,
  "cambios": ["descripción breve de cada cambio realizado"],
  "plan_actualizado": {{ "meals": [...], "jugos": [...] }},
  "explicacion": "razonamiento nutricional del ajuste",
  "advertencias": ["si algo se acerca al límite o hay algo a considerar"]
}}"""


def clean_json_response(raw: str) -> str:
    """Elimina markdown code fences si Claude los incluyó."""
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        # Quitar primera y última línea (``` y ```)
        inner = lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
        raw = "\n".join(inner).strip()
    return raw


# ─── Endpoint ────────────────────────────────────────────────────────────────

@router.post("/generate")
async def generate_plan(body: GenerateRequest, user=Depends(get_current_user)):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY no configurada en el servidor")

    if not body.mensaje or not body.mensaje.strip():
        raise HTTPException(status_code=422, detail="La instrucción no puede estar vacía")

    supabase = get_supabase()

    # Determinar usuario objetivo (admin puede generar para otro usuario)
    target_id = body.target_user_id or user.id
    if target_id != user.id:
        own = supabase.table("profiles").select("theme").eq("id", user.id).single().execute()
        if not own.data or own.data.get("theme") != "bash":
            raise HTTPException(status_code=403, detail="No autorizado para generar plan de otro usuario")

    # Fetch de todos los datos necesarios (siempre frescos desde la DB)
    try:
        profile_res   = supabase.table("profiles").select("*").eq("id", target_id).single().execute()
        meals_res     = supabase.table("meals").select("*").eq("user_id", target_id).order("orden").execute()
        jugos_res     = supabase.table("jugos").select("*").eq("user_id", target_id).order("orden").execute()
        registros_res = (
            supabase.table("registros")
            .select("fecha,peso_kg,cintura_cm,cadera_cm")
            .eq("user_id", target_id)
            .order("fecha", desc=False)
            .limit(10)
            .execute()
        )
    except Exception as e:
        logger.error(f"Error fetching data for AI plan (user {target_id}): {e}")
        raise HTTPException(status_code=500, detail="Error obteniendo datos del usuario")

    profile   = profile_res.data or {}
    meals     = meals_res.data or []
    jugos     = jugos_res.data or []
    registros = registros_res.data or []

    prompt = build_prompt(profile, meals, jugos, registros, body.mensaje.strip())
    logger.info(f"AI plan generation requested by {user.id} for target {target_id}")

    # Llamada a Claude
    try:
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )
        raw    = response.content[0].text
        clean  = clean_json_response(raw)
        result = json.loads(clean)
    except json.JSONDecodeError as e:
        logger.error(f"Claude returned invalid JSON: {e}")
        raise HTTPException(status_code=500, detail="La IA devolvió una respuesta con formato inválido. Intenta de nuevo.")
    except anthropic.APIStatusError as e:
        logger.error(f"Anthropic API error {e.status_code}: {e.message}")
        raise HTTPException(status_code=502, detail="Error al comunicarse con la IA. Intenta de nuevo.")
    except Exception as e:
        logger.error(f"Unexpected error in AI plan generation: {e}")
        raise HTTPException(status_code=500, detail="Error inesperado. Intenta de nuevo.")

    return result
