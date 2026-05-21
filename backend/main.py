import os
import io
import uuid
import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from data_cleaning import CleanRequest, process_clean_data
from model_training import TrainRequest, process_train_models

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        file_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}.csv")
        df.to_csv(file_path, index=False)
        
        columns = df.columns.tolist()
        preview = df.head(5).fillna("").to_dict(orient="records")
        
        return {
            "file_id": file_id,
            "columns": columns,
            "preview": preview,
            "total_rows": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/clean")
def clean_data(req: CleanRequest):
    return process_clean_data(req, UPLOAD_DIR)

@app.get("/api/download/{file_id}")
def download_file(file_id: str):
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}.csv")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path=file_path, filename="optimized_data.csv", media_type='text/csv')

@app.post("/api/train")
def train_models(req: TrainRequest):
    return process_train_models(req, UPLOAD_DIR)
