import { useEffect, useState, useMemo, useRef } from "react";
import { resolveCampaignCoordinates } from "@/lib/campaignLocation";
import type { Campaign } from "@/lib/campaignStore";
import { Layers } from "lucide-react";

interface SingleCampaignMapProps {
  campaign: Campaign;
  height?: string;
  staticMode?: boolean;
}

function getMapStatusInfo(status: Campaign["status"]) {
  if (status === "recruiting") {
    return {
      color: "#F59E0B",
      label: "Đang tuyển",
    };
  }
  if (status === "completed" || status === "ended") {
    return {
      color: "#EF4444",
      label: "Đã kết thúc",
    };
  }
  if (status === "active" || status === "inProgress") {
    return {
      color: "#1E5EFF",
      label: "Đang diễn ra",
    };
  }
  return {
    color: "#64748B",
    label: "Chờ duyệt",
  };
}

function getCustomIcon(L: any, category: string, status: string) {
  if (typeof window === "undefined" || !L) return null;

  const color = getMapStatusInfo(status as Campaign["status"]).color;
  const size = 36;
  const shadow = "0 4px 10px rgba(0,0,0,0.2)";

  let innerIconSvg = `<circle cx="12" cy="12" r="5" fill="white" />`;
  if (category === "environment") {
    innerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
  } else if (category === "infrastructure") {
    innerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>`;
  } else if (category === "public_safety") {
    innerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
  }

  return L.divIcon({
    className: "custom-campaign-detail-marker",
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: ${size - 10}px;
          height: ${size - 10}px;
          border-radius: 50% 50% 50% 0;
          background: ${color};
          border: 2.5px solid #ffffff;
          box-shadow: ${shadow};
          transform: rotate(-45deg);
        "></div>
        <div style="
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        ">
          ${innerIconSvg}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

export function SingleCampaignMap({
  campaign,
  height = "320px",
  staticMode = false,
}: SingleCampaignMapProps) {
  const [leafletComponents, setLeafletComponents] = useState<{
    MapContainer: any;
    TileLayer: any;
    Marker: any;
    Circle: any;
    GeoJSON: any;
    L: any;
  } | null>(null);

  const [layerType, setLayerType] = useState<"road" | "satellite">("road");
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const coordinates = useMemo(() => resolveCampaignCoordinates(campaign), [campaign]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([import("react-leaflet"), import("leaflet")]).then(([rl, LMod]) => {
      if (!cancelled) {
        setLeafletComponents({
          MapContainer: rl.MapContainer,
          TileLayer: rl.TileLayer,
          Marker: rl.Marker,
          Circle: rl.Circle,
          GeoJSON: rl.GeoJSON,
          L: LMod.default || LMod,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close dropdown on click outside
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

  const layers = {
    road: {
      url: "https://mt1.google.com/vt/lyrs=m&hl=vi&gl=VN&x={x}&y={y}&z={z}",
      attribution: "&copy; Google Maps Road",
    },
    satellite: {
      url: "https://mt1.google.com/vt/lyrs=y&hl=vi&gl=VN&x={x}&y={y}&z={z}",
      attribution: "&copy; Google Maps Hybrid",
    },
  };

  if (!leafletComponents) {
    return (
      <div
        className="flex items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl"
        style={{ height }}
      >
        <span className="text-slate-400 text-sm font-semibold">Đang tải bản đồ...</span>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Circle, GeoJSON, L } = leafletComponents;
  const position: [number, number] = [coordinates.lat, coordinates.lng];
  const customIcon = getCustomIcon(L, campaign.category, campaign.status);

  // Render a custom boundary from GeoJSON if available, else fall back to a 200m radius circle
  let boundaryElement = null;
  if (campaign.boundaryGeojson) {
    try {
      const geoJsonData = JSON.parse(campaign.boundaryGeojson);
      boundaryElement = (
        <GeoJSON
          data={geoJsonData}
          style={{
            color: "#7C3AED",
            weight: 2.5,
            fillColor: "#7C3AED",
            fillOpacity: 0.12,
          }}
        />
      );
    } catch (e) {
      console.error("Failed to parse boundaryGeojson:", e);
    }
  }

  if (!boundaryElement) {
    boundaryElement = (
      <Circle
        center={position}
        radius={200}
        pathOptions={{
          color: "#7C3AED",
          weight: 2.5,
          fillColor: "#7C3AED",
          fillOpacity: 0.12,
        }}
      />
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-100 bg-white" style={{ height }}>
      {/* Floating Map Controls */}
      <div
        ref={dropdownRef}
        className="absolute top-3 right-3 flex flex-col items-end gap-2 text-xs"
        style={{ zIndex: 1000 }}
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLayersOpen(!isLayersOpen)}
            className="w-8 h-8 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-md flex items-center justify-center cursor-pointer transition text-[#0b2545] font-bold"
            title="Lớp bản đồ"
          >
            <Layers size={15} className="text-slate-600" />
          </button>

          {isLayersOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-lg shadow-xl py-1.5 z-[1100]">
              <div className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Loại bản đồ
              </div>
              <button
                type="button"
                onClick={() => {
                  setLayerType("road");
                  setIsLayersOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs transition flex items-center gap-1.5 ${
                  layerType === "road"
                    ? "bg-blue-50 text-blue-600 font-extrabold"
                    : "text-slate-700 hover:bg-slate-50 font-semibold"
                }`}
              >
                🗺️ Bản đồ đường phố
              </button>
              <button
                type="button"
                onClick={() => {
                  setLayerType("satellite");
                  setIsLayersOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs transition flex items-center gap-1.5 ${
                  layerType === "satellite"
                    ? "bg-blue-50 text-blue-600 font-extrabold"
                    : "text-slate-700 hover:bg-slate-50 font-semibold"
                }`}
              >
                🛰️ Bản đồ vệ tinh
              </button>
            </div>
          )}
        </div>
      </div>

      <MapContainer
        center={position}
        zoom={coordinates.zoom || 15}
        className="w-full h-full"
        zoomControl={!staticMode}
        scrollWheelZoom={!staticMode}
        dragging={!staticMode}
        doubleClickZoom={!staticMode}
        touchZoom={!staticMode}
        attributionControl={false}
      >
        <TileLayer
          attribution={layers[layerType].attribution}
          url={layers[layerType].url}
        />
        {boundaryElement}
        <Marker position={position} icon={customIcon || undefined} />
      </MapContainer>
    </div>
  );
}
