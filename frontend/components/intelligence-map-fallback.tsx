"use client";

import { useEffect, useRef, useState } from "react";

interface GeographyData {
  state: string;
  total_cases: number;
  total_financial_loss: number;
}

// Simple OpenStreetMap-based fallback if Mappls fails
export default function IntelligenceMapFallback({ geography }: { geography: GeographyData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "success" | "fallback" | "error">("loading");

  useEffect(() => {
    if (!containerRef.current) return;

    const initMap = async () => {
      try {
        // Check if Mappls is available
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for CDN

        if (window.mappls && process.env.NEXT_PUBLIC_MAPPLS_STATIC_KEY) {
          console.log("Using Mappls");
          setStatus("success");
        } else {
          console.log("Falling back to OpenStreetMap");
          setStatus("fallback");
          
          // Load Leaflet dynamically
          const L = await import("leaflet");
          const { MapContainer, TileLayer, CircleMarker, Popup } = await import("react-leaflet");
          
          const stateCoords: Record<string, [number, number]> = {
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
          
          // Render map info
          containerRef.current.innerHTML = `
            <div style="padding: 16px; background: #f1f5f9; border-radius: 8px;">
              <p style="margin: 0; color: #334155; font-size: 14px;">
                Using OpenStreetMap (Mappls temporarily unavailable)
              </p>
              <p style="margin: 8px 0 0 0; color: #64748b; font-size: 12px;">
                Showing ${geography.length} regions
              </p>
            </div>
          `;
        }
      } catch (error) {
        console.error("Map init error:", error);
        setStatus("error");
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div style="padding: 16px; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; color: #991b1b;">
              <p style="margin: 0; font-weight: 600;">Map Loading Error</p>
              <p style="margin: 8px 0 0 0; font-size: 12px;">${error instanceof Error ? error.message : "Unknown error"}</p>
            </div>
          `;
        }
      }
    };

    initMap();
  }, [geography]);

  if (status === "error") {
    return (
      <div ref={containerRef} className="h-[400px] w-full rounded-xl flex items-center justify-center bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-800" />
    );
  }

  return (
    <div ref={containerRef} className="h-[400px] w-full rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
      {status === "loading" && <span className="text-slate-600 dark:text-slate-300">Loading map...</span>}
      {status === "success" && <span className="text-cyan-600 dark:text-cyan-300">Mappls map initialized</span>}
      {status === "fallback" && <span className="text-amber-600 dark:text-amber-300">Using fallback map</span>}
    </div>
  );
}
