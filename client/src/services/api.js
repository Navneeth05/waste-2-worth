import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
});

// Attach token and user info from sessionStorage on every request
API.interceptors.request.use((config) => {
  const user = sessionStorage.getItem("pb_user");
  if (user) {
    const { id, role } = JSON.parse(user);
    config.headers["x-user-id"]   = id;
    config.headers["x-user-role"] = role;
  }
  return config;
});

// ─── Hotel Endpoints ─────────────────────────────────────────
export const hotelAPI = {
  // Send image file → .h5 model classifies edible/non-edible
  classifyFood: (imageFile) => {
    const form = new FormData();
    form.append("file", imageFile);
    return API.post("/hotel/classify", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  uploadFood:   (data) => API.post("/hotel/upload", data),
  getHistory:   ()     => API.get("/hotel/history"),
  getScore:     ()     => API.get("/hotel/score"),
  getDashboard: ()     => API.get("/hotel/dashboard"),
};

// ─── NGO Endpoints ───────────────────────────────────────────
export const ngoAPI = {
  getAvailableFood: ()           => API.get("/ngo/available"),
  getPickups:       ()           => API.get("/ngo/pickups"),
  claimFood:        (uploadId)   => API.post(`/ngo/claim/${uploadId}`),
  // KEY: NGO confirms pickup AND awards hygiene points to hotel
  confirmPickupAndAwardPoints: (claimId, pointsAwarded = 5, reason = "Pickup confirmed by NGO") =>
    API.post(`/ngo/pickup/${claimId}/confirm`, { claim_id: claimId, points_awarded: pointsAwarded, reason }),
  getScore:         ()           => API.get("/ngo/score"),
  getDashboard:     ()           => API.get("/ngo/dashboard"),
};

// ─── Municipal Endpoints ──────────────────────────────────────
export const municipalAPI = {
  getWaste:      ()         => API.get("/muni/waste"),
  markCollected: (uploadId) => API.post(`/muni/collect/${uploadId}`),
  getDashboard:  ()         => API.get("/muni/dashboard"),
};

// ─── Shared Auth & Profile ──────────────────────────────────
export const authAPI = {
  register:       (data) => API.post("/auth/register", data),
  login:          (data) => API.post("/auth/login", data),
  updateProfile:  (data) => API.post("/profile/update", data),
};

export default API;
