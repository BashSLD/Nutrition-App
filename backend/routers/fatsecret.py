from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import os
import httpx
import time
from base64 import b64encode
import logging

logger = logging.getLogger("nutriapp")

router = APIRouter()

_token = None
_token_expires_at = 0

async def get_access_token() -> str:
    global _token, _token_expires_at
    
    if _token and time.time() < _token_expires_at:
        return _token
    
    fatsecret_client_id = os.getenv("FATSECRET_CLIENT_ID")
    fatsecret_client_secret = os.getenv("FATSECRET_CLIENT_SECRET")
    
    if not fatsecret_client_id or not fatsecret_client_secret:
        logger.error("Credenciales de FatSecret no configuradas en entorno")
        raise HTTPException(status_code=500, detail="FatSecret no está configurado")
        
    auth_str = f"{fatsecret_client_id.strip()}:{fatsecret_client_secret.strip()}"
    b64_auth_str = b64encode(auth_str.encode()).decode()
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                "https://oauth.fatsecret.com/connect/token",
                headers={"Authorization": f"Basic {b64_auth_str}"},
                data={"grant_type": "client_credentials", "scope": "basic"}
            )
            resp.raise_for_status()
            data = resp.json()
            _token = data["access_token"]
            _token_expires_at = time.time() + data["expires_in"] - 60  # margen
            logger.info("Token FatSecret renovado")
            return _token
        except Exception as e:
            logger.error(f"Error obteniendo token de FatSecret: {e}")
            raise HTTPException(status_code=500, detail="Error de autenticación con proveedor")


@router.get("/search")
async def search_food(query: str):
    """
    Busca alimentos en FatSecret y retorna una versión simplificada
    """
    if not query or len(query) < 2:
        return []
        
    token = await get_access_token()
    
    async with httpx.AsyncClient() as client:
        try:
            # Region MX, Idioma ES
            resp = await client.get(
                "https://platform.fatsecret.com/rest/foods/search/v1",
                params={
                    "search_expression": query,
                    "format": "json",
                    "max_results": 20,
                    "region": "MX",
                    "language": "es"
                },
                headers={"Authorization": f"Bearer {token}"}
            )
            resp.raise_for_status()
            data = resp.json()
            
            foods_data = data.get("foods", {})
            if not foods_data or "food" not in foods_data:
                return []
                
            food_list = foods_data["food"]
            if isinstance(food_list, dict):
                food_list = [food_list]
                
            results = []
            for f in food_list:
                desc = f.get("food_description", "")
                results.append({
                    "id": f.get("food_id"),
                    "name": f.get("food_name"),
                    "brand": f.get("brand_name"),
                    "description": desc,
                })
                
            return results
            
        except Exception as e:
            logger.error(f"Error buscando alimento: {e}")
            raise HTTPException(status_code=500, detail="Error consultando FatSecret")
