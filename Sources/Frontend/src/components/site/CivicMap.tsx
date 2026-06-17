import { useState, useEffect } from "react";
import L from "leaflet";

interface MapMarker {
  position: [number, number];
  title: string;
  description?: string;
  status?: "pending" | "inProgress" | "resolved" | "urgent";
}

interface Props {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  height?: string;
  interactive?: boolean;
  showBoundary?: boolean;
  boundaryRadius?: number;
}

// Custom Leaflet marker generator
function getMarkerIcon(status?: string) {
  if (typeof window === "undefined" || !L) return null;
  const colorMap: Record<string, string> = {
    pending: "#f97316",    // Orange
    inProgress: "#3b82f6", // Blue
    resolved: "#22c55e",   // Green
    urgent: "#ef4444",     // Red
  };
  const color = colorMap[status || "pending"] || "#3b82f6";
  
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50% 50% 50% 0;
          background: ${color};
          border: 2.5px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25);
          transform: rotate(-45deg);
        "></div>
        <div style="
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ffffff;
          z-index: 10;
        "></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
}

export function CivicMap({
  center = [15.8, 108.3],
  zoom = 10,
  markers = [],
  height = "h-72 md:h-96",
  interactive = true,
  showBoundary = false,
  boundaryRadius = 500,
}: Props) {
  // Dynamic import: Leaflet requires `window` at module-load time,
  // so we lazy-load react-leaflet only on the client.
  const [leafletComponents, setLeafletComponents] = useState<{
    MapContainer: any;
    TileLayer: any;
    Marker: any;
    Popup: any;
    Circle: any;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("react-leaflet").then((mod) => {
      if (!cancelled) {
        setLeafletComponents({
          MapContainer: mod.MapContainer,
          TileLayer: mod.TileLayer,
          Marker: mod.Marker,
          Popup: mod.Popup,
          Circle: mod.Circle,
        });
      }
    });
    return () => { cancelled = true; };
  }, []);

  if (!leafletComponents) {
    return (
      <div
        className="rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 flex items-center justify-center"
        style={{ height }}
      >
        <span className="text-slate-400 text-sm">Đang tải bản đồ...</span>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Circle } = leafletComponents;

  return (
    <div
      className="rounded-xl overflow-hidden border border-slate-100 shadow-sm"
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        zoomControl={interactive}
        dragging={interactive}
        scrollWheelZoom={interactive}
      >
        <TileLayer
          attribution="&copy; Google Maps"
          url="https://mt1.google.com/vt/lyrs=m&hl=vi&gl=VN&x={x}&y={y}&z={z}"
        />
        {showBoundary && (
          <Circle
            center={center}
            radius={boundaryRadius}
            pathOptions={{
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.08,
              weight: 2,
              dashArray: "6, 6",
            }}
          />
        )}
        {markers.map((m, i) => {
          const icon = getMarkerIcon(m.status);
          return (
            <Marker key={i} position={m.position} icon={icon || undefined}>
              <Popup>
                <div className="p-1 max-w-[200px]">
                  <strong className="text-slate-800 text-sm font-bold block">{m.title}</strong>
                  {m.description && <p className="text-slate-600 text-xs mt-1 leading-relaxed">{m.description}</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export type { MapMarker };
