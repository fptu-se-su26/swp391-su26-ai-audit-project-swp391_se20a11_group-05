import { useState, useEffect } from "react";
import type { LatLngExpression } from "leaflet";

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
}

// Marker color mapping
const markerColors: Record<string, string> = {
  pending: "orange",
  inProgress: "blue",
  resolved: "green",
  urgent: "red",
};

export function CivicMap({
  center = [15.8, 108.3],
  zoom = 10,
  markers = [],
  height = "h-72 md:h-96",
  interactive = true,
}: Props) {
  // Dynamic import: Leaflet requires `window` at module-load time,
  // so we lazy-load react-leaflet only on the client.
  const [leafletComponents, setLeafletComponents] = useState<{
    MapContainer: any;
    TileLayer: any;
    Marker: any;
    Popup: any;
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

  const { MapContainer, TileLayer, Marker, Popup } = leafletComponents;

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
        {markers.map((m, i) => (
          <Marker key={i} position={m.position}>
            <Popup>
              <strong>{m.title}</strong>
              {m.description && <p className="text-sm mt-1">{m.description}</p>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export type { MapMarker };
