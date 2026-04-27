import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Navbar";
import HotelHome from "./HotelHome";
import UploadPage from "./UploadPage";
import History from "./History";
import Score from "./Score";
import Profile from "../Shared/Profile";

export default function HotelDashboard() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route index element={<><Topbar title="Hotel Dashboard" subtitle="Overview of your food uploads" /><HotelHome /></>} />
          <Route path="upload"  element={<><Topbar title="Upload Food" subtitle="Upload surplus food before 8 PM" /><UploadPage /></>} />
          <Route path="history" element={<><Topbar title="Upload History" subtitle="All past food uploads" /><History /></>} />
          <Route path="score"   element={<><Topbar title="Hygiene Score" subtitle="Your performance & rating" /><Score /></>} />
          <Route path="profile" element={<><Topbar title="Profile" subtitle="Edit your personal details" /><Profile /></>} />
          <Route path="*" element={<Navigate to="/hotel" replace />} />
        </Routes>
      </div>
    </div>
  );
}
