"""Response models for the Ocean Explorer 3D API.

These describe the small, frontend-ready JSON shapes returned by our own
FastAPI routes — not the raw Argovis payloads (see services/argo_service.py
for the translation layer).
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class FloatSummary(BaseModel):
    """One Argo profile location, lightweight enough for a map marker."""

    id: str = Field(..., description="Argovis profile id, e.g. '1901094_109' (WMO_cycle)")
    wmo: str = Field(..., description="Float platform number (WMO id)")
    cycle_number: Optional[int] = None
    lat: float
    lon: float
    date: str = Field(..., description="ISO 8601 timestamp of the profile")


class FloatListResponse(BaseModel):
    count: int
    region: Optional[str] = None
    year: Optional[int] = None
    source: str = "argovis"
    floats: List[FloatSummary]


class ProfileLevel(BaseModel):
    pressure: Optional[float] = Field(None, description="Sea water pressure, dbar")
    depth_m: Optional[float] = Field(
        None, description="Depth in meters, approximated as pressure in dbar (standard 1 dbar ≈ 1 m rule of thumb)"
    )
    temperature: Optional[float] = Field(None, description="In-situ temperature, °C")
    salinity: Optional[float] = Field(None, description="Practical salinity, PSU")
    oxygen: Optional[float] = Field(None, description="Dissolved oxygen, µmol/kg (BGC floats only)")


class ProfileDetail(BaseModel):
    id: str
    wmo: str
    cycle_number: Optional[int] = None
    lat: float
    lon: float
    date: str
    has_oxygen: bool
    levels: List[ProfileLevel]
    source_url: Optional[str] = Field(None, description="Original GDAC NetCDF file this profile came from")


class TrajectoryPoint(BaseModel):
    id: str
    lat: float
    lon: float
    date: str
    cycle_number: Optional[int] = None


class TrajectoryResponse(BaseModel):
    wmo: str
    count: int
    points: List[TrajectoryPoint]


class HealthResponse(BaseModel):
    status: str
    upstream: str
