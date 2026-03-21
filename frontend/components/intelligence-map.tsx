"use client";

import { useTheme } from "next-themes";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface GeographyData {
  state: string;
  total_cases: number;
  total_financial_loss: number;
}

// Map Indian Cities to Lat/Lng for visualization
const stateCoordinates: Record<string, [number, number]> = {
  "Bangalore": [12.9716, 77.5946],
  "Kolkata": [22.5726, 88.3639],
  "Ahmedabad": [23.0225, 72.5714],
  "Jaipur": [26.9124, 75.7873],
  "Mumbai": [19.0760, 72.8777],
  "Pune": [18.5204, 73.8567],
  "Lucknow": [26.8467, 80.9462],
  "Delhi": [28.7041, 77.1025],
  "Hyderabad": [17.3850, 78.4867],
  "Chennai": [13.0827, 80.2707],
};

export default function IntelligenceMap({ geography }: { geography: GeographyData[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const DEFAULT_CENTER: [number, number] = [22.5937, 78.9629];
  
  // Find max cases to normalize radius
  const maxCases = geography.length > 0 ? Math.max(...geography.map(g => g.total_cases)) : 1;

  const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={4}
      scrollWheelZoom={true}
      className="h-[400px] w-full rounded-xl z-0"
    >
      <TileLayer
        key={isDark ? "dark" : "light"}
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={isDark 
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        }
      />

      {geography.map((geo) => {
        const coords = stateCoordinates[geo.state];
        if (!coords) return null;
        
        // Calculate relative size (minimum 6, maximum 35)
        const radius = Math.max(6, Math.min(35, (geo.total_cases / maxCases) * 35));
        
        return (
          <CircleMarker
            key={geo.state}
            center={coords}
            radius={radius}
            pathOptions={{
              color: isDark ? "#06b6d4" : "#0284c7",
              fillColor: isDark ? "#06b6d4" : "#0284c7",
              fillOpacity: 0.6,
              weight: 2,
            }}
          >
            <Popup>
              <div className="p-2 min-w-[160px]">
                <strong className="text-sm border-b pb-1 font-bold mb-2 block text-slate-800">{geo.state}</strong>
                <div className="text-xs mt-2 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Total Cases:</span>
                    <span className="font-bold text-rose-500">{fmt(geo.total_cases)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-4 border-t pt-1 mt-1 border-slate-100 dark:border-slate-700">
                    <span className="text-slate-500 font-medium whitespace-nowrap">Financial Impact:</span>
                    <span className="font-bold text-rose-500">₹{fmt(geo.total_financial_loss)}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
