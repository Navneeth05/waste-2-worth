import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Clock, Package, MapPin, Search, Star, RefreshCw } from "lucide-react";
import { ngoAPI } from "../../services/api";

const STATUS_BADGE = {
  confirmed: "badge-edible",
  claimed:   "badge-pending",
  cancelled: "badge-waste",
};

const STATUS_LABEL = {
  confirmed: "✅ Confirmed",
  claimed:   "⏳ Pending",
  cancelled: "❌ Cancelled",
};

// Points options: NGO can choose how many points to award
const POINT_OPTIONS = [3, 5, 8, 10];

const MOCK_PICKUPS = [
  { claim_id: 1, hotel: "Grand Palace Hotel",  item: "Rice & Curry",        quantity: 10.5, location: "MG Road, Bangalore",     status: "confirmed", claimed_at: "2026-04-15T18:30:00", confirmed_at: "2026-04-15T19:00:00", hygiene_pts_awarded: 10 },
  { claim_id: 2, hotel: "Elite Residency",      item: "Chapati & Sabzi",     quantity: 8.0,  location: "Indiranagar, Bangalore", status: "claimed",   claimed_at: "2026-04-15T17:45:00", confirmed_at: null,                   hygiene_pts_awarded: 0 },
  { claim_id: 3, hotel: "The Oberoi",           item: "Paneer Butter Masala", quantity: 6.5,  location: "Jayanagar, Bangalore",   status: "confirmed", claimed_at: "2026-04-14T16:00:00", confirmed_at: "2026-04-14T17:30:00", hygiene_pts_awarded: 8 },
  { claim_id: 4, hotel: "ITC Gardenia",         item: "Steamed Rice & Dal",  quantity: 14.0, location: "Whitefield, Bangalore",  status: "claimed",   claimed_at: "2026-04-14T15:00:00", confirmed_at: null,                   hygiene_pts_awarded: 0 },
  { claim_id: 5, hotel: "Radisson Blu",         item: "Fruit Salad",         quantity: 4.0,  location: "HSR Layout, Bangalore",  status: "confirmed", claimed_at: "2026-04-13T17:00:00", confirmed_at: "2026-04-13T18:15:00", hygiene_pts_awarded: 5 },
  { claim_id: 6, hotel: "Grand Palace Hotel",   item: "Chicken Biryani",     quantity: 12.0, location: "MG Road, Bangalore",     status: "confirmed", claimed_at: "2026-04-12T16:30:00", confirmed_at: "2026-04-12T18:00:00", hygiene_pts_awarded: 10 },
  { claim_id: 7, hotel: "Hyatt Regency",        item: "Naan & Roti",         quantity: 5.5,  location: "Koramangala, Bangalore", status: "claimed",   claimed_at: "2026-04-12T14:00:00", confirmed_at: null,                   hygiene_pts_awarded: 0 },
  { claim_id: 8, hotel: "Taj West End",         item: "Dal Fry & Rice",      quantity: 9.0,  location: "MG Road, Bangalore",     status: "confirmed", claimed_at: "2026-04-11T17:30:00", confirmed_at: "2026-04-11T19:00:00", hygiene_pts_awarded: 8 },
];

export default function Pickups() {
  const [pickups,    setPickups]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState("all");
  const [confirming, setConfirming] = useState(null);  // claim_id being confirmed
  const [awardMap,   setAwardMap]   = useState({});    // { claim_id: pointsToAward }
  const [toast,      setToast]      = useState(null);

  const fetchPickups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ngoAPI.getPickups();
      const data = res.data.pickups || [];
      setPickups(data.length > 0 ? data : MOCK_PICKUPS);
    } catch (err) {
      // Fallback to mock data
      setPickups(MOCK_PICKUPS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPickups(); }, [fetchPickups]);

  // NGO awards hygiene points and confirms the pickup
  const handleConfirm = async (pickup) => {
    const pts = awardMap[pickup.claim_id] ?? 5;
    setConfirming(pickup.claim_id);
    try {
      const res = await ngoAPI.confirmPickupAndAwardPoints(
        pickup.claim_id, pts, `Pickup confirmed by NGO`
      );
      setToast({
        type:    "success",
        message: `✅ Pickup confirmed! ${pts} hygiene points awarded to ${pickup.hotel}.`,
      });
      // Refresh list
      await fetchPickups();
    } catch (err) {
      setToast({
        type:    "error",
        message: err.response?.data?.detail || "Failed to confirm pickup",
      });
    } finally {
      setConfirming(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const filtered = pickups.filter((p) => {
    const ms = p.hotel?.toLowerCase().includes(search.toLowerCase()) ||
               p.item?.toLowerCase().includes(search.toLowerCase());
    const mf = filter === "all" || p.status === filter;
    return ms && mf;
  });

  const totalPoints = pickups.filter(p => p.status === "confirmed")
    .reduce((s, p) => s + (p.hygiene_pts_awarded || 0), 0);
  const completed   = pickups.filter(p => p.status === "confirmed").length;
  const pending     = pickups.filter(p => p.status === "claimed").length;

  return (
    <div>
      {/* Toast notification */}
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

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Claims",  value: pickups.length, icon: Package,     color: "ngo" },
          { label: "Confirmed",     value: completed,      icon: CheckCircle, color: "ngo" },
          { label: "Pending",       value: pending,        icon: Clock,       color: "ngo" },
          { label: "Hygiene Pts Awarded", value: `+${totalPoints}`, icon: Star, color: "ngo" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`stat-card ${color}`}>
            <div className={`stat-icon ${color}`}><Icon size={18} /></div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Info banner — explains the NGO hygiene points role */}
      <div style={{
        marginBottom: 20, padding: "14px 18px", borderRadius: "var(--radius-md)",
        background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04))",
        border: "1px solid rgba(16,185,129,0.25)",
        fontSize: 13, color: "#065f46",
        display: "flex", alignItems: "flex-start", gap: 10,
      }}>
        <Star size={18} style={{ flexShrink: 0, marginTop: 1 }} color="#059669" />
        <div>
          <strong>You award hygiene points.</strong> When you confirm a pickup, you choose
          how many hygiene points (3–10) to award to the hotel based on food quality,
          packaging, and FSSAI compliance. These points appear on the hotel's score dashboard.
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="form-input"
              placeholder="Search hotel or food..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
          {["all", "claimed", "confirmed", "cancelled"].map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${filter === s ? "btn-ngo" : "btn-ghost"}`}
              onClick={() => setFilter(s)}
              style={{ textTransform: "capitalize" }}
            >
              {s === "all" ? "All" : s === "claimed" ? "⏳ Pending" : s === "confirmed" ? "✅ Confirmed" : "❌ Cancelled"}
            </button>
          ))}
          <button className="btn btn-ghost btn-sm" style={{ gap: 6 }} onClick={fetchPickups}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
            <div className="spinner spinner-dark" style={{ margin: "0 auto 12px", width: 28, height: 28 }} />
            Loading pickups…
          </div>
        )}

        {error && !loading && (
          <div style={{
            padding: "14px 18px", borderRadius: "var(--radius-md)",
            background: "#fee2e2", border: "1px solid #fecaca",
            color: "#b91c1c", fontSize: 14, marginBottom: 16,
          }}>⚠️ {error}</div>
        )}

        {!loading && !error && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Hotel</th>
                  <th>Food Item</th>
                  <th>Qty</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Pts Awarded</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                    {pickups.length === 0 ? "No pickups yet. Claim food from the main dashboard!" : "No pickups found"}
                  </td></tr>
                )}
                {filtered.map((p, i) => (
                  <tr key={p.claim_id}>
                    <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>🏨 {p.hotel}</td>
                    <td>🍱 {p.item}</td>
                    <td>{p.quantity} kg</td>
                    <td style={{ fontSize: 12 }}>📍 {p.location || "—"}</td>
                    <td style={{ fontSize: 11 }}>{p.claimed_at ? new Date(p.claimed_at).toLocaleDateString() : "—"}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[p.status] || "badge-pending"}`}>
                        {STATUS_LABEL[p.status] || p.status}
                      </span>
                    </td>
                    <td>
                      {p.hygiene_pts_awarded > 0 ? (
                        <span style={{ color: "var(--ngo-primary)", fontWeight: 700 }}>
                          +{p.hygiene_pts_awarded} ⭐
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td>
                      {p.status === "claimed" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {/* NGO selects how many points to award */}
                          <select
                            className="form-input form-select"
                            style={{ width: 60, padding: "4px 6px", fontSize: 12, height: 30 }}
                            value={awardMap[p.claim_id] ?? 5}
                            onChange={(e) =>
                              setAwardMap((prev) => ({ ...prev, [p.claim_id]: Number(e.target.value) }))
                            }
                            title="Select hygiene points to award"
                          >
                            {POINT_OPTIONS.map((pt) => (
                              <option key={pt} value={pt}>{pt} pts</option>
                            ))}
                          </select>
                          <button
                            className="btn btn-ngo btn-sm"
                            style={{ gap: 4, whiteSpace: "nowrap" }}
                            disabled={confirming === p.claim_id}
                            onClick={() => handleConfirm(p)}
                          >
                            {confirming === p.claim_id ? (
                              <><div className="spinner spinner-dark" style={{ width: 12, height: 12 }} /> Confirming…</>
                            ) : (
                              <><CheckCircle size={13} /> Confirm & Award</>
                            )}
                          </button>
                        </div>
                      )}
                      {p.status === "confirmed" && (
                        <span style={{ fontSize: 12, color: "var(--ngo-primary)", fontWeight: 600 }}>
                          ✓ Done
                        </span>
                      )}
                      {p.status === "cancelled" && (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
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
