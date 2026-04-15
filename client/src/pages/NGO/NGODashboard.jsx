import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Navbar";
import NotificationToast from "../../components/NotificationToast";
import NGOHome from "./NGOHome";
import MapPage from "./MapPage";
import Pickups from "./Pickups";
import Profile from "../Shared/Profile";

// Simulated socket notifications
let notifIdCounter = 100;
const mockNotifications = [
  { id: 1, title: "New Food Available!", message: "Grand Palace Hotel uploaded 18kg of Biryani at MG Road", time: "Just now" },
  { id: 2, title: "Urgent Pickup",       message: "Spice Garden has 12kg edible food expiring soon",        time: "5 min ago" },
];

export default function NGODashboard() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [showToasts,    setShowToasts]    = useState(true);

  // Simulate incoming socket event every 45 seconds (demo)
  useEffect(() => {
    const interval = setInterval(() => {
      const newNotif = {
        id: ++notifIdCounter,
        title: "New Food Available!",
        message: `Hotel #${Math.floor(Math.random() * 50) + 1} uploaded ${Math.floor(Math.random() * 30) + 5}kg of fresh food`,
        time: "Just now",
      };
      setNotifications((prev) => [newNotif, ...prev].slice(0, 10));
      setShowToasts(true);
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  const dismissNotif = (id) => setNotifications((p) => p.filter((n) => n.id !== id));

  return (
    <div className="dashboard-layout">
      <Sidebar
        notifCount={notifications.length}
        onNotifClick={() => setShowToasts((v) => !v)}
      />
      <div className="main-content">
        <Routes>
          <Route index element={<><Topbar title="NGO Dashboard" subtitle="Monitor food availability & pickups" notifCount={notifications.length} onNotifClick={() => setShowToasts(v => !v)} /><NGOHome notifications={notifications} /></>} />
          <Route path="map"     element={<><Topbar title="Food Map" subtitle="Live map of available food locations" notifCount={notifications.length} onNotifClick={() => setShowToasts(v => !v)} /><MapPage /></>} />
          <Route path="pickups" element={<><Topbar title="Pickups" subtitle="Your confirmed & pending pickups" notifCount={notifications.length} onNotifClick={() => setShowToasts(v => !v)} /><Pickups /></>} />
          <Route path="profile" element={<><Topbar title="Profile" subtitle="Edit your personal details" notifCount={notifications.length} onNotifClick={() => setShowToasts(v => !v)} /><Profile /></>} />
          <Route path="*" element={<Navigate to="/ngo" replace />} />
        </Routes>
      </div>
      {showToasts && notifications.length > 0 && (
        <NotificationToast notifications={notifications.slice(0, 3)} onDismiss={dismissNotif} />
      )}
    </div>
  );
}