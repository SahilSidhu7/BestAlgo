import os
import pandas as pd
from typing import List, Dict, Any
from pydantic import BaseModel
from fastapi import HTTPException

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, confusion_matrix

# Classification Models
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier

# Regression Models
from sklearn.linear_model import LinearRegression # Multilinear regression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import make_pipeline
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor

class TrainRequest(BaseModel):
    file_id: str
    target_column: str
    models: List[str] # e.g. ["RandomForest", "KNN"]
    hyperparameters: Dict[str, Any] # e.g. {"RandomForest": {"n_estimators": 100}, "KNN": {"n_neighbors": 5}}

def process_train_models(req: TrainRequest, upload_dir: str):
    file_path = os.path.join(upload_dir, f"{req.file_id}.csv")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        df = pd.read_csv(file_path)
        if req.target_column not in df.columns:
            raise HTTPException(status_code=400, detail="Target column missing")
            
        # Check if Classification or Regression
        target_dtype = df[req.target_column].dtype
        unique_vals = df[req.target_column].nunique()
        
        is_classification = False
        if target_dtype == 'object' or target_dtype == 'bool' or (pd.api.types.is_integer_dtype(target_dtype) and unique_vals < 20):
            is_classification = True
            
        X = df.drop(columns=[req.target_column])
        y = df[req.target_column]
        
        # Ensure all X is numeric
        for col in X.columns:
            if X[col].dtype == 'object':
                 le = LabelEncoder()
                 X[col] = le.fit_transform(X[col].astype(str))
                 
        if is_classification and y.dtype == 'object':
             le_y = LabelEncoder()
             y = le_y.fit_transform(y.astype(str))
             
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        results = {}
        
        for model_name in req.models:
            params = req.hyperparameters.get(model_name, {})
            model = None
            
            if is_classification:
                if model_name == 'Logistic Regression':
                    model = LogisticRegression(max_iter=int(params.get('max_iter', 1000)))
                elif model_name == 'Decision Tree':
                    model = DecisionTreeClassifier(max_depth=int(params.get('max_depth', 0)) if params.get('max_depth') else None)
                elif model_name == 'Random Forest':
                    model = RandomForestClassifier(n_estimators=int(params.get('n_estimators', 100)))
                elif model_name == 'SVM':
                    model = SVC(kernel=params.get('kernel', 'rbf'))
                elif model_name == 'KNN':
                    model = KNeighborsClassifier(n_neighbors=int(params.get('n_neighbors', 5)))
            else:
                if model_name == 'Multilinear Regression':
                    model = LinearRegression()
                elif model_name == 'Polynomial Regression':
                    degree = int(params.get('degree', 2))
                    model = make_pipeline(PolynomialFeatures(degree), LinearRegression())
                elif model_name == 'Decision Tree':
                    model = DecisionTreeRegressor(max_depth=int(params.get('max_depth', 0)) if params.get('max_depth') else None)
                elif model_name == 'Random Forest':
                    model = RandomForestRegressor(n_estimators=int(params.get('n_estimators', 100)))
                    
            if model is None:
                continue # Skip unknown model
                
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            
            if is_classification:
                acc = accuracy_score(y_test, y_pred)
                # handle multi-class vs binary
                avg_method = 'macro' if unique_vals > 2 else 'binary'
                try:
                    f1 = f1_score(y_test, y_pred, average=avg_method, zero_division=0)
                    prec = precision_score(y_test, y_pred, average=avg_method, zero_division=0)
                    rec = recall_score(y_test, y_pred, average=avg_method, zero_division=0)
                except Exception:
                    f1 = f1_score(y_test, y_pred, average='macro', zero_division=0)
                    prec = precision_score(y_test, y_pred, average='macro', zero_division=0)
                    rec = recall_score(y_test, y_pred, average='macro', zero_division=0)
                    
                cm = confusion_matrix(y_test, y_pred).tolist()
                
                results[model_name] = {
                    "accuracy": float(acc),
                    "f1_score": float(f1),
                    "precision": float(prec),
                    "recall": float(rec),
                    "confusion_matrix": cm
                }
            else:
                mse = mean_squared_error(y_test, y_pred)
                mae = mean_absolute_error(y_test, y_pred)
                r2 = r2_score(y_test, y_pred)
                
                results[model_name] = {
                    "mse": float(mse),
                    "mae": float(mae),
                    "r2": float(r2)
                }
                
        return {
            "task_type": "classification" if is_classification else "regression",
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
