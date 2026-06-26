import { useState, useMemo, useEffect, useRef } from "react";
import { Layers, MapPin, Users, Compass, CheckCircle } from "lucide-react";
import { WARD_BOUNDARIES } from "@/lib/geojson";
import type { Campaign } from "@/lib/campaignStore";
import { useAuth } from "@/lib/auth";

interface Props {
  height?: string;
  campaigns?: Campaign[];
  activeCampaign?: Campaign;
  showBoundary?: boolean;
  onCampaignClick?: (campaign: Campaign) => void;
}

// Helper to resolve coordinates from string or object
function resolveCampaignLatLng(campaign: Campaign): [number, number] | null {
  if (campaign.latitude && campaign.longitude) {
    return [campaign.latitude, campaign.longitude];
  }
  // Try fallback positions if any
  const fallback = (campaign as any).position;
  if (Array.isArray(fallback) && fallback.length === 2 && typeof fallback[0] === "number") {
    return fallback as [number, number];
  }
  return null;
}

function getCustomIcon(L: any, category: string, status: string, isActive: boolean) {
  if (typeof window === "undefined" || !L) return null;

  let color = "#1E5EFF"; // Default Blue
  if (status === "completed") {
    color = "#22C55E"; // Green
  } else if (status === "recruiting") {
    color = "#F59E0B"; // Amber
  } else if (status === "inProgress") {
    color = "#1E5EFF"; // Blue
  } else {
    color = "#64748B"; // Slate for pending/other
  }

  const border = isActive ? "3px solid #7C3AED" : "2px solid #ffffff";
  const size = isActive ? 38 : 32;
  const shadow = isActive ? "0 4px 14px rgba(124, 58, 237, 0.4)" : "0 4px 10px rgba(0,0,0,0.2)";

  let innerIconSvg = `<circle cx="12" cy="12" r="5" fill="white" />`;
  if (category === "environment") {
    innerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
  } else if (category === "infrastructure") {
    innerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>`;
  } else if (category === "public_safety") {
    innerIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
  }

  return L.divIcon({
    className: "custom-campaign-marker",
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: ${size - 10}px;
          height: ${size - 10}px;
          border-radius: 50% 50% 50% 0;
          background: ${color};
          border: ${border};
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
    popupAnchor: [0, -size],
  });
}

function MapController({
  activeCampaign,
  campaigns = [],
  L,
  useMap,
}: {
  activeCampaign?: Campaign;
  campaigns?: Campaign[];
  L: any;
  useMap: () => any;
}) {
  const map = useMap();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (activeCampaign) {
      const pos = resolveCampaignLatLng(activeCampaign);
      if (!pos) return;

      let boundaryLayer = null;
      if (activeCampaign.boundaryGeojson) {
        try {
          boundaryLayer = JSON.parse(activeCampaign.boundaryGeojson);
        } catch {}
      }
      if (!boundaryLayer && activeCampaign.ward && WARD_BOUNDARIES[activeCampaign.ward]) {
        boundaryLayer = WARD_BOUNDARIES[activeCampaign.ward];
      }

      if (boundaryLayer && L) {
        try {
          const tempLayer = L.geoJSON(boundaryLayer);
          const bounds = tempLayer.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
            return;
          }
        } catch (e) {
          console.error("Error fitting campaign bounds:", e);
        }
      }

      map.flyTo(pos, 15, { animate: true });
    } else if (campaigns.length > 0 && L && !hasFittedRef.current) {
      try {
        const points = campaigns
          .map(resolveCampaignLatLng)
          .filter((x): x is [number, number] => x !== null);

        if (points.length > 0) {
          const bounds = L.latLngBounds(points);
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [60, 60] });
            hasFittedRef.current = true;
          }
        }
      } catch (e) {
        console.error("Error fitting list bounds:", e);
      }
    }
  }, [activeCampaign, campaigns, map, L]);

  return null;
}

export function CampaignMap({
  height = "500px",
  campaigns = [],
  activeCampaign,
  showBoundary = true,
  onCampaignClick,
}: Props) {
  const [leafletComponents, setLeafletComponents] = useState<{
    MapContainer: any;
    TileLayer: any;
    Marker: any;
    Popup: any;
    Circle: any;
    GeoJSON: any;
    useMap: any;
    L: any;
  } | null>(null);

  const [layerType, setLayerType] = useState<"osm" | "satellite">("osm");
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"city" | "managed">("city");

  const filteredCampaigns = useMemo(() => {
    if (viewMode === "city" || !user?.wardId) {
      return campaigns;
    }
    return campaigns.filter((c) => String(c.wardId) === String(user.wardId));
  }, [campaigns, viewMode, user]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([import("react-leaflet"), import("leaflet")]).then(([rl, LMod]) => {
      if (!cancelled) {
        setLeafletComponents({
          MapContainer: rl.MapContainer,
          TileLayer: rl.TileLayer,
          Marker: rl.Marker,
          Popup: rl.Popup,
          Circle: rl.Circle,
          GeoJSON: rl.GeoJSON,
          useMap: rl.useMap,
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
    osm: {
      url: "https://mt1.google.com/vt/lyrs=m&hl=vi&gl=VN&x={x}&y={y}&z={z}",
      attribution: "&copy; Google Maps",
    },
    satellite: {
      url: "https://mt1.google.com/vt/lyrs=y&hl=vi&gl=VN&x={x}&y={y}&z={z}",
      attribution: "&copy; Google Maps",
    },
  };

  const defaultCenter: [number, number] = [16.044, 108.22];

  if (!leafletComponents) {
    return (
      <div
        className="flex flex-col rounded-2xl overflow-hidden border border-[#E4EAF2] bg-slate-50 items-center justify-center"
        style={{ height }}
      >
        <span className="text-slate-400 text-sm font-semibold">Đang tải bản đồ chiến dịch...</span>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Circle, GeoJSON, useMap, L } = leafletComponents;

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-[#E4EAF2] bg-white shadow-sm relative">
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
            className="w-10 h-10 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-md flex items-center justify-center cursor-pointer transition text-[#0b2545] font-bold"
            title="Lớp bản đồ"
          >
            <Layers size={18} className="text-slate-600" />
          </button>

          {isLayersOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-[1100]">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Loại bản đồ
              </div>
              <button
                type="button"
                onClick={() => {
                  setLayerType("osm");
                  setIsLayersOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-xs transition flex items-center gap-2 ${
                  layerType === "osm"
                    ? "bg-blue-50 text-blue-600 font-extrabold"
                    : "text-slate-700 hover:bg-slate-50 font-semibold"
                }`}
              >
                🗺️ Bản đồ (Google Maps)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLayerType("satellite");
                  setIsLayersOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-xs transition flex items-center gap-2 ${
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

      <div style={{ height }} className="relative z-10 w-full">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          className="w-full h-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url={layers[layerType].url} attribution={layers[layerType].attribution} />

          <MapController
            activeCampaign={activeCampaign}
            campaigns={filteredCampaigns}
            L={L}
            useMap={useMap}
          />

          {/* Render 100m radius range circle for active campaign */}
          {showBoundary &&
            filteredCampaigns.map((c) => {
              const pos = resolveCampaignLatLng(c);
              if (!pos) return null;

              const isCurrent = activeCampaign?.id === c.id;

              // If active campaign is specified, we render boundary only for the active one to avoid clutter.
              if (activeCampaign && !isCurrent) return null;

              // Draw a custom boundary from GeoJSON if available, else fall back to a 200m radius circle
              if (c.boundaryGeojson) {
                try {
                  const geoJsonData = JSON.parse(c.boundaryGeojson);
                  return (
                    <GeoJSON
                      key={`boundary-${c.id}`}
                      data={geoJsonData}
                      style={{
                        color: isCurrent ? "#7C3AED" : "#1E5EFF",
                        weight: isCurrent ? 2.5 : 1.5,
                        fillColor: isCurrent ? "#7C3AED" : "#1E5EFF",
                        fillOpacity: isCurrent ? 0.12 : 0.06,
                      }}
                    />
                  );
                } catch (e) {
                  console.error("Failed to parse boundaryGeojson:", e);
                }
              }

              return (
                <Circle
                  key={`circle-${c.id}`}
                  center={pos}
                  radius={200}
                  pathOptions={{
                    color: isCurrent ? "#7C3AED" : "#1E5EFF",
                    weight: isCurrent ? 2.5 : 1.5,
                    fillColor: isCurrent ? "#7C3AED" : "#1E5EFF",
                    fillOpacity: isCurrent ? 0.12 : 0.06,
                  }}
                />
              );
            })}

          {/* Markers */}
          {filteredCampaigns.map((c) => {
            const pos = resolveCampaignLatLng(c);
            if (!pos) return null;

            const isCurrent = activeCampaign?.id === c.id;
            const icon = getCustomIcon(L, c.category, c.status, isCurrent);

            return (
              <Marker
                key={c.id}
                position={pos}
                icon={icon || undefined}
                eventHandlers={{
                  click: () => {
                    if (onCampaignClick) onCampaignClick(c);
                  },
                }}
              >
                <Popup>
                  <div className="p-2 max-w-[240px]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                          c.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : c.status === "recruiting"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-[#1E5EFF]"
                        }`}
                      >
                        {c.status === "completed"
                          ? "Hoàn thành"
                          : c.status === "recruiting"
                            ? "Đang tuyển"
                            : "Đang diễn ra"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">
                        {c.category === "environment"
                          ? "Môi trường"
                          : c.category === "infrastructure"
                            ? "Hạ tầng"
                            : "An toàn"}
                      </span>
                    </div>
                    <strong className="text-slate-800 text-sm font-extrabold block leading-snug">
                      {c.name}
                    </strong>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Phường: {c.ward}
                    </span>
                    <p className="text-slate-600 text-xs mt-1 leading-relaxed line-clamp-2">
                      {c.desc}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Map Legend Footer */}
      <div className="p-4 border-t border-[#E4EAF2] bg-slate-50/50 space-y-4">
        {/* Segmented Control Tab Switcher */}
        <div className="flex border border-slate-200 rounded-xl p-1 bg-white max-w-md shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode("city")}
            className={`flex-1 py-2 text-center text-[11px] font-black rounded-lg transition-all ${
              viewMode === "city"
                ? "bg-[#0F5BD8] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            Chiến dịch của thành phố
          </button>
          <button
            type="button"
            onClick={() => setViewMode("managed")}
            className={`flex-1 py-2 text-center text-[11px] font-black rounded-lg transition-all ${
              viewMode === "managed"
                ? "bg-[#0F5BD8] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            Chiến dịch đang quản lý
          </button>
        </div>

        {/* Empty State Warning */}
        {viewMode === "managed" && filteredCampaigns.length === 0 && (
          <div className="p-4 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs font-bold text-amber-800 flex items-center gap-2">
            <span>⚠️</span>
            <span>Bạn hiện chưa quản lý chiến dịch nào thuộc phường/xã của mình.</span>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#F59E0B] border border-white shadow-sm" />
            <span>Đang tuyển thành viên</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#1E5EFF] border border-white shadow-sm" />
            <span>Chiến dịch đang diễn ra</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#22C55E] border border-white shadow-sm" />
            <span>Chiến dịch đã hoàn thành</span>
          </div>
        </div>
      </div>
    </div>
  );
}
