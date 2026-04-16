const MONTHLY = [
  { month: "Nov", waste: 620 }, { month: "Dec", waste: 740 },
  { month: "Jan", waste: 810 }, { month: "Feb", waste: 760 },
  { month: "Mar", waste: 830 }, { month: "Apr", waste: 892 },
];

const ZONES = [
  { zone: "Zone A", total: 220, collected: 195, pct: 89 },
  { zone: "Zone B", total: 185, collected: 160, pct: 86 },
  { zone: "Zone C", total: 160, collected: 110, pct: 69 },
  { zone: "Zone D", total: 180, collected: 145, pct: 81 },
  { zone: "Zone E", total: 147, collected: 140, pct: 95 },
];

const TOP_HOTELS = [
  { name: "Grand Buffet",      waste: "120 kg", zone: "Zone A", reports: 14 },
  { name: "Curry Leaf Hotel",  waste: "95 kg",  zone: "Zone A", reports: 11 },
  { name: "Coastal Kitchen",   waste: "88 kg",  zone: "Zone D", reports: 9  },
  { name: "Hotel Sunshine",    waste: "76 kg",  zone: "Zone B", reports: 8  },
  { name: "Spice Palace",      waste: "58 kg",  zone: "Zone C", reports: 7  },
];

const MAX_WASTE = Math.max(...MONTHLY.map((m) => m.waste));

export default function MunicipalStats() {
  return (
    <div>
      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Waste This Month", value: "892 kg" },
          { label: "Collection Rate",        value: "86%"    },
          { label: "Active Zones",           value: "5"      },
          { label: "Hotels Reporting",       value: "38"     },
        ].map(({ label, value }) => (
          <div key={label} className="stat-card muni">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Bar chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Monthly Waste Trend</div>
            <div className="card-subtitle">Non-edible food collected (kg)</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 180, marginTop: 16 }}>
            {MONTHLY.map(({ month, waste }) => (
              <div key={month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{waste}</div>
                <div
                  style={{
                    width: "100%",
                    background: "var(--muni-primary)",
                    borderRadius: "4px 4px 0 0",
                    height: `${(waste / MAX_WASTE) * 140}px`,
                    opacity: 0.7 + (waste / MAX_WASTE) * 0.3,
                    transition: "height 0.5s ease",
                  }}
                />
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone performance */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Zone Performance</div>
            <div className="card-subtitle">Collection efficiency by zone</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 4 }}>
            {ZONES.map(({ zone, total, collected, pct }) => (
              <div key={zone}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{zone}</span>
                  <span style={{ color: pct >= 85 ? "var(--ngo-primary)" : pct >= 70 ? "var(--warning)" : "var(--non-edible)", fontWeight: 700 }}>
                    {pct}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 85
                        ? "linear-gradient(90deg,var(--ngo-primary),#34d399)"
                        : pct >= 70
                        ? "linear-gradient(90deg,var(--warning),#fbbf24)"
                        : "linear-gradient(90deg,var(--non-edible),#f87171)",
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                  {collected} / {total} kg collected
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top waste hotels */}
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="card-header">
            <div className="card-title">Top Waste-Generating Hotels</div>
            <div className="card-subtitle">Requires targeted hygiene action</div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Hotel Name</th>
                  <th>Zone</th>
                  <th>Total Waste</th>
                  <th>Reports Filed</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {TOP_HOTELS.map((h, i) => (
                  <tr key={h.name}>
                    <td style={{ fontWeight: 700, color: i < 3 ? "var(--non-edible)" : "var(--text-muted)" }}>
                      {i < 3 ? "⚠️" : ""} #{i + 1}
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>🏨 {h.name}</td>
                    <td><span className="badge badge-collected">📌 {h.zone}</span></td>
                    <td style={{ color: "var(--non-edible)", fontWeight: 700 }}>{h.waste}</td>
                    <td>{h.reports} reports</td>
                    <td>
                      <button className="btn btn-danger btn-sm">Issue Notice</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
