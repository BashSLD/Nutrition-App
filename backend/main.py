from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from routers import auth, plan, lista, seguimiento

app = FastAPI(title="NutriApp API", version="1.0.0")

# ─── CORS ───────────────────────────────────────────────
origins = ["http://localhost:5173"]  # dev
if os.getenv("ENVIRONMENT") == "production":
    origins = ["*"]  # Railway sirve todo desde el mismo dominio

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
