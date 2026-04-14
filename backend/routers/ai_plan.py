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

MAX_RETRIES = 2  # Reintentos silenciosos si kcal no cuadra

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


# ─── Helpers — cálculos en Python (nunca delegados a Claude) ────────────────

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


def sum_kcal(meals: list) -> int:
    """Suma kcal_total de cada meal. Python es el árbitro, no Claude."""
    return sum(m.get("kcal_total") or 0 for m in meals)


def validate_kcal(meals: list, meta_kcal: int, sexo: str) -> dict:
    """
    Valida que el plan cumpla los rangos. Retorna un dict con:
      - total: kcal sumadas por Python
      - ok: bool
      - min_kcal, margen, rango_min, rango_max
    """
    total    = sum_kcal(meals)
    min_kcal = 1200 if sexo == "femenino" else 1500
    margen   = round(meta_kcal * 0.05) if meta_kcal else 0
    rango_min = meta_kcal - margen if meta_kcal else min_kcal
    rango_max = meta_kcal + margen if meta_kcal else 9999

    ok = total >= min_kcal and (not meta_kcal or abs(total - meta_kcal) <= margen)
    return {
        "total":     total,
        "ok":        ok,
        "min_kcal":  min_kcal,
        "margen":    margen,
        "rango_min": rango_min,
        "rango_max": rango_max,
    }


def build_correction_message(v: dict, meta_kcal: int) -> str:
    """
    Mensaje de corrección silenciosa para Claude.
    Se envía como turno de usuario en la conversación existente.
    Claude mantiene el contexto de su propuesta anterior.
    """
    bajo_minimo = v["total"] < v["min_kcal"]
    lines = [
        f"El plan que propusiste suma {v['total']} kcal (calculado por el sistema).",
        f"El rango aceptable es {v['rango_min']}–{v['rango_max']} kcal (meta {meta_kcal} ± {v['margen']} kcal).",
    ]
    if bajo_minimo:
        lines.append(f"Además está por debajo del mínimo absoluto de {v['min_kcal']} kcal.")
    lines += [
        "",
        "Ajusta ÚNICAMENTE las porciones/cantidades de los ingredientes para que la suma quede dentro del rango.",
        "No cambies los alimentos base ni el número de comidas.",
        "Devuelve exactamente el mismo formato JSON con los kcal_total corregidos.",
        "No incluyas texto fuera del JSON.",
    ]
    return "\n".join(lines)


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

## Tu rol
Proporciona el plan nutricional actualizado con alimentos reales, porciones concretas y el valor calórico de cada comida (kcal_total).
El sistema calculará y validará los totales — tú NO sumas ni verificas el total, solo aporta datos precisos por comida.

## Reglas
1. kcal_total de cada meal debe ser el valor calórico real de esa comida, basado en ingredientes y porciones
2. Meta del día: {meta_kcal} kcal (rango {meta_kcal - margen}–{meta_kcal + margen}) — distribuye bien entre comidas
3. Proteína mínima: {prot_min}g/día — no negociable
4. Ingredientes disponibles en México, sin ultraprocesados
5. No reemplazar comidas reales por snacks o postres
6. Número de opciones por perfil: {n_opciones}
7. Si la instrucción viola alguna restricción, responde con rechazado: true y NO modifiques el plan

## Restricciones no negociables
- Sin reemplazar proteína completa por carbohidrato
- En superávit: no exceder TDEE + 600 kcal

## Formato de respuesta obligatorio
Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown.

{{
  "rechazado": false,
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
        inner = lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
        raw = "\n".join(inner).strip()
    return raw


def call_claude(client: anthropic.Anthropic, messages: list) -> dict:
    """Llama a Claude con una lista de mensajes (soporte multi-turno)."""
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=messages,
    )
    raw   = response.content[0].text
    clean = clean_json_response(raw)
    return json.loads(clean), raw  # retorna dict parseado y texto crudo


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

    meta_kcal = profile.get("meta_kcal") or 0
    sexo      = profile.get("sexo") or "masculino"

    prompt = build_prompt(profile, meals, jugos, registros, body.mensaje.strip())
    logger.info(f"AI plan generation requested by {user.id} for target {target_id}")

    client = anthropic.Anthropic(api_key=api_key)

    # ── Turno inicial ────────────────────────────────────────────────────────
    conversation = [{"role": "user", "content": prompt}]

    try:
        result, raw_text = call_claude(client, conversation)
    except json.JSONDecodeError as e:
        logger.error(f"Claude returned invalid JSON (attempt 1): {e}")
        raise HTTPException(status_code=500, detail="La IA devolvió una respuesta con formato inválido. Intenta de nuevo.")
    except anthropic.APIStatusError as e:
        logger.error(f"Anthropic API error {e.status_code}: {e.message}")
        raise HTTPException(status_code=502, detail="Error al comunicarse con la IA. Intenta de nuevo.")
    except Exception as e:
        logger.error(f"Unexpected error in AI plan generation: {e}")
        raise HTTPException(status_code=500, detail="Error inesperado. Intenta de nuevo.")

    # Si Claude rechaza la instrucción, devolver directo (no hay plan que validar)
    if result.get("rechazado"):
        return result

    # ── Validación Python + reintentos silenciosos ───────────────────────────
    attempt = 0
    while attempt < MAX_RETRIES:
        proposed_meals = result.get("plan_actualizado", {}).get("meals", [])
        v = validate_kcal(proposed_meals, meta_kcal, sexo)

        logger.info(
            f"kcal validation attempt {attempt + 1}: "
            f"sum={v['total']} target={meta_kcal} range={v['rango_min']}–{v['rango_max']} ok={v['ok']}"
        )

        if v["ok"]:
            break  # Plan válido — salir del loop

        # Plan fuera de rango → re-prompt silencioso
        attempt += 1
        if attempt >= MAX_RETRIES:
            break  # Se agotaron reintentos — salir y devolver lo que hay con advertencia

        correction_msg = build_correction_message(v, meta_kcal)
        logger.warning(
            f"Silent re-prompt #{attempt}: plan sums {v['total']} kcal "
            f"(range {v['rango_min']}–{v['rango_max']})"
        )

        # Acumular la conversación: asistente respondió raw_text, nosotros corregimos
        conversation.append({"role": "assistant", "content": raw_text})
        conversation.append({"role": "user",      "content": correction_msg})

        try:
            result, raw_text = call_claude(client, conversation)
        except json.JSONDecodeError as e:
            logger.error(f"Claude returned invalid JSON (re-prompt #{attempt}): {e}")
            raise HTTPException(status_code=500, detail="La IA devolvió una respuesta con formato inválido tras corrección. Intenta de nuevo.")
        except anthropic.APIStatusError as e:
            logger.error(f"Anthropic API error on re-prompt: {e.status_code}: {e.message}")
            raise HTTPException(status_code=502, detail="Error al comunicarse con la IA. Intenta de nuevo.")
        except Exception as e:
            logger.error(f"Unexpected error on re-prompt #{attempt}: {e}")
            raise HTTPException(status_code=500, detail="Error inesperado. Intenta de nuevo.")

    # ── Calcular total final con Python y construir respuesta ────────────────
    final_meals = result.get("plan_actualizado", {}).get("meals", [])
    v_final = validate_kcal(final_meals, meta_kcal, sexo)

    advertencias = result.get("advertencias") or []
    if not v_final["ok"]:
        advertencias.append(
            f"El plan suma {v_final['total']} kcal (rango esperado: "
            f"{v_final['rango_min']}–{v_final['rango_max']} kcal). "
            "Revisa las porciones antes de confirmar."
        )
        logger.warning(f"Plan delivered outside kcal range after {attempt} retries: {v_final['total']} kcal")

    return {
        "rechazado":      False,
        "kcal_total_plan": v_final["total"],   # calculado por Python, nunca de Claude
        "cambios":        result.get("cambios") or [],
        "plan_actualizado": result.get("plan_actualizado") or {},
        "explicacion":    result.get("explicacion") or "",
        "advertencias":   advertencias,
    }
