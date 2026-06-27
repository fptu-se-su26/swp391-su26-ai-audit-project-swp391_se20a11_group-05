import React, { useState, useEffect, useRef } from "react";
import { Layers } from "lucide-react";
import "leaflet/dist/leaflet.css";

export interface WardHotspot {
  name: string;
  lat: number;
  lng: number;
  total: number;
  unresolved: number;
  overdue: number;
  unresolvedPct: number;
  topCategory: string;
}

interface Props {
  hotspots: WardHotspot[];
  onSelectWard: (wardName: string) => void;
  selectedWard?: string;
}

const getHotspotColor = (unresolved: number) => {
  if (unresolved >= 15) return "#EF4444"; // Critical / High (Red)
  if (unresolved >= 5) return "#F97316"; // Medium (Orange)
  if (unresolved > 0) return "#FCD34D"; // Low (Yellow)
  return "#94A3B8"; // Zero / Neutral (Gray)
};

export function SuperAdminMap({ hotspots, onSelectWard, selectedWard }: Props) {
  const center: [number, number] = [16.0544, 108.2022];
  const [mapLayerType, setMapLayerType] = useState<"osm" | "satellite">("osm");
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsLayersOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const [leafletComponents, setLeafletComponents] = useState<{
    MapContainer: any;
    TileLayer: any;
    CircleMarker: any;
    Popup: any;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("react-leaflet").then((mod) => {
      if (!cancelled) {
        setLeafletComponents({
          MapContainer: mod.MapContainer,
          TileLayer: mod.TileLayer,
          CircleMarker: mod.CircleMarker,
          Popup: mod.Popup,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!leafletComponents) {
    return (
      <div className="w-full h-full min-h-[360px] bg-slate-50 flex items-center justify-center rounded-xl border border-slate-100 shadow-sm">
        <span className="text-slate-400 text-sm">Đang tải bản đồ...</span>
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Popup } = leafletComponents;

  return (
    <div className="w-full h-full min-h-[360px] relative z-0">
      {/* Nút bật/tắt Layer */}
      <div className="absolute top-4 right-4 z-[1000]">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsLayersOpen(!isLayersOpen)}
            className="flex items-center justify-center w-10 h-10 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-md transition-all text-slate-700"
            title="Lớp bản đồ"
          >
            <Layers size={18} />
          </button>
          {isLayersOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-[1100] text-left">
              <button
                type="button"
                onClick={() => {
                  setMapLayerType("osm");
                  setIsLayersOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs transition ${
                  mapLayerType === "osm"
                    ? "bg-blue-50 text-[#0B4FC4] font-extrabold"
                    : "text-slate-700 hover:bg-slate-50 font-semibold"
                }`}
              >
                🗺️ Bản đồ (Google)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMapLayerType("satellite");
                  setIsLayersOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs transition ${
                  mapLayerType === "satellite"
                    ? "bg-blue-50 text-[#0B4FC4] font-extrabold"
                    : "text-slate-700 hover:bg-slate-50 font-semibold"
                }`}
              >
                🛰️ Vệ tinh
              </button>
            </div>
          )}
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={12}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution="&copy; Google Maps"
          url={
            mapLayerType === "osm"
              ? "https://mt1.google.com/vt/lyrs=m&hl=vi&gl=VN&x={x}&y={y}&z={z}"
              : "https://mt1.google.com/vt/lyrs=y&hl=vi&gl=VN&x={x}&y={y}&z={z}"
          }
        />
        {hotspots.map((h) => {
          const color = getHotspotColor(h.unresolved);
          const isSelected = selectedWard === h.name;
          const radius = 14 + Math.min(20, h.unresolved * 1.5);

          return (
            <CircleMarker
              key={h.name}
              center={[h.lat, h.lng]}
              pathOptions={{
                color: isSelected ? "#0B4FC4" : color,
                fillColor: color,
                fillOpacity: 0.65,
                weight: isSelected ? 3 : 1.5,
              }}
              radius={radius}
              eventHandlers={{
                click: () => {
                  onSelectWard(h.name);
                },
              }}
            >
              <Popup>
                <div className="text-slate-800 p-1 font-sans text-xs min-w-[180px]">
                  <h4 className="font-bold text-sm text-[#0B4FC4] border-b border-slate-100 pb-1.5 mb-2">
                    Khu vực: {h.name}
                  </h4>
                  <div className="space-y-1.5 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tổng phản ánh:</span>
                      <span className="font-bold text-slate-800">{h.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Chưa xử lý:</span>
                      <span className="font-bold text-orange-600">{h.unresolved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Quá hạn:</span>
                      <span className="font-bold text-red-600">{h.overdue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tỷ lệ chưa xử lý:</span>
                      <span className="font-bold text-slate-800">
                        {h.unresolvedPct.toFixed(1)}%
                      </span>
                    </div>
                    {h.topCategory && (
                      <div className="border-t border-slate-100 pt-1.5 mt-1">
                        <span className="text-slate-500 block mb-0.5">Lĩnh vực chính:</span>
                        <span className="font-bold text-slate-800">{h.topCategory}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onSelectWard(h.name)}
                    className="w-full mt-2.5 py-1 bg-blue-50 text-[#0B4FC4] hover:bg-[#0B4FC4] hover:text-white rounded font-bold transition text-center cursor-pointer border border-blue-200"
                  >
                    Lọc theo khu vực
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
