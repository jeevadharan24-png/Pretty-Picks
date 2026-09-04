import { useEffect, useState } from "react";

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

type Analytics = {
  dailySales: Record<string, number>;
  bestSellingProducts: Array<{ name: string; quantity: number; sales: number }>;
  orderCountByStatus: Record<string, number>;
  totalOrders: number;
  totalRevenue: number;
};

export default function AdminAnalytics({ token }: { token: string }) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const r = await fetch("/api/admin/analytics", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (r.ok) {
          setAnalytics(await r.json());
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, [token]);

  if (loading) return <div className="admin-content-loading">Loading analytics...</div>;
  if (!analytics) return <div className="admin-error">Failed to load analytics</div>;

  const dailySalesArray = Object.entries(analytics.dailySales || {}).map(([date, sales]) => ({
    date,
    sales,
  }));

  const maxDailySales = Math.max(...dailySalesArray.map((d) => d.sales || 0), 1);

  return (
    <div className="admin-analytics">
      <div className="admin-section-header">
        <h2>Analytics</h2>
      </div>

      <div className="analytics-overview">
        <div className="overview-card">
          <h3>Total Revenue</h3>
          <p className="large-value">{money(analytics.totalRevenue)}</p>
        </div>
        <div className="overview-card">
          <h3>Total Orders</h3>
          <p className="large-value">{analytics.totalOrders}</p>
        </div>
        <div className="overview-card">
          <h3>Average Order Value</h3>
          <p className="large-value">
            {analytics.totalOrders > 0
              ? money(analytics.totalRevenue / analytics.totalOrders)
              : "₹0"}
          </p>
        </div>
      </div>

      <div className="analytics-widgets">
        <div className="analytics-widget">
          <h3>📈 Daily Sales (Last 7 Days)</h3>
          <div className="chart-container">
            {dailySalesArray.length === 0 ? (
              <p className="empty-state">No data available</p>
            ) : (
              <div className="simple-bar-chart">
                {dailySalesArray.map((day, idx) => (
                  <div key={idx} className="bar-item">
                    <div className="bar-wrapper">
                      <div
                        className="bar"
                        style={{
                          height: `${(day.sales / maxDailySales) * 200}px`,
                        }}
                        title={money(day.sales)}
                      />
                    </div>
                    <p className="bar-label">{day.date.split("-")[2]}</p>
                    <p className="bar-value">{money(day.sales)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="analytics-widget">
          <h3>🎯 Order Status Distribution</h3>
          <div className="status-breakdown">
            {Object.entries(analytics.orderCountByStatus || {}).map(([status, count]) => {
              const total = analytics.totalOrders || 1;
              const percentage = ((count as number) / total) * 100;
              return (
                <div key={status} className="status-row">
                  <div className="status-info">
                    <span className={`status-label status-${status.toLowerCase()}`}>
                      {status}
                    </span>
                    <span className="status-count">{count as number}</span>
                  </div>
                  <div className="status-bar">
                    <div className="progress" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="percentage">{percentage.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="analytics-widget">
          <h3>🏆 Best Selling Products</h3>
          {analytics.bestSellingProducts.length === 0 ? (
            <p className="empty-state">No product sales data</p>
          ) : (
            <div className="products-ranking">
              {analytics.bestSellingProducts.slice(0, 10).map((product, idx) => (
                <div key={idx} className="ranking-item">
                  <div className="rank-number">{idx + 1}</div>
                  <div className="rank-info">
                    <p className="rank-name">{product.name}</p>
                    <p className="rank-stats">
                      {product.quantity} sold · {money(product.sales)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
