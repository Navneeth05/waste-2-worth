import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

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
  { id: 1, lat: 12.9716, lng: 77.5946, label: "Grand Palace Hotel",   status: "edible",     qty: "25 kg", time: "6:30 PM", hotel: "Grand Palace Hotel", item: "Mix Veg Curry", location: "MG Road" },
  { id: 2, lat: 12.9352, lng: 77.6245, label: "Spice Garden",         status: "edible",     qty: "12 kg", time: "7:00 PM", hotel: "Spice Garden",       item: "Chapati & Sabzi", location: "Indiranagar" },
  { id: 3, lat: 12.9580, lng: 77.6081, label: "Hotel Sunshine",       status: "non-edible", qty: "8 kg",  time: "5:45 PM", hotel: "Hotel Sunshine",     item: "Spoiled Fruits", location: "Whitefield" },
  { id: 4, lat: 12.9890, lng: 77.5920, label: "Ritz Caterers",        status: "edible",     qty: "40 kg", time: "7:30 PM", hotel: "Ritz Caterers",      item: "Biryani", location: "Jayanagar" },
];

// Auto-fit map bounds when route is active
function FitBounds({ routeLine }) {
  const map = useMap();
  useEffect(() => {
    if (routeLine) {
      const bounds = L.latLngBounds(
        [routeLine.from.lat, routeLine.from.lng],
        [routeLine.to.lat, routeLine.to.lng]
      );
      map.fitBounds(bounds.pad(0.3));
    }
  }, [routeLine, map]);
  return null;
}

// Calculate approximate distance in km between two points
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapView({
  markers = DEFAULT_MARKERS,
  height = 420,
  routeLine = null,
  ngoLocation = null,
  onClaim = null,       // callback(marker) — claim a food item
  onNavigate = null,    // callback(marker) — show route on map
  onOpenMaps = null,    // callback(marker) — open Google Maps externally
  claimingId = null,    // currently claiming marker id
}) {
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

        {/* Food markers with interactive popups */}
        {markers.map((m) => {
          const dist = ngoLocation ? getDistanceKm(ngoLocation.lat, ngoLocation.lng, m.lat, m.lng).toFixed(1) : null;
          const isActive = routeLine && routeLine.to && routeLine.to.id === m.id;
          return (
            <Marker
              key={m.id}
              position={[m.lat, m.lng]}
              icon={m.status === "edible" ? edibleIcon : wasteIcon}
            >
              <Popup minWidth={220} maxWidth={280}>
                <div style={{ fontFamily: "inherit" }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>🏨</span>
                    <strong style={{ fontSize: 14, color: "#1e293b" }}>{m.label || m.hotel}</strong>
                  </div>

                  {/* Status badge */}
                  <span style={{
                    display: "inline-block",
                    padding: "2px 8px", borderRadius: 100,
                    background: m.status === "edible" ? "#dcfce7" : "#fee2e2",
                    color: m.status === "edible" ? "#15803d" : "#dc2626",
                    fontSize: 11, fontWeight: 700, marginBottom: 8,
                  }}>
                    {m.status === "edible" ? "✅ Edible" : "⚠️ Non-Edible"}
                  </span>

                  {/* Details */}
                  <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
                    {m.item && <div>🍱 <strong>{m.item}</strong></div>}
                    <div>📦 {m.qty} &nbsp;|&nbsp; ⏰ {m.time}</div>
                    {m.location && <div>📍 {m.location}</div>}
                    {dist && <div>📏 ~{dist} km away</div>}
                  </div>

                  {/* Action buttons inside popup */}
                  {(onClaim || onNavigate || onOpenMaps) && (
                    <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                      {/* Navigate on Map button */}
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate(m)}
                          style={{
                            flex: 1, padding: "6px 10px", borderRadius: 6,
                            border: isActive ? "1.5px solid #22c55e" : "1.5px solid #3b82f6",
                            background: isActive ? "#f0fdf4" : "#eff6ff",
                            color: isActive ? "#15803d" : "#1d4ed8",
                            fontSize: 11, fontWeight: 700,
                            cursor: "pointer", display: "flex",
                            alignItems: "center", justifyContent: "center", gap: 4,
                          }}
                        >
                          🗺️ {isActive ? "Navigating" : "Navigate"}
                        </button>
                      )}

                      {/* Claim button */}
                      {onClaim && m.status === "edible" && (
                        <button
                          onClick={() => onClaim(m)}
                          disabled={claimingId === m.id}
                          style={{
                            flex: 1, padding: "6px 10px", borderRadius: 6,
                            border: "none",
                            background: "linear-gradient(135deg, #22c55e, #16a34a)",
                            color: "#fff", fontSize: 11, fontWeight: 700,
                            cursor: claimingId === m.id ? "wait" : "pointer",
                            opacity: claimingId === m.id ? 0.7 : 1,
                            display: "flex", alignItems: "center",
                            justifyContent: "center", gap: 4,
                          }}
                        >
                          {claimingId === m.id ? "⏳ Claiming..." : "✅ Claim"}
                        </button>
                      )}

                      {/* Open in Google Maps */}
                      {onOpenMaps && (
                        <button
                          onClick={() => onOpenMaps(m)}
                          style={{
                            padding: "6px 10px", borderRadius: 6,
                            border: "1.5px solid #e2e8f0",
                            background: "#fff", color: "#475569",
                            fontSize: 11, fontWeight: 600,
                            cursor: "pointer", display: "flex",
                            alignItems: "center", justifyContent: "center", gap: 4,
                          }}
                        >
                          🔗 Maps
                        </button>
                      )}
                    </div>
                  )}
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
          );
        })}

        {/* Navigation route line (dashed blue with glow) */}
        {routeLine && (
          <>
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
            {/* Main dashed route */}
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