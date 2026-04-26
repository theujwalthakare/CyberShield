"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface GeographyData {
  state: string;
  total_cases: number;
  total_financial_loss: number;
}

// City → lat/lng mapping for Indian cities in intelligence_reports
const CITY_COORDS: Record<string, [number, number]> = {
  "Bangalore":  [12.9716,  77.5946],
  "Kolkata":    [22.5726,  88.3639],
  "Ahmedabad":  [23.0225,  72.5714],
  "Jaipur":     [26.9124,  75.7873],
  "Mumbai":     [19.0760,  72.8777],
  "Pune":       [18.5204,  73.8567],
  "Lucknow":    [26.8467,  80.9462],
  "Delhi":      [28.7041,  77.1025],
  "Hyderabad":  [17.3850,  78.4867],
  "Chennai":    [13.0827,  80.2707],
  "Surat":      [21.1702,  72.8311],
  "Patna":      [25.5941,  85.1376],
  "Bhopal":     [23.2599,  77.4126],
  "Indore":     [22.7196,  75.8577],
  "Nagpur":     [21.1458,  79.0882],
  "Chandigarh": [30.7333,  76.7794],
  "Kochi":      [9.9312,   76.2673],
  "Visakhapatnam": [17.6868, 83.2185],
  "Coimbatore": [11.0168,  76.9558],
  "Bhubaneswar":[20.2961,  85.8245],
};

const INDIA_CENTER: [number, number] = [22.5937, 78.9629];

const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);
const fmtCurr = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
};

// Colour scale: green → yellow → red based on intensity 0–1
function heatColor(intensity: number): string {
  if (intensity > 0.75) return "#ef4444"; // red
  if (intensity > 0.5)  return "#f97316"; // orange
  if (intensity > 0.25) return "#eab308"; // yellow
  return "#22c55e";                        // green
}

// Fly-to-India control
function ResetView() {
  const map = useMap();
  useEffect(() => {
    const ctrl = L.control({ position: "bottomright" });
    ctrl.onAdd = () => {
      const btn = L.DomUtil.create("button");
      btn.title = "Reset view";
      btn.innerHTML = "🗺️";
      btn.style.cssText =
        "background:#fff;border:2px solid #ccc;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:16px;box-shadow:0 1px 5px rgba(0,0,0,.3)";
      L.DomEvent.disableClickPropagation(btn);
      btn.onclick = () => map.flyTo(INDIA_CENTER, 5, { duration: 1 });
      return btn;
    };
    ctrl.addTo(map);
    return () => { ctrl.remove(); };
  }, [map]);
  return null;
}

// Layer switcher: OSM ↔ Satellite
function LayerSwitcher() {
  const map = useMap();
  const [satellite, setSatellite] = useState(false);
  const osmRef   = useRef<L.TileLayer | null>(null);
  const satRef   = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    osmRef.current = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { attribution: "© OpenStreetMap contributors", maxZoom: 19 }
    ).addTo(map);

    satRef.current = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "© Esri", maxZoom: 19 }
    );

    return () => {
      osmRef.current?.remove();
      satRef.current?.remove();
    };
  }, [map]);

  const toggle = useCallback(() => {
    setSatellite(prev => {
      if (!prev) {
        osmRef.current?.remove();
        satRef.current?.addTo(map);
      } else {
        satRef.current?.remove();
        osmRef.current?.addTo(map);
      }
      return !prev;
    });
  }, [map]);

  useEffect(() => {
    const ctrl = L.control({ position: "topright" });
    ctrl.onAdd = () => {
      const btn = L.DomUtil.create("button");
      btn.innerHTML = satellite ? "🗺️ Street" : "🛰️ Satellite";
      btn.style.cssText =
        "background:#fff;border:2px solid #ccc;border-radius:4px;padding:6px 10px;cursor:pointer;font-size:12px;font-weight:600;box-shadow:0 1px 5px rgba(0,0,0,.3)";
      L.DomEvent.disableClickPropagation(btn);
      btn.onclick = toggle;
      return btn;
    };
    ctrl.addTo(map);
    return () => { ctrl.remove(); };
  }, [map, satellite, toggle]);

  return null;
}

// Click-to-locate
function LocateControl() {
  const map = useMap();
  useEffect(() => {
    const ctrl = L.control({ position: "topright" });
    ctrl.onAdd = () => {
      const btn = L.DomUtil.create("button");
      btn.innerHTML = "📍";
      btn.title = "My location";
      btn.style.cssText =
        "background:#fff;border:2px solid #ccc;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:16px;box-shadow:0 1px 5px rgba(0,0,0,.3);margin-top:4px;display:block";
      L.DomEvent.disableClickPropagation(btn);
      btn.onclick = () => map.locate({ setView: true, maxZoom: 12 });
      return btn;
    };
    ctrl.addTo(map);
    return () => { ctrl.remove(); };
  }, [map]);
  return null;
}

// Legend
function Legend({ max }: { max: number }) {
  const map = useMap();
  useEffect(() => {
    const ctrl = L.control({ position: "bottomleft" });
    ctrl.onAdd = () => {
      const div = L.DomUtil.create("div");
      div.style.cssText =
        "background:rgba(255,255,255,0.92);padding:8px 12px;border-radius:6px;font-size:11px;box-shadow:0 1px 5px rgba(0,0,0,.3);line-height:1.8";
      div.innerHTML = `
        <strong style="display:block;margin-bottom:4px;font-size:12px">Incident Density</strong>
        <span style="color:#22c55e">●</span> Low &nbsp;
        <span style="color:#eab308">●</span> Medium &nbsp;
        <span style="color:#f97316">●</span> High &nbsp;
        <span style="color:#ef4444">●</span> Critical
        <div style="margin-top:4px;color:#64748b">Max: ${fmt(max)} cases</div>
      `;
      return div;
    };
    ctrl.addTo(map);
    return () => { ctrl.remove(); };
  }, [map, max]);
  return null;
}

export default function IntelligenceMap({ geography }: { geography: GeographyData[] }) {
  const maxCases = useMemo(
    () => geography.length > 0 ? Math.max(...geography.map(g => g.total_cases)) : 1,
    [geography]
  );

  const points = useMemo(() =>
    geography
      .map(geo => ({ geo, coords: CITY_COORDS[geo.state] }))
      .filter((p): p is { geo: GeographyData; coords: [number, number] } => !!p.coords),
    [geography]
  );

  return (
    <div className="relative h-[450px] w-full rounded-xl overflow-hidden z-0">
      <MapContainer
        center={INDIA_CENTER}
        zoom={5}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        {/* Base tile layer rendered via LayerSwitcher */}
        <LayerSwitcher />
        <LocateControl />
        <ResetView />
        <Legend max={maxCases} />

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={60}
          showCoverageOnHover={false}
        >
          {points.map(({ geo, coords }) => {
            const intensity = geo.total_cases / maxCases;
            const radius = Math.max(10, Math.min(40, intensity * 40));
            const color = heatColor(intensity);

            return (
              <CircleMarker
                key={geo.state}
                center={coords}
                radius={radius}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.65,
                  weight: 2,
                }}
              >
                <Popup minWidth={200}>
                  <div style={{ fontFamily: "ui-sans-serif,system-ui,sans-serif", padding: "4px" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, borderBottom: "1px solid #e2e8f0", paddingBottom: 6, marginBottom: 8 }}>
                      📍 {geo.state}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                      <span style={{ color: "#64748b" }}>Total Incidents</span>
                      <strong style={{ color: "#ef4444" }}>{fmt(geo.total_cases)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#64748b" }}>Financial Loss</span>
                      <strong style={{ color: "#ef4444" }}>{fmtCurr(geo.total_financial_loss)}</strong>
                    </div>
                    <div style={{ marginTop: 8, background: "#f1f5f9", borderRadius: 4, padding: "4px 8px", fontSize: 11, color: "#475569" }}>
                      Intensity: {(intensity * 100).toFixed(1)}% of peak
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
