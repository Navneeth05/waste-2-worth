import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Map, Package, Bell, Star, TrendingUp, CheckCircle, Clock, Navigation, RefreshCw, ArrowUpRight, Sparkles } from "lucide-react";
import { ngoAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const NGO_LOC = { lat: 12.9600, lng: 77.5800 };

// Mock fallback data
const MOCK_FOOD = [
  { upload_id: 201, hotel_name: "Grand Palace Hotel", food_item: "Mix Veg Curry", quantity: 10.5, location: "MG Road, Bangalore", city: "Bangalore", zone: "Zone A", upload_time: "06:30 PM", latitude: 12.9716, longitude: 77.5946 },
  { upload_id: 202, hotel_name: "Elite Residency", food_item: "Chapati & Sabzi", quantity: 8.0, location: "Indiranagar, Bangalore", city: "Bangalore", zone: "Zone B", upload_time: "05:45 PM", latitude: 12.9352, longitude: 77.6245 },
  { upload_id: 203, hotel_name: "The Oberoi", food_item: "Paneer Butter Masala", quantity: 6.5, location: "Jayanagar, Bangalore", city: "Bangalore", zone: "Zone A", upload_time: "04:20 PM", latitude: 12.9733, longitude: 77.6117 },
  { upload_id: 204, hotel_name: "ITC Gardenia", food_item: "Steamed Rice & Dal", quantity: 14.0, location: "Whitefield, Bangalore", city: "Bangalore", zone: "Zone C", upload_time: "03:00 PM", latitude: 12.9600, longitude: 77.5900 },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, title: "New food available!", message: "Grand Palace Hotel uploaded 10.5 kg of Mix Veg Curry", time: "2 min ago" },
  { id: 2, title: "Pickup confirmed", message: "You earned 10 notice points for confirming pickup from Elite Residency", time: "1 hour ago" },
  { id: 3, title: "Food expiring soon", message: "Chapati & Sabzi from Elite Residency — claim before it expires", time: "3 hours ago" },
];

export default function NGOHome({ notifications: propNotifs = [] }) {
  const { user } = useAuth();
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  const [foodList,   setFoodList]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [claimedIds, setClaimedIds] = useState([]);
  const [claiming,   setClaiming]   = useState(null);
  const [dashboard,  setDashboard]  = useState(null);
  const [toast,      setToast]      = useState(null);

  const notifications = propNotifs.length > 0 ? propNotifs : MOCK_NOTIFICATIONS;

  const fetchAvailable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ngoAPI.getAvailableFood();
      const data = res.data.available || [];
      setFoodList(data.length > 0 ? data : MOCK_FOOD);
    } catch (err) {
      setFoodList(MOCK_FOOD);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await ngoAPI.getDashboard();
      setDashboard(res.data);
    } catch {
      setDashboard({ pickups_done: 12, notice_points: 45, pending_pickups: 3, meals_served_estimate: 42, available_food_count: 4 });
    }
  }, []);

  useEffect(() => {
    fetchAvailable();
    fetchDashboard();
  }, [fetchAvailable, fetchDashboard]);

  const handleClaim = useCallback(async (food) => {
    setClaiming(food.upload_id);
    try {
      await ngoAPI.claimFood(food.upload_id);
      setClaimedIds((prev) => [...prev, food.upload_id]);
      setToast({ type: "success", message: `✅ Claimed ${food.food_item} from ${food.hotel_name}! Go to Pickups to confirm.` });
      setFoodList((prev) => prev.filter((f) => f.upload_id !== food.upload_id));
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.detail || "Failed to claim food" });
    } finally {
      setClaiming(null);
      setTimeout(() => setToast(null), 4000);
    }
  }, []);

  const openNav = (food) => {
    const dest = food.latitude && food.longitude
      ? `${food.latitude},${food.longitude}`
      : encodeURIComponent(food.location || food.hotel_name);
    window.open(`https://www.google.com/maps/dir/${NGO_LOC.lat},${NGO_LOC.lng}/${dest}`, "_blank");
  };

  const claimedThisSession = claimedIds.length;

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
          fontSize: 14, fontWeight: 500,
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          animation: "slideInRight 0.3s ease", maxWidth: 380,
        }}>
          {toast.message}
        </div>
      )}

      {/* ── Welcome Hero Banner ── */}
      <div className="welcome-hero ngo">
        <div className="floating-shapes">
          <div className="floating-shape" />
          <div className="floating-shape" />
          <div className="floating-shape" />
          <div className="floating-shape" />
        </div>
        <div className="welcome-hero-content">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h2>{greeting}, {user?.name || "NGO"} 🤝</h2>
              <p>
                {foodList.length > 0
                  ? `There are ${foodList.length} edible food items available for pickup right now. Claim them before they expire!`
                  : "All food has been claimed! Check back later for new uploads from hotels."}
              </p>
            </div>
            <div className="live-indicator" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }}>
              <span className="live-dot" style={{ background: "#fff" }} />
              {foodList.length} Available
            </div>
          </div>
          <div className="welcome-hero-stats">
            <div className="welcome-hero-stat">
              <div className="welcome-hero-stat-value">{dashboard?.pickups_done ?? "—"}</div>
              <div className="welcome-hero-stat-label">Pickups Done</div>
            </div>
            <div className="welcome-hero-stat">
              <div className="welcome-hero-stat-value">{dashboard?.notice_points ?? "—"}</div>
              <div className="welcome-hero-stat-label">Notice Points</div>
            </div>
            <div className="welcome-hero-stat">
              <div className="welcome-hero-stat-value">{dashboard?.meals_served_estimate ? Math.round(dashboard.meals_served_estimate) : "—"}</div>
              <div className="welcome-hero-stat-label">Meals Served</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Available Now",    value: String(foodList.length),                       icon: Bell,        color: "ngo",  change: "Updated live" },
          { label: "Pickups Done",     value: String(dashboard?.pickups_done ?? "—"),         icon: CheckCircle, color: "ngo",  change: "Confirmed" },
          { label: "Notice Points",    value: String(dashboard?.notice_points ?? "—"),        icon: Star,        color: "ngo",  change: "Your total score" },
          { label: "Meals Served",     value: dashboard?.meals_served_estimate
              ? `${Math.round(dashboard.meals_served_estimate)}` : "—",                       icon: TrendingUp,  color: "ngo",  change: "Estimated total" },
        ].map(({ label, value, icon: Icon, color, change }) => (
          <div key={label} className={`stat-card ${color}`}>
            <div className={`stat-icon ${color}`}><Icon size={20} /></div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            <div className="stat-change up">{change}</div>
          </div>
        ))}
      </div>

      {/* Session claimed banner */}
      {claimedThisSession > 0 && (
        <div className="card" style={{
          marginBottom: 20,
          background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
          border: "1px solid #bbf7d0",
        }}>
          <div className="card-header">
            <div>
              <div className="card-title" style={{ color: "#15803d" }}>✅ {claimedThisSession} Item{claimedThisSession !== 1 ? "s" : ""} Claimed This Session</div>
              <div className="card-subtitle">Go to Pickups → Confirm & Award hygiene points to the hotel</div>
            </div>
            <Link to="/ngo/pickups">
              <button className="btn btn-ngo btn-sm"><Package size={14} /> My Pickups</button>
            </Link>
          </div>
        </div>
      )}

      {/* Available food — as activity feed cards */}
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <div className="card-header">
          <div>
            <div className="card-title">Available Food Nearby</div>
            <div className="card-subtitle">
              {loading ? "Loading…" : `${foodList.length} edible item${foodList.length !== 1 ? "s" : ""} ready for pickup`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" style={{ gap: 6 }} onClick={() => { fetchAvailable(); fetchDashboard(); }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <Link to="/ngo/map">
              <button className="btn btn-ngo btn-sm"><Map size={14} /> Open Map</button>
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
            {foodList.length === 0 && (
              <div className="empty-state">
                <Sparkles />
                <p>🎉 All food has been claimed! Check back later.</p>
              </div>
            )}
            {foodList.map((f) => (
              <div key={f.upload_id} className="activity-feed-item">
                <div className="activity-icon edible">🍱</div>
                <div className="activity-info">
                  <div className="activity-title">
                    <span style={{ marginRight: 6 }}>🏨</span>{f.hotel_name}
                    <span style={{ marginLeft: 8, color: "var(--text-muted)", fontWeight: 400, fontSize: 12 }}>— {f.food_item}</span>
                  </div>
                  <div className="activity-meta">
                    <span>{f.quantity} kg</span>
                    <span>•</span>
                    <span>📍 {f.location || f.city || "—"}</span>
                    <span>•</span>
                    <span>🕐 {f.upload_time}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                  {claiming === f.upload_id ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ngo-primary)" }}>
                      <div className="spinner spinner-dark" style={{ width: 14, height: 14 }} /> Claiming…
                    </span>
                  ) : (
                    <button className="btn btn-ngo btn-sm" onClick={() => handleClaim(f)}>
                      <CheckCircle size={13} /> Claim
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => openNav(f)} style={{ gap: 4 }}>
                    <Navigation size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid-2" style={{ gap: 20, marginTop: 20 }}>
        {/* Quick actions */}
        <div className="card">
          <div className="card-header"><div className="card-title">Quick Actions</div></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link to="/ngo/map" style={{ textDecoration: "none" }}>
              <div className="quick-action-btn">
                <div className="quick-action-icon" style={{ background: "var(--green-light)", color: "var(--green-dark)" }}>
                  <Map size={22} />
                </div>
                <div>
                  <div className="quick-action-label">View Food Map</div>
                  <div className="quick-action-desc">Live locations of available food</div>
                </div>
              </div>
            </Link>
            <Link to="/ngo/pickups" style={{ textDecoration: "none" }}>
              <div className="quick-action-btn">
                <div className="quick-action-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>
                  <Package size={22} />
                </div>
                <div>
                  <div className="quick-action-label">My Pickups</div>
                  <div className="quick-action-desc">Confirm pickups & award hygiene points</div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Notice Points + Notifications */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Notice Points</div>
              <div className="card-subtitle">Earned per confirmed pickup</div>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div className="score-ring" style={{ width: 120, height: 120 }}>
              <svg viewBox="0 0 120 120" width="120" height="120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-base)" strokeWidth="10" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--ngo-primary)" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 52 * Math.min((dashboard?.notice_points || 0) / 500, 1)} ${2 * Math.PI * 52 * Math.max(1 - (dashboard?.notice_points || 0) / 500, 0)}`}
                  strokeLinecap="round"
                  style={{ filter: "drop-shadow(0 0 6px rgba(34,197,94,0.4))", transition: "stroke-dasharray 1s ease" }} />
              </svg>
              <div className="score-ring-value">
                {dashboard?.notice_points ?? "—"}
                <div className="score-ring-label">pts</div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700 }}>
              🏅 {(dashboard?.notice_points || 0) >= 200 ? <span className="gradient-text ngo">Gold Level</span> : (dashboard?.notice_points || 0) >= 100 ? "Silver Level" : "Bronze Level"} NGO
            </div>
          </div>

          <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Recent Alerts</div>
            {notifications.slice(0, 3).map((n) => (
              <div key={n.id} style={{
                padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.04)",
                display: "flex", alignItems: "flex-start", gap: 10,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "var(--ngo-light)", color: "var(--ngo-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12,
                }}>
                  <Bell size={13} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{n.message}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
