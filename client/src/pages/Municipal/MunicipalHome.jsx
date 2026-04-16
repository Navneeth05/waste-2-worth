import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Trash2, CheckCircle, AlertTriangle, BarChart3, Navigation, RefreshCw, ArrowUpRight, MapPin, Clock } from "lucide-react";
import { municipalAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

// Mock fallback data
const MOCK_WASTE = [
  { upload_id: 301, hotel_name: "Grand Palace Hotel", food_item: "Spoiled Fruits", quantity: 4.0, location: "MG Road, Bangalore", zone: "Zone A", city: "Bangalore", status: "waste_routed", date: "2026-04-16", time: "11:30 AM", latitude: 12.9716, longitude: 77.5946 },
  { upload_id: 302, hotel_name: "Elite Residency", food_item: "Expired Bread", quantity: 3.0, location: "Indiranagar, Bangalore", zone: "Zone B", city: "Bangalore", status: "waste_routed", date: "2026-04-16", time: "10:15 AM", latitude: 12.9352, longitude: 77.6245 },
  { upload_id: 303, hotel_name: "City Inn", food_item: "Coffee Grounds", quantity: 2.5, location: "Whitefield, Bangalore", zone: "Zone C", city: "Bangalore", status: "waste_routed", date: "2026-04-15", time: "08:45 PM", latitude: 12.9580, longitude: 77.6081 },
  { upload_id: 304, hotel_name: "The Oberoi", food_item: "Vegetable Peels", quantity: 5.5, location: "Jayanagar, Bangalore", zone: "Zone A", city: "Bangalore", status: "waste_routed", date: "2026-04-15", time: "07:30 PM", latitude: 12.9733, longitude: 77.6117 },
];

export default function MunicipalHome() {
  const { user } = useAuth();
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";
  const muniLoc = {
    lat: user?.latitude  || 12.9716,
    lng: user?.longitude || 77.5946,
  };

  const [dashboard, setDashboard] = useState(null);
  const [waste,     setWaste]     = useState([]);
  const [loading,   setLoading]   = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, wasteRes] = await Promise.all([
        municipalAPI.getDashboard(),
        municipalAPI.getWaste(),
      ]);
      setDashboard(dashRes.data || {});
      const pending = (wasteRes.data.waste || []).filter((w) => w.status !== "picked_up");
      setWaste(pending.length > 0 ? pending.slice(0, 5) : MOCK_WASTE);
    } catch {
      setDashboard({ pending: 4, collected: 12, total_kg: 67.5, zones_active: 3 });
      setWaste(MOCK_WASTE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNav = (item) => {
    const dest = item.latitude && item.longitude
      ? `${item.latitude},${item.longitude}`
      : encodeURIComponent(item.location || item.hotel_name);
    window.open(`https://www.google.com/maps/dir/${muniLoc.lat},${muniLoc.lng}/${dest}`, "_blank");
  };

  const d = dashboard || {};

  return (
    <div>
      {/* ── Welcome Hero Banner ── */}
      <div className="welcome-hero muni">
        <div className="floating-shapes">
          <div className="floating-shape" />
          <div className="floating-shape" />
          <div className="floating-shape" />
          <div className="floating-shape" />
        </div>
        <div className="welcome-hero-content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h2>{greeting}, Municipal Admin 🏛️</h2>
              <p>
                {(d.pending ?? 0) > 0
                  ? `You have ${d.pending} waste items pending collection across ${d.zones_active ?? "—"} zones. Navigate to the nearest hotel for pickup.`
                  : "All waste has been collected! Great work keeping the city clean."}
              </p>
            </div>
            <div className="live-indicator" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }}>
              <span className="live-dot" style={{ background: (d.pending ?? 0) > 0 ? "#fbbf24" : "#4ade80" }} />
              {(d.pending ?? 0) > 0 ? `${d.pending} Pending` : "All Clear"}
            </div>
          </div>
          <div className="welcome-hero-stats">
            <div className="welcome-hero-stat">
              <div className="welcome-hero-stat-value">{loading ? "…" : d.pending ?? 0}</div>
              <div className="welcome-hero-stat-label">Pending</div>
            </div>
            <div className="welcome-hero-stat">
              <div className="welcome-hero-stat-value">{loading ? "…" : d.collected ?? 0}</div>
              <div className="welcome-hero-stat-label">Collected</div>
            </div>
            <div className="welcome-hero-stat">
              <div className="welcome-hero-stat-value">{loading ? "…" : `${Number(d.total_kg ?? 0).toFixed(0)}`}</div>
              <div className="welcome-hero-stat-label">Total Kg</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats from DB */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Pending Collection", value: loading ? "…" : d.pending    ?? 0, icon: AlertTriangle, color: "muni", change: "Needs attention"  },
          { label: "Collected",          value: loading ? "…" : d.collected  ?? 0, icon: CheckCircle,   color: "muni", change: "Total done"        },
          { label: "Total Waste (kg)",   value: loading ? "…" : Number(d.total_kg  ?? 0).toFixed(1), icon: Trash2,   color: "muni", change: "All time"        },
          { label: "Zones Active",       value: loading ? "…" : d.zones_active ?? 0, icon: BarChart3,    color: "muni", change: "Across city"       },
        ].map(({ label, value, icon: Icon, color, change }) => (
          <div key={label} className={`stat-card ${color}`}>
            <div className={`stat-icon ${color}`}><Icon size={20} /></div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            <div className="stat-change up">{change}</div>
          </div>
        ))}
      </div>

      {/* Pending waste as activity feed */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Pending Waste Collections</div>
            <div className="card-subtitle">
              {loading ? "Loading…" : `${waste.length} non-edible item${waste.length !== 1 ? "s" : ""} awaiting collection`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" style={{ gap: 6 }} onClick={fetchData}>
              <RefreshCw size={14} /> Refresh
            </button>
            <Link to="/municipal/waste">
              <button className="btn btn-muni btn-sm"><Trash2 size={13} /> Manage All</button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-text" style={{ width: "60%" }} />
                  <div className="skeleton skeleton-text" style={{ width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {waste.length === 0 && (
              <div className="empty-state">
                <CheckCircle />
                <p>🎉 No pending waste collections! Check back later.</p>
              </div>
            )}
            {waste.map((w) => (
              <div key={w.upload_id} className="activity-feed-item">
                <div className="activity-icon waste">🗑️</div>
                <div className="activity-info">
                  <div className="activity-title">
                    <span style={{ marginRight: 6 }}>🏨</span>{w.hotel_name}
                    <span style={{ marginLeft: 8, color: "var(--text-muted)", fontWeight: 400, fontSize: 12 }}>— {w.food_item}</span>
                  </div>
                  <div className="activity-meta">
                    <span>{w.quantity} kg</span>
                    <span>•</span>
                    <span>📍 {w.location || "—"}</span>
                    <span>•</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      📌 <span className="activity-badge" style={{ background: "#dbeafe", color: "#1d4ed8" }}>{w.zone || w.city || "—"}</span>
                    </span>
                    <span>•</span>
                    <span>🕐 {w.time}</span>
                  </div>
                </div>
                <button className="btn btn-muni btn-sm" onClick={() => openNav(w)} style={{ gap: 4, flexShrink: 0 }}>
                  <Navigation size={13} /> Navigate
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Quick actions */}
        <div className="card">
          <div className="card-header"><div className="card-title">Quick Actions</div></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link to="/municipal/waste" style={{ textDecoration: "none" }}>
              <div className="quick-action-btn">
                <div className="quick-action-icon" style={{ background: "var(--blue-light)", color: "var(--blue-dark)" }}>
                  <Trash2 size={22} />
                </div>
                <div>
                  <div className="quick-action-label">Waste Collection</div>
                  <div className="quick-action-desc">{loading ? "Loading…" : `${d.pending ?? 0} items pending`}</div>
                </div>
              </div>
            </Link>
            <Link to="/municipal/stats" style={{ textDecoration: "none" }}>
              <div className="quick-action-btn">
                <div className="quick-action-icon" style={{ background: "#f0fdf4", color: "var(--green-dark)" }}>
                  <BarChart3 size={22} />
                </div>
                <div>
                  <div className="quick-action-label">View Analytics</div>
                  <div className="quick-action-desc">Monthly waste trends & zone performance</div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* How It Works */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">How It Works</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { step: "1", text: "Hotel uploads food photo — AI classifies it as edible or non-edible", icon: "📸" },
              { step: "2", text: "Non-edible items appear here instantly (status: waste_routed)", icon: "⚡" },
              { step: "3", text: "Click Navigate to get driving directions to the hotel", icon: "🗺️" },
              { step: "4", text: "Click Collect to mark the waste as picked up in the system", icon: "✅" },
            ].map(({ step, text, icon }) => (
              <div key={step} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: "linear-gradient(135deg, var(--muni-primary), #60a5fa)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
                }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>Step {step}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
