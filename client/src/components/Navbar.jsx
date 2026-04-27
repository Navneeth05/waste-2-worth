import { Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLE_COLOR = { hotel: "hotel", ngo: "ngo", muni: "muni" };
const ROLE_LABEL = { hotel: "Hotel", ngo: "NGO", muni: "Municipal" };

export default function Topbar({ title, subtitle, notifCount = 0, onNotifClick, extra }) {
  const { user } = useAuth();
  const role = user?.role === "muni" ? "muni" : user?.role;

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
      </div>

      <div className="topbar-actions">
        {extra}

        <span className={`topbar-badge ${ROLE_COLOR[role] || "hotel"}`}>
          <span style={{ fontSize: 13 }}>
            {role === "hotel" ? "🏨" : role === "ngo" ? "🤝" : "🏛️"}
          </span>
          {ROLE_LABEL[role] || "User"}
        </span>

        {onNotifClick && (
          <button className="notif-btn" onClick={onNotifClick}>
            <Bell size={18} />
            {notifCount > 0 && (
              <span className="notif-count">{notifCount > 9 ? "9+" : notifCount}</span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
