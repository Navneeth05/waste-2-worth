import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/login";
import HotelDashboard from "./pages/Hotel/HotelDashboard";
import NGODashboard from "./pages/NGO/NGODashboard";
import MunicipalDashboard from "./pages/Municipal/MunicipalDashboard";

// ─── Route Guard ─────────────────────────────────────────────
function RequireAuth({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  // Municipal role stored as "muni"
  const userRole = user.role === "muni" ? "muni" : user.role;
  if (role && userRole !== role) return <Navigate to="/login" replace />;
  return children;
}

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "hotel") return <Navigate to="/hotel"     replace />;
  if (user.role === "ngo")   return <Navigate to="/ngo"       replace />;
  if (user.role === "muni")  return <Navigate to="/municipal" replace />;
  return <Navigate to="/login" replace />;
}

// ─── App ─────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      <Route path="/"      element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/hotel/*"
        element={
          <RequireAuth role="hotel">
            <HotelDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/ngo/*"
        element={
          <RequireAuth role="ngo">
            <NGODashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/municipal/*"
        element={
          <RequireAuth role="muni">
            <MunicipalDashboard />
          </RequireAuth>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}