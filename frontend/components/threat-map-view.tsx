"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface RiskArea {
  area_code: string;
  score: number;
  risk_level: string;
}

// Simple lat/lng mapping for demo - in production, geocode from area_code
const areaCoords: Record<string, [number, number]> = {
  "ZONE-MH": [19.076, 72.8777],
  "ZONE-DL": [28.6139, 77.209],
  "ZONE-KA": [12.9716, 77.5946],
  "ZONE-TN": [13.0827, 80.2707],
  "ZONE-UP": [26.8467, 80.9462],
  "ZONE-GJ": [23.0225, 72.5714],
  "ZONE-WB": [22.5726, 88.3639],
  "ZONE-RJ": [26.9124, 75.7873],
  "ZONE-KL": [10.8505, 76.2711],
  "ZONE-TG": [17.385, 78.4867],
};

// Default center: India
const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];

function riskColor(level: string) {
  switch (level) {
    case "critical":
      return "#ef4444";
    case "high":
      return "#f97316";
    case "medium":
      return "#eab308";
    case "low":
      return "#22c55e";
    default:
      return "#6366f1";
  }
}

export default function ThreatMapView({ areas }: { areas: RiskArea[] }) {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={5}
      scrollWheelZoom
      className="h-[450px] w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {areas.map((area) => {
        const coords = areaCoords[area.area_code];
        if (!coords) return null;
        return (
          <CircleMarker
            key={area.area_code}
            center={coords}
            radius={Math.max(8, area.score / 5)}
            pathOptions={{
              color: riskColor(area.risk_level),
              fillColor: riskColor(area.risk_level),
              fillOpacity: 0.6,
            }}
          >
            <Popup>
              <strong>{area.area_code}</strong>
              <br />
              Score: {area.score}
              <br />
              Risk: {area.risk_level}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
