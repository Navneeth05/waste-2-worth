import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Navbar";
import MunicipalHome from "./MunicipalHome";
import WasteManagement from "./WasteManagement";
import MunicipalStats from "./MunicipalStats";
import Profile from "../Shared/Profile";

export default function MunicipalDashboard() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route index        element={<><Topbar title="Municipal Dashboard" subtitle="City-wide waste food management" /><MunicipalHome /></>} />
          <Route path="waste" element={<><Topbar title="Waste Collection" subtitle="Track & collect waste food reports" /><WasteManagement /></>} />
          <Route path="stats" element={<><Topbar title="Analytics" subtitle="Municipal food waste data" /><MunicipalStats /></>} />
          <Route path="profile" element={<><Topbar title="Profile" subtitle="Edit your personal details" /><Profile /></>} />
          <Route path="*"     element={<Navigate to="/municipal" replace />} />
        </Routes>
      </div>
    </div>
  );
}
