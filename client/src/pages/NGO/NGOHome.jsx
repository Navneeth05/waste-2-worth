import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Map, Package, Bell, Star, TrendingUp, CheckCircle, Clock, Navigation, RefreshCw } from "lucide-react";
import { ngoAPI } from "../../services/api";

const NGO_LOC = { lat: 12.9600, lng: 77.5800 };

export default function NGOHome({ notifications = [] }) {
  const [foodList,   setFoodList]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [claimedIds, setClaimedIds] = useState([]); // local set of upload_ids claimed this session
  const [claiming,   setClaiming]   = useState(null);
  const [dashboard,  setDashboard]  = useState(null);
  const [toast,      setToast]      = useState(null);

  const fetchAvailable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ngoAPI.getAvailableFood();
      setFoodList(res.data.available || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load available food");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await ngoAPI.getDashboard();
      setDashboard(res.data);
    } catch { /* silent — stats are not critical */ }
  }, []);

  useEffect(() => {
    fetchAvailable();
    fetchDashboard();
  }, [fetchAvailable, fetchDashboard]);

  const handleClaim = useCallback(async (food) => {
    setClaiming(food.upload_id);
    try {
      const res = await ngoAPI.claimFood(food.upload_id);
      setClaimedIds((prev) => [...prev, food.upload_id]);
      setToast({ type: "success", message: `✅ Claimed ${food.food_item} from ${food.hotel_name}! Go to Pickups to confirm.` });
      // Remove from list
      setFoodList((prev) => prev.filter((f) => f.upload_id !== food.upload_id));
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.detail || "Failed to claim food" });
    } finally {
      setClaiming(null);
      setTimeout(() => setToast(null), 4000);
    }
  }, []);

  const openNav = (food) => {
    // Use food location text for Google Maps search if no lat/lng
    const dest = food.lat && food.lng
      ? `${food.lat},${food.lng}`
      : encodeURIComponent(food.location || food.hotel_name);
    const url = `https://www.google.com/maps/dir/${NGO_LOC.lat},${NGO_LOC.lng}/${dest}`;
    window.open(url, "_blank");
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

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Available Now",    value: String(foodList.length),                       icon: Bell,        color: "ngo",  change: "Updated live" },
          { label: "Pickups Done",     value: String(dashboard?.pickups_done ?? "—"),         icon: CheckCircle, color: "ngo",  change: "+this session" },
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

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Available food table */}
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

          {loading && (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
              <div className="spinner spinner-dark" style={{ margin: "0 auto 12px", width: 28, height: 28 }} />
              Fetching available food from database…
            </div>
          )}

          {error && !loading && (
            <div style={{
              padding: "14px 18px", borderRadius: "var(--radius-md)",
              background: "#fee2e2", border: "1px solid #fecaca",
              color: "#b91c1c", fontSize: 14,
            }}>⚠️ {error}</div>
          )}

          {!loading && !error && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Hotel</th>
                    <th>Food Item</th>
                    <th>Quantity</th>
                    <th>Location</th>
                    <th>Upload Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {foodList.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                      🎉 All food has been claimed! Check back later.
                    </td></tr>
                  )}
                  {foodList.map((f) => (
                    <tr key={f.upload_id}>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>🏨 {f.hotel_name}</td>
                      <td>🍱 {f.food_item}</td>
                      <td>{f.quantity} kg</td>
                      <td style={{ fontSize: 12 }}>📍 {f.location || f.city || "—"}</td>
                      <td>{f.upload_time}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
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
                            <Navigation size={13} /> Navigate
                          </button>
                        </div>
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
            <Link to="/ngo/map">
              <button className="btn btn-ngo btn-full" style={{ justifyContent: "flex-start", gap: 12, padding: "14px 18px" }}>
                <Map size={20} />
                <div style={{ textAlign: "left" }}>
                  <div>View Food Map</div>
                  <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>Live locations of available food</div>
                </div>
              </button>
            </Link>
            <Link to="/ngo/pickups">
              <button className="btn btn-ghost btn-full" style={{ justifyContent: "flex-start", gap: 12, padding: "14px 18px" }}>
                <Package size={20} />
                <div style={{ textAlign: "left" }}>
                  <div>My Pickups</div>
                  <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>Confirm pickups & award hygiene points</div>
                </div>
              </button>
            </Link>
          </div>
        </div>

        {/* Notice points */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Notice Points</div>
            <div className="card-subtitle">Earned per confirmed pickup</div>
          </div>
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div className="score-ring">
              <svg viewBox="0 0 120 120" width="120" height="120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-base)" strokeWidth="10" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--ngo-primary)" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 52 * Math.min((dashboard?.notice_points || 0) / 500, 1)} ${2 * Math.PI * 52 * Math.max(1 - (dashboard?.notice_points || 0) / 500, 0)}`}
                  strokeLinecap="round" />
              </svg>
              <div className="score-ring-value">
                {dashboard?.notice_points ?? "—"}
                <div className="score-ring-label">pts</div>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-muted)" }}>
              🏅 {(dashboard?.notice_points || 0) >= 200 ? "Gold" : (dashboard?.notice_points || 0) >= 100 ? "Silver" : "Bronze"} Level NGO
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Alerts</div>
              <div className="card-subtitle">{notifications.length} notifications</div>
            </div>
            <div className="pulse-dot" />
          </div>
          <div>
            {notifications.slice(0, 4).map((n) => (
              <div key={n.id} style={{
                padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.05)",
                display: "flex", alignItems: "flex-start", gap: 10,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "var(--radius-sm)",
                  background: "var(--ngo-light)", color: "var(--ngo-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Bell size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{n.message}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>{n.time}</div>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="empty-state"><Bell /><p>No notifications yet</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
