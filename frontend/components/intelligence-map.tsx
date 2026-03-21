"use client";

import { useTheme } from "next-themes";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface GeographyData {
  state: string;
  total_cases: number;
  total_convictions: number;
}

// Map Indian States to Lat/Lng for visualization
const stateCoordinates: Record<string, [number, number]> = {
  "Andhra Pradesh": [15.9129, 79.74],
  "Arunachal Pradesh": [28.218, 94.7278],
  "Assam": [26.2006, 92.9376],
  "Bihar": [25.0961, 85.3131],
  "Chhattisgarh": [25.0961, 81.3131], // approx
  "Delhi": [28.7041, 77.1025],
  "Goa": [15.2993, 74.124],
  "Gujarat": [22.2587, 71.1924],
  "Haryana": [29.0588, 76.0856],
  "Himachal Pradesh": [31.1048, 77.1615],
  "Jharkhand": [21.2787, 81.8661],
  "Karnataka": [15.3173, 75.7139],
  "Kerala": [10.8505, 76.2711],
  "Madhya Pradesh": [22.9734, 78.6569],
  "Maharashtra": [19.7515, 75.7139],
  "Manipur": [28.0289, 94.1332],
  "Meghalaya": [25.467, 91.3662],
  "Mizoram": [23.1645, 92.9376],
  "Nagaland": [24.6637, 93.9063],
  "Odisha": [20.9517, 85.0985],
  "Punjab": [29.0588, 75.9221],
  "Rajasthan": [27.0238, 74.2179],
  "Sikkim": [27.533, 88.5122],
  "Tamil Nadu": [11.1271, 78.6569],
  "Telangana": [18.1124, 79.0193],
  "Tripura": [23.9408, 91.9882],
  "Uttar Pradesh": [26.8467, 80.9462],
  "Uttarakhand": [31.1048, 79.1615],
  "West Bengal": [20.9517, 87.0985],
  // Add fallback cases
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
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Convictions:</span>
                    <span className="font-bold text-emerald-500">{fmt(geo.total_convictions)}</span>
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
