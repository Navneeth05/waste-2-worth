import { X, Bell } from "lucide-react";

export default function NotificationToast({ notifications = [], onDismiss }) {
  if (!notifications.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        right: 20,
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxWidth: 340,
        width: "100%",
      }}
    >
      {notifications.map((n) => (
        <div key={n.id} className="toast-notification">
          <div className="toast-icon ngo">
            <Bell size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="toast-title">{n.title || "New Food Available!"}</div>
            <div className="toast-body">{n.message}</div>
            {n.time && (
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
                {n.time}
              </div>
            )}
          </div>
          {onDismiss && (
            <button
              onClick={() => onDismiss(n.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: 2,
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}