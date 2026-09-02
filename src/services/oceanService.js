// Gridded ocean fields (sea surface temperature maps, current vector
// fields) used by the 2D panels and the globe's temperature overlay.
//
// STATUS: these remain lightweight, procedurally generated sample data
// (src/data/sampleOceanData.js) — NOT real data. Argovis (our real Argo
// data source) serves point profiles, not pre-gridded fields; producing a
// real gridded product would mean pulling from a separate service (e.g. a
// gridded Argo climatology, or NOAA/Copernicus SST). That's a reasonable
// next step but out of scope for this pass, which focused on real Argo
// float locations, profiles and trajectories.
//
// This file exists so the service-layer structure matches what a real
// integration would look like: swap the re-exports below for real fetch()
// calls against a backend endpoint (e.g. /api/ocean/sst) and nothing
// elsewhere in the app needs to change.

export {
  temperatureAt,
  currentVectorAt,
  temperatureColor,
  speedColor,
  salinityAt,
  salinityColor,
  pressureAt,
  pressureColor,
  yearlyTrend,
  REGIONS,
} from '../data/sampleOceanData.js'
