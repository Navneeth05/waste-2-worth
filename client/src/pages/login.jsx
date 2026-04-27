import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Leaf, Eye, EyeOff, ArrowRight, CheckCircle, MapPin, Loader } from "lucide-react";

const ROLES = [
  { id: "hotel", label: "Hotel",     icon: "🏨", desc: "Upload surplus food for donation" },
  { id: "ngo",   label: "NGO",       icon: "🤝", desc: "Collect & distribute food to needy" },
  { id: "muni",  label: "Municipal", icon: "🏛️", desc: "Manage non-edible food waste" },
];

const REDIRECT = { hotel: "/hotel", ngo: "/ngo", muni: "/municipal" };

const DEMO = {
  hotel: { email: "hotel1@example.com", password: "hotel123" },
  ngo:   { email: "ngo1@example.com",   password: "ngo123"   },
  muni:  { email: "muni@example.com",   password: "muni123"  },
};

export default function Login() {
  const [authMode, setAuthMode] = useState("login");
  const [role,     setRole]     = useState("hotel");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [phone,    setPhone]    = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  // Live GPS location state
  const [gpsStatus,  setGpsStatus]  = useState("idle"); // idle | fetching | done | error
  const [gpsCoords,  setGpsCoords]  = useState(null);   // { lat, lng, city }
  const [gpsLabel,   setGpsLabel]   = useState("");

  const { login } = useAuth();
  const navigate  = useNavigate();

  const selectedRole = ROLES.find((r) => r.id === role);

  // Auto-fetch GPS when user switches to signup (for hotel/ngo only)
  useEffect(() => {
    if (authMode === "signup" && role !== "muni") {
      fetchLocation();
    }
  }, [authMode, role]);

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsLabel("Geolocation not supported by your browser");
      return;
    }
    setGpsStatus("fetching");
    setGpsLabel("Detecting your location…");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGpsCoords({ lat, lng });
        // Reverse geocode using free Nominatim API
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || "";
          const area = data.address?.suburb || data.address?.neighbourhood || "";
          setGpsCoords({ lat, lng, city });
          setGpsLabel(`📍 ${area ? area + ", " : ""}${city || "Location detected"}`);
        } catch {
          setGpsLabel(`📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
        setGpsStatus("done");
      },
      (err) => {
        setGpsStatus("error");
        setGpsLabel("Location access denied — please enable location permission");
      },
      { timeout: 10000 }
    );
  };

  const handleRoleSelect = (id) => {
    setRole(id);
    setError("");
    if (authMode === "login") {
      setEmail(DEMO[id]?.email || "");
      setPassword(DEMO[id]?.password || "");
    }
  };

  const handleAuthModeSwitch = (mode) => {
    setAuthMode(mode);
    setError(""); setSuccess("");
    setName(""); setConfirm(""); setPhone("");
    setGpsStatus("idle"); setGpsCoords(null); setGpsLabel("");
    if (mode === "login") {
      setEmail(DEMO[role]?.email || "");
      setPassword(DEMO[role]?.password || "");
    } else {
      setEmail(""); setPassword("");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(role, email, password);
      navigate(REDIRECT[role]);
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim())             { setError("Please enter your organisation name."); return; }
    if (!phone.trim())            { setError("Please enter a contact phone number."); return; }
    if (!/^\d{10}$/.test(phone))  { setError("Phone number must be exactly 10 digits."); return; }
    if (password !== confirm)     { setError("Passwords do not match."); return; }
    if (password.length < 6)      { setError("Password must be at least 6 characters."); return; }
    if (role !== "muni" && !gpsCoords) {
      setError("Please allow location access to register. Click 'Detect Location' above.");
      return;
    }
    setLoading(true);
    try {
      const { default: API } = await import("../services/api");
      await API.post("/auth/register", {
        name,
        email,
        password,
        role,
        phone,
        city:      gpsCoords?.city || "",
        latitude:  gpsCoords?.lat || null,
        longitude: gpsCoords?.lng || null,
      });
      setSuccess("Account created! You can now sign in with your credentials.");
      setAuthMode("login");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const accentColor = role === "hotel" ? "hotel" : role === "ngo" ? "ngo" : "muni";

  return (
    <div className="login-page">
      {/* ── Left Hero ── */}
      <div className="login-hero">
        <div className="hero-pattern" />
        <div className="floating-shapes">
          <div className="floating-shape" />
          <div className="floating-shape" />
          <div className="floating-shape" />
          <div className="floating-shape" />
        </div>
        <div className="hero-content">
          <div className="hero-logo">
            <div className="hero-logo-icon">🌿</div>
            <div>
              <div className="hero-brand">Waste 2 Worth</div>
              <div className="hero-brand-sub">Food Redistribution Platform</div>
            </div>
          </div>
          <h1 className="hero-headline">
            Turn Surplus Food<br />
            Into <span>Real Value</span>
          </h1>
          <p className="hero-desc">
            Connecting hotels, NGOs and municipalities to eliminate food waste
            and feed communities — powered by AI classification.
          </p>
          <div className="hero-stats">
            {[
              { value: "2.4T",  label: "Meals Saved"   },
              { value: "380+",  label: "Partner Hotels" },
              { value: "96%",   label: "AI Accuracy"    },
            ].map(({ value, label }) => (
              <div key={label} className="hero-stat">
                <div className="hero-stat-value">{value}</div>
                <div className="hero-stat-label">{label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 36, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["🤖 AI Image Classification", "📍 Live Location Map", "🔔 Real-time Alerts", "📱 GPS Auto-detect"].map((f) => (
              <span key={f} style={{
                padding: "6px 12px", borderRadius: "100px",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 500,
              }}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="login-form-panel">
        <div className="login-form-header">
          <div className="login-form-title">
            {authMode === "login" ? "Welcome back 👋" : "Create account 🚀"}
          </div>
          <div className="login-form-sub">
            {authMode === "login"
              ? "Sign in to your Waste 2 Worth portal"
              : "Join the Waste 2 Worth community"}
          </div>
        </div>

        {/* Mode switcher */}
        <div className="auth-mode-tabs">
          <button className={`auth-mode-tab ${authMode === "login"  ? "active" : ""}`} onClick={() => handleAuthModeSwitch("login")}  type="button">Sign In</button>
          <button className={`auth-mode-tab ${authMode === "signup" ? "active" : ""}`} onClick={() => handleAuthModeSwitch("signup")} type="button">Sign Up</button>
        </div>

        {/* Success banner */}
        {success && (
          <div style={{
            background: "#dcfce7", border: "1px solid #bbf7d0",
            borderRadius: "var(--radius-sm)", padding: "10px 14px",
            display: "flex", gap: 8, alignItems: "center",
            fontSize: 13, color: "#15803d", marginBottom: 16, fontWeight: 500,
          }}>
            <CheckCircle size={16} /> {success}
          </div>
        )}

        {/* Role selector */}
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Select your role
        </p>
        <div className="role-tabs">
          {ROLES.map((r) => (
            <button
              key={r.id} type="button"
              className={`role-tab ${role === r.id ? `active-${r.id}` : ""}`}
              onClick={() => handleRoleSelect(r.id)}
            >
              <span className="role-tab-icon">{r.icon}</span>
              <span className="role-tab-label">{r.label}</span>
            </button>
          ))}
        </div>

        {/* Role description */}
        <div style={{
          background: role === "hotel" ? "#fff7ed" : role === "ngo" ? "#dcfce7" : "#eff6ff",
          border: `1px solid ${role === "hotel" ? "rgba(249,115,22,0.2)" : role === "ngo" ? "rgba(34,197,94,0.2)" : "rgba(59,130,246,0.2)"}`,
          borderRadius: "var(--radius-sm)", padding: "10px 14px",
          fontSize: 12,
          color: role === "hotel" ? "var(--orange-dark)" : role === "ngo" ? "var(--green-dark)" : "var(--blue-dark)",
          marginBottom: 20, fontWeight: 500,
        }}>
          {selectedRole?.icon} {selectedRole?.desc}
          {authMode === "login" && (
            <span style={{ float: "right", opacity: 0.7, fontSize: 11 }}>
              Demo: {DEMO[role]?.email}
            </span>
          )}
        </div>

        {/* Form */}
        <form onSubmit={authMode === "login" ? handleLogin : handleSignup}>
          {/* Sign Up fields */}
          {authMode === "signup" && (
            <>
              {/* Name */}
              <div className="form-group">
                <label className="form-label">Organisation / Full Name</label>
                <input
                  id="signup-name" className="form-input"
                  placeholder={role === "hotel" ? "e.g. The Grand Palace Hotel" : role === "ngo" ? "e.g. FoodHope NGO" : "e.g. BBMP Ward 42"}
                  value={name} onChange={(e) => setName(e.target.value)} required
                />
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label">Contact Phone Number</label>
                <input
                  id="signup-phone" className="form-input" type="tel"
                  placeholder="10-digit mobile number"
                  value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  required
                />
              </div>

              {/* GPS Location (Hotel & NGO only) */}
              {role !== "muni" && (
                <div className="form-group">
                  <label className="form-label">
                    <MapPin size={12} style={{ marginRight: 4 }} />
                    Location <span style={{ color: "#b91c1c", fontWeight: 700 }}>*</span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400, marginLeft: 6 }}>
                      Required — used for the live food map
                    </span>
                  </label>

                  {/* GPS status display */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: "var(--radius-sm)",
                    border: `1px solid ${
                      gpsStatus === "done"  ? "#bbf7d0" :
                      gpsStatus === "error" ? "#fecaca" :
                      gpsStatus === "fetching" ? "rgba(245,158,11,0.3)" :
                      "var(--border)"
                    }`,
                    background: gpsStatus === "done" ? "#f0fdf4" : gpsStatus === "error" ? "#fef2f2" : "var(--bg-surface)",
                    marginBottom: 8,
                  }}>
                    {gpsStatus === "fetching" ? (
                      <Loader size={16} style={{ color: "#d97706", flexShrink: 0, animation: "spin 1s linear infinite" }} />
                    ) : gpsStatus === "done" ? (
                      <CheckCircle size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
                    ) : (
                      <MapPin size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                    )}
                    <span style={{
                      fontSize: 13, flex: 1,
                      color: gpsStatus === "done" ? "#15803d" : gpsStatus === "error" ? "#b91c1c" : "var(--text-muted)",
                      fontWeight: gpsStatus === "done" ? 500 : 400,
                    }}>
                      {gpsStatus === "idle" ? "Click below to detect your location" : gpsLabel}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={`btn btn-sm btn-ghost`}
                    onClick={fetchLocation}
                    disabled={gpsStatus === "fetching"}
                    style={{ width: "100%", gap: 6 }}
                  >
                    {gpsStatus === "fetching" ? (
                      <><Loader size={14} /> Detecting…</>
                    ) : gpsStatus === "done" ? (
                      <><MapPin size={14} /> Re-detect Location</>
                    ) : (
                      <><MapPin size={14} /> 📍 Detect My Location</>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              id="auth-email" type="email" className="form-input"
              placeholder="Enter your email"
              value={email} onChange={(e) => setEmail(e.target.value)} required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="auth-password"
                type={showPw ? "text" : "password"}
                className="form-input"
                placeholder={authMode === "signup" ? "Min 6 characters" : "Enter your password"}
                value={password} onChange={(e) => setPassword(e.target.value)}
                required style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} style={{
                position: "absolute", right: 12, top: "50%",
                transform: "translateY(-50%)", background: "none",
                border: "none", cursor: "pointer", color: "var(--text-muted)",
                display: "flex", padding: 0,
              }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          {authMode === "signup" && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                id="signup-confirm" type="password" className="form-input"
                placeholder="Re-enter password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} required
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: "#fee2e2", border: "1px solid #fecaca",
              borderRadius: "var(--radius-sm)", padding: "10px 14px",
              fontSize: 13, color: "#b91c1c", marginBottom: 14, fontWeight: 500,
            }}>
              ⚠️ {error}
            </div>
          )}


          <button
            id="auth-submit" type="submit" disabled={loading}
            className={`btn btn-${accentColor} btn-full btn-lg`}
          >
            {loading ? (
              <><div className="spinner" /> {authMode === "login" ? "Signing in…" : "Creating account…"}</>
            ) : authMode === "login" ? (
              <>Sign In as {selectedRole?.label} <ArrowRight size={18} /></>
            ) : (
              <>Create {selectedRole?.label} Account <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className="login-divider"><span>or</span></div>

        <div style={{ textAlign: "center" }}>
          {authMode === "login" ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Don't have an account?{" "}
              <span onClick={() => handleAuthModeSwitch("signup")}
                style={{ color: role === "hotel" ? "var(--orange-dark)" : role === "ngo" ? "var(--green-dark)" : "var(--blue-dark)", fontWeight: 600, cursor: "pointer" }}>
                Sign up free
              </span>
            </p>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Already have an account?{" "}
              <span onClick={() => handleAuthModeSwitch("login")}
                style={{ color: role === "hotel" ? "var(--orange-dark)" : role === "ngo" ? "var(--green-dark)" : "var(--blue-dark)", fontWeight: 600, cursor: "pointer" }}>
                Sign in
              </span>
            </p>
          )}
        </div>
        <div style={{ marginTop: 28, textAlign: "center", fontSize: 11, color: "var(--text-muted)" }}>
          🔒 Secured · Waste 2 Worth © 2026
        </div>
      </div>
    </div>
  );
}
