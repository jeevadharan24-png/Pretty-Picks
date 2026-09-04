import { useEffect, useState } from "react";

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  orderId?: number | null;
  read: boolean;
  createdAt: string;
};

export default function AdminNotifications({ token }: { token: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const fetchNotifications = async () => {
    try {
      const r = await fetch("/api/admin/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        setNotifications(await r.json());
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [token]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const r = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (r.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    for (const n of unread) {
      await handleMarkAsRead(n.id);
    }
  };

  if (loading) return <div className="admin-content-loading">Loading notifications...</div>;

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      NEW_ORDER: "📦",
      ORDER_STATUS_CHANGED: "🔄",
      LOW_STOCK: "🚨",
      PAYMENT_RECEIVED: "💰",
      REFUND_PROCESSED: "↩️",
    };
    return icons[type] || "🔔";
  };

  return (
    <div className="admin-notifications">
      <div className="admin-section-header">
        <h2>Notifications</h2>
        <p className="section-subtitle">
          {unreadCount} unread · {notifications.length} total
        </p>
      </div>

      <div className="notification-controls">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({notifications.length})
          </button>
          <button
            className={`filter-btn ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={`filter-btn ${filter === "read" ? "active" : ""}`}
            onClick={() => setFilter("read")}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <button className="button small" onClick={handleMarkAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="notifications-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>
              {filter === "all"
                ? "No notifications yet"
                : filter === "unread"
                ? "All caught up!"
                : "No read notifications"}
            </p>
          </div>
        ) : (
          filtered.map((notif) => (
            <div
              key={notif.id}
              className={`notification-card ${notif.read ? "read" : "unread"}`}
            >
              <div className="notification-icon">
                {getTypeIcon(notif.type)}
              </div>
              <div className="notification-content">
                <div className="notification-header">
                  <h4>{notif.title}</h4>
                  <span className="notification-type">{notif.type}</span>
                </div>
                <p className="notification-message">{notif.message}</p>
                <p className="notification-time">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </div>
              {!notif.read && (
                <button
                  className="btn-mark-read"
                  onClick={() => handleMarkAsRead(notif.id)}
                  title="Mark as read"
                >
                  ✓
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
