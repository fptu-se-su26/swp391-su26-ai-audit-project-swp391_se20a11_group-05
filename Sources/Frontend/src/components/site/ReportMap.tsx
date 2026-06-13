import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";

const CURRENT_LOCATION_ZOOM = 17;

const currentLocationIcon = typeof window !== "undefined" ? L.divIcon({
  className: "",
  html: `
    <div style="position: relative; width: 32px; height: 42px;">
      <div style="
        position: absolute;
        left: 3px;
        top: 2px;
        width: 26px;
        height: 26px;
        border-radius: 50% 50% 50% 0;
        background: #0b5ed7;
        border: 3px solid #ffffff;
        box-shadow: 0 10px 22px rgba(11, 94, 215, 0.35);
        transform: rotate(-45deg);
        display: grid;
        place-items: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: #111111;
          transform: rotate(45deg);
        "></div>
      </div>
    </div>
  `,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
}) : null;

function MapViewUpdater({
  center,
  hasLocation,
}: {
  center: [number, number];
  hasLocation: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    window.setTimeout(() => map.invalidateSize(), 0);

    if (hasLocation) {
      map.flyTo(center, CURRENT_LOCATION_ZOOM, { animate: true, duration: 0.8 });
      return;
    }

    map.setView(center, 13, { animate: true });
  }, [center, hasLocation, map]);

  return null;
}

interface ReportMapProps {
  mapCenter: [number, number];
  hasLocation: boolean;
  markerDisplayed: boolean;
  latitude: number | null;
  longitude: number | null;
  address: string;
  locationLoading: boolean;
}

export function ReportMap({
  mapCenter,
  hasLocation,
  markerDisplayed,
  latitude,
  longitude,
  address,
  locationLoading,
}: ReportMapProps) {
  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={mapCenter}
        zoom={hasLocation ? CURRENT_LOCATION_ZOOM : 13}
        className="w-full h-full"
        scrollWheelZoom={true}
        dragging={true}
        zoomControl={true}
      >
        <MapViewUpdater center={mapCenter} hasLocation={hasLocation} />
        <TileLayer
          attribution="&copy; Google Maps"
          url="https://mt1.google.com/vt/lyrs=m&hl=vi&gl=VN&x={x}&y={y}&z={z}"
        />
        {markerDisplayed && latitude !== null && longitude !== null && currentLocationIcon && (
          <Marker position={[latitude, longitude]} icon={currentLocationIcon}>
            <Popup>
              <strong>Vị trí hiện tại</strong>
              <p className="text-sm mt-1">{address || "Đã xác định bằng GPS"}</p>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {!markerDisplayed && (
        <div className="absolute inset-x-4 top-4 rounded-lg border border-white/70 bg-white/95 p-4 shadow-sm z-[500]">
          <div className="flex items-start gap-3">
            <MapPin className="text-gov-blue shrink-0 mt-0.5" size={22} />
            <div>
              <p className="font-bold text-ink">Đang chờ vị trí</p>
              <p className="text-sm text-ink-soft">
                {locationLoading
                  ? "Hệ thống đang xin quyền GPS..."
                  : "Bấm Lấy lại vị trí để hiển thị ghim trên bản đồ."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
