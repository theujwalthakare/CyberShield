from typing import Optional
from fastapi import APIRouter, Query
import pandas as pd
import numpy as np
import os
import math

router = APIRouter()

DATA_PATH = os.path.join(os.path.dirname(__file__), "../../../../data/cybercrime_cases.csv")
df = None

def get_data():
    global df
    if df is None:
        if os.path.exists(DATA_PATH):
            raw_df = pd.read_csv(DATA_PATH)
            # Filter exactly 2020-2024 as requested
            raw_df = raw_df[(raw_df["Year"] >= 2020) & (raw_df["Year"] <= 2024)]
            
            # Map new dataset format to internal structure
            df = pd.DataFrame()
            df["Year"] = raw_df["Year"].astype(int)
            df["Day"] = raw_df["Day"].astype(int)
            df["State"] = raw_df["City"]
            df["Crime_Type"] = raw_df["Incident_Type"]
            df["Cases_Reported"] = 1
            df["Financial_Loss"] = raw_df["Amount_Lost_INR"].fillna(0)
            df["Crime_Rate_per_100k"] = 0.0
            df["District"] = raw_df["Category"]
        else:
            return pd.DataFrame()
    return df

def filter_data(data: pd.DataFrame, year: Optional[int] = None, state: Optional[str] = None, crime_type: Optional[str] = None, category: Optional[str] = None) -> pd.DataFrame:
    res = data
    if year:
        res = res[res["Year"] == year]
    if state and state != "All":
        res = res[res["State"] == state]
    if crime_type and crime_type != "All":
        res = res[res["Crime_Type"] == crime_type]
    if category and category != "All":
        res = res[res["District"] == category]
    return res

@router.get("/filters")
async def get_filters():
    data = get_data()
    if data.empty:
        return {"years": [], "states": [], "crime_types": [], "categories": []}
    years = sorted(data["Year"].unique().tolist(), reverse=True)
    states = sorted(data["State"].unique().tolist())
    crime_types = sorted(data["Crime_Type"].unique().tolist())
    categories = sorted(data["District"].unique().tolist())
    return {"years": years, "states": states, "crime_types": crime_types, "categories": categories}

@router.get("/overview")
async def get_overview(year: Optional[int] = None, state: Optional[str] = None, crime_type: Optional[str] = None, category: Optional[str] = None):
    data = get_data()
    data = filter_data(data, year, state, crime_type, category)
    if data.empty:
        return {"total_cases": 0, "total_financial_loss": 0, "avg_loss_per_case": 0, "total_districts": 0}
    
    total_cases = int(data["Cases_Reported"].sum())
    total_loss = float(data["Financial_Loss"].sum())
    avg_loss = float(total_loss / total_cases) if total_cases > 0 else 0.0
    total_districts = int(data["District"].nunique())
    
    return {
        "total_cases": total_cases,
        "total_financial_loss": total_loss,
        "avg_loss_per_case": round(avg_loss, 2),
        "impacted_sectors": total_districts
    }

@router.get("/trends")
async def get_trends(year: Optional[int] = None, state: Optional[str] = None, crime_type: Optional[str] = None, category: Optional[str] = None):
    data = get_data()
    data = filter_data(data, year=None, state=state, crime_type=crime_type, category=category) 
    if data.empty:
        return []
        
    trends = data.groupby("Year")[["Cases_Reported", "Financial_Loss"]].sum().reset_index()
    return trends.to_dict(orient="records")

@router.get("/distribution")
async def get_distribution(year: Optional[int] = None, state: Optional[str] = None, crime_type: Optional[str] = None, category: Optional[str] = None):
    data = get_data()
    data = filter_data(data, year, state, crime_type, category)
    if data.empty:
        return []
        
    dist = data.groupby("Crime_Type")["Cases_Reported"].sum().reset_index()
    dist.columns = ["crime_type", "count"]
    dist = dist.sort_values("count", ascending=False)
    return dist.to_dict(orient="records")

@router.get("/geography")
async def get_geography(year: Optional[int] = None, state: Optional[str] = None, crime_type: Optional[str] = None, category: Optional[str] = None):
    data = get_data()
    data = filter_data(data, year, state, crime_type, category)
    if data.empty:
        return []
        
    geo = data.groupby("State").agg({
        "Cases_Reported": "sum",
        "Financial_Loss": "sum"
    }).reset_index()
    geo.columns = ["state", "total_cases", "total_financial_loss"]
    geo = geo.sort_values("total_cases", ascending=False)
    return geo.to_dict(orient="records")

@router.get("/forecast")
async def get_forecast(state: Optional[str] = None, crime_type: Optional[str] = None, category: Optional[str] = None):
    data = get_data()
    data = filter_data(data, year=None, state=state, crime_type=crime_type, category=category)
    if data.empty:
        return []
        
    trends = data.groupby("Year")[["Cases_Reported", "Financial_Loss"]].sum().reset_index()
    if len(trends) < 2:
        res = []
        for _, row in trends.iterrows():
            res.append({"Year": int(row["Year"]), "Cases_Reported": int(row["Cases_Reported"]), "Financial_Loss": float(row["Financial_Loss"]), "is_forecast": False})
        return res
        
    x = trends["Year"].values
    y_cases = trends["Cases_Reported"].values
    
    coeffs = np.polyfit(x, y_cases, 1)
    cases_fit = np.poly1d(coeffs)
    
    # Calculate Standard Error of the Regression for realistic confidence intervals
    if len(x) > 2:
        y_pred_hist = cases_fit(x)
        residuals = y_cases - y_pred_hist
        se = np.sqrt(np.sum(residuals**2) / (len(x) - 2))
    else:
        se = 0
    
    future_years = [2025, 2026, 2027, 2028]
    forecast = []
    
    for _, row in trends.iterrows():
        forecast.append({
            "Year": int(row["Year"]),
            "Cases_Reported": int(row["Cases_Reported"]),
            "Financial_Loss": float(row["Financial_Loss"]),
            "is_forecast": False
        })
        
    for yr in future_years:
        pred_cases = int(cases_fit(yr))
        # Growth of uncertainty the further out the projection goes
        time_distance = yr - 2024
        margin = int(se * 1.5 * np.sqrt(1 + time_distance * 0.2))
        
        forecast.append({
            "Year": yr,
            "Cases_Reported": max(0, pred_cases),
            "Cases_Predicted_Lower": max(0, pred_cases - margin),
            "Cases_Predicted_Upper": max(0, pred_cases + margin),
            "Financial_Loss": 0,
            "is_forecast": True
        })
        
    return forecast

@router.get("/daily-distribution")
async def get_daily_distribution(year: Optional[int] = None, state: Optional[str] = None, crime_type: Optional[str] = None, category: Optional[str] = None):
    data = get_data()
    data = filter_data(data, year, state, crime_type, category)
    if data.empty:
        return []
    daily = data.groupby("Day")["Cases_Reported"].sum().reset_index()
    daily.columns = ["day", "count"]
    return daily.to_dict(orient="records")

@router.get("/category-distribution")
async def get_category_distribution(year: Optional[int] = None, state: Optional[str] = None, crime_type: Optional[str] = None, category: Optional[str] = None):
    data = get_data()
    data = filter_data(data, year, state, crime_type, category)
    if data.empty:
        return []
    cat_dist = data.groupby("District")["Cases_Reported"].sum().reset_index()
    cat_dist.columns = ["category", "count"]
    cat_dist = cat_dist.sort_values("count", ascending=False)
    return cat_dist.to_dict(orient="records")

@router.get("/risk")
async def get_risk(crime_type: Optional[str] = None, category: Optional[str] = None):
    data = get_data()
    data = filter_data(data, year=None, state=None, crime_type=crime_type, category=category)
    if data.empty:
        return []
        
    state_trends = data.groupby(["State", "Year"])["Cases_Reported"].sum().reset_index()
    
    risks = []
    for state, group in state_trends.groupby("State"):
        if len(group) < 2: 
            continue
        x = group["Year"].values
        y = group["Cases_Reported"].values
        
        coeffs = np.polyfit(x, y, 1)
        slope = coeffs[0]
        
        pred_2028 = int(np.poly1d(coeffs)(2028))
        
        risks.append({
            "State": state,
            "surge_velocity": float(slope),
            "projected_cases": max(0, pred_2028)
        })
        
    risks = sorted(risks, key=lambda d: d["surge_velocity"], reverse=True)
    return risks[:5]
