import { useEffect, useState } from "react";

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

type Customer = {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
};

type CustomerDetail = Customer & {
  orders: any[];
};

export default function AdminCustomers({ token }: { token: string }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchCustomers = async () => {
    try {
      const r = await fetch("/api/admin/customers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        setCustomers(await r.json());
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [token]);

  const handleViewDetails = async (customerId: number) => {
    try {
      const r = await fetch(`/api/admin/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        const data = await r.json();
        setSelectedCustomer(data);
        setShowDetails(true);
      }
    } catch (err) {
      console.error("Failed to fetch customer details:", err);
    }
  };

  if (loading) return <div className="admin-content-loading">Loading customers...</div>;

  return (
    <div className="admin-customers">
      <div className="admin-section-header">
        <h2>Customer Management</h2>
        <p className="section-subtitle">Total Customers: {customers.length}</p>
      </div>

      {showDetails && selectedCustomer && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="modal-header">
              <h3>Customer Profile - {selectedCustomer.name}</h3>
              <button className="close-btn" onClick={() => setShowDetails(false)}>
                ✕
              </button>
            </div>

            <div className="customer-details">
              <div className="detail-section">
                <h4>Personal Information</h4>
                <div className="detail-row">
                  <span className="label">Name:</span>
                  <span className="value">{selectedCustomer.name}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Phone:</span>
                  <span className="value">{selectedCustomer.phone}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Email:</span>
                  <span className="value">{selectedCustomer.email || "Not provided"}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Joined:</span>
                  <span className="value">
                    {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Address</h4>
                <div className="detail-row">
                  <span className="value">
                    {selectedCustomer.address || "Not provided"}
                  </span>
                </div>
                {(selectedCustomer.city || selectedCustomer.state || selectedCustomer.pincode) && (
                  <div className="detail-row">
                    <span className="value">
                      {[selectedCustomer.city, selectedCustomer.state, selectedCustomer.pincode]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h4>Purchase Statistics</h4>
                <div className="stat-mini-grid">
                  <div className="stat-mini-card">
                    <p className="stat-label">Total Orders</p>
                    <p className="stat-value">{selectedCustomer.totalOrders}</p>
                  </div>
                  <div className="stat-mini-card">
                    <p className="stat-label">Total Spent</p>
                    <p className="stat-value">{money(selectedCustomer.totalSpent)}</p>
                  </div>
                  <div className="stat-mini-card">
                    <p className="stat-label">Avg Order Value</p>
                    <p className="stat-value">
                      {selectedCustomer.totalOrders > 0
                        ? money(selectedCustomer.totalSpent / selectedCustomer.totalOrders)
                        : "₹0"}
                    </p>
                  </div>
                </div>
              </div>

              {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
                <div className="detail-section">
                  <h4>Order History</h4>
                  <table className="orders-mini-table">
                    <thead>
                      <tr>
                        <th>Order Number</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.orders.map((order) => (
                        <tr key={order.id}>
                          <td>{order.orderNumber}</td>
                          <td>{money(order.total)}</td>
                          <td>
                            <span className={`badge ${order.orderStatus.toLowerCase()}`}>
                              {order.orderStatus}
                            </span>
                          </td>
                          <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="button outline"
                  onClick={() => setShowDetails(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="customers-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.email || "-"}</td>
                  <td>{customer.totalOrders}</td>
                  <td>{money(customer.totalSpent)}</td>
                  <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-view"
                      onClick={() => handleViewDetails(customer.id)}
                      title="View Details"
                    >
                      👁
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
