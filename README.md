# Ocean Explorer 3D v2 — Full-Stack (Real Argo Data)

An interactive 3D ocean-data dashboard: a rotating WebGL globe showing real
Argo float positions, a FastAPI backend that serves real profile/trajectory
data from Argovis (the public Argo data API), and 2D scientific panels.

**This is the full-stack version.** The 3D globe UI, layout, sidebar, depth
control, timeline, charts, and trajectory panel are all unchanged from the
original frontend-only prototype — only the data underneath is now real.

---

## Quick start

**Terminal 1 — backend**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # optional, defaults work out of the box
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`. Check `http://localhost:8000/api/health`.

**Terminal 2 — frontend**

```bash
npm install
cp .env.example .env             # optional, defaults already point at :8000
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

You should see real Argo float markers appear on the globe within a few
seconds of load. Click one to see its real measurements.

---

## What's real vs. what's still sample data

**Real (live from Argovis / the official Argo GDAC network):**
- Argo float marker positions on the globe (`GET /api/argo/floats`)
- A float's real temperature, salinity, pressure, and (when the float is a
  BGC float) dissolved-oxygen measurements per depth level, shown in the
  popup and the Vertical Profile / Vertical Section charts
  (`GET /api/argo/profile/{id}`)
- A float's real historical trajectory, built from that platform's other
  profile locations over time (`GET /api/argo/trajectory/{id}`)
- Year and region controls, which are sent to the backend as real query
  filters (bounding box + date window)

**Still sample/procedural data (clearly labeled in the UI):**
- The Sea Surface Temperature and Ocean Currents 2D panels on the right
- The globe's optional temperature-overlay texture and the current-particle
  animation
- The three "at various depths" preview strips at the bottom, and the
  Timeseries tab's trend line

These are all generated in `src/data/sampleOceanData.js`. Argovis serves
*point* profiles, not pre-gridded fields, so a real version of these would
need a separate gridded product (e.g. a gridded Argo climatology, or
NOAA/Copernicus SST) — a reasonable next step, out of scope here.

---

## Data source

**[Argovis](https://argovis.colorado.edu)** (`https://argovis-api.colorado.edu`),
a public REST API built and maintained by CU Boulder, serving the official
international Argo float program's data — the same data the Argo GDACs
(Ifremer, Coriolis, AOML, etc.) distribute as NetCDF, indexed for fast
queries. Citable at https://doi.org/10.17882/42182.

**No account or API key required.** Requests work anonymously; Argovis just
throttles anonymous traffic more aggressively under heavy load. If you want
a higher rate limit, get a free key at https://argovis-keygen.colorado.edu/
and put it in `backend/.env` as `ARGOVIS_API_KEY` — never commit that file.

---

## API reference

| Route | Description |
|---|---|
| `GET /api/health` | `{status, upstream}` — checks Argovis reachability too |
| `GET /api/argo/floats?region=indian_ocean&year=2024&limit=40` | Lightweight list of real float positions |
| `GET /api/argo/profile/{float_id}` | Full real profile (all recorded levels) for one float, e.g. `1901094_109` |
| `GET /api/argo/trajectory/{float_id}` | Real historical positions for that float's platform |

`region` accepts: `indian_ocean`, `pacific_ocean`, `atlantic_ocean`,
`southern_ocean` (omit for global). `float_id` is Argovis's own profile id,
format `{WMO}_{cycle}`, e.g. `1901094_109`.

Interactive API docs: `http://localhost:8000/docs`.

---

## Design decisions worth knowing about

- **Floats list is deliberately lightweight.** It requests only
  location/date/id from Argovis — not per-level measurements — so listing
  ~40 floats stays fast. Full measurements are fetched only when you click
  a marker.
- **Bounded time window, not the whole year.** Requesting every profile in
  a whole ocean basin for a full year could mean a very large, slow
  response. Each floats request is bounded to a ~45-day window inside the
  selected year (ending at year-end, or "now" for the current year), capped
  at 60 markers. This is a real, filtered *subset*, not a fabricated one —
  see `SEARCH_WINDOW_DAYS` / `MAX_FLOATS` in `backend/services/argo_service.py`
  if you want to widen it.
- **Depth = pressure, not a true depth conversion.** Argo floats measure
  pressure (dbar); this app uses the standard oceanographic rule-of-thumb
  that 1 dbar ≈ 1 m, same as most lightweight ocean dashboards. It is *not*
  a TEOS-10 pressure-to-depth conversion.
- **The depth slider picks the nearest real recorded level — it never
  interpolates.** Argo profiles have irregular level spacing; the popup is
  explicit that it's showing the nearest measured level, not an exact match
  for the slider's depth.
- **In-memory caching.** Repeated requests for the same floats query or the
  same float's profile/trajectory are cached for 15 minutes
  (`CACHE_TTL_SECONDS` in `backend/.env`) to avoid hammering Argovis,
  especially while the timeline is auto-playing.
- **Oxygen only shows when present.** Only BGC (biogeochemical) Argo floats
  carry oxygen sensors; the popup and profile charts hide that row/chart
  entirely for floats that don't have it, rather than showing a fake value.

---

## Environment variables

**Frontend** (`.env`, see `.env.example`):
```
VITE_API_BASE_URL=http://localhost:8000
```

**Backend** (`backend/.env`, see `backend/.env.example`):
```
ARGOVIS_API_KEY=                # optional
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ARGOVIS_BASE_URL=https://argovis-api.colorado.edu
CACHE_TTL_SECONDS=900
```

No secrets are required for the first working version, and nothing frontend
ever holds a credential — the optional Argovis key lives only in
`backend/.env`, which is git-ignored.

---

## Limitations / honesty check

- **Not tested end-to-end by the assistant.** This project was built and
  code-reviewed in a sandbox without npm/PyPI registry access, so
  `npm install`, `pip install`, and an actual `uvicorn` + `vite dev` run
  could not be executed here. Every file was syntax-checked
  (`py_compile` for Python, bracket-balance checks for JS/JSX), and the
  Argovis query patterns were taken directly from the official `argopy`
  client's source and verified once with a live request during
  development — but please run it and report back if anything doesn't
  come up clean.
- One soft assumption: the exact key names inside Argovis's per-level
  `data` payload (`pressure`, `temperature`, `salinity`, `doxy`) are
  inferred from Argovis's `data_info` field names and `argopy`'s query
  construction, not confirmed against a live `data=...` response (the
  research tool used to explore the API cached earlier responses and
  wouldn't re-fetch with different query params). If float markers appear
  but clicking one returns an empty profile, this is the first thing to
  check — add a `print(raw)` in `backend/services/argo_service.py`'s
  `get_profile()` right after the `_get()` call.
- Argovis is a community research API, not a guaranteed-uptime commercial
  service. If it's slow or briefly down, `/api/health` will report
  `upstream: "unreachable"` and float requests will fail with a clear error
  surfaced in the UI (a banner + inline popup message) rather than silently
  falling back to fake data.
- The 2D gridded panels (SST map, currents, depth-preview strips,
  timeseries) are still sample data, as documented above.
- No automated tests were added (none existed in the original project).

---

## Project structure

```
backend/
  main.py                 FastAPI app, routes, CORS
  requirements.txt
  .env.example
  services/
    argo_service.py       Real Argovis integration
    cache.py               In-memory TTL cache
  models/
    schemas.py             Pydantic response models

src/
  services/
    api.js                 fetch wrapper (base URL, error handling)
    argoService.js         raw backend calls
    argoData.js             adapter -> shape used by UI components (real data)
    oceanService.js         re-exports sample ocean fields (documented as mock)
    oceanData.js             (unchanged) procedural sample generators
  components/               (unchanged) Globe, Sidebar, DataPanel, Timeline, Views
  data/
    sampleArgoData.js       legacy mock floats (no longer used, kept for reference)
    sampleOceanData.js       procedural gridded-field generators (still used)
  App.jsx                   wiring: real data fetching, depth-slider logic
  App.css                    (extended) loading/error banner styles
```
