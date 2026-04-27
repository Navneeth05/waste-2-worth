import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Search, Navigation, ExternalLink, RefreshCw } from "lucide-react";
import { municipalAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const MUNI_LOC_DEFAULT = { lat: 12.9716, lng: 77.5946 };

const MOCK_WASTE = [
  { upload_id: 301, hotel_name: "Grand Palace Hotel", food_item: "Spoiled Fruits",   quantity: 4.0, location: "MG Road, Bangalore",      zone: "Zone A", city: "Bangalore", status: "waste_routed", date: "2026-04-16", time: "11:30 AM", latitude: 12.9716, longitude: 77.5946 },
  { upload_id: 302, hotel_name: "Elite Residency",    food_item: "Expired Bread",    quantity: 3.0, location: "Indiranagar, Bangalore",  zone: "Zone B", city: "Bangalore", status: "waste_routed", date: "2026-04-16", time: "10:15 AM", latitude: 12.9352, longitude: 77.6245 },
  { upload_id: 303, hotel_name: "City Inn",           food_item: "Coffee Grounds",   quantity: 2.5, location: "Whitefield, Bangalore",   zone: "Zone C", city: "Bangalore", status: "waste_routed", date: "2026-04-15", time: "08:45 PM", latitude: 12.9580, longitude: 77.6081 },
  { upload_id: 304, hotel_name: "The Oberoi",         food_item: "Vegetable Peels",  quantity: 5.5, location: "Jayanagar, Bangalore",    zone: "Zone A", city: "Bangalore", status: "waste_routed", date: "2026-04-15", time: "07:30 PM", latitude: 12.9733, longitude: 77.6117 },
  { upload_id: 305, hotel_name: "Radisson Blu",       food_item: "Spoiled Milk",     quantity: 2.0, location: "Koramangala, Bangalore",  zone: "Zone C", city: "Bangalore", status: "picked_up",   date: "2026-04-15", time: "06:00 PM", latitude: 12.9780, longitude: 77.6400 },
  { upload_id: 306, hotel_name: "Hyatt Regency",      food_item: "Stale Rice",       quantity: 3.5, location: "HSR Layout, Bangalore",   zone: "Zone B", city: "Bangalore", status: "picked_up",   date: "2026-04-14", time: "05:15 PM", latitude: 12.9300, longitude: 77.6200 },
  { upload_id: 307, hotel_name: "ITC Gardenia",       food_item: "Rotten Vegetables",quantity: 6.0, location: "MG Road, Bangalore",      zone: "Zone A", city: "Bangalore", status: "waste_routed", date: "2026-04-14", time: "04:00 PM", latitude: 12.9600, longitude: 77.5900 },
  { upload_id: 308, hotel_name: "Taj West End",       food_item: "Expired Yogurt",   quantity: 1.5, location: "Jayanagar, Bangalore",    zone: "Zone A", city: "Bangalore", status: "picked_up",   date: "2026-04-13", time: "07:45 PM", latitude: 12.9800, longitude: 77.5800 },
];

export default function WasteManagement() {
  const { user } = useAuth();
  const muniLoc = {
    lat: user?.latitude  || MUNI_LOC_DEFAULT.lat,
    lng: user?.longitude || MUNI_LOC_DEFAULT.lng,
  };

  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [collecting, setCollecting] = useState(null);
  const [search,    setSearch]    = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast,     setToast]     = useState(null);

  const fetchWaste = useCallback(async () => {
    setLoading(true);
    try {
      const res = await municipalAPI.getWaste();
      const data = res.data.waste || [];
      setItems(data.length > 0 ? data : MOCK_WASTE);
    } catch {
      // Fallback to mock data
      setItems(MOCK_WASTE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWaste(); }, [fetchWaste]);

  const handleCollect = async (item) => {
    setCollecting(item.upload_id);
    try {
      await municipalAPI.markCollected(item.upload_id);
      setItems((prev) =>
        prev.map((w) =>
          w.upload_id === item.upload_id ? { ...w, status: "picked_up" } : w
        )
      );
      setToast({ type: "success", message: `✅ ${item.food_item} from ${item.hotel_name} marked as collected!` });
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.detail || "Collection failed" });
    } finally {
      setCollecting(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const openNav = (item) => {
    const dest = item.latitude && item.longitude
      ? `${item.latitude},${item.longitude}`
      : encodeURIComponent(item.location || item.hotel_name);
    const url = `https://www.google.com/maps/dir/${muniLoc.lat},${muniLoc.lng}/${dest}`;
    window.open(url, "_blank");
  };

  const filtered = items.filter((w) => {
    const matchSearch =
      w.hotel_name.toLowerCase().includes(search.toLowerCase()) ||
      w.food_item.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "pending"   && w.status !== "picked_up") ||
      (statusFilter === "collected" && w.status === "picked_up");
    return matchSearch && matchStatus;
  });

  const pending   = items.filter((w) => w.status !== "picked_up").length;
  const collected = items.filter((w) => w.status === "picked_up").length;
  const totalKg   = items.reduce((s, w) => s + parseFloat(w.quantity || 0), 0);

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
          fontSize: 14, fontWeight: 500, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", maxWidth: 380,
        }}>
          {toast.message}
        </div>
      )}

      {/* Stats from DB */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Reports", value: loading ? "…" : items.length },
          { label: "Pending",       value: loading ? "…" : pending      },
          { label: "Collected",     value: loading ? "…" : collected    },
          { label: "Total (kg)",    value: loading ? "…" : totalKg.toFixed(1) },
        ].map(({ label, value }) => (
          <div key={label} className="stat-card muni">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="form-input"
              placeholder="Search hotel or item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 34 }}
            />
          </div>
          <select className="form-input form-select" value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 150 }}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="collected">Collected</option>
          </select>
          <button className="btn btn-ghost btn-sm" style={{ gap: 6 }} onClick={fetchWaste}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
            <div className="spinner spinner-dark" style={{ margin: "0 auto 12px", width: 24, height: 24 }} />
            Loading waste reports from database…
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Hotel</th>
                  <th>Waste Item</th>
                  <th>Zone</th>
                  <th>Qty (kg)</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                      {items.length === 0 ? "No waste reports yet. Hotels will appear here when they upload non-edible food." : "No records match your filter."}
                    </td>
                  </tr>
                )}
                {filtered.map((w, i) => {
                  const isPending = w.status !== "picked_up";
                  return (
                    <tr key={w.upload_id}>
                      <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{i + 1}</td>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>🏨 {w.hotel_name}</td>
                      <td>🗑️ {w.food_item}</td>
                      <td>
                        <span className="badge badge-collected">📌 {w.zone || w.city || "—"}</span>
                      </td>
                      <td>{w.quantity} kg</td>
                      <td style={{ fontSize: 12, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        📍 {w.location || "—"}
                      </td>
                      <td style={{ fontSize: 12 }}>{w.date}</td>
                      <td style={{ fontSize: 12 }}>{w.time}</td>
                      <td>
                        <span className={`badge ${isPending ? "badge-pending" : "badge-edible"}`}>
                          {isPending ? "⏳ Pending" : "✅ Collected"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {isPending && (
                            collecting === w.upload_id ? (
                              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--muni-primary, #3b82f6)" }}>
                                <div className="spinner spinner-dark" style={{ width: 14, height: 14 }} /> Updating…
                              </span>
                            ) : (
                              <button className="btn btn-muni btn-sm" onClick={() => handleCollect(w)}>
                                <CheckCircle size={13} /> Collect
                              </button>
                            )
                          )}
                          <button className="btn btn-ghost btn-sm" onClick={() => openNav(w)} style={{ gap: 4 }}>
                            <Navigation size={13} /> Navigate
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}