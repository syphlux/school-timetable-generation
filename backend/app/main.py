import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import solve
from app.logging_config import setup_logging

setup_logging(level=os.getenv("LOG_LEVEL", "INFO"))

app = FastAPI(title="School Timetable Generator", version="1.0.0")

_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
_origins = [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(solve.router)


@app.get("/health")
def health():
    return {"status": "ok"}


# Serve the React SPA for everything else.
# html=True makes StaticFiles return index.html for unknown paths (SPA routing).
# Must be mounted last so API routes above take priority.
_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dist")
if os.path.isdir(_dist):
    app.mount("/", StaticFiles(directory=_dist, html=True), name="frontend")
