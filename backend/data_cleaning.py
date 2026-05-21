import os
import pandas as pd
import numpy as np
from pydantic import BaseModel
from fastapi import HTTPException
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder

class CleanRequest(BaseModel):
    file_id: str
    target_column: str
    mode: str # 'auto' or 'manual'
    # Manual options
    remove_duplicates: bool = False
    drop_nans: bool = False
    fill_nans_mean: bool = False
    standardize: bool = False
    normalize: bool = False
    encode_categorical: bool = False

def process_clean_data(req: CleanRequest, upload_dir: str):
    file_path = os.path.join(upload_dir, f"{req.file_id}.csv")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        df = pd.read_csv(file_path)
        original_rows = len(df)
        
        if req.target_column not in df.columns:
            raise HTTPException(status_code=400, detail="Target column not found in data")

        # Drop rows where target column is NaN before anything else
        df = df.dropna(subset=[req.target_column])
        
        if req.mode == 'auto':
            # Basic auto clean
            df = df.drop_duplicates()
            
            # Fill numeric NaNs with mean, categorical with mode
            for col in df.columns:
                if col != req.target_column:
                    if pd.api.types.is_numeric_dtype(df[col]):
                        df[col] = df[col].fillna(df[col].mean())
                    else:
                        if not df[col].mode().empty:
                            df[col] = df[col].fillna(df[col].mode()[0])
            
            # Label encode categorical features (except target for now if it's classification, wait, we should encode target if categorical)
            le_dict = {}
            for col in df.columns:
                if df[col].dtype == 'object' or df[col].dtype.name == 'category':
                    le = LabelEncoder()
                    df[col] = le.fit_transform(df[col].astype(str))
                    le_dict[col] = le

            # We won't standardize/normalize in 'auto' automatically unless requested, or we can just leave it as is.
        else:
            # Manual clean
            if req.remove_duplicates:
                df = df.drop_duplicates()
            
            if req.drop_nans:
                df = df.dropna()
            elif req.fill_nans_mean:
                for col in df.columns:
                    if col != req.target_column and pd.api.types.is_numeric_dtype(df[col]):
                        df[col] = df[col].fillna(df[col].mean())
                        
            if req.encode_categorical:
                for col in df.columns:
                    if df[col].dtype == 'object' or df[col].dtype.name == 'category':
                        le = LabelEncoder()
                        df[col] = le.fit_transform(df[col].astype(str))
                        
            if req.standardize:
                num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
                if req.target_column in num_cols:
                    num_cols.remove(req.target_column) # Don't scale target
                if num_cols:
                    scaler = StandardScaler()
                    df[num_cols] = scaler.fit_transform(df[num_cols])
            elif req.normalize:
                num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
                if req.target_column in num_cols:
                    num_cols.remove(req.target_column)
                if num_cols:
                    scaler = MinMaxScaler()
                    df[num_cols] = scaler.fit_transform(df[num_cols])

        cleaned_file_id = f"cleaned_{req.file_id}"
        cleaned_file_path = os.path.join(upload_dir, f"{cleaned_file_id}.csv")
        df.to_csv(cleaned_file_path, index=False)
        
        # Check if Classification or Regression
        target_dtype = df[req.target_column].dtype
        unique_vals = df[req.target_column].nunique()
        
        is_classification = False
        if target_dtype == 'object' or target_dtype == 'bool' or (pd.api.types.is_integer_dtype(target_dtype) and unique_vals < 20):
            is_classification = True

        return {
            "cleaned_file_id": cleaned_file_id,
            "original_rows": original_rows,
            "final_rows": len(df),
            "columns": df.columns.tolist(),
            "preview": df.head(5).fillna("").to_dict(orient="records"),
            "task_type": "classification" if is_classification else "regression"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
