import { useEffect, useState } from "react";

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

type Stats = {
  totalSales: number;
  totalOrders: number;
  todaysSales: number;
  totalCustomers: number;
  productsSold: number;
  pendingOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  lowStockProducts: any[];
  recentNotifications: any[];
  unreadCount: number;
};

export default function AdminDashboardHome({ token }: { token: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const r = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (r.ok) {
          setStats(await r.json());
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [token]);

  if (loading) return <div className="admin-content-loading">Loading dashboard...</div>;
  if (!stats) return <div className="admin-error">Failed to load dashboard statistics</div>;

  const statCards = [
    { label: "Total Sales", value: money(stats.totalSales), icon: "💰", color: "blue" },
    { label: "Total Orders", value: stats.totalOrders, icon: "📦", color: "green" },
    { label: "Total Customers", value: stats.totalCustomers, icon: "👥", color: "purple" },
    { label: "Today's Sales", value: money(stats.todaysSales), icon: "📈", color: "orange" },
    { label: "Products Sold", value: stats.productsSold, icon: "🛍️", color: "pink" },
    { label: "Pending Orders", value: stats.pendingOrders, icon: "⏳", color: "yellow" },
    { label: "Cancelled Orders", value: stats.cancelledOrders, icon: "❌", color: "red" },
    { label: "Returned Orders", value: stats.returnedOrders, icon: "↩️", color: "gray" },
  ];

  return (
    <div className="admin-dashboard-home">
      <div className="dashboard-stats-grid">
        {statCards.map((card, i) => (
          <div key={i} className={`stat-card stat-${card.color}`}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-content">
              <p className="stat-label">{card.label}</p>
              <p className="stat-value">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-widgets">
        <div className="dashboard-widget">
          <h3>🚨 Low Stock Products</h3>
          {stats.lowStockProducts.length === 0 ? (
            <p className="empty-state">No products with low stock</p>
          ) : (
            <div className="product-list">
              {stats.lowStockProducts.map((p) => (
                <div key={p.id} className="product-item">
                  <img src={p.image} alt={p.name} />
                  <div className="product-info">
                    <p className="product-name">{p.name}</p>
                    <p className="product-stock">Stock: {p.stock}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-widget">
          <h3>🔔 Recent Notifications</h3>
          {stats.recentNotifications.length === 0 ? (
            <p className="empty-state">No recent notifications</p>
          ) : (
            <div className="notification-list">
              {stats.recentNotifications.slice(0, 5).map((n) => (
                <div key={n.id} className={`notification-item ${n.read ? "read" : "unread"}`}>
                  <div className="notification-type">{n.type}</div>
                  <p className="notification-title">{n.title}</p>
                  <p className="notification-message">{n.message}</p>
                  <p className="notification-time">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
