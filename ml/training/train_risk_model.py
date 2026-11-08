import os
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, f1_score, confusion_matrix
import xgboost as xgb

def generate_training_data(n_samples: int = 1200, random_seed: int = 42):
    """Generates structured incident feature dataset representing urban monsoon behavior."""
    np.random.seed(random_seed)
    
    # Features:
    # 0: vision_score (0.0 to 1.0)
    # 1: water_coverage (0.0 to 1.0)
    # 2: rainfall_1h (0.0 to 90.0 mm)
    # 3: rainfall_3h (0.0 to 160.0 mm)
    # 4: hotspot_distance_m (0.0 to 2000.0 m)
    # 5: corroboration_count (0 to 8)
    # 6: in_500m_hotspot (0 or 1)

    records = []
    labels = [] # "low", "medium", "high"
    
    for _ in range(n_samples):
        # Sample mode: low risk, medium risk, high risk scenarios
        category = np.random.choice(["low", "medium", "high"], p=[0.40, 0.35, 0.25])
        
        if category == "low":
            v_score = np.random.beta(1.5, 5.0) # skewed towards 0
            water_cov = np.random.beta(1.2, 8.0)
            r1 = max(0.0, np.random.exponential(3.0))
            r3 = r1 + max(0.0, np.random.exponential(5.0))
            spot_dist = np.random.uniform(400, 2000)
            corroboration = np.random.choice([0, 1], p=[0.85, 0.15])
            in_500m = 1.0 if spot_dist <= 500 else 0.0
        elif category == "medium":
            v_score = np.random.uniform(0.35, 0.75)
            water_cov = np.random.uniform(0.20, 0.50)
            r1 = np.random.uniform(10.0, 35.0)
            r3 = r1 + np.random.uniform(10.0, 30.0)
            spot_dist = np.random.uniform(150, 1200)
            corroboration = np.random.choice([0, 1, 2], p=[0.5, 0.35, 0.15])
            in_500m = 1.0 if spot_dist <= 500 else 0.0
        else: # high
            v_score = np.random.beta(5.0, 1.5) # skewed towards 1.0
            water_cov = np.random.uniform(0.45, 0.85)
            r1 = np.random.uniform(30.0, 85.0)
            r3 = r1 + np.random.uniform(25.0, 70.0)
            spot_dist = np.random.uniform(20, 600)
            corroboration = np.random.choice([1, 2, 3, 4, 5], p=[0.2, 0.3, 0.25, 0.15, 0.1])
            in_500m = 1.0 if spot_dist <= 500 else 0.0

        records.append([v_score, water_cov, r1, r3, spot_dist, corroboration, in_500m])
        labels.append(category)

    feature_names = [
        "vision_score",
        "water_coverage",
        "rainfall_1h",
        "rainfall_3h",
        "hotspot_distance_m",
        "corroboration_count",
        "in_500m_hotspot"
    ]
    df = pd.DataFrame(records, columns=feature_names)
    df["risk_priority"] = labels
    return df

def train_and_evaluate():
    print("Generating structured incident feature dataset...")
    df = generate_training_data(n_samples=1500)
    
    feature_cols = [c for c in df.columns if c != "risk_priority"]
    X = df[feature_cols]
    y = df["risk_priority"]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    # 1. Random Forest Classifier
    print("Training Random Forest Classifier...")
    rf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    rf.fit(X_train, y_train)
    rf_preds = rf.predict(X_test)
    rf_f1 = f1_score(y_test, rf_preds, average="macro")
    
    print("\n--- Random Forest Classification Report ---")
    print(classification_report(y_test, rf_preds))
    print(f"Random Forest Macro F1: {rf_f1:.4f}")

    # Feature Importances
    importances = dict(zip(feature_cols, rf.feature_importances_))
    print("\nRandom Forest Feature Importances:")
    for k, v in sorted(importances.items(), key=lambda item: item[1], reverse=True):
        print(f"  {k:20s}: {v:.4f}")

    # 2. XGBoost Classifier Comparison
    print("\nTraining XGBoost Classifier...")
    label_map = {"low": 0, "medium": 1, "high": 2}
    inv_label_map = {0: "low", 1: "medium", 2: "high"}
    y_train_num = y_train.map(label_map)
    y_test_num = y_test.map(label_map)
    
    xgb_clf = xgb.XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.08, random_state=42)
    xgb_clf.fit(X_train, y_train_num)
    xgb_preds_num = xgb_clf.predict(X_test)
    xgb_preds = [inv_label_map[p] for p in xgb_preds_num]
    xgb_f1 = f1_score(y_test, xgb_preds, average="macro")
    print(f"XGBoost Macro F1: {xgb_f1:.4f}")

    # Save trained model
    models_dir = Path(__file__).resolve().parent.parent / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    out_model_path = models_dir / "risk_rf_model.pkl"
    joblib.dump(rf, out_model_path)
    print(f"\nTrained Random Forest model successfully serialized to {out_model_path}")

    # Save evaluation metrics artifact
    artifacts_dir = Path(__file__).resolve().parent.parent.parent / "artifacts" / "evaluation_results"
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    metrics_summary = {
        "random_forest_macro_f1": round(rf_f1, 4),
        "xgboost_macro_f1": round(xgb_f1, 4),
        "feature_importances": {k: round(v, 4) for k, v in importances.items()},
        "classes": list(rf.classes_)
    }
    with open(artifacts_dir / "risk_model_metrics.json", "w", encoding="utf-8") as f:
        import json
        json.dump(metrics_summary, f, indent=2)

if __name__ == "__main__":
    train_and_evaluate()

