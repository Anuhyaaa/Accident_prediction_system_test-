# AI-Based Accident Hotspot Prediction System — India

A proactive road-safety intelligence platform combining **GIS spatial analysis** with a **hybrid ML pipeline** (DBSCAN + Random Forest) to identify accident Black Spots across India and predict severity under varying road and environmental conditions.

The system has a React SPA frontend with an interactive map, analytics dashboards, and a real-time prediction form, backed by a Flask REST API that serves ML model outputs.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Dataset](#dataset)
3. [Quick Start — Local Setup](#quick-start--local-setup)
4. [Running the ML Pipeline](#running-the-ml-pipeline)
5. [Starting the Servers](#starting-the-servers)
6. [Verifying the Integration](#verifying-the-integration)
7. [ML Pipeline Details](#ml-pipeline-details)
8. [API Reference](#api-reference)
9. [Configuration](#configuration)
10. [Project Structure](#project-structure)

---

## Architecture Overview

```
road.csv (Road Accident Data)
    │
    ▼ python backend/run_pipeline.py
┌──────────────────────────────────────────────────────────────────┐
│  ML Pipeline (5 stages)                                           │
│  1. Preprocess  → cleaned CSV + label encoders                   │
│  2. EDA         → 11 JSON stat files                             │
│  3. DBSCAN      → 12 geographic clusters (India)                 │
│  4. RandomForest → severity classifier (84.5% accuracy)          │
│  5. ARI         → risk scores per cluster                        │
└────────────────────────────┬─────────────────────────────────────┘
                             │ .joblib models + EDA JSON files
                             ▼
                  ┌──────────────────────┐
                  │  Flask REST API       │  ← python backend/app.py
                  │  http://localhost:5000│
                  │  14+ endpoints        │
                  └──────────┬───────────┘
                             │ /api proxy (Vite)
                             ▼
                  ┌──────────────────────┐
                  │  React SPA (Vite)    │  ← npm run dev (frontend/)
                  │  http://localhost:5173│
                  │  Dashboard · Map     │
                  │  Analytics · Predict │
                  └──────────────────────┘
```

---

## Dataset

The system uses the **Road Accident Severity dataset** (Ethiopian RTA Dataset) available on Kaggle. The preprocessing pipeline geocodes the `Area_accident_occured` column to representative Indian city coordinates, making it suitable for India-focused hotspot analysis.

| Property   | Details                                                                         |
|------------|---------------------------------------------------------------------------------|
| Source     | Kaggle — Ethiopian Road Traffic Accident (RTA) Dataset                          |
| File       | `road.csv`                                                                      |
| Rows       | ~12,316 accident records                                                        |
| Target     | `Accident_severity` → Slight Injury / Serious Injury / Fatal Injury             |

### Geocoding mapping (area type → Indian city)

| Area type           | Mapped city   |
|---------------------|---------------|
| Office areas        | Delhi NCR     |
| Residential areas   | Mumbai        |
| Church areas        | Bangalore     |
| Industrial areas    | Ahmedabad     |
| School areas        | Chennai       |
| Recreational areas  | Kolkata       |
| Hospital areas      | Jaipur        |
| Market areas        | Hyderabad     |
| Rural village areas | Nagpur        |
| Outside rural areas | Varanasi      |
| Other               | Pune          |
| Unknown             | Centre of India |

### How to get the dataset

1. Create a free [Kaggle](https://www.kaggle.com) account.
2. Download the RTA dataset CSV.
3. Place it at: `backend/data/road.csv`

---

## Quick Start — Local Setup

### Prerequisites

| Tool      | Version   | Purpose           |
|-----------|-----------|-------------------|
| Python    | 3.10+     | Backend & ML pipeline |
| Node.js   | 18+       | Frontend dev server |
| npm       | 9+        | Frontend dependencies |

### 1 — Clone the repo

```bash
git clone <your-repo-url>
cd Accident_prediction_system_test-
```

### 2 — Place the dataset

```
backend/
└── data/
    └── road.csv     ← put the downloaded CSV here
```

### 3 — Set up the Python backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows

# Install Python dependencies
pip install -r requirements.txt
```

### 4 — Install frontend dependencies

In a new terminal from the project root:

```bash
cd frontend
npm install
```

---

## Running the ML Pipeline

> **Must be run once before starting the API server.** This trains the models and generates all EDA files.

From the `backend/` directory (with the venv active):

```bash
python run_pipeline.py
```

This runs all 5 stages sequentially (~30–60 seconds on a typical machine):

```
STEP 1/5 — Data Preprocessing
  Loads road.csv, geocodes areas, encodes 15 categoricals
  → data/processed_accidents.csv  +  models/label_encoders.joblib

STEP 2/5 — Exploratory Data Analysis
  Computes hourly, weekly, severity, weather, area, collision, cause distributions
  → data/eda/*.json  (11 files)

STEP 3/5 — DBSCAN Spatial Clustering  (eps = 0.005 rad ≈ 32 km)
  Groups geocoded coordinates into geographic Black Spots
  → models/dbscan_labels.joblib  +  models/cluster_data.joblib

STEP 4/5 — Random Forest Classifier  (200 trees, depth 20, balanced)
  Trains on 17 features including Cluster_ID for spatial awareness
  → models/rf_model.joblib  +  data/eda/model_metrics.json
  Accuracy: ~84.5%

STEP 5/5 — Accident Risk Index (ARI)
  ARI = W1 × Severity + W2 × Density + W3 × Environment
  Weights derived from RF feature importances
  → models/ari_data.joblib  +  data/eda/ari_results.json
```

After the pipeline you should have **12 clusters** across India with ARI tiers (Low / Moderate / Severe / Critical).

### Optional flags

```bash
# Also seed results into a MySQL database
python run_pipeline.py --seed-db

# Skip step 1 if processed CSV already exists
python run_pipeline.py --skip-preprocess
```

---

## Starting the Servers

You need **two terminals** running simultaneously.

### Terminal 1 — Flask API (backend)

```bash
cd backend
source venv/bin/activate          # if not already active
python app.py
```

The API starts at **http://localhost:5000**. Confirm it's healthy:

```bash
curl http://localhost:5000/api/health
# → {"status": "ok", "models_loaded": {"ari_data": true, "random_forest": true, ...}}
```

### Terminal 2 — React dev server (frontend)

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

> Vite automatically proxies all `/api/*` requests to `http://localhost:5000`, so no CORS configuration is needed during development.

---

## Verifying the Integration

Once both servers are running, check these pages in the browser. The "Sample Data" badge in each page header should disappear once real API data loads.

| Page        | URL                              | What to verify                                          |
|-------------|----------------------------------|---------------------------------------------------------|
| Dashboard   | http://localhost:5173/           | 12 clusters, real incident counts, ARI scores            |
| Hotspot Map | http://localhost:5173/map        | 12 circle markers at Indian city coordinates            |
| Analytics   | http://localhost:5173/analytics  | Real EDA charts (hourly, weekly, severity, weather, etc.) |
| Prediction  | http://localhost:5173/predict    | Cluster dropdown populated; predictions return real ARI  |
| Data Manager| http://localhost:5173/data       | Upload and re-run pipeline from the UI                  |

### Quick API smoke tests

```bash
# Clusters GeoJSON (12 features, PascalCase property keys)
curl http://localhost:5000/api/clusters | python3 -c \
  "import json,sys; d=json.load(sys.stdin); print(len(d['features']), 'clusters')"

# EDA hourly distribution
curl http://localhost:5000/api/eda/hourly

# Prediction for cluster 1 (Delhi), rainy evening
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"cluster_id": 1, "hour": 18, "weather": "Rain", "day_of_week": 4}'
```

---

## ML Pipeline Details

### DBSCAN Clustering parameters

| Parameter      | Value     | Notes                                           |
|----------------|-----------|--------------------------------------------------|
| `eps`          | 0.005 rad | ~32 km radius — large enough to group each city's accidents, small enough to separate cities |
| `min_samples`  | 15        | Min points to form a Black Spot cluster          |
| `metric`       | haversine | Geographically accurate great-circle distance    |
| `algorithm`    | ball_tree | Efficient spatial indexing for haversine         |

**Why DBSCAN?** Finds clusters of arbitrary shape (road corridors), handles noise (isolated incidents), and does not require specifying the number of clusters upfront.

### Random Forest features (17)

```
Hour, DayOfWeek, Is_Night, Weather_Binned_Enc, Num_Vehicles,
Type_of_vehicle_Enc, Road_surface_type_Enc, Road_surface_conditions_Enc,
Light_conditions_Enc, Type_of_collision_Enc, Cause_of_accident_Enc,
Road_allignment_Enc, Types_of_Junction_Enc, Lanes_or_Medians_Enc,
Driving_experience_Enc, Age_band_of_driver_Enc, Cluster_ID
```

`Cluster_ID` is included as a feature so the model is **spatially aware** — severity patterns differ between city types.

### Accident Risk Index formula

```
ARI = W1 × Severity_Score + W2 × Density_Score + W3 × Environmental_Factor
```

| Component          | Derivation                                           |
|--------------------|------------------------------------------------------|
| Severity_Score     | Mean severity in cluster, normalised to [0, 1]       |
| Density_Score      | Cluster incident count / max count across clusters   |
| Environmental_Factor | Weather risk score (Clear=0.15 … Snow=0.85)        |
| W1, W2, W3         | Derived from RF feature importances (sum to 1)       |

| Risk Tier | ARI Range   | Map colour |
|-----------|-------------|------------|
| Low       | 0.00 – 0.30 | Green      |
| Moderate  | 0.30 – 0.50 | Yellow     |
| Severe    | 0.50 – 0.70 | Orange     |
| Critical  | 0.70 – 1.00 | Red        |

---

## API Reference

### Core

| Method | Endpoint                    | Description                                    |
|--------|-----------------------------|------------------------------------------------|
| GET    | `/api/health`               | Models loaded status                           |
| GET    | `/api/clusters`             | All clusters as GeoJSON FeatureCollection      |
| GET    | `/api/clusters?format=json` | All clusters as raw JSON list                  |
| GET    | `/api/clusters/<id>`        | Single cluster + accident records (MySQL only) |
| POST   | `/api/predict`              | Severity + ARI prediction for given conditions |

### EDA

| Method | Endpoint                       | Returns                         |
|--------|--------------------------------|---------------------------------|
| GET    | `/api/eda/hourly`              | `[{hour, count}]` × 24         |
| GET    | `/api/eda/weekly`              | `[{day, day_idx, count}]` × 7  |
| GET    | `/api/eda/severity`            | `[{severity, label, count}]`   |
| GET    | `/api/eda/weather`             | `[{weather, count}]`           |
| GET    | `/api/eda/top_areas`           | `[{area, count}]`              |
| GET    | `/api/eda/collision_types`     | `[{collision_type, count}]`    |
| GET    | `/api/eda/causes`              | `[{cause, count}]`             |
| GET    | `/api/eda/vehicle_types`       | `[{vehicle_type, count}]`      |
| GET    | `/api/eda/severity_by_weather` | Cross-tab array                |
| GET    | `/api/eda/severity_by_light`   | Cross-tab array                |
| GET    | `/api/eda/summary`             | Dataset summary stats          |
| GET    | `/api/model/metrics`           | RF accuracy, confusion matrix, feature importances |

### Upload & Pipeline

| Method | Endpoint            | Description                         |
|--------|---------------------|-------------------------------------|
| POST   | `/api/upload`       | Upload a new `road.csv` (multipart) |
| POST   | `/api/pipeline/run` | Re-run full ML pipeline (blocking)  |

### Prediction request/response

**Request body:**
```json
{
  "cluster_id": 1,
  "hour": 17,
  "day_of_week": 4,
  "is_night": 1,
  "weather": "Rain",
  "num_vehicles": 2,
  "type_of_vehicle": "Automobile",
  "road_surface_conditions": "Wet or damp",
  "light_conditions": "Darkness - lights unlit",
  "type_of_collision": "Vehicle with vehicle collision",
  "cause_of_accident": "No distancing",
  "driving_experience": "5-10yr",
  "age_band_of_driver": "18-30"
}
```

`cluster_id`, `hour`, and `weather` are required. All other fields are optional and fall back to sensible defaults.

**Response:**
```json
{
  "cluster_id": 1,
  "predicted_severity": 1,
  "predicted_label": "Slight Injury",
  "severity_probabilities": {
    "Slight Injury": 0.8292,
    "Serious Injury": 0.1431,
    "Fatal Injury": 0.0277
  },
  "ari_score": 0.73,
  "risk_tier": "Critical",
  "weights": {
    "W1_severity": 0.5401,
    "W2_density": 0.3948,
    "W3_environment": 0.0651
  },
  "input_conditions": {
    "weather": "Rain",
    "hour": 17,
    "env_score": 0.75
  }
}
```

---

## Configuration

All configuration is centralised in `backend/config.py`. Override with environment variables:

| Variable             | Default | Description                                   |
|----------------------|---------|-----------------------------------------------|
| `DBSCAN_EPS`         | `0.005` | Cluster radius in radians (~32 km)            |
| `DBSCAN_MIN_SAMPLES` | `15`    | Min accidents to form a Black Spot            |
| `RF_N_ESTIMATORS`    | `200`   | Number of trees in Random Forest              |
| `RF_MAX_DEPTH`       | `20`    | Maximum tree depth                            |
| `RF_TEST_SIZE`       | `0.2`   | Test set fraction (stratified split)          |
| `FLASK_PORT`         | `5000`  | Flask API port                                |
| `FLASK_DEBUG`        | `1`     | Enable Flask debug/reloader                   |
| `MYSQL_HOST`         | `localhost` | MySQL host (optional)                     |
| `MYSQL_PORT`         | `3306`  | MySQL port                                    |
| `MYSQL_USER`         | `root`  | MySQL user                                    |
| `MYSQL_PASSWORD`     | *(empty)* | MySQL password                              |
| `MYSQL_DATABASE`     | `accident_hotspot_db` | MySQL database name             |

---

## Project Structure

```
Accident_prediction_system_test-/
├── README.md
├── backend/
│   ├── app.py                    # Flask application entry point
│   ├── config.py                 # Centralised configuration & paths
│   ├── requirements.txt          # Python dependencies
│   ├── run_pipeline.py           # Master pipeline runner (steps 1–5)
│   ├── data/
│   │   ├── road.csv              # Raw dataset (place here before running pipeline)
│   │   ├── processed_accidents.csv  # Generated by step 1
│   │   └── eda/                  # Generated JSON stat files (steps 2 & 4 & 5)
│   ├── models/                   # Serialised ML artefacts (generated by pipeline)
│   │   ├── rf_model.joblib       # Trained Random Forest (~57 MB)
│   │   ├── dbscan_labels.joblib
│   │   ├── cluster_data.joblib
│   │   ├── ari_data.joblib
│   │   ├── label_encoders.joblib
│   │   └── feature_importances.joblib
│   ├── scripts/                  # Modular ML pipeline stages
│   │   ├── preprocess.py         # Step 1
│   │   ├── eda.py                # Step 2
│   │   ├── clustering.py         # Step 3
│   │   ├── classifier.py         # Step 4
│   │   ├── ari.py                # Step 5
│   │   └── seed_db.py            # Optional — seed MySQL
│   ├── routes/                   # Flask API blueprints
│   │   ├── clusters.py
│   │   ├── predictions.py
│   │   ├── eda_routes.py
│   │   └── upload.py
│   └── utils/
│       ├── db.py                 # MySQL helpers (optional)
│       └── geojson_utils.py      # Cluster → GeoJSON conversion
└── frontend/
    ├── package.json
    ├── vite.config.js            # Vite + /api proxy to :5000
    └── src/
        ├── api.js                # Axios wrappers for all API calls
        ├── mockData.js           # Fallback data shown before API responds
        ├── App.jsx               # Layout + routing
        ├── ThemeContext.jsx      # Dark / light theme
        ├── components/           # Shared UI components
        └── pages/
            ├── Dashboard.jsx     # KPI overview + cluster table
            ├── MapView.jsx       # Leaflet hotspot map
            ├── Analytics.jsx     # EDA charts
            ├── Predict.jsx       # Real-time severity prediction
            └── DataManager.jsx   # CSV upload + pipeline trigger
```

---

## Notes

- **MySQL is optional.** The API automatically falls back to serving from `.joblib` files when no database connection is available.
- **Mock data fallback:** The frontend displays sample data while the API loads. Once the backend responds, real data replaces it and the "Sample Data" badge disappears.
- **Re-training:** Upload a new `road.csv` via the Data Manager page and click "Run Pipeline" to retrain all models without restarting the server.
