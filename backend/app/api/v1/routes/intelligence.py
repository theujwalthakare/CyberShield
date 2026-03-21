from typing import Optional
from fastapi import APIRouter, Query
import pandas as pd
import numpy as np
import os
import math

router = APIRouter()

DATA_PATH = os.path.join(os.path.dirname(__file__), "../../../../data/india_district_crime.csv")
df = None

def get_data():
    global df
    if df is None:
        if os.path.exists(DATA_PATH):
            df = pd.read_csv(DATA_PATH)
        else:
            return pd.DataFrame()
    return df

def filter_data(data: pd.DataFrame, year: Optional[int] = None, state: Optional[str] = None, crime_type: Optional[str] = None) -> pd.DataFrame:
    res = data
    if year:
        res = res[res["Year"] == year]
    if state and state != "All":
        res = res[res["State"] == state]
    if crime_type and crime_type != "All":
        res = res[res["Crime_Type"] == crime_type]
    return res

@router.get("/filters")
async def get_filters():
    data = get_data()
    if data.empty:
        return {"years": [], "states": [], "crime_types": []}
    years = sorted(data["Year"].unique().tolist(), reverse=True)
    states = sorted(data["State"].unique().tolist())
    crime_types = sorted(data["Crime_Type"].unique().tolist())
    return {"years": years, "states": states, "crime_types": crime_types}

@router.get("/overview")
async def get_overview(year: Optional[int] = None, state: Optional[str] = None, crime_type: Optional[str] = None):
    data = get_data()
    data = filter_data(data, year, state, crime_type)
    if data.empty:
        return {"total_cases": 0, "total_convictions": 0, "avg_crime_rate": 0, "total_districts": 0}
    
    total_cases = int(data["Cases_Reported"].sum())
    total_convictions = int(data["Convictions"].sum())
    avg_crime_rate = float(data["Crime_Rate_per_100k"].mean())
    total_districts = int(data["District"].nunique())
    
    return {
        "total_cases": total_cases,
        "total_convictions": total_convictions,
        "avg_crime_rate": round(avg_crime_rate, 2) if not math.isnan(avg_crime_rate) else 0.00,
        "total_districts": total_districts
    }

@router.get("/trends")
async def get_trends(year: Optional[int] = None, state: Optional[str] = None, crime_type: Optional[str] = None):
    data = get_data()
    data = filter_data(data, year=None, state=state, crime_type=crime_type) # Always show full timeline regardless of year selected in slicer
    if data.empty:
        return []
        
    trends = data.groupby("Year")[["Cases_Reported", "Convictions"]].sum().reset_index()
    return trends.to_dict(orient="records")

@router.get("/distribution")
async def get_distribution(year: Optional[int] = None, state: Optional[str] = None, crime_type: Optional[str] = None):
    data = get_data()
    data = filter_data(data, year, state, crime_type)
    if data.empty:
        return []
        
    dist = data.groupby("Crime_Type")["Cases_Reported"].sum().reset_index()
    dist.columns = ["crime_type", "count"]
    dist = dist.sort_values("count", ascending=False)
    return dist.to_dict(orient="records")

@router.get("/geography")
async def get_geography(year: Optional[int] = None, state: Optional[str] = None, crime_type: Optional[str] = None):
    data = get_data()
    data = filter_data(data, year, state, crime_type)
    if data.empty:
        return []
        
    geo = data.groupby("State").agg({
        "Cases_Reported": "sum",
        "Convictions": "sum"
    }).reset_index()
    geo.columns = ["state", "total_cases", "total_convictions"]
    geo = geo.sort_values("total_cases", ascending=False)
    return geo.to_dict(orient="records")

@router.get("/forecast")
async def get_forecast(state: Optional[str] = None, crime_type: Optional[str] = None):
    data = get_data()
    data = filter_data(data, year=None, state=state, crime_type=crime_type)
    if data.empty:
        return []
        
    trends = data.groupby("Year")[["Cases_Reported", "Convictions"]].sum().reset_index()
    if len(trends) < 2:
        res = []
        for _, row in trends.iterrows():
            res.append({"Year": int(row["Year"]), "Cases_Reported": int(row["Cases_Reported"]), "Convictions": int(row["Convictions"]), "is_forecast": False})
        return res
        
    x = trends["Year"].values
    y_cases = trends["Cases_Reported"].values
    y_conv = trends["Convictions"].values
    
    cases_fit = np.poly1d(np.polyfit(x, y_cases, 1))
    conv_fit = np.poly1d(np.polyfit(x, y_conv, 1))
    
    future_years = [2024, 2025, 2026, 2027, 2028, 2029, 2030]
    forecast = []
    
    for _, row in trends.iterrows():
        forecast.append({
            "Year": int(row["Year"]),
            "Cases_Reported": int(row["Cases_Reported"]),
            "Convictions": int(row["Convictions"]),
            "is_forecast": False
        })
        
    for yr in future_years:
        pred_cases = int(cases_fit(yr))
        pred_conv = int(conv_fit(yr))
        forecast.append({
            "Year": yr,
            "Cases_Reported": max(0, pred_cases),
            "Convictions": max(0, pred_conv),
            "is_forecast": True
        })
        
    return forecast

@router.get("/risk")
async def get_risk(crime_type: Optional[str] = None):
    data = get_data()
    data = filter_data(data, year=None, state=None, crime_type=crime_type)
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
        
        pred_2024 = int(np.poly1d(coeffs)(2024))
        
        risks.append({
            "State": state,
            "surge_velocity": float(slope),
            "projected_cases": max(0, pred_2024)
        })
        
    risks = sorted(risks, key=lambda d: d["surge_velocity"], reverse=True)
    return risks[:5]
