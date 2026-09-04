# 🌊 Ocean Explorer 3D v2 — Real-Time Argo Ocean Data

> **An interactive 3D ocean-data visualization platform powered by real Argo float data, Argovis, FastAPI, and WebGL.**

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge)](https://cyberxjn.github.io/ocean-explorer-3d-v2/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge\&logo=github)](https://github.com/Cyberxjn/ocean-explorer-3d-v2)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge)](https://fastapi.tiangolo.com/)
[![Data](https://img.shields.io/badge/Data-Argovis%20%2F%20Argo-orange?style=for-the-badge)](https://argovis.colorado.edu/)

**Ocean Explorer 3D v2** is a full-stack interactive ocean-data dashboard that combines a WebGL 3D globe with real-world Argo float observations.

The application allows users to explore floating oceanographic platforms, inspect real measurements, view vertical profiles, and follow historical trajectories through an interactive interface.

---

## 🚀 Live Demo

### 🌐 [Launch Ocean Explorer 3D v2](https://cyberxjn.github.io/ocean-explorer-3d-v2/)

**Frontend:** GitHub Pages
**Backend:** FastAPI + Render
**Data:** Argovis / International Argo Program

> The application uses live upstream oceanographic data where supported. Availability depends on the Argovis service.

---

# ✨ Features

### 🌍 Interactive 3D Ocean Globe

* Interactive WebGL-based Earth
* Real Argo float locations
* Globe rotation and navigation
* Clickable float markers
* Geographic exploration

### 📊 Real Argo Measurements

When a float is selected, the application can display real recorded measurements including:

* Temperature
* Salinity
* Pressure
* Dissolved Oxygen for BGC floats
* Profile metadata
* Measurement levels

### 📈 Vertical Ocean Profiles

Explore how ocean conditions change with depth using real measurements from individual Argo profiles.

### 🛰️ Float Trajectories

View the historical movement of an Argo platform using its recorded profile locations.

### 🔎 Region & Time Filtering

Filter available float observations by:

* Indian Ocean
* Pacific Ocean
* Atlantic Ocean
* Southern Ocean
* Global coverage
* Year

### ⚡ Fast API Architecture

The frontend communicates with a FastAPI backend instead of directly querying Argovis.

This provides:

* API abstraction
* Error handling
* CORS configuration
* Response validation
* Server-side caching
* Cleaner frontend data handling

---

# 🧬 Data Pipeline

```text
                 ┌─────────────────────┐
                 │   Argo Float Data   │
                 │ International Argo  │
                 │       Network       │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │      Argovis        │
                 │   Public Argo API   │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │      FastAPI        │
                 │      Backend       │
                 └──────────┬──────────┘
                            │
                  JSON API responses
                            │
                            ▼
                 ┌─────────────────────┐
                 │   React + WebGL     │
                 │    Frontend         │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │  Interactive 3D     │
                 │   Ocean Explorer    │
                 └─────────────────────┘
```

---

# 🧪 What's Real vs Sample Data

## ✅ Real Data

The following components use real data retrieved through the backend from Argovis:

* Argo float positions
* Float IDs
* Observation dates
* Temperature measurements
* Salinity measurements
* Pressure measurements
* Dissolved oxygen when available
* Individual profile data
* Historical float trajectories
* Region filters
* Year/date filtering

## 🧩 Sample / Procedural Data

Some visualization layers remain procedural/sample data:

* Sea Surface Temperature 2D panel
* Ocean current visualization
* Temperature overlay texture
* Current particle animation
* Depth preview strips
* Timeseries preview graph

These are clearly separated in the codebase so they can later be replaced by real gridded datasets such as satellite, NOAA, Copernicus, or gridded Argo products.

---

# 🏗️ Architecture

```text
React / Vite Frontend
        │
        │ REST API
        ▼
FastAPI Backend
        │
        ├── Argo Service
        ├── Response Models
        ├── Caching Layer
        └── Error Handling
        │
        ▼
Argovis API
        │
        ▼
International Argo Data
```

---

# 🛠️ Tech Stack

### Frontend

* React
* Vite
* JavaScript / JSX
* WebGL
* Interactive 3D visualization
* CSS

### Backend

* Python
* FastAPI
* Pydantic
* REST API
* In-memory TTL caching

### Ocean Data

* Argovis
* International Argo Program
* Argo profile observations
* Temperature / Salinity / Pressure
* BGC Dissolved Oxygen

### Deployment

* GitHub Pages
* Render
* GitHub Actions

---

# 📂 Project Structure

```text
ocean-explorer-3d-v2/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py
│   │
│   └── services/
│       ├── __init__.py
│       ├── argo_service.py
│       └── cache.py
│
├── src/
│   ├── components/
│   ├── data/
│   │   ├── sampleArgoData.js
│   │   └── sampleOceanData.js
│   │
│   ├── services/
│   │   ├── api.js
│   │   ├── argoService.js
│   │   ├── argoData.js
│   │   ├── oceanService.js
│   │   └── oceanData.js
│   │
│   ├── App.jsx
│   └── App.css
│
├── index.html
├── package.json
└── README.md
```

---

# ⚡ Quick Start

## 1. Clone

```bash
git clone https://github.com/Cyberxjn/ocean-explorer-3d-v2.git
cd ocean-explorer-3d-v2
```

---

## 2. Start Backend

```bash
cd backend

python3 -m venv .venv
source .venv/bin/activate
```

### Windows

```powershell
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Optional environment file:

```bash
cp .env.example .env
```

Start FastAPI:

```bash
uvicorn main:app --reload
```

Backend:

```text
http://localhost:8000
```

Health check:

```text
http://localhost:8000/api/health
```

API documentation:

```text
http://localhost:8000/docs
```

---

# 💻 Frontend

Open another terminal:

```bash
cd ocean-explorer-3d-v2
npm install
```

Optional:

```bash
cp .env.example .env
```

Start development server:

```bash
npm run dev
```

Vite normally starts at:

```text
http://localhost:5173
```

---

# 🔌 API Endpoints

| Endpoint                              | Description                     |
| ------------------------------------- | ------------------------------- |
| `GET /api/health`                     | Backend + Argovis health status |
| `GET /api/argo/floats`                | Real Argo float locations       |
| `GET /api/argo/profile/{float_id}`    | Complete profile for a float    |
| `GET /api/argo/trajectory/{float_id}` | Historical float trajectory     |

Example:

```text
/api/argo/floats?region=indian_ocean&year=2024&limit=40
```

Example profile:

```text
/api/argo/profile/1901094_109
```

---

# 🌊 How the Float System Works

The float listing intentionally requests lightweight metadata first.

Instead of downloading complete measurements for every float:

```text
Load Globe
    ↓
Fetch float locations
    ↓
Display markers
    ↓
User clicks a marker
    ↓
Fetch complete profile
    ↓
Display measurements
```

This keeps the initial dashboard responsive and avoids unnecessary API requests.

---

# 📐 Depth Handling

Argo observations record **pressure**, normally in decibars (dbar).

This project uses the common lightweight approximation:

```text
1 dbar ≈ 1 meter
```

The application does not claim this to be a full TEOS-10 pressure-to-depth conversion.

The depth slider selects the **nearest recorded measurement level** rather than interpolating artificial values between observations.

---

# 🫧 BGC / Oxygen Support

Dissolved oxygen is only displayed when the selected Argo float actually contains oxygen observations.

The application does **not** generate fake oxygen measurements for floats without BGC sensors.

---

# ⚡ Caching

The backend includes an in-memory TTL cache.

Repeated requests for:

* Float lists
* Profiles
* Trajectories

can be served from cache for a configured period.

Default:

```text
CACHE_TTL_SECONDS=900
```

This helps reduce repeated requests to Argovis while users explore the dashboard.

---

# 🔐 Environment Variables

### Frontend

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Backend

```env
ARGOVIS_API_KEY=
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ARGOVIS_BASE_URL=https://argovis-api.colorado.edu
CACHE_TTL_SECONDS=900
```

An Argovis API key is optional.

**Never commit `.env` files or API credentials.**

---

# 🧭 Original Project & V1

This project builds upon the original **Ocean Explorer 3D** frontend prototype created by **Riddhima Dixit**.

### Original V1 Repository

🔗 **[RiddhimaDixit1/open-explorer-3d](https://github.com/RiddhimaDixit1/open-explorer-3d)**

The original project provided the foundation for the interactive ocean-exploration concept and frontend experience.

**Ocean Explorer 3D v2** extends that work by introducing a full-stack architecture and real Argo data integration, including:

* FastAPI backend
* Argovis integration
* Real float positions
* Real profile measurements
* Real float trajectories
* API-based data fetching
* Server-side caching
* Production deployment
* Additional data handling and fixes

> **Credit:** The original concept and V1 implementation are attributed to **Riddhima Dixit**. This repository represents my independent V2 development, modifications, integrations, fixes, and deployment work based on that foundation.

---

# 🏆 Smart India Hackathon Context

The project is related to the broader **Smart India Hackathon (SIH) ocean-data problem space**, particularly the challenge of making large and complex Argo/oceanographic datasets easier to explore and visualize.

One relevant SIH 2025 problem statement was **PS 25040 — FloatChat: AI-Powered Conversational Interface for ARGO Ocean Data Discovery and Visualization**, focused on making Argo data more accessible through an interactive data platform.

This project focuses specifically on the **interactive 3D visualization and real-data exploration side** of that problem space.

---

# 🎯 Future Improvements

Planned / possible improvements include:

* Real gridded SST datasets
* Real ocean-current datasets
* Copernicus Marine integration
* NOAA data integration
* Complete Argo trajectory visualization
* BGC parameter support
* Chlorophyll visualization
* Oxygen visualization layers
* NetCDF data export
* CSV profile export
* Advanced ocean-depth visualization
* More accurate pressure-to-depth conversion
* PostgreSQL/PostGIS storage
* AI-powered natural-language ocean-data queries

---

# ⚠️ Current Limitations

Some visualization panels still use procedural/sample data because Argovis primarily provides point/profile observations rather than complete gridded ocean fields.

For true gridded visualizations, dedicated datasets such as Copernicus Marine, NOAA products, or gridded Argo products would be required.

Argovis is also a public research-oriented API, so temporary upstream downtime or throttling may affect live data requests.

---

# 📚 Data Sources

### Argovis

**Argovis — CU Boulder**

https://argovis.colorado.edu/

Public API:

https://argovis-api.colorado.edu/

Argovis provides indexed access to observations from the international Argo program.

### Argo Global Data Assembly

The underlying Argo program distributes oceanographic observations through the global Argo data system.

Dataset reference:

https://doi.org/10.17882/42182

---

# 🙏 Acknowledgments

Special thanks to:

* **Riddhima Dixit** — Original Ocean Explorer 3D V1 project and frontend foundation
* **Argovis / CU Boulder** — Public Argo data API
* **International Argo Program** — Oceanographic observations
* **Smart India Hackathon ecosystem** — Problem-space inspiration and context

---

# 👨‍💻 Developer

### Cyberxjn

GitHub:

**https://github.com/Cyberxjn**

Project:

**https://github.com/Cyberxjn/ocean-explorer-3d-v2**

Live Demo:

**https://cyberxjn.github.io/ocean-explorer-3d-v2/**

---

# 📄 License

See the repository's license and the original project's licensing terms before redistributing or reusing code.

This V2 repository contains modifications and integrations built on top of the original V1 project. Third-party APIs, datasets, libraries, and assets remain subject to their respective licenses and terms.

---

<p align="center">

### 🌊 Explore the Ocean. Visualize the Data. Discover the Unknown.

**Ocean Explorer 3D v2**

</p>
