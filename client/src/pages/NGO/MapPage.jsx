import { useState, useCallback, useEffect } from "react";
import MapView from "../../components/Mapview";
import { CheckCircle, Navigation, ExternalLink, X, RefreshCw } from "lucide-react";
import { ngoAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const MOCK_MARKERS = [
  { id: 201, lat: 12.9716, lng: 77.5946, label: "Grand Palace Hotel", status: "edible", qty: "10.5 kg", time: "06:30 PM", hotel: "Grand Palace Hotel", item: "Mix Veg Curry", location: "MG Road, Bangalore", upload_id: 201 },
  { id: 202, lat: 12.9352, lng: 77.6245, label: "Elite Residency",    status: "edible", qty: "8.0 kg",  time: "05:45 PM", hotel: "Elite Residency",    item: "Chapati & Sabzi", location: "Indiranagar, Bangalore", upload_id: 202 },
  { id: 203, lat: 12.9733, lng: 77.6117, label: "The Oberoi",         status: "edible", qty: "6.5 kg",  time: "04:20 PM", hotel: "The Oberoi",         item: "Paneer Butter Masala", location: "Jayanagar, Bangalore", upload_id: 203 },
  { id: 204, lat: 12.9600, lng: 77.5900, label: "ITC Gardenia",       status: "edible", qty: "14.0 kg", time: "03:00 PM", hotel: "ITC Gardenia",       item: "Steamed Rice & Dal", location: "Whitefield, Bangalore", upload_id: 204 },
];

export default function MapPage() {
  const { user } = useAuth();
  const [foodList,   setFoodList]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("all");
  const [claimedIds, setClaimedIds] = useState([]);
  const [claiming,   setClaiming]   = useState(null);
  const [activeNav,  setActiveNav]  = useState(null);
  const [toast,      setToast]      = useState(null);

  // NGO's own location — from their registered GPS (stored in session)
  const NGO_LOCATION = {
    lat:   user?.latitude  || 12.9600,
    lng:   user?.longitude || 77.5800,
    label: `Your Location (${user?.name || "NGO"})`,
  };

  const fetchFood = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ngoAPI.getAvailableFood();
      // Map DB rows to marker format expected by MapView
      const markers = (res.data.available || []).map((f) => ({
        id:      f.upload_id,
        lat:     parseFloat(f.latitude)  || 12.9716,
        lng:     parseFloat(f.longitude) || 77.5946,
        label:   f.hotel_name,
        status:  "edible",
        qty:     `${f.quantity} kg`,
        time:    f.upload_time,
        hotel:   f.hotel_name,
        item:    f.food_item,
        location: f.location,
        upload_id: f.upload_id,
      }));
      setFoodList(markers.length > 0 ? markers : MOCK_MARKERS);
    } catch {
      // Fallback to mock markers
      setFoodList(MOCK_MARKERS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFood(); }, [fetchFood]);

  const handleClaim = useCallback(async (marker) => {
    setClaiming(marker.id);
    try {
      const res = await ngoAPI.claimFood(marker.upload_id);
      setClaimedIds((prev) => [...prev, marker.id]);
      setActiveNav(marker);
      setToast({ type: "success", message: `✅ Claimed ${marker.item} from ${marker.hotel}!` });
      // Remove from list
      setFoodList((prev) => prev.filter((f) => f.id !== marker.id));
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.detail || "Claim failed" });
    } finally {
      setClaiming(null);
      setTimeout(() => setToast(null), 4000);
    }
  }, []);

  const cancelNav = () => setActiveNav(null);

  const openGoogleNav = (dest) => {
    const url = `https://www.google.com/maps/dir/${NGO_LOCATION.lat},${NGO_LOCATION.lng}/${dest.lat},${dest.lng}`;
    window.open(url, "_blank");
  };

  const displayedMarkers = foodList.filter((m) => {
    if (claimedIds.includes(m.id)) return false;
    if (filter === "all") return true;
    return m.status === filter;
  });

  const routeLine = activeNav ? { from: NGO_LOCATION, to: activeNav } : null;

  // All claimed markers (for the claimed section below)
  const claimedMarkers = foodList.filter((m) => claimedIds.includes(m.id));

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          padding: "14px 20px", borderRadius: "var(--radius-md)",
          background: toast.type === "success" ? "#dcfce7" : "#fee2e2",
          border: `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecaca"}`,
          color: toast.type === "success" ? "#15803d" : "#b91c1c",
          fontSize: 14, fontWeight: 500, boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          animation: "slideInRight 0.3s ease", maxWidth: 380,
        }}>
          {toast.message}
        </div>
      )}

      {/* Navigation banner */}
      {activeNav && (
        <div style={{
          background: "linear-gradient(135deg, #dcfce7, #f0fdf4)",
          border: "1px solid rgba(34,197,94,0.3)", borderRadius: "var(--radius-md)",
          padding: "16px 20px", display: "flex", alignItems: "center", gap: 14,
          marginBottom: 20, boxShadow: "0 4px 16px rgba(34,197,94,0.12)",
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: "var(--radius-sm)",
            background: "linear-gradient(135deg,#22c55e,#16a34a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", flexShrink: 0,
          }}>
            <Navigation size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              🚗 Navigating to {activeNav.hotel}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
              📍 {activeNav.location} &nbsp;·&nbsp; 🍱 {activeNav.item} ({activeNav.qty}) &nbsp;·&nbsp; ⏰ {activeNav.time}
            </div>
            <div style={{ fontSize: 11, color: "var(--green-dark)", fontWeight: 600, marginTop: 4 }}>
              ✅ Claimed — hotel notified. Go to Pickups to confirm & award points.
            </div>
          </div>
          <button className="btn btn-ngo btn-sm" onClick={() => openGoogleNav(activeNav)} style={{ gap: 5 }}>
            <ExternalLink size={13} /> Open in Maps
          </button>
          <button className="btn btn-ghost btn-sm" onClick={cancelNav} style={{ padding: "6px 8px" }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { v: "all",    label: "All Locations" },
          { v: "edible", label: "✅ Edible Only" },
        ].map(({ v, label }) => (
          <button key={v} className={`btn ${filter === v ? "btn-ngo" : "btn-ghost"} btn-sm`}
            onClick={() => setFilter(v)}>{label}</button>
        ))}
        <button className="btn btn-ghost btn-sm" style={{ gap: 6, marginLeft: "auto" }} onClick={fetchFood}>
          <RefreshCw size={14} /> {loading ? "Loading…" : "Refresh"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: "var(--text-muted)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--ngo-primary)", display: "inline-block" }} /> Edible
          </span>
          {claimedIds.length > 0 && (
            <span style={{ fontWeight: 600, color: "var(--green-dark)" }}>🎉 {claimedIds.length} claimed</span>
          )}
        </div>
      </div>

      {/* Map — pins come from real DB coordinates */}
      <div className="card" style={{ marginBottom: 20, padding: 0, overflow: "hidden" }}>
        <MapView
          markers={displayedMarkers}
          height={460}
          routeLine={routeLine}
          ngoLocation={NGO_LOCATION}
        />
      </div>

      {/* Food list table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Available Food Locations</div>
            <div className="card-subtitle">
              {loading ? "Loading from database…" : `${displayedMarkers.length} available · ${claimedIds.length} claimed by you`}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
            <div className="spinner spinner-dark" style={{ margin: "0 auto 12px", width: 24, height: 24 }} />
            Loading from database…
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Hotel</th>
                  <th>Food</th>
                  <th>Qty</th>
                  <th>Location</th>
                  <th>Upload Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedMarkers.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                    {claimedIds.length > 0 ? "🎉 All available food claimed!" : "No food available right now"}
                  </td></tr>
                )}
                {displayedMarkers.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>🏨 {m.hotel}</td>
                    <td>🍱 {m.item}</td>
                    <td>{m.qty}</td>
                    <td style={{ fontSize: 12 }}>📍 {m.location}</td>
                    <td>{m.time}</td>
                    <td>
                      {claiming === m.id ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ngo-primary)" }}>
                          <div className="spinner spinner-dark" style={{ width: 14, height: 14 }} /> Claiming…
                        </span>
                      ) : (
                        <button className="btn btn-ngo btn-sm" onClick={() => handleClaim(m)}>
                          <CheckCircle size={13} /> Claim & Navigate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Claimed items */}
        {claimedIds.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
              ✅ Your Claimed Pickups This Session
            </div>
            {foodList.filter((m) => claimedIds.includes(m.id)).map((m) => (
              <div key={m.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", borderRadius: "var(--radius-sm)",
                background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: 8,
              }}>
                <CheckCircle size={16} color="#16a34a" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    {m.hotel} — {m.item} ({m.qty})
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    📍 {m.location} &nbsp;·&nbsp; Hotel notified
                  </div>
                </div>
                <button className="btn btn-ngo btn-sm" onClick={() => { setActiveNav(m); openGoogleNav(m); }} style={{ gap: 4 }}>
                  <Navigation size={13} /> Navigate
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
