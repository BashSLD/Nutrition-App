from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import logging
from dotenv import load_dotenv

# Ensure we load `.env` from root and current dir
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from routers import auth, plan, lista, seguimiento, fatsecret

# ─── Logging ────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("nutriapp")

# ─── App ────────────────────────────────────────────────
app = FastAPI(title="NutriApp API", version="1.0.0")

# ─── Rate Limiting ──────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# ─── CORS ───────────────────────────────────────────────
origins = ["http://localhost:5173"]  # dev
if os.getenv("ENVIRONMENT") == "production":
    origins = ["*"]  # TODO: restringir al dominio Railway cuando sea fijo

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ────────────────────────────────────────────
app.include_router(auth.router,        prefix="/api/auth",        tags=["auth"])
app.include_router(plan.router,        prefix="/api/plan",        tags=["plan"])
app.include_router(lista.router,       prefix="/api/lista",       tags=["lista"])
app.include_router(seguimiento.router, prefix="/api/seguimiento", tags=["seguimiento"])
app.include_router(fatsecret.router,   prefix="/api/fatsecret",   tags=["fatsecret"])

# ─── Health check ───────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok"}

# ─── Servir React (producción) ──────────────────────────
# En desarrollo React corre en :5173
# En producción FastAPI sirve el build estático
static_path = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.exists(static_path):
    app.mount("/assets", StaticFiles(directory=f"{static_path}/assets"), name="assets")

    @app.get("/{full_path:path}")
    def serve_react(full_path: str):
        index = os.path.join(static_path, "index.html")
        return FileResponse(index)

logger.info("NutriApp API started")
