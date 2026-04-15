import { useState } from "react";
import { authAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { User, Mail, Phone, MapPin, Building, Save, AlertCircle, CheckCircle } from "lucide-react";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name:  user?.name  || "",
    email: user?.email || "",
    phone: user?.phone || "",
    city:  user?.city  || "",
    zone:  user?.zone  || "",
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await authAPI.updateProfile(formData);
      // Update context state
      updateUser({ ...user, ...res.data.user });
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(err.response?.data?.detail || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Edit Profile</div>
            <div className="card-subtitle">Update your account information</div>
          </div>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "var(--bg-secondary)", 
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-primary)"
          }}>
            <User size={24} />
          </div>
        </div>

        {error && (
          <div style={{
            background: "#fee2e2", border: "1px solid #fecaca",
            padding: "12px 16px", borderRadius: "var(--radius-md)",
            color: "#b91c1c", fontSize: 13, marginBottom: 20,
            display: "flex", alignItems: "center", gap: 8
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {success && (
          <div style={{
            background: "#dcfce7", border: "1px solid #bbf7d0",
            padding: "12px 16px", borderRadius: "var(--radius-md)",
            color: "#15803d", fontSize: 13, marginBottom: 20,
            display: "flex", alignItems: "center", gap: 8
          }}>
            <CheckCircle size={16} /> {success}
          </div>
        )}

        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: "relative" }}>
              <User size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                required
                name="name"
                className="form-input"
                style={{ paddingLeft: 40 }}
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                required
                type="email"
                name="email"
                className="form-input"
                style={{ paddingLeft: 40 }}
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <div style={{ position: "relative" }}>
              <Phone size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                name="phone"
                className="form-input"
                style={{ paddingLeft: 40 }}
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">City</label>
              <div style={{ position: "relative" }}>
                <MapPin size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  name="city"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Bangalore"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Zone / Area</label>
              <div style={{ position: "relative" }}>
                <Building size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  name="zone"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  value={formData.zone}
                  onChange={handleChange}
                  placeholder="Whitefield"
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 10, padding: "12px", background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--text-muted)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MapPin size={14} /> 
              <span>GPS coords: {user?.latitude?.toFixed(4) || "—"}, {user?.longitude?.toFixed(4) || "—"} (Fixed from signup)</span>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-hotel btn-full"
            style={{ marginTop: 24, padding: "12px" }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                <div className="spinner" style={{ width: 16, height: 16, borderTopColor: "#fff" }} /> Saving...
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                <Save size={18} /> Update Profile
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
