import { useState, useRef, useEffect } from "react";
import { Upload, X, CheckCircle, AlertCircle, Camera } from "lucide-react";

export default function UploadBox({ onFileSelect, result }) {
  const [preview,   setPreview]   = useState(null);
  const [dragging,  setDragging]  = useState(false);
  const [isCamOpen, setIsCamOpen] = useState(false);
  const [stream,    setStream]    = useState(null);
  
  const inputRef = useRef(null);
  const videoRef = useRef(null);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCamOpen(false);
  };

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment", width: 1280, height: 720 } 
      });
      setStream(s);
      setIsCamOpen(true);
    } catch (err) {
      alert("Could not access camera. Please check permissions.");
    }
  };

  useEffect(() => {
    if (isCamOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCamOpen, stream]);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onFileSelect?.(file);
    stopCamera();
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], "captured-food.jpg", { type: "image/jpeg" });
      handleFile(file);
    }, "image/jpeg", 0.95);
  };

  const clearPreview = () => {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    onFileSelect?.(null);
  };

  return (
    <div className="upload-box-container">
      {!preview ? (
        <div style={{ position: "relative" }}>
          {!isCamOpen ? (
            <div
              className={`upload-zone ${dragging ? "dragover" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => inputRef.current?.click()}
              style={{ minHeight: 200, cursor: "pointer" }}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
              <div className="upload-icon">
                <Upload size={32} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                {dragging ? "Drop image here" : "Click to select food photo"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
                Supports JPG, PNG — max 10MB
              </div>
              
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button
                  type="button"
                  className="btn btn-hotel btn-sm"
                  onClick={(e) => { e.stopPropagation(); startCamera(); }}
                  style={{ gap: 8, background: "var(--hotel-primary)", color: "#fff", padding: "10px 20px" }}
                >
                  <Camera size={16} /> Use Real-time Camera
                </button>
              </div>
            </div>
          ) : (
            <div className="upload-zone" style={{ padding: 0, overflow: "hidden", minHeight: 400, background: "#000", borderRadius: "12px" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <div style={{
                position: "absolute", bottom: 20, left: 0, right: 0,
                display: "flex", justifyContent: "center", gap: 16, alignItems: "center"
              }}>
                <button 
                  type="button" 
                  onClick={takeSnapshot} 
                  style={{ 
                    width: 70, height: 70, borderRadius: "50%", 
                    background: "#fff", border: "5px solid rgba(255,255,255,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", boxShadow: "0 0 20px rgba(0,0,0,0.3)"
                  }}
                >
                  <div style={{ width: 50, height: 50, borderRadius: "50%", border: "2px solid #000" }} />
                </button>
                <button 
                  type="button" 
                  onClick={stopCamera} 
                  className="btn btn-danger btn-sm" 
                  style={{ position: "absolute", right: 20, padding: "8px 16px" }}
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="upload-preview" style={{ position: "relative", borderRadius: "12px", overflow: "hidden" }}>
          <img src={preview} alt="Food preview" style={{ width: "100%", display: "block", maxHeight: 400, objectFit: "contain", background: "var(--bg-hover)" }} />
          <div style={{ position: "absolute", top: 12, right: 12 }}>
            <button
              className="btn btn-danger btn-sm"
              onClick={(e) => { e.stopPropagation(); clearPreview(); }}
              style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
            >
              <X size={14} /> Remove Photo
            </button>
          </div>

          {result && (
            <div
              style={{
                position: "absolute", bottom: 12, left: 12, right: 12,
                background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)",
                borderRadius: "10px", padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 12,
                border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
              }}
            >
              <div style={{ 
                width: 36, height: 36, borderRadius: "50%", 
                background: result.label === "edible" ? "#dcfce7" : "#fee2e2",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {result.label === "edible" ? (
                  <CheckCircle size={20} color="#15803d" />
                ) : (
                  <AlertCircle size={20} color="#b91c1c" />
                )}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: result.label === "edible" ? "#15803d" : "#b91c1c" }}>
                  {result.label === "edible" ? "AI says: Edible ✅" : "AI says: Waste ⚠️"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Confidence: {Math.round((result.confidence || 0) * 100)}%
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}