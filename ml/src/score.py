"""
score.py — CyberShield batch risk scoring pipeline

Loads the trained model, scores the latest intelligence_reports,
and upserts results into the risk_scores table in Supabase.

Run daily via cron / GitHub Actions / Celery.
"""

from __future__ import annotations

import json
import os
import pickle
from datetime import date, timedelta
from pathlib import Path

import httpx
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

MODELS_DIR = Path(__file__).resolve().parents[1] / "models"
MODEL_PATH  = MODELS_DIR / "risk_model.pkl"
METRICS_PATH = MODELS_DIR / "metrics.json"

FEATURE_COLS = [
    "incident_type_enc",
    "city_enc",
    "month",
    "day_of_week",
    "amount_lost_inr",
    "incident_density",
    "year",
]

RISK_SCORE_MAP = {"low": 20, "medium": 50, "high": 75, "critical": 95}


def load_model() -> dict:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Run train.py first.")
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)


def fetch_recent(url: str, key: str, days: int = 30) -> pd.DataFrame:
    since = (date.today() - timedelta(days=days)).isoformat()
    resp = httpx.get(
        f"{url}/rest/v1/intelligence_reports",
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
        params={"select": "*", "day": f"gte.{since}", "limit": "10000"},
    )
    resp.raise_for_status()
    df = pd.DataFrame(resp.json())
    print(f"Fetched {len(df)} recent rows for scoring")
    return df


def engineer_features(df: pd.DataFrame, le_type, le_city) -> pd.DataFrame:
    df = df.copy()
    df["day"] = pd.to_datetime(df["day"])
    df["month"]       = df["day"].dt.month
    df["day_of_week"] = df["day"].dt.dayofweek
    df["amount_lost_inr"] = df["amount_lost_inr"].fillna(0).astype(float)

    # Encode — unseen labels fall back to 0
    def safe_encode(encoder, series: pd.Series) -> pd.Series:
        known = set(encoder.classes_)
        return series.map(lambda x: encoder.transform([x])[0] if x in known else 0)

    df["incident_type_enc"] = safe_encode(le_type, df["incident_type"].fillna("unknown"))
    df["city_enc"]          = safe_encode(le_city, df["city"].fillna("unknown"))

    density = (
        df.groupby(["city", "month"])
        .size()
        .reset_index(name="incident_density")
    )
    df = df.merge(density, on=["city", "month"], how="left")
    return df


def score(df: pd.DataFrame, model, le_type, le_city) -> pd.DataFrame:
    df = engineer_features(df, le_type, le_city)
    X = df[FEATURE_COLS].fillna(0)
    df["risk_label"] = model.predict(X)
    df["risk_score"] = df["risk_label"].map(RISK_SCORE_MAP).fillna(50).astype(int)
    return df


def aggregate_by_city(df: pd.DataFrame) -> list[dict]:
    """Aggregate per-row scores into one risk score per city."""
    agg = (
        df.groupby("city")
        .agg(
            score=("risk_score", "mean"),
            incident_count=("risk_score", "count"),
            total_loss=("amount_lost_inr", "sum"),
            dominant_type=("incident_type", lambda x: x.value_counts().index[0]),
        )
        .reset_index()
    )
    agg["score"] = agg["score"].round(1)

    def score_to_level(s: float) -> str:
        if s < 30:   return "low"
        if s < 60:   return "medium"
        if s < 80:   return "high"
        return "critical"

    agg["risk_level"] = agg["score"].apply(score_to_level)
    return agg.to_dict(orient="records")


def upsert_scores(url: str, key: str, rows: list[dict]) -> None:
    records = [
        {
            "area_code":    r["city"].lower().replace(" ", "_"),
            "score":        r["score"],
            "risk_level":   r["risk_level"],
            "factors_json": json.dumps({
                "incident_count": r["incident_count"],
                "total_loss_inr": r["total_loss"],
                "dominant_type":  r["dominant_type"],
            }),
            "computed_at": date.today().isoformat(),
        }
        for r in rows
    ]
    resp = httpx.post(
        f"{url}/rest/v1/risk_scores",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        },
        json=records,
    )
    resp.raise_for_status()
    print(f"Upserted {len(records)} risk scores")


def main() -> None:
    url = "https://fwdyudjgnroozqfobziy.supabase.co"
    key = "sb_publishable_RFktMZvfAOGKMxM7Rx7GbA_4Dqm0qqt"

    artifacts = load_model()
    model, le_type, le_city = artifacts["model"], artifacts["le_type"], artifacts["le_city"]

    df = fetch_recent(url, key, days=30)
    if df.empty:
        print("No recent data to score.")
        return

    scored_df = score(df, model, le_type, le_city)
    city_scores = aggregate_by_city(scored_df)
    upsert_scores(url, key, city_scores)

    for row in sorted(city_scores, key=lambda r: r["score"], reverse=True)[:10]:
        print(f"  {row['city']:<20} score={row['score']:>5}  level={row['risk_level']}")


if __name__ == "__main__":
    main()
