import React, { useMemo } from "react";
import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";
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

interface Cluster {
  lat: number;
  lng: number;
  count: number;
  feedbacks: Hotspot[];
}

// Hàm gộp các điểm gần nhau (bán kính khoảng 1.5km ~ 0.015 độ)
function clusterHotspots(hotspots: Hotspot[], distanceThreshold = 0.015): Cluster[] {
  const clusters: Cluster[] = [];

  for (const p of hotspots) {
    let added = false;
    for (const c of clusters) {
      const dx = p.latitude - c.lat;
      const dy = p.longitude - c.lng;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < distanceThreshold) {
        c.feedbacks.push(p);
        c.count += 1;
        // Cập nhật lại tâm của cụm (trung bình cộng)
        c.lat = (c.lat * (c.count - 1) + p.latitude) / c.count;
        c.lng = (c.lng * (c.count - 1) + p.longitude) / c.count;
        added = true;
        break;
      }
    }
    if (!added) {
      clusters.push({ lat: p.latitude, lng: p.longitude, count: 1, feedbacks: [p] });
    }
  }
  return clusters;
}

export function HeatmapMap({ hotspots }: HeatmapMapProps) {
  // Tọa độ trung tâm Quảng Nam - Đà Nẵng
  const center = [15.8, 108.3] as [number, number];

  const clusters = useMemo(() => clusterHotspots(hotspots || []), [hotspots]);

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer center={center} zoom={10} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=m&hl=vi&gl=VN&x={x}&y={y}&z={z}"
          attribution='&copy; Google Maps'
        />
        {clusters.map((c, i) => {
          // Quy luật màu: 10+ đỏ, 3-9 cam, 1-2 xanh dương
          let color = "blue";
          if (c.count >= 10) color = "red";
          else if (c.count >= 3) color = "orange";

          // Bán kính tĩnh (Circle tính bằng mét) thay vì pixel
          // Giúp khi zoom in thì vòng tròn sẽ to ra để hiện rõ khu vực, zoom out thì nhỏ lại
          // Tăng bán kính dựa trên số lượng để nhìn rõ độ lớn của điểm nóng
          const radiusMeters = 800 + c.count * 100;

          return (
            <Circle
              key={i}
              center={[c.lat, c.lng]}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.5,
                weight: 1,
              }}
              radius={radiusMeters} // Bán kính thực tế tính bằng mét
            >
              <Popup>
                <div className="text-sm min-w-[200px]">
                  <strong className="text-base text-gov-blue border-b pb-1 mb-2 block">
                    Khu vực có {c.count} phản ánh
                  </strong>
                  <div className="max-h-[150px] overflow-y-auto pr-2 space-y-2">
                    {c.feedbacks.map((f, idx) => (
                      <div key={idx} className="bg-slate-50 p-2 rounded border border-slate-100">
                        <strong>Loại:</strong> {f.categoryName} <br />
                        <strong>Trạng thái:</strong> {f.status}
                      </div>
                    ))}
                  </div>
                </div>
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>
    </div>
  );
}
