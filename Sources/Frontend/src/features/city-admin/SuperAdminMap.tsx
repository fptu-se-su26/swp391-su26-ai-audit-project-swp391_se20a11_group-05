import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search } from "lucide-react";
import geoData from "@/assets/danang-wards.json";
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

const NEUTRAL_COLOR = "#94A3B8"; // Zero / no data
const getHotspotColor = (unresolved: number) => {
  if (unresolved >= 15) return "#EF4444"; // Critical / High (Red)
  if (unresolved >= 5) return "#F97316"; // Medium (Orange)
  if (unresolved > 0) return "#FCD34D"; // Low (Yellow)
  return NEUTRAL_COLOR; // Zero / Neutral (Gray)
};

// The hotspot list is bucketed at the (old) district level ("Hải Châu",
// "Thanh Khê"...) while the ward-boundary GeoJSON is at the finer
// commune/"xã" level after the 2025 administrative merger — so a commune
// is matched to a hotspot district by substring, same fuzzy approach
// OverviewPage already uses when bucketing feedbacks into DEFAULT_WARDS.
function findHotspotForWard(wardName: string, hotspots: WardHotspot[]): WardHotspot | undefined {
  const n = wardName.trim().toLowerCase();
  return hotspots.find(
    (h) => n.includes(h.name.toLowerCase()) || h.name.toLowerCase().includes(n),
  );
}

export function SuperAdminMap({ hotspots, onSelectWard, selectedWard }: Props) {
  const center: [number, number] = [16.0544, 108.2022];
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [leafletComponents, setLeafletComponents] = useState<{
    MapContainer: any;
    TileLayer: any;
    GeoJSON: any;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("react-leaflet").then((mod) => {
      if (!cancelled) {
        setLeafletComponents({
          MapContainer: mod.MapContainer,
          TileLayer: mod.TileLayer,
          GeoJSON: mod.GeoJSON,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const mapRef = useRef<any>(null);
  const geoJsonRef = useRef<any>(null);
  const layersMapRef = useRef(new Map<string, any>());

  const geoJsonKey = useMemo(
    () => JSON.stringify(hotspots.map((h) => h.name + h.unresolved)),
    [hotspots],
  );

  useEffect(() => {
    if (selectedWard && mapRef.current) {
      const layer = layersMapRef.current.get(selectedWard);
      if (layer) {
        const bounds = layer.getBounds();
        mapRef.current.flyToBounds(bounds, { duration: 1, padding: [50, 50] });
        geoJsonRef.current?.resetStyle();
        layer.setStyle({ weight: 4, color: "#0B4FC4", dashArray: "", fillOpacity: 0.85 });
        layer.bringToFront();
      }
    } else if (!selectedWard && geoJsonRef.current) {
      geoJsonRef.current.resetStyle();
    }
  }, [selectedWard]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    const allGeoWards = (geoData as any).features
      .map((f: any) => f.properties?.ten_xa)
      .filter(Boolean) as string[];
    const uniqueWards = Array.from(new Set(allGeoWards));
    return uniqueWards.filter((w) => w.toLowerCase().includes(term)).slice(0, 8);
  }, [searchTerm]);

  const handleSelectSearchResult = (wardName: string) => {
    setSearchTerm(wardName);
    setIsSearchFocused(false);
    const hotspot = findHotspotForWard(wardName, hotspots);
    onSelectWard(hotspot ? hotspot.name : wardName);
  };

  if (!leafletComponents) {
    return (
      <div className="w-full h-full min-h-[360px] bg-slate-50 flex items-center justify-center rounded-xl border border-slate-100 shadow-sm">
        <span className="text-slate-400 text-sm">Đang tải bản đồ...</span>
      </div>
    );
  }

  const { MapContainer, TileLayer, GeoJSON } = leafletComponents;

  const styleFeature = (feature: any) => {
    const wardName = feature.properties?.ten_xa;
    let fillColor = NEUTRAL_COLOR;
    if (wardName) {
      const hotspot = findHotspotForWard(wardName, hotspots);
      if (hotspot) fillColor = getHotspotColor(hotspot.unresolved);
    }
    return {
      fillColor,
      weight: 1.5,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.75,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const wardName = feature.properties?.ten_xa;
    if (!wardName) return;

    const hotspot = findHotspotForWard(wardName, hotspots);
    if (hotspot) {
      layersMapRef.current.set(hotspot.name, layer);
    }

    const popupContent = hotspot
      ? `<div class="font-sans text-xs min-w-[180px]">
           <div class="font-bold text-sm text-[#0B4FC4] border-b border-slate-100 pb-1.5 mb-2">Khu vực: ${hotspot.name}</div>
           <div class="space-y-1 font-medium">
             <div class="flex justify-between"><span class="text-slate-500">Tổng phản ánh:</span><span class="font-bold">${hotspot.total}</span></div>
             <div class="flex justify-between"><span class="text-slate-500">Chưa xử lý:</span><span class="font-bold text-orange-600">${hotspot.unresolved}</span></div>
             <div class="flex justify-between"><span class="text-slate-500">Quá hạn:</span><span class="font-bold text-red-600">${hotspot.overdue}</span></div>
             <div class="flex justify-between"><span class="text-slate-500">Tỷ lệ chưa xử lý:</span><span class="font-bold">${hotspot.unresolvedPct.toFixed(1)}%</span></div>
             ${hotspot.topCategory ? `<div class="border-t border-slate-100 pt-1 mt-1"><span class="text-slate-500 block">Lĩnh vực chính:</span><span class="font-bold">${hotspot.topCategory}</span></div>` : ""}
           </div>
         </div>`
      : `<div class="font-sans"><div class="font-bold text-[#0B4FC4]">${wardName}</div><div class="text-xs text-slate-500 mt-1">Chưa có dữ liệu phản ánh</div></div>`;
    layer.bindPopup(popupContent);

    layer.on({
      click: () => {
        onSelectWard(hotspot ? hotspot.name : wardName);
      },
      mouseover: (e: any) => {
        e.target.setStyle({ weight: 3, color: "#f59e0b", dashArray: "", fillOpacity: 0.9 });
        e.target.bringToFront();
      },
      mouseout: (e: any) => {
        geoJsonRef.current?.resetStyle(e.target);
        if (hotspot && selectedWard === hotspot.name) {
          e.target.setStyle({ weight: 4, color: "#0B4FC4", dashArray: "", fillOpacity: 0.85 });
          e.target.bringToFront();
        }
      },
    });
  };

  return (
    <div className="relative w-full h-full min-h-[360px] rounded-xl overflow-hidden">
      {/* Thanh tìm kiếm */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-sm px-4">
        <div className="relative bg-white rounded-full shadow-lg flex items-center px-4 py-2 border border-slate-200">
          <Search className="w-5 h-5 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Tìm kiếm phường/xã..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsSearchFocused(true);
            }}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
          />
          {searchTerm && (
            <button
              className="text-slate-400 hover:text-slate-600 ml-2"
              onClick={() => {
                setSearchTerm("");
                if (selectedWard) onSelectWard(selectedWard);
              }}
            >
              ✕
            </button>
          )}
        </div>

        {isSearchFocused && searchResults.length > 0 && (
          <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[1001]">
            {searchResults.map((w, idx) => (
              <button
                key={idx}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                onMouseDown={() => handleSelectSearchResult(w)}
              >
                {w}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full h-full relative z-0">
        <MapContainer
          center={center}
          zoom={11}
          className="w-full h-full"
          zoomControl={true}
          attributionControl={false}
          scrollWheelZoom={true}
          ref={mapRef}
        >
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=s&hl=vi&gl=VN&x={x}&y={y}&z={z}"
            attribution="&copy; Google Maps"
          />

          <GeoJSON
            key={geoJsonKey}
            ref={geoJsonRef}
            data={geoData as any}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />

          <TileLayer url="https://mt1.google.com/vt/lyrs=h&hl=vi&gl=VN&x={x}&y={y}&z={z}" />
        </MapContainer>
      </div>
    </div>
  );
}
