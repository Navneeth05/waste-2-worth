import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, Upload, History, Star, Bell,
  Map, Package, Trash2, BarChart3, LogOut, Utensils,
  ChevronRight, User
} from "lucide-react";

const NAVS = {
  hotel: [
    { to: "/hotel",         label: "Dashboard", icon: LayoutDashboard },
    { to: "/hotel/upload",  label: "Upload Food", icon: Upload },
    { to: "/hotel/history", label: "History",     icon: History },
    { to: "/hotel/score",   label: "Hygiene Score", icon: Star },
    { to: "/hotel/profile", label: "My Profile",  icon: User },
  ],
  ngo: [
    { to: "/ngo",          label: "Dashboard",       icon: LayoutDashboard },
    { to: "/ngo/map",      label: "Food Map",         icon: Map },
    { to: "/ngo/pickups",  label: "Pickups",          icon: Package },
    { to: "/ngo/profile",  label: "My Profile",       icon: User },
  ],
  muni: [
    { to: "/municipal",        label: "Dashboard",       icon: LayoutDashboard },
    { to: "/municipal/waste",  label: "Waste Collection", icon: Trash2 },
    { to: "/municipal/stats",  label: "Analytics",        icon: BarChart3 },
    { to: "/municipal/profile", label: "My Profile",       icon: User },
  ],
};

const COLOR = { hotel: "hotel", ngo: "ngo", muni: "muni" };

const LOGO = {
  hotel: { icon: "🏨", label: "Waste 2 Worth", sub: "Hotel Portal" },
  ngo:   { icon: "🤝", label: "Waste 2 Worth", sub: "NGO Portal"   },
  muni:  { icon: "🏛️", label: "Waste 2 Worth", sub: "Municipal Portal" },
};

const AVATAR_COLOR = {
  hotel: "linear-gradient(135deg,#f97316,#ea580c)",
  ngo:   "linear-gradient(135deg,#22c55e,#16a34a)",
  muni:  "linear-gradient(135deg,#3b82f6,#2563eb)",
};

export default function Sidebar({ notifCount = 0, onNotifClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role === "muni" ? "muni" : user?.role;
  const navItems = NAVS[role] || [];
  const logo = LOGO[role] || LOGO.hotel;
  const color = COLOR[role] || "hotel";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" style={{ background: AVATAR_COLOR[role] }}>
          <span style={{ fontSize: 18 }}>{logo.icon}</span>
        </div>
        <div>
          <div className="sidebar-logo-text">{logo.label}</div>
          <div className="sidebar-logo-sub">{logo.sub}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Menu</div>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === `/${role}` || to === "/municipal"}
            className={({ isActive }) =>
              `nav-item ${isActive ? `active ${color}` : ""}`
            }
          >
            <Icon size={18} />
            {label}
            <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.4 }} />
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Notification shortcut for NGO */}
        {role === "ngo" && (
          <button
            className="nav-item"
            style={{ marginBottom: 4 }}
            onClick={onNotifClick}
          >
            <Bell size={18} />
            Notifications
            {notifCount > 0 && (
              <span
                style={{
                  marginLeft: "auto",
                  background: "var(--non-edible)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: "100px",
                  padding: "1px 6px",
                }}
              >
                {notifCount}
              </span>
            )}
          </button>
        )}

        {/* User / Logout */}
        <div className="sidebar-user" onClick={handleLogout} title="Logout">
          <div
            className="user-avatar"
            style={{ background: AVATAR_COLOR[role] }}
          >
            {user?.name?.[0] || "U"}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name || "User"}</div>
            <div className="user-role">Tap to logout</div>
          </div>
          <LogOut size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
