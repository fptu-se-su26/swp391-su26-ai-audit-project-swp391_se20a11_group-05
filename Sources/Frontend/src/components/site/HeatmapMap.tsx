import React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface Hotspot {
  latitude: number;
  longitude: number;
  weight: number;
  status: string;
  categoryName: string;
}

interface HeatmapMapProps {
  hotspots: Hotspot[];
}

export function HeatmapMap({ hotspots }: HeatmapMapProps) {
  // Tọa độ trung tâm Quảng Nam - Đà Nẵng
  const center = [15.8, 108.3] as [number, number];

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer center={center} zoom={10} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=m&hl=vi&gl=VN&x={x}&y={y}&z={z}"
          attribution='&copy; Google Maps'
        />
        {hotspots.map((h, i) => {
          // Màu sắc theo độ nghiêm trọng
          const color = h.weight === 3 ? "red" : h.weight === 2 ? "orange" : "blue";
          return (
            <CircleMarker
              key={i}
              center={[h.latitude, h.longitude]}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.5,
                weight: 0,
              }}
              radius={h.weight * 10}
            >
              <Popup>
                <div className="text-sm">
                  <strong>Loại:</strong> {h.categoryName} <br/>
                  <strong>Trạng thái:</strong> {h.status}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
