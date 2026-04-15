import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import {
  Upload, History, Star, Clock, TrendingUp,
  CheckCircle, AlertCircle, RefreshCw,
} from "lucide-react";
import { hotelAPI } from "../../services/api";

export default function HotelHome() {
  const { user } = useAuth();
  const hour       = new Date().getHours();
  const uploadOpen = hour < 20;

  const [dashboard, setDashboard] = useState(null);
  const [recent,    setRecent]    = useState([]);
  const [loading,   setLoading]   = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, histRes] = await Promise.all([
        hotelAPI.getDashboard(),
        hotelAPI.getHistory(),
      ]);
      setDashboard(dashRes.data || {});
      // Show only the 3 most recent uploads
      setRecent((histRes.data.history || []).slice(0, 3));
    } catch {
      // Fail silently — dashboard is informational
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hygienePoints  = dashboard?.hygiene_points   ?? 0;
  const totalUploads   = dashboard?.total_uploads     ?? "—";
  const edibleUploads  = dashboard?.edible_uploads    ?? "—";
  const wasteUploads   = totalUploads !== "—" && edibleUploads !== "—"
    ? totalUploads - edibleUploads : "—";
  const pickupsDone    = dashboard?.pickups_completed ?? "—";

  return (
    <div>
      {/* Time Banner */}
      <div style={{
        background: uploadOpen ? "#dcfce7" : "#fee2e2",
        border: `1px solid ${uploadOpen ? "#bbf7d0" : "#fecaca"}`,
        borderRadius: "var(--radius-md)", padding: "12px 20px",
        display: "flex", alignItems: "center", gap: 10,
        marginBottom: 24,
        color: uploadOpen ? "#15803d" : "#b91c1c",
        fontSize: 14, fontWeight: 500,
      }}>
        <Clock size={18} />
        {uploadOpen
          ? `Upload window is open until 8 PM — ${20 - hour} hour${20 - hour !== 1 ? "s" : ""} remaining.`
          : "Upload window is closed. Food uploads are accepted until 8 PM daily."}
      </div>

      {/* Stats — all from DB */}
      <div className="stats-grid">
        {[
          { label: "Total Uploads",      value: totalUploads,  icon: Upload,      color: "hotel", change: "All time" },
          { label: "Edible Items",        value: edibleUploads, icon: CheckCircle, color: "ngo",   change: "Available for NGOs" },
          { label: "Waste Items",         value: wasteUploads,  icon: AlertCircle, color: "hotel", change: "Routed to municipal" },
          { label: "Hygiene Points",      value: hygienePoints, icon: Star,        color: "hotel", change: "Awarded by NGOs" },
        ].map(({ label, value, icon: Icon, color, change }) => (
          <div key={label} className={`stat-card ${color}`}>
            <div className={`stat-icon ${color}`}><Icon size={20} /></div>
            <div className="stat-value">{loading ? "…" : value}</div>
            <div className="stat-label">{label}</div>
            <div className="stat-change up">{change}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid-2" style={{ gap: 20, marginTop: 20 }}>
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Quick Actions</div>
              <div className="card-subtitle">Manage your food uploads</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Link to="/hotel/upload">
              <button
                className="btn btn-hotel btn-full"
                disabled={!uploadOpen}
                style={{ justifyContent: "flex-start", gap: 12, padding: "14px 18px" }}
              >
                <Upload size={20} />
                <div style={{ textAlign: "left" }}>
                  <div>Upload Surplus Food</div>
                  <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>
                    {uploadOpen ? "Window open — upload now" : "Closed after 8 PM"}
                  </div>
                </div>
              </button>
            </Link>
            <Link to="/hotel/history">
              <button className="btn btn-ghost btn-full" style={{ justifyContent: "flex-start", gap: 12, padding: "14px 18px" }}>
                <History size={20} />
                <div style={{ textAlign: "left" }}>
                  <div>View Upload History</div>
                  <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>
                    {loading ? "Loading…" : `${totalUploads} total records`}
                  </div>
                </div>
              </button>
            </Link>
            <Link to="/hotel/score">
              <button className="btn btn-ghost btn-full" style={{ justifyContent: "flex-start", gap: 12, padding: "14px 18px" }}>
                <Star size={20} />
                <div style={{ textAlign: "left" }}>
                  <div>Hygiene Points</div>
                  <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>
                    {loading ? "Loading…" : `${hygienePoints} pts — awarded by NGOs`}
                  </div>
                </div>
              </button>
            </Link>
          </div>
        </div>

        {/* Hygiene Points Card — live from DB */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Hygiene Points</div>
              <div className="card-subtitle">Awarded by NGOs after pickup</div>
            </div>
            <Link to="/hotel/score">
              <button className="btn btn-ghost btn-sm">Details →</button>
            </Link>
          </div>
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div className="score-ring">
              <svg viewBox="0 0 120 120" width="120" height="120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-hover)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke="var(--hotel-primary)" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 52 * Math.min(hygienePoints / 100, 1)} ${2 * Math.PI * 52 * Math.max(1 - hygienePoints / 100, 0)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="score-ring-value">
                {loading ? "…" : hygienePoints}
                <div className="score-ring-label">pts</div>
              </div>
            </div>
            <div style={{ marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>
              {hygienePoints >= 80 ? "⭐ Excellent" :
               hygienePoints >= 50 ? "👍 Good" :
               hygienePoints >= 20 ? "📈 Improving" : "🆕 Getting started"}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
              Points are awarded by the NGO when they confirm your pickup
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            {[
              { label: "Successful Pickups", value: loading ? "…" : `${pickupsDone}` },
              { label: "Kg Donated",         value: loading ? "…" : `${Number(dashboard?.kg_donated ?? 0).toFixed(1)} kg` },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between",
                padding: "8px 0", borderBottom: "1px solid var(--border)",
                fontSize: 13,
              }}>
                <span style={{ color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Uploads — last 3 from DB */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Recent Uploads</div>
            <div className="card-subtitle">Your last 3 food submissions</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" style={{ gap: 6 }} onClick={fetchData}>
              <RefreshCw size={14} /> Refresh
            </button>
            <Link to="/hotel/history">
              <button className="btn btn-ghost btn-sm">View All →</button>
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
                  <th>Food Item</th>
                  <th>Status</th>
                  <th>Quantity</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Hygiene Pts ⭐</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                      No uploads yet. <Link to="/hotel/upload" style={{ color: "var(--hotel-primary)" }}>Upload your first food item →</Link>
                    </td>
                  </tr>
                )}
                {recent.map((r) => (
                  <tr key={r.upload_id}>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span>{r.ai_label === "edible" ? "🍱" : "🗑️"}</span>
                        {r.food_item}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${r.ai_label === "edible" ? "badge-edible" : "badge-waste"}`}>
                        {r.ai_label === "edible" ? "✅ Edible" : "⚠️ Waste"}
                      </span>
                    </td>
                    <td>{r.quantity} kg</td>
                    <td style={{ fontSize: 12 }}>{r.location || "—"}</td>
                    <td style={{ fontSize: 12 }}>{r.date}</td>
                    <td style={{ fontSize: 12 }}>{r.time}</td>
                    <td>
                      {r.hygiene_points > 0 ? (
                        <span style={{ color: "var(--hotel-primary)", fontWeight: 700 }}>+{r.hygiene_points} ⭐</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                          {r.status === "available" ? "Awaiting NGO" :
                           r.status === "claimed"   ? "NGO claimed" : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
