"""
Real Argo ocean data, fetched from Argovis.

Argovis is a public REST API maintained by CU Boulder and provides official
Argo float profile data.

The service:
- Searches real Argo profiles for map markers.
- Fetches real pressure, temperature and salinity profile measurements.
- Builds real float trajectories from Argovis profile locations.
- Never generates/mock-fills scientific measurements.
"""

import os
import re
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx

from .cache import TTLCache


ARGOVIS_BASE_URL = os.getenv(
    "ARGOVIS_BASE_URL",
    "https://argovis-api.colorado.edu",
)

ARGOVIS_API_KEY = os.getenv("ARGOVIS_API_KEY", "").strip()

CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "900"))

MAX_FLOATS = 60
SEARCH_WINDOW_DAYS = 3
TRAJECTORY_MAX_POINTS = 30


cache = TTLCache(ttl_seconds=CACHE_TTL_SECONDS)


REGION_BOXES = {
    "indian_ocean": {
        "lonRange": (40, 120),
        "latRange": (-45, 25),
    },
    "pacific_ocean": {
        "lonRange": (-180, -100),
        "latRange": (-50, 50),
    },
    "atlantic_ocean": {
        "lonRange": (-60, -10),
        "latRange": (-50, 50),
    },
    "southern_ocean": {
        "lonRange": (-180, 180),
        "latRange": (-70, -40),
    },
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
    headers = {
        "Accept": "application/json",
        "User-Agent": "ocean-explorer-3d/1.0",
    }

    if ARGOVIS_API_KEY:
        headers["x-argokey"] = ARGOVIS_API_KEY

    return headers


async def _get(path: str, params) -> list:
    """
    GET JSON data from Argovis.

    `params` may be either:
    - a normal dictionary
    - a list of tuples, which allows repeated query parameters such as:

        data=pressure
        data=temperature
        data=salinity
    """

    url = f"{ARGOVIS_BASE_URL}{path}"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                url,
                params=params,
                headers=_headers(),
            )
    except httpx.RequestError as exc:
        raise ArgoServiceError(
            f"Could not reach Argovis ({exc.__class__.__name__}): {exc}",
            504,
        )

    if resp.status_code == 404:
        return []

    if resp.status_code == 429:
        raise ArgoServiceError(
            "Argovis rate limit hit — try again shortly, "
            "or set ARGOVIS_API_KEY.",
            429,
        )

    if resp.status_code >= 400:
        raise ArgoServiceError(
            f"Argovis returned HTTP {resp.status_code}: {resp.text[:300]}",
            502,
        )

    try:
        data = resp.json()
    except ValueError:
        raise ArgoServiceError(
            "Argovis returned a non-JSON response.",
            502,
        )

    return data or []


def _year_window(year: Optional[int]) -> tuple[str, str]:
    """Return a bounded date window."""

    now = datetime.now(timezone.utc)

    if year is None:
        end = now
        start = end - timedelta(days=SEARCH_WINDOW_DAYS)

        return (
            start.strftime("%Y-%m-%dT%H:%M:%SZ"),
            end.strftime("%Y-%m-%dT%H:%M:%SZ"),
        )

    year = int(year)

    year_end = datetime(
        year,
        12,
        31,
        23,
        59,
        59,
        tzinfo=timezone.utc,
    )

    end = min(year_end, now)

    start = end - timedelta(days=SEARCH_WINDOW_DAYS)

    year_start = datetime(
        year,
        1,
        1,
        tzinfo=timezone.utc,
    )

    if start < year_start:
        start = year_start

    return (
        start.strftime("%Y-%m-%dT%H:%M:%SZ"),
        end.strftime("%Y-%m-%dT%H:%M:%SZ"),
    )


def _parse_wmo(profile_id: str) -> str:
    match = re.match(r"^(\d+)_", profile_id)

    return match.group(1) if match else profile_id


async def search_floats(
    region: Optional[str] = None,
    year: Optional[int] = None,
    limit: int = 40,
) -> dict:

    limit = max(1, min(limit, MAX_FLOATS))

    region_slug = slugify_region(region)

    start_date, end_date = _year_window(year)

    cache_key = (
        f"floats:{region_slug}:{year}:{limit}:"
        f"{start_date}:{end_date}"
    )

    async def fetch():

        params = {
            "startDate": start_date,
            "endDate": end_date,
        }

        if region_slug:
            box = REGION_BOXES[region_slug]

            lon_min, lon_max = box["lonRange"]
            lat_min, lat_max = box["latRange"]

            params["box"] = (
                f"[[{lon_min},{lat_min}],"
                f"[{lon_max},{lat_max}]]"
            )

        return await _get("/argo", params)

    raw = await cache.get_or_set_async(
        cache_key,
        fetch,
    )

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
    """
    Convert Argovis profile data into frontend-friendly level objects.

    Argovis returns profile measurements in column-oriented form.

    Example:

        data_info:
        [
            ["pressure", "temperature", "salinity"],
            ...
        ]

        data:
        [
            [pressure values...],
            [temperature values...],
            [salinity values...]
        ]

    This function converts those columns into:

        [
            {
                "pressure": ...,
                "temperature": ...,
                "salinity": ...,
                "oxygen": ...
            }
        ]
    """

    data_info = doc.get("data_info") or []

    names = []

    if (
        isinstance(data_info, list)
        and len(data_info) > 0
        and isinstance(data_info[0], list)
    ):
        names = data_info[0]

    raw_data = doc.get("data") or []

    if not isinstance(raw_data, list):
        return [], False

    # ---------------------------------------------------------
    # Case 1:
    # Argovis returned normal column-oriented arrays:
    #
    # data = [
    #     [pressure1, pressure2, ...],
    #     [temperature1, temperature2, ...],
    #     [salinity1, salinity2, ...]
    # ]
    # ---------------------------------------------------------

    if (
        names
        and len(raw_data) == len(names)
        and all(isinstance(column, list) for column in raw_data)
    ):
        columns = {
            name: column
            for name, column in zip(names, raw_data)
        }

        pressure_values = columns.get("pressure", [])
        temperature_values = columns.get("temperature", [])
        salinity_values = columns.get("salinity", [])
        oxygen_values = columns.get("doxy", [])

        max_len = max(
            len(pressure_values),
            len(temperature_values),
            len(salinity_values),
            len(oxygen_values),
            0,
        )

        levels = []
        has_oxygen = False

        for index in range(max_len):

            pressure = (
                pressure_values[index]
                if index < len(pressure_values)
                else None
            )

            temperature = (
                temperature_values[index]
                if index < len(temperature_values)
                else None
            )

            salinity = (
                salinity_values[index]
                if index < len(salinity_values)
                else None
            )

            oxygen = (
                oxygen_values[index]
                if index < len(oxygen_values)
                else None
            )

            if oxygen is not None:
                has_oxygen = True

            if (
                pressure is None
                and temperature is None
                and salinity is None
            ):
                continue

            levels.append(
                {
                    "pressure": pressure,
                    "depth_m": pressure,
                    "temperature": temperature,
                    "salinity": salinity,
                    "oxygen": oxygen,
                }
            )

        levels.sort(
            key=lambda lv: (
                lv["pressure"] is None,
                lv["pressure"] if lv["pressure"] is not None else 0,
            )
        )

        return levels, has_oxygen

    # ---------------------------------------------------------
    # Case 2:
    # Defensive support for list-of-dicts response.
    # ---------------------------------------------------------

    levels = []
    has_oxygen = False

    for entry in raw_data:

        if not isinstance(entry, dict):
            continue

        pressure = entry.get("pressure")
        temperature = entry.get("temperature")
        salinity = entry.get("salinity")
        oxygen = entry.get("doxy")

        if oxygen is not None:
            has_oxygen = True

        if (
            pressure is None
            and temperature is None
            and salinity is None
        ):
            continue

        levels.append(
            {
                "pressure": pressure,
                "depth_m": pressure,
                "temperature": temperature,
                "salinity": salinity,
                "oxygen": oxygen,
            }
        )

    levels.sort(
        key=lambda lv: (
            lv["pressure"] is None,
            lv["pressure"] if lv["pressure"] is not None else 0,
        )
    )

    return levels, has_oxygen


async def get_profile(float_id: str) -> dict:
    """
    Fetch one real Argo profile.

    Important:
    Argovis expects repeated `data` query parameters rather than one
    comma-separated value.

    Example:

        ?id=1902190_244
        &data=pressure
        &data=temperature
        &data=salinity
    """

    cache_key = f"profile:{float_id}"

    async def fetch():

        params = [
            ("id", float_id),
            ("data", "pressure"),
            ("data", "temperature"),
            ("data", "salinity"),
        ]

        return await _get(
            "/argo",
            params,
        )

    raw = await cache.get_or_set_async(
        cache_key,
        fetch,
    )

    if not raw:
        raise ArgoServiceError(
            f"No profile found for id '{float_id}'.",
            404,
        )

    doc = raw[0]

    try:
        lon, lat = doc["geolocation"]["coordinates"]
    except (KeyError, TypeError, ValueError):
        raise ArgoServiceError(
            "Profile is missing geolocation data.",
            502,
        )

    levels, has_oxygen = _extract_levels(doc)

    source_url = None

    sources = doc.get("source") or []

    if isinstance(sources, list) and sources:

        first_source = sources[0]

        if isinstance(first_source, dict):
            source_url = first_source.get("url")

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

        start = now - timedelta(days=365 * 3)

        params = {
            "platform": wmo,
            "startDate": start.strftime(
                "%Y-%m-%dT%H:%M:%SZ"
            ),
            "endDate": now.strftime(
                "%Y-%m-%dT%H:%M:%SZ"
            ),
        }

        return await _get(
            "/argo",
            params,
        )

    raw = await cache.get_or_set_async(
        cache_key,
        fetch,
    )

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

    points.sort(
        key=lambda p: p["date"] or ""
    )

    if len(points) > TRAJECTORY_MAX_POINTS:

        step = len(points) / TRAJECTORY_MAX_POINTS

        points = [
            points[int(i * step)]
            for i in range(TRAJECTORY_MAX_POINTS)
        ]

    return {
        "wmo": wmo,
        "count": len(points),
        "points": points,
    }


async def ping_upstream() -> bool:

    try:

        async with httpx.AsyncClient(timeout=8.0) as client:

            resp = await client.get(
                f"{ARGOVIS_BASE_URL}/ping",
                headers=_headers(),
            )

        return resp.status_code < 400

    except httpx.RequestError:
        return False
