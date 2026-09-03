"""Ocean Explorer 3D v2 — backend API.

Serves real Argo float data (via Argovis, https://argovis-api.colorado.edu)
as small, frontend-ready JSON. Run with:

    uvicorn main:app --reload

See README.md (project root) and backend/.env.example for setup details.
"""

import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

from models.schemas import (  # noqa: E402
    FloatListResponse,
    HealthResponse,
    ProfileDetail,
    TrajectoryResponse,
)
from services import argo_service  # noqa: E402
from services.argo_service import ArgoServiceError  # noqa: E402

app = FastAPI(
    title="Ocean Explorer 3D v2 API",
    description="Lightweight REST API serving real Argo float data from Argovis.",
    version="1.0.0",
)

_default_origins = "http://localhost:5173,http://127.0.0.1:5173"
cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", _default_origins).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.exception_handler(ArgoServiceError)
async def argo_service_error_handler(request, exc: ArgoServiceError):
    return JSONResponse(status_code=exc.status_code, content={"detail": str(exc)})


@app.get("/api/health", response_model=HealthResponse)
async def health():
    upstream_ok = await argo_service.ping_upstream()
    return HealthResponse(status="ok", upstream="reachable" if upstream_ok else "unreachable")


@app.get("/api/argo/floats", response_model=FloatListResponse)
async def list_floats(
    region: Optional[str] = Query(None, description="e.g. indian_ocean, pacific_ocean, atlantic_ocean, southern_ocean"),
    year: Optional[int] = Query(None, ge=1997, le=2100),
    limit: int = Query(40, ge=1, le=100),
):
    result = await argo_service.search_floats(region=region, year=year, limit=limit)
    return result


@app.get("/api/argo/profile/{float_id}", response_model=ProfileDetail)
async def get_profile(float_id: str):
    result = await argo_service.get_profile(float_id)
    return result


@app.get("/api/argo/trajectory/{float_id}", response_model=TrajectoryResponse)
async def get_trajectory(float_id: str):
    result = await argo_service.get_trajectory(float_id)
    return result
