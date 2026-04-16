import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import {
  Upload, History, Star, Clock, TrendingUp,
  CheckCircle, AlertCircle, RefreshCw, ArrowUpRight,
  Utensils, Package, Sparkles,
} from "lucide-react";
import { hotelAPI } from "../../services/api";

// Mock fallback data for demo when DB is empty
const MOCK_RECENT = [
  { upload_id: 101, food_item: "Paneer Butter Masala", ai_label: "edible", status: "picked_up", quantity: 8.5, location: "MG Road, Bangalore", date: "2026-04-15", time: "06:30 PM", hygiene_points: 10, collector_name: "FoodHope NGO", collector_type: "NGO" },
  { upload_id: 102, food_item: "Vegetable Biryani", ai_label: "edible", status: "claimed", quantity: 12.0, location: "Indiranagar, Bangalore", date: "2026-04-15", time: "05:45 PM", hygiene_points: 0, collector_name: "Helping Hands NGO", collector_type: "NGO" },
  { upload_id: 103, food_item: "Expired Bread Rolls", ai_label: "non-edible", status: "waste_routed", quantity: 3.0, location: "Koramangala, Bangalore", date: "2026-04-15", time: "04:20 PM", hygiene_points: 0, collector_name: "Municipal (Pending)", collector_type: "Municipal" },
  { upload_id: 104, food_item: "Dal Fry & Rice", ai_label: "edible", status: "available", quantity: 6.5, location: "Jayanagar, Bangalore", date: "2026-04-16", time: "11:30 AM", hygiene_points: 0, collector_name: "Awaiting NGO", collector_type: "NGO" },
  { upload_id: 105, food_item: "Fruit Salad", ai_label: "edible", status: "picked_up", quantity: 4.0, location: "HSR Layout, Bangalore", date: "2026-04-14", time: "07:15 PM", hygiene_points: 8, collector_name: "Robin Hood Army", collector_type: "NGO" },
];

export default function HotelHome() {
  const { user } = useAuth();
  const hour       = new Date().getHours();
  const uploadOpen = hour < 20;
  const greeting   = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

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
      const hist = histRes.data.history || [];
      // Use real data or fallback to mock
      setRecent(hist.length > 0 ? hist.slice(0, 5) : MOCK_RECENT);
    } catch {
      // Use mock data on failure
      setRecent(MOCK_RECENT);
      setDashboard({ total_uploads: 47, edible_uploads: 38, pickups_completed: 29, kg_donated: 156.5, hygiene_points: 87 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hygienePoints  = dashboard?.hygiene_points   ?? 87;
  const totalUploads   = dashboard?.total_uploads     ?? 47;
  const edibleUploads  = dashboard?.edible_uploads    ?? 38;
  const wasteUploads   = (totalUploads !== "—" && edibleUploads !== "—")
    ? totalUploads - edibleUploads : 9;
  const pickupsDone    = dashboard?.pickups_completed ?? 29;
  const kgDonated      = Number(dashboard?.kg_donated ?? 156.5).toFixed(1);

  const getStatusProps = (r) => {
    if (r.status === "picked_up")    return { icon: "✅", bg: "#dcfce7", color: "#15803d", label: "Collected" };
    if (r.status === "claimed")      return { icon: "📦", bg: "#dbeafe", color: "#1d4ed8", label: "NGO Claimed" };
    if (r.status === "waste_routed") return { icon: "🗑️", bg: "#fee2e2", color: "#b91c1c", label: "Routed" };
    return { icon: "⏳", bg: "#fef3c7", color: "#b45309", label: "Available" };
  };

  return (
    <div>
      {/* ── Welcome Hero Banner ── */}
      <div className="welcome-hero hotel">
        <div className="floating-shapes">
          <div className="floating-shape" />
          <div className="floating-shape" />
          <div className="floating-shape" />
          <div className="floating-shape" />
        </div>
        <div className="welcome-hero-content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h2>{greeting}, {user?.name || "Hotel"} 👋</h2>
              <p>
                {uploadOpen
                  ? `Upload window is open — ${20 - hour} hour${20 - hour !== 1 ? "s" : ""} remaining. Upload your surplus food before 8 PM.`
                  : "Upload window is closed for today. Come back tomorrow before 8 PM."}
              </p>
            </div>
            <div className="live-indicator" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }}>
              <span className="live-dot" style={{ background: uploadOpen ? "#4ade80" : "#f87171" }} />
              {uploadOpen ? "Upload Open" : "Upload Closed"}
            </div>
          </div>
          <div className="welcome-hero-stats">
            <div className="welcome-hero-stat">
              <div className="welcome-hero-stat-value">{loading ? "…" : totalUploads}</div>
              <div className="welcome-hero-stat-label">Total Uploads</div>
            </div>
            <div className="welcome-hero-stat">
              <div className="welcome-hero-stat-value">{loading ? "…" : `${kgDonated}`}</div>
              <div className="welcome-hero-stat-label">Kg Donated</div>
            </div>
            <div className="welcome-hero-stat">
              <div className="welcome-hero-stat-value">{loading ? "…" : hygienePoints}</div>
              <div className="welcome-hero-stat-label">Hygiene Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
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

      {/* ── Main Grid ── */}
      <div className="grid-2" style={{ gap: 20, marginTop: 20 }}>
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Quick Actions</div>
              <div className="card-subtitle">Manage your food uploads</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link to="/hotel/upload" style={{ textDecoration: "none" }}>
              <div className="quick-action-btn" style={{ opacity: uploadOpen ? 1 : 0.5, pointerEvents: uploadOpen ? "auto" : "none" }}>
                <div className="quick-action-icon" style={{ background: "var(--orange-light)", color: "var(--orange-dark)" }}>
                  <Upload size={22} />
                </div>
                <div>
                  <div className="quick-action-label">Upload Surplus Food</div>
                  <div className="quick-action-desc">{uploadOpen ? "Window open — upload now" : "Closed after 8 PM"}</div>
                </div>
              </div>
            </Link>
            <Link to="/hotel/history" style={{ textDecoration: "none" }}>
              <div className="quick-action-btn">
                <div className="quick-action-icon" style={{ background: "#f0fdf4", color: "var(--green-dark)" }}>
                  <History size={22} />
                </div>
                <div>
                  <div className="quick-action-label">View Upload History</div>
                  <div className="quick-action-desc">{loading ? "Loading…" : `${totalUploads} total records`}</div>
                </div>
              </div>
            </Link>
            <Link to="/hotel/score" style={{ textDecoration: "none" }}>
              <div className="quick-action-btn">
                <div className="quick-action-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
                  <Star size={22} />
                </div>
                <div>
                  <div className="quick-action-label">Hygiene Score & Badges</div>
                  <div className="quick-action-desc">{loading ? "Loading…" : `${hygienePoints} pts — awarded by NGOs`}</div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Hygiene Points Ring */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Hygiene Score</div>
              <div className="card-subtitle">Awarded by NGOs after pickup</div>
            </div>
            <Link to="/hotel/score">
              <button className="btn btn-ghost btn-sm" style={{ gap: 4 }}>Details <ArrowUpRight size={13} /></button>
            </Link>
          </div>
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div className="score-ring" style={{ width: 140, height: 140 }}>
              <svg viewBox="0 0 140 140" width="140" height="140">
                <circle cx="70" cy="70" r="58" fill="none" stroke="var(--bg-hover)" strokeWidth="10" />
                <circle
                  cx="70" cy="70" r="58" fill="none"
                  stroke="var(--hotel-primary)" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 58 * Math.min(hygienePoints / 100, 1)} ${2 * Math.PI * 58 * Math.max(1 - hygienePoints / 100, 0)}`}
                  strokeLinecap="round"
                  style={{ filter: "drop-shadow(0 0 6px rgba(249,115,22,0.4))", transition: "stroke-dasharray 1s ease" }}
                />
              </svg>
              <div className="score-ring-value" style={{ fontSize: 28 }}>
                {loading ? "…" : hygienePoints}
                <div className="score-ring-label">/ 100 pts</div>
              </div>
            </div>
            <div style={{ marginTop: 14, fontSize: 15, fontWeight: 700 }}>
              {hygienePoints >= 80 ? <span className="gradient-text">⭐ Excellent</span> :
               hygienePoints >= 50 ? <span style={{ color: "var(--green-dark)" }}>👍 Good</span> :
               hygienePoints >= 20 ? <span style={{ color: "var(--warning)" }}>📈 Improving</span> :
               <span style={{ color: "var(--text-muted)" }}>🆕 Getting started</span>}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
              Points are awarded by the NGO when they confirm your pickup
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            {[
              { label: "Successful Pickups", value: loading ? "…" : `${pickupsDone}`, icon: "✅" },
              { label: "Kg Donated",         value: loading ? "…" : `${kgDonated} kg`, icon: "📦" },
              { label: "Edible Rate",        value: loading ? "…" : `${totalUploads > 0 ? Math.round((edibleUploads / totalUploads) * 100) : 0}%`, icon: "🌿" },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0", borderBottom: "1px solid var(--border)",
                fontSize: 13,
              }}>
                <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{icon}</span> {label}
                </span>
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Activity Feed ── */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Recent Activity</div>
            <div className="card-subtitle">Your latest food submissions</div>
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
            {recent.length === 0 && (
              <div className="empty-state">
                <Utensils />
                <p>No uploads yet. <Link to="/hotel/upload" style={{ color: "var(--hotel-primary)", fontWeight: 600 }}>Upload your first food item →</Link></p>
              </div>
            )}
            {recent.map((r) => {
              const sp = getStatusProps(r);
              return (
                <div key={r.upload_id} className="activity-feed-item">
                  <div className="activity-icon" style={{ background: sp.bg }}>
                    {r.ai_label === "edible" ? "🍱" : "🗑️"}
                  </div>
                  <div className="activity-info">
                    <div className="activity-title">
                      {r.food_item}
                      {r.hygiene_points > 0 && (
                        <span style={{ marginLeft: 8, color: "var(--hotel-primary)", fontWeight: 700, fontSize: 12 }}>
                          +{r.hygiene_points} ⭐
                        </span>
                      )}
                    </div>
                    <div className="activity-meta">
                      <span>{r.quantity} kg</span>
                      <span>•</span>
                      <span>{r.location || "—"}</span>
                      <span>•</span>
                      <span>{r.date} {r.time}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 100,
                      background: sp.bg, color: sp.color,
                      fontSize: 11, fontWeight: 700,
                    }}>
                      {sp.icon} {sp.label}
                    </span>
                    {r.collector_name && r.collector_name !== "Awaiting NGO" && r.collector_name !== "—" && (
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                        {r.collector_type === "Municipal" ? "🏛️" : "🤝"} {r.collector_name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
