import { useEffect, useState } from "react";

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const VALID_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

type OrderItem = {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
};

type Order = {
  id: number;
  orderNumber: string;
  customerId?: number | null;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  shipping: number;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  items: OrderItem[];
  createdAt: string;
};

export default function AdminOrders({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchOrders = async () => {
    try {
      const r = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        setOrders(await r.json());
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const r = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (r.ok) {
        fetchOrders();
      } else {
        alert("Failed to update order status");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Error updating status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "pending",
      CONFIRMED: "confirmed",
      PROCESSING: "processing",
      PACKED: "packed",
      SHIPPED: "shipped",
      OUT_FOR_DELIVERY: "delivery",
      DELIVERED: "delivered",
      CANCELLED: "cancelled",
      RETURNED: "returned",
    };
    return colors[status] || "pending";
  };

  if (loading) return <div className="admin-content-loading">Loading orders...</div>;

  return (
    <div className="admin-orders">
      <div className="admin-section-header">
        <h2>Order Management</h2>
        <p className="section-subtitle">Total Orders: {orders.length}</p>
      </div>

      {showDetails && selectedOrder && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="modal-header">
              <h3>Order Details - {selectedOrder.orderNumber}</h3>
              <button className="close-btn" onClick={() => setShowDetails(false)}>
                ✕
              </button>
            </div>

            <div className="order-details">
              <div className="detail-section">
                <h4>Customer Information</h4>
                <div className="detail-row">
                  <span className="label">Name:</span>
                  <span className="value">{selectedOrder.customerName}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Phone:</span>
                  <span className="value">{selectedOrder.phone}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Email:</span>
                  <span className="value">{selectedOrder.email}</span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Delivery Address</h4>
                <div className="detail-row">
                  <span className="value">{selectedOrder.address}</span>
                </div>
                <div className="detail-row">
                  <span className="value">
                    {selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Order Items</h4>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{money(item.price)}</td>
                        <td>{item.quantity}</td>
                        <td>{money(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="detail-section">
                <h4>Pricing</h4>
                <div className="detail-row">
                  <span className="label">Subtotal:</span>
                  <span className="value">{money(selectedOrder.subtotal)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Shipping:</span>
                  <span className="value">{money(selectedOrder.shipping)}</span>
                </div>
                <div className="detail-row total">
                  <span className="label">Total:</span>
                  <span className="value">{money(selectedOrder.total)}</span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Payment & Status</h4>
                <div className="detail-row">
                  <span className="label">Payment Status:</span>
                  <span className={`badge ${selectedOrder.paymentStatus.toLowerCase()}`}>
                    {selectedOrder.paymentStatus}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Order Date:</span>
                  <span className="value">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="modal-actions">
                <button className="button" onClick={() => window.print()}>
                  🖨 Print Invoice
                </button>
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

      <div className="orders-table">
        <table>
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Total</th>
              <th>Payment Status</th>
              <th>Order Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.orderNumber}</strong>
                  </td>
                  <td>{order.customerName}</td>
                  <td>{order.phone}</td>
                  <td>{money(order.total)}</td>
                  <td>
                    <span className={`badge ${order.paymentStatus.toLowerCase()}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <select
                      value={order.orderStatus}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      disabled={updatingId === order.id}
                      className={`status-select status-${getStatusColor(order.orderStatus)}`}
                    >
                      {VALID_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-view"
                      onClick={() => handleViewDetails(order)}
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
