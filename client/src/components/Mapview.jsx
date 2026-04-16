import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon broken by vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const edibleIcon = new L.Icon({
  iconUrl:    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl:  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const wasteIcon = new L.Icon({
  iconUrl:    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const ngoIcon = new L.Icon({
  iconUrl:    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

// Default food locations for demo
const DEFAULT_MARKERS = [
  { id: 1, lat: 12.9716, lng: 77.5946, label: "Grand Palace Hotel",   status: "edible",     qty: "25 kg", time: "6:30 PM" },
  { id: 2, lat: 12.9352, lng: 77.6245, label: "Spice Garden",         status: "edible",     qty: "12 kg", time: "7:00 PM" },
  { id: 3, lat: 12.9580, lng: 77.6081, label: "Hotel Sunshine",       status: "non-edible", qty: "8 kg",  time: "5:45 PM" },
  { id: 4, lat: 12.9890, lng: 77.5920, label: "Ritz Caterers",        status: "edible",     qty: "40 kg", time: "7:30 PM" },
];

// Auto-fit map bounds when route is active
function FitBounds({ routeLine }) {
  const map = useMap();
  if (routeLine) {
    const bounds = L.latLngBounds(
      [routeLine.from.lat, routeLine.from.lng],
      [routeLine.to.lat, routeLine.to.lng]
    );
    map.fitBounds(bounds.pad(0.3));
  }
  return null;
}

export default function MapView({ markers = DEFAULT_MARKERS, height = 420, routeLine = null, ngoLocation = null }) {
  return (
    <div className="map-container" style={{ height }}>
      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />

        {/* Auto-fit when route is active */}
        <FitBounds routeLine={routeLine} />

        {/* NGO's own location */}
        {ngoLocation && (
          <Marker position={[ngoLocation.lat, ngoLocation.lng]} icon={ngoIcon}>
            <Popup>
              <strong style={{ fontSize: 13 }}>📍 {ngoLocation.label}</strong>
              <br />
              <span style={{ fontSize: 12, color: "#3b82f6" }}>Your current location</span>
            </Popup>
          </Marker>
        )}

        {/* Food markers */}
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={m.status === "edible" ? edibleIcon : wasteIcon}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <strong style={{ fontSize: 13 }}>{m.label}</strong>
                <br />
                <span style={{
                  color: m.status === "edible" ? "#16a34a" : "#dc2626",
                  fontWeight: 600, fontSize: 12,
                }}>
                  {m.status === "edible" ? "✅ Edible" : "⚠️ Non-Edible"}
                </span>
                <br />
                <span style={{ fontSize: 12, color: "#666" }}>
                  🍱 {m.qty} &nbsp;|&nbsp; ⏰ {m.time}
                </span>
              </div>
            </Popup>
            {m.status === "edible" && (
              <Circle
                center={[m.lat, m.lng]}
                radius={300}
                pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.06, weight: 1 }}
              />
            )}
          </Marker>
        ))}

        {/* Navigation route line (dashed blue) */}
        {routeLine && (
          <>
            <Polyline
              positions={[
                [routeLine.from.lat, routeLine.from.lng],
                [routeLine.to.lat,   routeLine.to.lng],
              ]}
              pathOptions={{
                color: "#3b82f6",
                weight: 4,
                dashArray: "10, 10",
                opacity: 0.8,
              }}
            />
            {/* Glow behind route */}
            <Polyline
              positions={[
                [routeLine.from.lat, routeLine.from.lng],
                [routeLine.to.lat,   routeLine.to.lng],
              ]}
              pathOptions={{
                color: "#3b82f6",
                weight: 12,
                opacity: 0.15,
              }}
            />
            {/* Destination pulse circle */}
            <Circle
              center={[routeLine.to.lat, routeLine.to.lng]}
              radius={200}
              pathOptions={{
                color: "#22c55e",
                fillColor: "#22c55e",
                fillOpacity: 0.15,
                weight: 2,
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}