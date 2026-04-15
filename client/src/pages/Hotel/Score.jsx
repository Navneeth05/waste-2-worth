const CRITERIA = [
  { label: "Food Quality & Freshness",  score: 92, max: 100, desc: "Based on AI image classification results" },
  { label: "Timely Uploads",            score: 88, max: 100, desc: "Uploads before 8 PM deadline" },
  { label: "Packaging & Presentation",  score: 78, max: 100, desc: "Assessed from food images" },
  { label: "Quantity Accuracy",         score: 85, max: 100, desc: "Reported vs actual quantity match" },
  { label: "NGO Pickup Success Rate",   score: 90, max: 100, desc: "% of edible uploads picked up" },
];

const HISTORY_SCORES = [
  { month: "Nov", score: 72 }, { month: "Dec", score: 78 },
  { month: "Jan", score: 80 }, { month: "Feb", score: 83 },
  { month: "Mar", score: 85 }, { month: "Apr", score: 87 },
];

const BADGES = [
  { icon: "🏆", label: "Top Donor",         desc: "Uploaded 100+ meals",         earned: true  },
  { icon: "⭐", label: "5-Star Hygiene",     desc: "Score above 85 for 3 months",  earned: true  },
  { icon: "⚡", label: "Fast Uploader",      desc: "Always uploads before 7 PM",   earned: true  },
  { icon: "🌿", label: "Zero Waste Hero",    desc: "90%+ edible food rate",         earned: false },
  { icon: "🤝", label: "NGO Partner Elite",  desc: "50+ successful pickups",        earned: false },
];

const OVERALL = 87;

export default function Score() {
  return (
    <div>
      {/* Hero Score */}
      <div className="card" style={{ marginBottom: 20, textAlign: "center" }}>
        <div style={{ display: "flex", gap: 40, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
          <div>
            <div className="score-ring" style={{ width: 160, height: 160 }}>
              <svg viewBox="0 0 160 160" width="160" height="160">
                <circle cx="80" cy="80" r="68" fill="none" stroke="var(--bg-hover)" strokeWidth="12" />
                <circle
                  cx="80" cy="80" r="68" fill="none"
                  stroke="var(--hotel-primary)" strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 68 * (OVERALL / 100)} ${2 * Math.PI * 68 * (1 - OVERALL / 100)}`}
                  strokeLinecap="round"
                  style={{ filter: "drop-shadow(0 0 8px var(--hotel-primary))" }}
                />
              </svg>
              <div className="score-ring-value" style={{ fontSize: 36 }}>
                {OVERALL}
                <div className="score-ring-label" style={{ fontSize: 12 }}>/ 100 pts</div>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 20, fontWeight: 700, color: "var(--hotel-primary)" }}>
              Excellent ⭐
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              Top 15% of hotels in Bangalore
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 220, textAlign: "left" }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
              Score Trend (Last 6 Months)
            </div>
            {/* Simple bar chart */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
              {HISTORY_SCORES.map(({ month, score }) => (
                <div key={month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div
                    style={{
                      width: "100%", background: "var(--hotel-primary)",
                      borderRadius: "4px 4px 0 0", opacity: 0.7 + (score - 70) / 100,
                      height: `${((score - 60) / 40) * 60}px`,
                      transition: "height 0.5s ease",
                    }}
                  />
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Criteria Breakdown */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">Score Breakdown</div>
          <div className="card-subtitle">By evaluation criteria</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {CRITERIA.map(({ label, score, max, desc }) => (
            <div key={label}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{desc}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--hotel-primary)", minWidth: 60, textAlign: "right" }}>
                  {score}<span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>/{max}</span>
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill hotel" style={{ width: `${(score / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Achievement Badges</div>
          <div className="card-subtitle">Earn badges by maintaining high standards</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {BADGES.map(({ icon, label, desc, earned }) => (
            <div
              key={label}
              style={{
                padding: "16px 14px",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${earned ? "rgba(245,158,11,0.3)" : "var(--border)"}`,
                background: earned ? "rgba(245,158,11,0.06)" : "var(--bg-surface)",
                opacity: earned ? 1 : 0.5,
                textAlign: "center",
                transition: "var(--transition)",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: earned ? "var(--hotel-primary)" : "var(--text-muted)", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{desc}</div>
              {!earned && <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>🔒 Locked</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
