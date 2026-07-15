import React, { useState, useEffect, useMemo, useRef } from "react";
import { scaleLinear } from "d3-scale";
import { WardRankingEntry } from "@/lib/api";
import geoData from "@/assets/danang-wards.json";
import "leaflet/dist/leaflet.css";
import { Search } from "lucide-react";

interface MapProps {
  data: WardRankingEntry[];
  onWardClick: (wardId: number) => void;
  metric?: "overallScore" | "speedScore" | "lowIncidenceScore" | "satisfactionScore";
}

export function WardChoroplethMap({ data, onWardClick, metric = "overallScore" }: MapProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeWardId, setActiveWardId] = useState<number | null>(null);

  // Color scale
  const colorScale = scaleLinear<string>()
    .domain([0, 50, 100])
    .range(["#ef4444", "#f59e0b", "#10b981"]);

  const wardDataMap = useMemo(() => {
    const map = new Map<string, WardRankingEntry>();
    data.forEach((w) => map.set(w.wardName.trim().toLowerCase(), w));
    return map;
  }, [data]);

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

  // Refs for map and layers
  const mapRef = useRef<any>(null);
  const geoJsonRef = useRef<any>(null);
  const layersMapRef = useRef(new Map<number, any>());

  // Force remount when data changes
  const geoJsonKey = useMemo(() => JSON.stringify(data.map(d => d.wardId + d.currentScore)), [data]);

  useEffect(() => {
    if (activeWardId && mapRef.current) {
      const layer = layersMapRef.current.get(activeWardId);
      if (layer) {
        const bounds = layer.getBounds();
        mapRef.current.flyToBounds(bounds, { duration: 1, padding: [50, 50] });
        
        // Highlight logic
        geoJsonRef.current?.resetStyle(); // Reset all styles first
        layer.setStyle({
          weight: 4,
          color: "#3b82f6", // Blue outline for searched ward
          dashArray: "",
          fillOpacity: 0.9
        });
        layer.bringToFront();
      }
    } else if (!activeWardId && geoJsonRef.current) {
      geoJsonRef.current.resetStyle();
    }
  }, [activeWardId]);
  // Lọc danh sách phường để tìm kiếm
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    
    // Get all valid wards from geoData
    const allGeoWards = (geoData as any).features
      .map((f: any) => f.properties?.ten_xa)
      .filter(Boolean) as string[];

    // Remove duplicates just in case
    const uniqueWards = Array.from(new Set(allGeoWards));

    return uniqueWards.filter(w => w.toLowerCase().includes(term)).slice(0, 8); // Giới hạn 8 kết quả
  }, [searchTerm]);

  const handleSelectWard = (wardName: string) => {
    setSearchTerm(wardName);
    setIsSearchFocused(false);
    
    // Find wardId if it exists in data
    const ward = wardDataMap.get(wardName.trim().toLowerCase());
    if (ward) {
      setActiveWardId(ward.wardId);
    } else {
      setActiveWardId(null);
    }
  };
  if (!leafletComponents) {
    return (
      <div className="w-full h-[500px] bg-slate-50 flex items-center justify-center rounded-xl border border-slate-200 shadow-inner">
        <span className="text-slate-400 text-sm">Đang tải bản đồ...</span>
      </div>
    );
  }

  const { MapContainer, TileLayer, GeoJSON } = leafletComponents;
  const center: [number, number] = [16.0544, 108.2022];

  const onEachFeature = (feature: any, layer: any) => {
    const wardName = feature.properties?.ten_xa;
    if (!wardName) return;

    const ward = wardDataMap.get(wardName.trim().toLowerCase());
    
    if (ward) {
      layersMapRef.current.set(ward.wardId, layer);
    }
    
    // Tooltip formatting
    let scoreText = "Chưa có phản ánh";
    if (ward) {
      if (ward.rankPosition > 0) {
        scoreText = `${ward[metric]} điểm`; // Has enough data
      } else {
        scoreText = `Có ${ward.totalFeedbacks} phản ánh (Chưa đủ điều kiện xếp hạng)`; // Unranked
      }
    }

    const popupContent = `
      <div class="font-sans">
        <div class="font-bold text-[#0B4FC4] border-b border-slate-200 pb-1 mb-1">${wardName}</div>
        <div class="text-sm font-semibold">${scoreText}</div>
      </div>
    `;
    layer.bindTooltip(popupContent, { sticky: true, className: 'bg-white border-0 shadow-lg rounded-lg p-2' });

    // Interactions
    layer.on({
      click: () => {
        if (ward && ward.totalFeedbacks > 0 && onWardClick) {
          onWardClick(ward.wardId);
        }
      },
      mouseover: (e: any) => {
        const target = e.target;
        target.setStyle({
          weight: 3,
          color: "#f59e0b",
          dashArray: "",
          fillOpacity: 0.9
        });
        target.bringToFront();
      },
      mouseout: (e: any) => {
        const target = e.target;
        geoJsonRef.current?.resetStyle(target);
        
        // Re-apply active search highlight if this was the active ward
        if (activeWardId && ward && activeWardId === ward.wardId) {
          target.setStyle({
            weight: 4,
            color: "#3b82f6",
            dashArray: "",
            fillOpacity: 0.9
          });
          target.bringToFront();
        }
      }
    });
  };

  const styleFeature = (feature: any) => {
    const wardName = feature.properties?.ten_xa;
    let fillColor = "#e2e8f0"; // Default gray for missing/unranked wards

    if (wardName) {
      const ward = wardDataMap.get(wardName.trim().toLowerCase());
      // ONLY apply color if they are RANKED (rankPosition > 0)
      if (ward && ward.rankPosition > 0) {
        fillColor = colorScale(ward[metric]);
      }
    }

    return {
      fillColor: fillColor,
      weight: 1.5,
      opacity: 1,
      color: 'white', // Border color
      dashArray: '3',
      fillOpacity: 0.75
    };
  };

  // Removed from here

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden border border-slate-200 shadow-md">
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
                setActiveWardId(null);
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Kết quả tìm kiếm */}
        {isSearchFocused && searchResults.length > 0 && (
          <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[1001]">
            {searchResults.map((w, idx) => (
              <button
                key={idx}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                onMouseDown={() => handleSelectWard(w)}
              >
                {w}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bản đồ */}
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

          <TileLayer
            url="https://mt1.google.com/vt/lyrs=h&hl=vi&gl=VN&x={x}&y={y}&z={z}"
          />
        </MapContainer>
      </div>
    </div>
  );
}
