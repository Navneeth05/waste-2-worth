import { useState, useEffect } from "react";
import { Search, Filter, Download, RefreshCw } from "lucide-react";
import { hotelAPI } from "../../services/api";

export default function History() {
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await hotelAPI.getHistory();
      setHistory(res.data.history || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const filtered = history.filter((r) => {
    const matchSearch = r.food_item?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || r.ai_label === filter;
    return matchSearch && matchFilter;
  });

  const totalEdible  = history.filter((r) => r.ai_label === "edible").length;
  const totalWaste   = history.filter((r) => r.ai_label === "non-edible").length;
  const totalPoints  = history.reduce((s, r) => s + (r.hygiene_points || 0), 0);

  const handleExportCSV = () => {
    const header = ["#", "Food Item", "AI Label", "Status", "Quantity (kg)", "Location", "Date", "Time", "Collected By", "Collector Type", "Hygiene Pts"];
    const rows = filtered.map((r, i) => [
      i + 1, r.food_item, r.ai_label, r.status,
      r.quantity || "—", r.location || "—",
      r.date, r.time,
      r.collector_name || "—", r.collector_type || "—",
      r.hygiene_points || 0,
    ]);
    const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "hotel_food_history.csv";
    a.click();
  };

  return (
    <div>
      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Uploads",        value: history.length, color: "hotel" },
          { label: "Edible",               value: totalEdible,    color: "ngo"   },
          { label: "Non-Edible",           value: totalWaste,     color: "hotel" },
          { label: "Hygiene Points Earned (awarded by NGOs)", value: totalPoints, color: "hotel" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`stat-card ${color}`}>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="card">
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              id="history-search"
              className="form-input"
              placeholder="Search food items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
          <select
            id="history-filter"
            className="form-input form-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: 160 }}
          >
            <option value="all">All Items</option>
            <option value="edible">Edible Only</option>
            <option value="non-edible">Waste Only</option>
          </select>
          <button className="btn btn-ghost" style={{ gap: 6 }} onClick={fetchHistory}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn btn-ghost" style={{ gap: 6 }} onClick={handleExportCSV}>
            <Download size={15} /> Export CSV
          </button>
        </div>

        {/* Loading / Error states */}
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
            <div className="spinner spinner-dark" style={{ margin: "0 auto 12px", width: 28, height: 28 }} />
            Loading history from database…
          </div>
        )}

        {error && !loading && (
          <div style={{
            padding: "16px 20px", borderRadius: "var(--radius-md)",
            background: "#fee2e2", border: "1px solid #fecaca",
            color: "#b91c1c", fontSize: 14, marginBottom: 16,
          }}>
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Food Item</th>
                  <th>AI Label</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Collected By</th>
                  <th>Hygiene Pts ⭐</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                    {history.length === 0 ? "No uploads yet. Upload your first food item!" : "No records found"}
                  </td></tr>
                )}
                {filtered.map((r, i) => (
                  <tr key={r.upload_id}>
                    <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span>{r.ai_label === "edible" ? "🍱" : "🗑️"}</span>
                        {r.food_item}
                      </div>
                    </td>
                    {/* AI Label badge */}
                    <td>
                      <span className={`badge ${r.ai_label === "edible" ? "badge-edible" : "badge-waste"}`}>
                        {r.ai_label === "edible" ? "✅ Edible" : "⚠️ Waste"}
                      </span>
                    </td>
                    {/* Quantity — uses r.quantity from DB */}
                    <td style={{ fontWeight: 600 }}>
                      {r.quantity ? `${r.quantity} kg` : "—"}
                    </td>
                    {/* Pickup status */}
                    <td>
                      <span className={`badge ${
                        r.status === "picked_up"    ? "badge-edible"  :
                        r.status === "claimed"      ? "badge-pending" :
                        r.status === "waste_routed" ? "badge-waste"   : "badge-pending"
                      }`}>
                        {r.status === "picked_up"    ? "✅ Collected" :
                         r.status === "claimed"      ? "📦 Claimed"  :
                         r.status === "waste_routed" ? "🗑️ Routed"   : "⏳ Available"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{r.location || "—"}</td>
                    <td>{r.date}</td>
                    <td>{r.time}</td>
                    {/* Collected By — NGO name or Municipal */}
                    <td style={{ fontSize: 12 }}>
                      {r.collector_type === "Municipal" ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{
                            padding: "2px 8px", borderRadius: 100,
                            background: "#eff6ff", color: "#1d4ed8",
                            fontSize: 11, fontWeight: 700,
                          }}>🏛️ Municipal</span>
                          {r.collector_name !== "Municipal" && (
                            <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
                              {r.collector_name}
                            </span>
                          )}
                        </span>
                      ) : r.collector_name && r.collector_name !== "Awaiting NGO" && r.collector_name !== "—" ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{
                            padding: "2px 8px", borderRadius: 100,
                            background: "#dcfce7", color: "#15803d",
                            fontSize: 11, fontWeight: 700,
                          }}>🤝 NGO</span>
                          <span style={{ color: "var(--ngo-primary)", fontWeight: 600 }}>
                            {r.collector_name}
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
                          {r.collector_name || "⏳ Awaiting"}
                        </span>
                      )}
                    </td>
                    {/* Hygiene Points (NGO-awarded, only for edible) */}
                    <td>
                      {r.hygiene_points > 0 ? (
                        <span style={{ color: "var(--hotel-primary)", fontWeight: 700 }}>
                          +{r.hygiene_points} ⭐
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>
                          {r.ai_label === "non-edible" ? "—" :
                           r.status === "picked_up"    ? "✓" : "Pending"}
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

      {/* Info note about hygiene points */}
      <div style={{
        marginTop: 16, padding: "12px 16px", borderRadius: "var(--radius-sm)",
        background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
        fontSize: 12, color: "#92400e", display: "flex", alignItems: "center", gap: 8,
      }}>
        ⭐ <strong>Hygiene Points are awarded by the NGO</strong> after confirming pickup.
        They are not auto-assigned — the NGO judges and awards them upon successful collection.
      </div>
    </div>
  );
}