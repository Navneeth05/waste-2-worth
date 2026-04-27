import { useState } from "react";
import { hotelAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import UploadBox from "../../components/UploadBox";
import { MapPin, Clock, Scale, FileText, CheckCircle, Loader, ShieldCheck, AlertTriangle, Info } from "lucide-react";

// FSSAI Regulations for surplus food donation
const FSSAI_GUIDELINES = [
  {
    icon: "🕐",
    title: "Time Limit",
    desc: "Surplus food must be donated within 2 hours of preparation or before the 'use-by' time, whichever is earlier.",
    rule: "FSSAI Regulation 2.1.1",
  },
  {
    icon: "🌡️",
    title: "Temperature Control",
    desc: "Hot food must be maintained above 65°C. Cold/refrigerated food must be kept below 5°C during storage and transit.",
    rule: "FSSAI Regulation 2.1.3",
  },
  {
    icon: "📦",
    title: "Packaging & Labelling",
    desc: "Food must be packed in clean, food-grade containers. Label must include: food item name, date/time of preparation, allergen info.",
    rule: "FSSAI Regulation 2.1.2",
  },
  {
    icon: "🧼",
    title: "Hygiene Standards",
    desc: "Handlers must follow proper hand hygiene. Preparation area must be clean and free from contamination.",
    rule: "FSSAI Schedule 4, Part V",
  },
  {
    icon: "🚫",
    title: "Prohibited Items",
    desc: "Do NOT donate: stale/spoiled food, leftover plate-scraped food, food touched by consumers, or food past expiry.",
    rule: "FSSAI Regulation 2.1.4",
  },
  {
    icon: "📋",
    title: "Record Keeping",
    desc: "Maintain records of donated food including quantity, recipient details, date/time for at least 1 year.",
    rule: "FSSAI Regulation 2.1.6",
  },
];

export default function UploadPage() {
  const { user } = useAuth();
  const [file,        setFile]        = useState(null);
  const [result,      setResult]      = useState(null);
  const [classifying, setClassifying] = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [routedTo,    setRoutedTo]    = useState("");
  const [location,    setLocation]    = useState(user?.city || "Bangalore, KA");
  const [quantity,    setQuantity]    = useState("");
  const [notes,       setNotes]       = useState("");
  const [showFssai,   setShowFssai]   = useState(false);  // collapsed by default

  const hour = new Date().getHours();
  const uploadLocked = hour >= 20;

  const handleFileSelect = async (f) => {
    setFile(f);
    setResult(null);
    setSuccess(false);
    if (!f) return;

    // Send image to FastAPI → .h5 model → get real classification
    setClassifying(true);
    try {
      const res = await hotelAPI.classifyFood(f);
      // res.data = { label: "edible"|"non-edible", confidence: 0.97, routed_to: "NGO"|"Municipal" }
      setResult(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail || "";
      if (detail.includes("model") || detail.includes("TensorFlow")) {
        // Model file not found — inform developer
        setResult({ label: "error", confidence: 0, routed_to: "", error: detail });
      } else {
        setResult({ label: "error", confidence: 0, routed_to: "", error: "Classification failed. Check that the server is running." });
      }
    } finally {
      setClassifying(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !result || uploading) return;
    if (!quantity || parseFloat(quantity) <= 0) {
      alert("Please enter a valid quantity (kg) before submitting.");
      return;
    }
    setUploading(true);
    try {
      const res = await hotelAPI.uploadFood({
        food_item:  notes.trim() || `Food upload — ${result.label}`,
        quantity:   parseFloat(quantity),
        ai_label:   result.label,
        location,
        latitude:   user?.latitude  || null,
        longitude:  user?.longitude || null,
        notes,
      });
      setRoutedTo(res.data.routed_to || "");
      setSuccess(true);
      setFile(null); setResult(null);
      setQuantity(""); setNotes("");
      setTimeout(() => setSuccess(false), 6000);
    } catch (err) {
      alert(err.response?.data?.detail || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Time lock banner */}
      {uploadLocked && (
        <div style={{
          background: "#fee2e2", border: "1px solid #fecaca",
          borderRadius: "var(--radius-md)", padding: "14px 20px",
          display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
          color: "#b91c1c", fontSize: 14, fontWeight: 500,
        }}>
          <Clock size={18} />
          Upload is closed after 8 PM. Please upload tomorrow before 8 PM.
        </div>
      )}

      {/* Success Banner */}
      {success && (
        <div style={{
          background: result?.label === "edible" ? "#dcfce7" : "#eff6ff",
          border: `1px solid ${result?.label === "edible" ? "#bbf7d0" : "#bfdbfe"}`,
          borderRadius: "var(--radius-md)", padding: "14px 20px",
          display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
          color: result?.label === "edible" ? "#15803d" : "#1d4ed8",
          fontSize: 14, fontWeight: 500,
        }}>
          <CheckCircle size={18} />
          {routedTo === "NGO"
            ? "✅ Food uploaded & sent to nearby NGOs for pickup!"
            : "🏛️ Non-edible food uploaded & routed to Municipal waste collection!"}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
         Upload Card, Metadata, Classification — unchanged below
         The FSSAI / T&C section is now at the BOTTOM of the page
      ──────────────────────────────────────────────────────────── */}

      {/* Upload Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Upload Surplus Food Image</div>
            <div className="card-subtitle">Our AI will classify it as edible or non-edible</div>
          </div>
          {classifying && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--hotel-primary)" }}>
              <div className="spinner spinner-dark" style={{ borderTopColor: "var(--hotel-primary)", width: 14, height: 14 }} />
              Classifying…
            </div>
          )}
        </div>
        <UploadBox onFileSelect={handleFileSelect} result={result} />
      </div>

      {/* Metadata form */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">Upload Details</div>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label"><MapPin size={12} style={{ marginRight: 4 }} />Location</label>
            <input id="upload-location" className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bangalore, KA" />
          </div>
          <div className="form-group">
            <label className="form-label"><Scale size={12} style={{ marginRight: 4 }} />Quantity (kg)</label>
            <input id="upload-quantity" className="form-input" type="number" min="0.1" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 12.5" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label"><Clock size={12} style={{ marginRight: 4 }} />Upload Time</label>
          <input className="form-input" value={new Date().toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })} readOnly style={{ color: "var(--text-muted)", cursor: "not-allowed" }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label"><FileText size={12} style={{ marginRight: 4 }} />Notes (optional)</label>
          <textarea id="upload-notes" className="form-input" rows={3} placeholder="Describe the food items, freshness, packaging, etc." value={notes} onChange={(e) => setNotes(e.target.value)} style={{ resize: "vertical" }} />
        </div>
      </div>

      {/* Classification result */}
      {result && result.label !== "error" && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">AI Classification Result</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Powered by your .h5 model</div>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{
              flex: 1, minWidth: 200, padding: "16px 20px", borderRadius: "var(--radius-md)",
              background: result.label === "edible" ? "#dcfce7" : "#fee2e2",
              border: `1px solid ${result.label === "edible" ? "#bbf7d0" : "#fecaca"}`,
            }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>
                {result.label === "edible" ? "✅" : "⚠️"}
              </div>
              <div style={{
                fontSize: 18, fontWeight: 700,
                color: result.label === "edible" ? "#15803d" : "#b91c1c",
              }}>
                {result.label === "edible" ? "Edible Food" : "Non-Edible / Waste"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                Confidence: {Math.round((result.confidence || 0) * 100)}%
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {result.label === "edible"
                  ? "✅ This food will be listed for NGO pickup. Nearby NGOs will be notified immediately."
                  : "⚠️ This food is classified as waste. It will be routed to the Municipal waste collection system."}
              </div>
              {result.label === "edible" && (
                <div style={{ fontSize: 12, color: "var(--orange-dark)", fontWeight: 600 }}>
                  ✅ This food will appear on the live NGO map immediately
                </div>
              )}
              {result.label === "non-edible" && (
                <div style={{ fontSize: 12, color: "#1d4ed8", fontWeight: 600 }}>
                  🏛️ This will be sent to Municipal waste collection
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Model error state */}
      {result?.label === "error" && (
        <div style={{
          padding: "14px 18px", borderRadius: "var(--radius-md)",
          background: "#fef3c7", border: "1px solid #fde68a",
          color: "#92400e", fontSize: 13, marginBottom: 20,
        }}>
          ⚠️ <strong>Model not available:</strong> {result.error}
          <div style={{ fontSize: 11, marginTop: 6, color: "#b45309" }}>
            Make sure <code>server/model/food_classifier.h5</code> exists and TensorFlow is installed.
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        id="upload-submit"
        className="btn btn-hotel btn-full btn-lg"
        onClick={handleUpload}
        disabled={!file || !result || uploading || uploadLocked || classifying || !quantity}
      >
        {uploading ? (
          <><div className="spinner" /> Submitting…</>
        ) : (
          <><CheckCircle size={20} /> Submit Food Upload</>
        )}
      </button>
      {!quantity && file && result && (
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: "#b91c1c" }}>
          ⚠️ Please enter the quantity (kg) above before submitting
        </div>
      )}

      {/* ─── FSSAI TERMS & CONDITIONS (below submit) ─────────────── */}
      <div style={{ marginTop: 32 }}>
        {/* Header row */}
        <button
          type="button"
          onClick={() => setShowFssai((v) => !v)}
          style={{
            width: "100%",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 18px",
            background: showFssai
              ? "linear-gradient(135deg, #fffbeb, #fef3c7)"
              : "rgba(245,158,11,0.06)",
            border: "1px solid #fde68a",
            borderRadius: showFssai ? "var(--radius-md) var(--radius-md) 0 0" : "var(--radius-md)",
            cursor: "pointer",
            transition: "var(--transition)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", flexShrink: 0,
            }}>
              <ShieldCheck size={17} />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#78350f" }}>
                📜 FSSAI Food Safety — Terms &amp; Conditions
              </div>
              <div style={{ fontSize: 11, color: "#b45309", fontWeight: 400 }}>
                Mandatory compliance for surplus food donation · Click to {showFssai ? "collapse" : "read"}
              </div>
            </div>
          </div>
          <span style={{
            fontSize: 18, color: "#b45309",
            transform: showFssai ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease", display: "inline-block",
          }}>▾</span>
        </button>

        {showFssai && (
          <div style={{
            border: "1px solid #fde68a", borderTop: "none",
            borderRadius: "0 0 var(--radius-md) var(--radius-md)",
            background: "linear-gradient(180deg, #fffbeb 0%, #fff 100%)",
            padding: "20px",
          }}>
            {/* Legal notice */}
            <div style={{
              background: "rgba(146,64,14,0.07)",
              border: "1px solid rgba(146,64,14,0.15)",
              borderRadius: 8, padding: "12px 14px", marginBottom: 18,
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <AlertTriangle size={16} color="#92400e" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, color: "#92400e", lineHeight: 1.7 }}>
                <strong>Legal Obligation — FSSAI (Food Safety and Standards Authority of India):</strong>&nbsp;
                All food establishments donating surplus food must comply with FSSAI Food Donation Guidelines 2020.
                Non-compliance may result in penalties, suspension of donation privileges, and deduction of Hygiene Points.
              </div>
            </div>

            {/* Guidelines grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
              gap: 12, marginBottom: 18,
            }}>
              {FSSAI_GUIDELINES.map(({ icon, title, desc, rule }) => (
                <div key={title} style={{
                  background: "#fff",
                  border: "1px solid rgba(146,64,14,0.1)",
                  borderLeft: "3px solid #f59e0b",
                  borderRadius: 8, padding: "12px 14px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#78350f" }}>{title}</div>
                      <div style={{ fontSize: 10, color: "#b45309", fontWeight: 500, letterSpacing: "0.3px" }}>{rule}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#92400e", lineHeight: 1.65 }}>{desc}</div>
                </div>
              ))}
            </div>

            {/* Numbered list of T&C clauses */}
            <div style={{
              background: "#fff",
              border: "1px solid rgba(146,64,14,0.1)",
              borderRadius: 8, padding: "14px 18px", marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#78350f", marginBottom: 10 }}>
                General Terms &amp; Conditions
              </div>
              {[
                "By uploading food, you confirm it is not stale, spoiled, or past its expiry date.",
                "Temperature guidelines must be followed during storage and transit as per FSSAI norms.",
                "Waste2Worth reserves the right to suspend upload privileges for repeated non-compliance.",
                "Hygiene Points are awarded at the discretion of the receiving NGO based on food quality.",
                "Records of all donations are maintained for regulatory and audit purposes.",
                "Hotels are liable under FSSAI Act 2006 for any food safety violations arising from donated food.",
              ].map((clause, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 12, color: "#78350f", lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 700, flexShrink: 0, color: "#b45309" }}>{i + 1}.</span>
                  <span>{clause}</span>
                </div>
              ))}
            </div>

            {/* Acknowledgement */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "12px 14px",
              background: "rgba(245,158,11,0.08)",
              border: "1px solid #fde68a", borderRadius: 8,
            }}>
              <input type="checkbox" id="fssai-ack" defaultChecked
                style={{ accentColor: "#d97706", width: 15, height: 15, marginTop: 2, flexShrink: 0 }} />
              <label htmlFor="fssai-ack" style={{ fontSize: 12, color: "#78350f", fontWeight: 500, cursor: "pointer", lineHeight: 1.6 }}>
                I have read and agree to the FSSAI Food Safety Regulations and Waste2Worth Terms &amp; Conditions.
                I confirm the food uploaded complies with all applicable guidelines.
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}