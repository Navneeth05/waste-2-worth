import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Trash2, CheckCircle, AlertTriangle, BarChart3, Navigation, RefreshCw } from "lucide-react";
import { municipalAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function MunicipalHome() {
  const { user } = useAuth();
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
      // Most recent 5 pending items
      const pending = (wasteRes.data.waste || []).filter((w) => w.status !== "picked_up");
      setWaste(pending.slice(0, 5));
    } catch {
      // fail silently
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

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Pending waste list */}
        <div className="card" style={{ gridColumn: "1 / -1" }}>
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
                    <th>Waste Item</th>
                    <th>Zone</th>
                    <th>Quantity</th>
                    <th>Location</th>
                    <th>Time</th>
                    <th>Navigate</th>
                  </tr>
                </thead>
                <tbody>
                  {waste.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                        🎉 No pending waste collections! Check back later.
                      </td>
                    </tr>
                  )}
                  {waste.map((w) => (
                    <tr key={w.upload_id}>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>🏨 {w.hotel_name}</td>
                      <td>🗑️ {w.food_item}</td>
                      <td><span className="badge badge-collected">📌 {w.zone || w.city || "—"}</span></td>
                      <td>{w.quantity} kg</td>
                      <td style={{ fontSize: 12 }}>📍 {w.location || "—"}</td>
                      <td style={{ fontSize: 12 }}>{w.time}</td>
                      <td>
                        <button className="btn btn-muni btn-sm" onClick={() => openNav(w)} style={{ gap: 4 }}>
                          <Navigation size={13} /> Navigate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card">
          <div className="card-header"><div className="card-title">Quick Actions</div></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link to="/municipal/waste">
              <button className="btn btn-muni btn-full" style={{ justifyContent: "flex-start", gap: 12, padding: "14px 18px" }}>
                <Trash2 size={20} />
                <div style={{ textAlign: "left" }}>
                  <div>Waste Collection</div>
                  <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>
                    {loading ? "Loading…" : `${d.pending ?? 0} items pending`}
                  </div>
                </div>
              </button>
            </Link>
            <Link to="/municipal/stats">
              <button className="btn btn-ghost btn-full" style={{ justifyContent: "flex-start", gap: 12, padding: "14px 18px" }}>
                <BarChart3 size={20} />
                <div style={{ textAlign: "left" }}>
                  <div>View Analytics</div>
                  <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>Monthly waste trends</div>
                </div>
              </button>
            </Link>
          </div>
        </div>

        {/* Info */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">How It Works</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { step: "1", text: "Hotel uploads food photo — AI classifies it as edible or non-edible" },
              { step: "2", text: "Non-edible items appear here instantly (status: waste_routed)" },
              { step: "3", text: "Click Navigate to get driving directions to the hotel" },
              { step: "4", text: "Click Collect to mark the waste as picked up in the system" },
            ].map(({ step, text }) => (
              <div key={step} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: "var(--muni-primary, #3b82f6)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                }}>{step}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
