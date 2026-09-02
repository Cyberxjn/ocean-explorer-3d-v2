"""Real Argo ocean data, fetched from Argovis (https://argovis-api.colorado.edu).

Argovis is a public REST API, maintained by CU Boulder, serving the official
international Argo float program's data (the same data GDACs like Ifremer /
Coriolis distribute as NetCDF). No account or API key is required for basic
use — an optional free key (https://argovis-keygen.colorado.edu/) just raises
your rate-limit ceiling under heavy load. See ARGOVIS_API_KEY in .env.example.

Query patterns below follow the ones used by `argopy`, the official Argo
Python client (euroargodev/argopy), specifically its Argovis data fetcher:
  - list/search profiles:  GET /argo?box=[[lonMin,latMin],[lonMax,latMax]]
                                    &startDate=...&endDate=...
  - single profile detail: GET /argo?id={wmo}_{cycle:03d}&data=pressure,temperature,salinity,doxy
  - all profiles for a float (used here to build a trajectory):
                            GET /argo?platform={wmo}&startDate=...&endDate=...

Design choices, made explicit rather than hidden:
  - The /floats list endpoint does NOT request per-level `data` (that would
    make listing dozens of floats slow and heavy) — it only asks Argovis for
    profile locations/metadata, which is exactly what a map marker needs.
  - "Depth" is reported as the profile's recorded pressure in dbar, using the
    standard oceanographic rule-of-thumb that 1 dbar of pressure ≈ 1 m of
    depth. This is the same approximation most lightweight ocean dashboards
    use; it is NOT a true pressure-to-depth (TEOS-10) conversion, and no
    interpolation between recorded levels is performed anywhere.
  - To keep responses small and fast (and avoid the upstream API's own
    request-size limits), float searches are bounded to a rolling ~45-day
    window inside the requested year rather than the full 365 days, and the
    result count is hard-capped. This is a real, filtered SUBSET of that
    year's floats, not a fabricated one — just not exhaustive.
"""

import os
import re
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx

from .cache import TTLCache

ARGOVIS_BASE_URL = os.getenv("ARGOVIS_BASE_URL", "https://argovis-api.colorado.edu")
ARGOVIS_API_KEY = os.getenv("ARGOVIS_API_KEY", "").strip()
CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "900"))

MAX_FLOATS = 60          # hard cap on markers returned to the frontend
SEARCH_WINDOW_DAYS = 45  # bounded window inside the requested year
TRAJECTORY_MAX_POINTS = 30

cache = TTLCache(ttl_seconds=CACHE_TTL_SECONDS)

# Same basin bounding boxes used by the frontend's region selector, so the
# real data lines up with what the UI is labeled with.
REGION_BOXES = {
    "indian_ocean": {"lonRange": (40, 120), "latRange": (-45, 25)},
    "pacific_ocean": {"lonRange": (-180, -100), "latRange": (-50, 50)},
    "atlantic_ocean": {"lonRange": (-60, -10), "latRange": (-50, 50)},
    "southern_ocean": {"lonRange": (-180, 180), "latRange": (-70, -40)},
}


def slugify_region(region: Optional[str]) -> Optional[str]:
    if not region:
        return None
    slug = region.strip().lower().replace(" ", "_")
    return slug if slug in REGION_BOXES else None


class ArgoServiceError(Exception):
    """Raised when the upstream Argovis API can't fulfil a request."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


def _headers() -> dict:
    headers = {"Accept": "application/json", "User-Agent": "ocean-explorer-3d/1.0"}
    if ARGOVIS_API_KEY:
        headers["x-argokey"] = ARGOVIS_API_KEY
    return headers


async def _get(path: str, params: dict) -> list:
    url = f"{ARGOVIS_BASE_URL}{path}"
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(url, params=params, headers=_headers())
    except httpx.RequestError as exc:
        raise ArgoServiceError(f"Could not reach Argovis ({exc.__class__.__name__}): {exc}", 504)

    if resp.status_code == 404:
        return []
    if resp.status_code == 429:
        raise ArgoServiceError("Argovis rate limit hit — try again shortly, or set ARGOVIS_API_KEY.", 429)
    if resp.status_code >= 400:
        raise ArgoServiceError(f"Argovis returned HTTP {resp.status_code}: {resp.text[:300]}", 502)

    try:
        data = resp.json()
    except ValueError:
        raise ArgoServiceError("Argovis returned a non-JSON response.", 502)

    return data or []


def _year_window(year: Optional[int]) -> tuple[str, str]:
    """A bounded date window inside the requested year (see module docstring)."""
    now = datetime.now(timezone.utc)
    if year is None:
        end = now
        start = end - timedelta(days=SEARCH_WINDOW_DAYS)
        return start.strftime("%Y-%m-%dT%H:%M:%SZ"), end.strftime("%Y-%m-%dT%H:%M:%SZ")

    year = int(year)
    year_end = datetime(year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
    end = min(year_end, now)
    start = end - timedelta(days=SEARCH_WINDOW_DAYS)
    year_start = datetime(year, 1, 1, tzinfo=timezone.utc)
    if start < year_start:
        start = year_start
    return start.strftime("%Y-%m-%dT%H:%M:%SZ"), end.strftime("%Y-%m-%dT%H:%M:%SZ")


def _parse_wmo(profile_id: str) -> str:
    match = re.match(r"^(\d+)_", profile_id)
    return match.group(1) if match else profile_id


async def search_floats(region: Optional[str] = None, year: Optional[int] = None, limit: int = 40) -> dict:
    limit = max(1, min(limit, MAX_FLOATS))
    region_slug = slugify_region(region)
    start_date, end_date = _year_window(year)

    cache_key = f"floats:{region_slug}:{year}:{limit}:{start_date}:{end_date}"

    async def fetch():
        params = {"startDate": start_date, "endDate": end_date}
        if region_slug:
            box = REGION_BOXES[region_slug]
            lon_min, lon_max = box["lonRange"]
            lat_min, lat_max = box["latRange"]
            params["box"] = f"[[{lon_min},{lat_min}],[{lon_max},{lat_max}]]"
        raw = await _get("/argo", params)
        return raw

    raw = await cache.get_or_set_async(cache_key, fetch)

    floats = []
    for doc in raw[:limit]:
        try:
            lon, lat = doc["geolocation"]["coordinates"]
        except (KeyError, TypeError, ValueError):
            continue
        floats.append(
            {
                "id": doc.get("_id"),
                "wmo": _parse_wmo(doc.get("_id", "")),
                "cycle_number": doc.get("cycle_number"),
                "lat": lat,
                "lon": lon,
                "date": doc.get("timestamp"),
            }
        )

    return {
        "count": len(floats),
        "region": region_slug,
        "year": year,
        "source": "argovis",
        "floats": floats,
    }


def _extract_levels(doc: dict) -> tuple[list[dict], bool]:
    """Turn Argovis's `data` + `data_info` payload into level dicts.

    Argovis returns `data_info` as [names, meta_keys, meta_values] and, when
    a `data=` filter was requested, a `data` array of either per-level dicts
    or (in minified mode) per-level lists ordered the same way as `names`.
    We handle both shapes defensively since the exact form can vary by
    request options.
    """
    names = []
    if doc.get("data_info") and len(doc["data_info"]) > 0:
        names = doc["data_info"][0]

    raw_levels = doc.get("data") or []
    levels = []
    has_oxygen = False

    for entry in raw_levels:
        if isinstance(entry, dict):
            level = entry
        elif isinstance(entry, list) and names:
            level = dict(zip(names, entry))
        else:
            continue

        pressure = level.get("pressure")
        temperature = level.get("temperature")
        salinity = level.get("salinity")
        oxygen = level.get("doxy")
        if oxygen is not None:
            has_oxygen = True

        if pressure is None and temperature is None and salinity is None:
            continue

        levels.append(
            {
                "pressure": pressure,
                "depth_m": pressure,  # 1 dbar ≈ 1 m — see module docstring
                "temperature": temperature,
                "salinity": salinity,
                "oxygen": oxygen,
            }
        )

    levels.sort(key=lambda lv: (lv["pressure"] is None, lv["pressure"]))
    return levels, has_oxygen


async def get_profile(float_id: str) -> dict:
    cache_key = f"profile:{float_id}"

    async def fetch():
        params = {"id": float_id, "data": "pressure,temperature,salinity,doxy"}
        return await _get("/argo", params)

    raw = await cache.get_or_set_async(cache_key, fetch)
    if not raw:
        raise ArgoServiceError(f"No profile found for id '{float_id}'.", 404)

    doc = raw[0]
    try:
        lon, lat = doc["geolocation"]["coordinates"]
    except (KeyError, TypeError, ValueError):
        raise ArgoServiceError("Profile is missing geolocation data.", 502)

    levels, has_oxygen = _extract_levels(doc)
    source_url = None
    sources = doc.get("source") or []
    if sources and isinstance(sources, list):
        source_url = sources[0].get("url")

    return {
        "id": doc.get("_id"),
        "wmo": _parse_wmo(doc.get("_id", "")),
        "cycle_number": doc.get("cycle_number"),
        "lat": lat,
        "lon": lon,
        "date": doc.get("timestamp"),
        "has_oxygen": has_oxygen,
        "levels": levels,
        "source_url": source_url,
    }


async def get_trajectory(float_id: str) -> dict:
    wmo = _parse_wmo(float_id)
    cache_key = f"trajectory:{wmo}"

    async def fetch():
        now = datetime.now(timezone.utc)
        start = now - timedelta(days=365 * 3)  # up to 3 years of history
        params = {
            "platform": wmo,
            "startDate": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "endDate": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        return await _get("/argo", params)

    raw = await cache.get_or_set_async(cache_key, fetch)

    points = []
    for doc in raw:
        try:
            lon, lat = doc["geolocation"]["coordinates"]
        except (KeyError, TypeError, ValueError):
            continue
        points.append(
            {
                "id": doc.get("_id"),
                "lat": lat,
                "lon": lon,
                "date": doc.get("timestamp"),
                "cycle_number": doc.get("cycle_number"),
            }
        )

    points.sort(key=lambda p: p["date"] or "")
    if len(points) > TRAJECTORY_MAX_POINTS:
        # keep it lightweight: evenly-spaced sample across the history
        step = len(points) / TRAJECTORY_MAX_POINTS
        points = [points[int(i * step)] for i in range(TRAJECTORY_MAX_POINTS)]

    return {"wmo": wmo, "count": len(points), "points": points}


async def ping_upstream() -> bool:
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(f"{ARGOVIS_BASE_URL}/ping", headers=_headers())
        return resp.status_code < 400
    except httpx.RequestError:
        return False
