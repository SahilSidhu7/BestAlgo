# BestAlgo

Upload a CSV, clean it, and automatically train and compare ML models to find the best algorithm for your dataset.

## How it works

1. Upload a CSV dataset through the web UI
2. Configure data cleaning (handled by the backend cleaning pipeline)
3. Train multiple scikit-learn models and compare their performance

## Stack

- **Backend** — FastAPI + pandas + scikit-learn (`backend/`)
- **Frontend** — React + Vite (`frontend/`)
- **Docker** — `compose.yaml` runs the full stack

## Run

### Docker

```sh
docker compose up
```

### Manual

```sh
# backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# frontend
cd frontend
npm install
npm run dev
```
