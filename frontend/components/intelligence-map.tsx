"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { mappls as MapplsSdk } from "mappls-web-maps";

interface GeographyData {
  state: string;
  total_cases: number;
  total_financial_loss: number;
}

type MapInstance = {
  on?: (eventName: string, callback: () => void) => void;
  addListener?: (eventName: string, callback: () => void) => void;
  remove?: () => void;
};

type MarkerInstance = {
  remove?: () => void;
};

type MapplsClient = {
  initialize: (
    token: string,
    loadObject: Record<string, unknown>,
    callback: () => void
  ) => void;
  Map: (options: {
    id: string;
    properties: Record<string, unknown>;
  }) => MapInstance;
  marker: (options: Record<string, unknown>) => MarkerInstance;
};

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

const INDIA_CENTER: [number, number] = [22.5937, 78.9629];
const MAP_CONTAINER_ID = "intelligence-mappls-map";

export default function IntelligenceMap({ geography }: { geography: GeographyData[] }) {
  const mapplsClientRef = useRef<MapplsClient | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const markersRef = useRef<MarkerInstance[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const mapplsApiKey =
    process.env.NEXT_PUBLIC_MAPPLS_MAP_KEY ||
    process.env.NEXT_PUBLIC_MAPMYINDIA_MAP_KEY ||
    process.env.NEXT_PUBLIC_MAPPLS_STATIC_KEY ||
    process.env.NEXT_PUBLIC_MAPMYINDIA_STATIC_KEY ||
    "";

  const maxCases = useMemo(
    () =>
      geography.length > 0
        ? Math.max(...geography.map((point) => point.total_cases))
        : 1,
    [geography]
  );

  const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapplsApiKey) {
        setMapError(
          "Map is unavailable. Add NEXT_PUBLIC_MAPPLS_STATIC_KEY (or NEXT_PUBLIC_MAPMYINDIA_STATIC_KEY) to frontend environment variables."
        );
        return;
      }

      try {
        const mapplsClient = new MapplsSdk() as unknown as MapplsClient;
        mapplsClientRef.current = mapplsClient;

        const loadObject = {
          map: true,
          layer: "vector",
          version: "3.0",
        };

        // initialize() loads required map scripts from Mappls endpoints using the API key.
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Mappls initialization timeout"));
          }, 10000);

          try {
            mapplsClient.initialize(mapplsApiKey, loadObject, () => {
              clearTimeout(timeout);
              resolve();
            });
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        });

        if (cancelled) {
          return;
        }

        const mapObject = mapplsClient.Map({
          id: MAP_CONTAINER_ID,
          properties: {
            center: INDIA_CENTER,
            zoom: 4,
            geolocation: false,
            zoomControl: true,
            clickableIcons: true,
          },
        });

        mapRef.current = mapObject;

        const onLoad = () => {
          if (!cancelled) {
            setMapReady(true);
            setMapError(null);
          }
        };

        if (typeof mapObject.on === "function") {
          mapObject.on("load", onLoad);
        } else if (typeof mapObject.addListener === "function") {
          mapObject.addListener("load", onLoad);
        } else {
          onLoad();
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        setMapError(
          `Unable to initialize Mappls map: ${errorMsg}`
        );
      }
    }

    void initMap();

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove?.());
      markersRef.current = [];
      mapRef.current?.remove?.();
      mapRef.current = null;
      mapplsClientRef.current = null;
      setMapReady(false);
    };
  }, [mapplsApiKey]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return;
    }

    const mapplsClient = mapplsClientRef.current;
    if (!mapplsClient) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove?.());
    markersRef.current = [];

    geography.forEach((geo) => {
      const coords = stateCoordinates[geo.state];
      if (!coords) {
        return;
      }

      const markerScale = Math.max(
        14,
        Math.min(36, (geo.total_cases / maxCases) * 36)
      );

      const popupHtml = `
        <div style="min-width:170px;padding:8px 10px;font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
          <div style="font-weight:700;font-size:13px;margin-bottom:8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">${geo.state}</div>
          <div style="font-size:12px;display:flex;justify-content:space-between;gap:12px;margin-bottom:6px;">
            <span style="color:#64748b;">Total Cases</span>
            <span style="font-weight:700;color:#e11d48;">${fmt(geo.total_cases)}</span>
          </div>
          <div style="font-size:12px;display:flex;justify-content:space-between;gap:12px;">
            <span style="color:#64748b;">Financial Impact</span>
            <span style="font-weight:700;color:#e11d48;">INR ${fmt(geo.total_financial_loss)}</span>
          </div>
        </div>
      `;

      try {
        const marker = mapplsClient.marker({
          map: mapRef.current,
          position: { lat: coords[0], lng: coords[1] },
          popupHtml,
          width: markerScale,
          height: markerScale,
        });
        if (marker) {
          markersRef.current.push(marker);
        }
      } catch (error) {
        console.error("Failed to create Mappls marker", error);
      }
    });
  }, [geography, mapReady, maxCases]);

  if (mapError) {
    return (
      <div className="h-[400px] w-full rounded-xl border border-rose-300/40 bg-rose-50/60 dark:bg-rose-950/20 dark:border-rose-700/40 text-rose-700 dark:text-rose-300 flex items-center justify-center px-4 text-sm text-center">
        {mapError}
      </div>
    );
  }

  return (
    <div className="relative h-[400px] w-full rounded-xl overflow-hidden z-0">
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-300 text-sm z-10">
          Loading Mappls Intelligence Map...
        </div>
      )}
      <div id={MAP_CONTAINER_ID} className="h-full w-full" />
    </div>
  );
}
