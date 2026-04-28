"""
train.py — CyberShield risk scoring training pipeline

Reads intelligence_reports from Supabase, engineers features,
trains a RandomForest risk classifier, and saves:
  models/risk_model.pkl   — trained model
  models/metrics.json     — accuracy + classification report
"""

from __future__ import annotations

import json
import os
import pickle
from pathlib import Path

import httpx
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

load_dotenv()

MODELS_DIR = Path(__file__).resolve().parents[1] / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# ── Risk thresholds (INR loss → risk label) ──────────────────
RISK_THRESHOLDS = [
    (0,        50_000,   "low"),
    (50_000,   500_000,  "medium"),
    (500_000,  2_000_000,"high"),
    (2_000_000, float("inf"), "critical"),
]

def label_risk(amount: float) -> str:
    for lo, hi, label in RISK_THRESHOLDS:
        if lo <= amount < hi:
            return label
    return "critical"


def fetch_data() -> pd.DataFrame:
    url = "https://fwdyudjgnroozqfobziy.supabase.co"
    key = "sb_publishable_RFktMZvfAOGKMxM7Rx7GbA_4Dqm0qqt"
    resp = httpx.get(
        f"{url}/rest/v1/intelligence_reports",
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
        params={"select": "*", "limit": "10000"},
    )
    resp.raise_for_status()
    df = pd.DataFrame(resp.json())
    print(f"Fetched {len(df)} rows from intelligence_reports")
    return df


def engineer_features(df: pd.DataFrame) -> tuple[pd.DataFrame, LabelEncoder, LabelEncoder]:
    df = df.copy()
    df["day"] = pd.to_datetime(df["day"])
    df["month"]      = df["day"].dt.month
    df["day_of_week"] = df["day"].dt.dayofweek
    df["amount_lost_inr"] = df["amount_lost_inr"].fillna(0).astype(float)

    # Encode categoricals
    le_type = LabelEncoder()
    le_city = LabelEncoder()
    df["incident_type_enc"] = le_type.fit_transform(df["incident_type"].fillna("unknown"))
    df["city_enc"]          = le_city.fit_transform(df["city"].fillna("unknown"))

    # Aggregate: incidents per city per month (density feature)
    density = (
        df.groupby(["city", "month"])
        .size()
        .reset_index(name="incident_density")
    )
    df = df.merge(density, on=["city", "month"], how="left")

    df["risk_label"] = df["amount_lost_inr"].apply(label_risk)
    return df, le_type, le_city


FEATURE_COLS = [
    "incident_type_enc",
    "city_enc",
    "month",
    "day_of_week",
    "amount_lost_inr",
    "incident_density",
    "year",
]


def train(df: pd.DataFrame) -> tuple[RandomForestClassifier, dict]:
    X = df[FEATURE_COLS].fillna(0)
    y = df["risk_label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = float(np.mean(y_pred == y_test))
    report = classification_report(y_test, y_pred, output_dict=True)

    metrics = {
        "accuracy": round(accuracy, 4),
        "classification_report": report,
        "feature_cols": FEATURE_COLS,
        "risk_thresholds": [(lo, hi, lbl) for lo, hi, lbl in RISK_THRESHOLDS],
    }
    print(f"Accuracy: {accuracy:.4f}")
    return model, metrics


def save_artifacts(
    model: RandomForestClassifier,
    metrics: dict,
    le_type: LabelEncoder,
    le_city: LabelEncoder,
) -> None:
    with open(MODELS_DIR / "risk_model.pkl", "wb") as f:
        pickle.dump({"model": model, "le_type": le_type, "le_city": le_city}, f)
    with open(MODELS_DIR / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"Artifacts saved to {MODELS_DIR}")


def main() -> None:
    df = fetch_data()
    if len(df) < 10:
        print("Not enough data to train (need ≥ 10 rows). Exiting.")
        return
    df, le_type, le_city = engineer_features(df)
    model, metrics = train(df)
    save_artifacts(model, metrics, le_type, le_city)


if __name__ == "__main__":
    main()
