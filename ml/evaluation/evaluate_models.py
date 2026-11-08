import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support
from ml.training.train_risk_model import generate_training_data

def evaluate_models():
    root = Path(__file__).resolve().parent.parent.parent
    model_path = root / "ml" / "models" / "risk_rf_model.pkl"
    if not model_path.exists():
        print(f"Model not found at {model_path}. Train it first.")
        return

    rf = joblib.load(model_path)
    
    # Generate independent test evaluation set
    df_eval = generate_training_data(n_samples=500, random_seed=999)
    feature_cols = [c for c in df_eval.columns if c != "risk_priority"]
    X_eval = df_eval[feature_cols]
    y_eval = df_eval["risk_priority"]
    
    preds = rf.predict(X_eval)
    probs = rf.predict_proba(X_eval)
    
    precision, recall, f1, support = precision_recall_fscore_support(y_eval, preds, labels=["low", "medium", "high"])
    cm = confusion_matrix(y_eval, preds, labels=["low", "medium", "high"])
    
    print("=== MODEL EVALUATION METRICS ===")
    print(classification_report(y_eval, preds))
    print("Confusion Matrix [low, medium, high]:")
    print(cm)
    
    eval_results = {
        "evaluation_samples": len(df_eval),
        "classes": ["low", "medium", "high"],
        "precision_by_class": {c: round(float(p), 4) for c, p in zip(["low", "medium", "high"], precision)},
        "recall_by_class": {c: round(float(r), 4) for c, r in zip(["low", "medium", "high"], recall)},
        "f1_by_class": {c: round(float(f), 4) for c, f in zip(["low", "medium", "high"], f1)},
        "confusion_matrix": cm.tolist()
    }
    
    out_path = root / "artifacts" / "evaluation_results" / "model_evaluation_report.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(eval_results, f, indent=2)
    print(f"Saved evaluation metrics to {out_path}")

if __name__ == "__main__":
    evaluate_models()

