import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboardHome from "./AdminDashboardHome";
import AdminProducts from "./AdminProducts";
import AdminOrders from "./AdminOrders";
import AdminCustomers from "./AdminCustomers";
import AdminNotifications from "./AdminNotifications";
import AdminAnalytics from "./AdminAnalytics";
import AdminSettings from "./AdminSettings";

type AdminSection = "dashboard" | "products" | "orders" | "customers" | "notifications" | "analytics" | "settings";

export default function AdminDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const navigate = useNavigate();
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Fetch unread notification count
    const fetchUnreadCount = async () => {
      try {
        const r = await fetch("/api/admin/notifications/unread/count", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (r.ok) {
          const data = await r.json();
          setUnreadCount(data.count || 0);
        }
      } catch (err) {
        console.error("Failed to fetch unread count:", err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [token]);

  const logout = () => {
    localStorage.removeItem("admin-token");
    onLogout();
    navigate("/admin");
  };

  const sidebarItems = [
    { id: "dashboard" as AdminSection, label: "Dashboard", icon: "🏠" },
    { id: "products" as AdminSection, label: "Products", icon: "📦" },
    { id: "orders" as AdminSection, label: "Orders", icon: "🛒" },
    { id: "customers" as AdminSection, label: "Customers", icon: "👥" },
    { id: "analytics" as AdminSection, label: "Analytics", icon: "📊" },
    { id: "notifications" as AdminSection, label: "Notifications", icon: "🔔", badge: unreadCount > 0 ? unreadCount : undefined },
    { id: "settings" as AdminSection, label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="admin-sidebar-header">
          <img src="/logo.jpeg" alt="Pretty Picks" className="admin-logo" />
          <h3>Pretty Picks</h3>
        </div>

        <nav className="admin-nav">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              className={`admin-nav-item ${section === item.id ? "active" : ""}`}
              onClick={() => setSection(item.id)}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
              {item.badge && <span className="badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <button className="admin-logout-btn" onClick={logout}>
          🚪 Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Topbar */}
        <div className="admin-topbar">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <h2 className="admin-page-title">
            {sidebarItems.find((x) => x.id === section)?.label || "Admin"}
          </h2>
          <div className="admin-topbar-right">
            <div className="notification-bell">
              <span className="bell-icon">🔔</span>
              {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
            </div>
            <button className="admin-user-btn">👤 Admin</button>
          </div>
        </div>

        {/* Content Area */}
        <div className="admin-content">
          {section === "dashboard" && <AdminDashboardHome token={token} />}
          {section === "products" && <AdminProducts token={token} />}
          {section === "orders" && <AdminOrders token={token} />}
          {section === "customers" && <AdminCustomers token={token} />}
          {section === "notifications" && <AdminNotifications token={token} />}
          {section === "analytics" && <AdminAnalytics token={token} />}
          {section === "settings" && <AdminSettings token={token} />}
        </div>
      </main>
    </div>
  );
}
