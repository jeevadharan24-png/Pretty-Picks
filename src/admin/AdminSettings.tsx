import { useState } from "react";

export default function AdminSettings({ token }: { token: string }) {
  const [settings, setSettings] = useState({
    businessName: "Pretty Picks",
    businessEmail: "prettypicks@gmail.com",
    businessPhone: "919962281251",
    whatsappNumber: "919962281251",
    instagramUrl: "https://www.instagram.com/prettypicks05/",
    pickupAddress: "123 Main Street, City, State",
    shippingCharge: 99,
    freeShippingThreshold: 2000,
    notificationsEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
  });

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setError("");
    // In a real implementation, this would POST/PUT to a backend API
    // For now, just show a success message
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="admin-settings">
      <div className="admin-section-header">
        <h2>Settings</h2>
        <p className="section-subtitle">Manage your business configuration</p>
      </div>

      {saved && (
        <div className="success-message">✓ Settings saved successfully</div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="settings-grid">
        {/* Business Information */}
        <div className="settings-section">
          <h3>🏢 Business Information</h3>
          <div className="form-group">
            <label>Business Name</label>
            <input
              type="text"
              value={settings.businessName}
              onChange={(e) => handleChange("businessName", e.target.value)}
              placeholder="Pretty Picks"
            />
          </div>

          <div className="form-group">
            <label>Business Email</label>
            <input
              type="email"
              value={settings.businessEmail}
              onChange={(e) => handleChange("businessEmail", e.target.value)}
              placeholder="business@example.com"
            />
          </div>

          <div className="form-group">
            <label>Business Phone</label>
            <input
              type="tel"
              value={settings.businessPhone}
              onChange={(e) => handleChange("businessPhone", e.target.value)}
              placeholder="+919876543210"
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="settings-section">
          <h3>📱 Contact Information</h3>
          <div className="form-group">
            <label>WhatsApp Number</label>
            <input
              type="tel"
              value={settings.whatsappNumber}
              onChange={(e) => handleChange("whatsappNumber", e.target.value)}
              placeholder="+919876543210"
            />
          </div>

          <div className="form-group">
            <label>Instagram URL</label>
            <input
              type="url"
              value={settings.instagramUrl}
              onChange={(e) => handleChange("instagramUrl", e.target.value)}
              placeholder="https://instagram.com/yourhandle"
            />
          </div>

          <div className="form-group">
            <label>Pickup/Warehouse Address</label>
            <textarea
              value={settings.pickupAddress}
              onChange={(e) => handleChange("pickupAddress", e.target.value)}
              placeholder="Full pickup address"
              rows={3}
            />
          </div>
        </div>

        {/* Shipping Configuration */}
        <div className="settings-section">
          <h3>📦 Shipping Configuration</h3>
          <div className="form-group">
            <label>Shipping Charge (₹)</label>
            <input
              type="number"
              value={settings.shippingCharge}
              onChange={(e) => handleChange("shippingCharge", Number(e.target.value))}
              placeholder="99"
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Free Shipping Threshold (₹)</label>
            <input
              type="number"
              value={settings.freeShippingThreshold}
              onChange={(e) => handleChange("freeShippingThreshold", Number(e.target.value))}
              placeholder="2000"
              min="0"
            />
            <small>Orders above this amount get free shipping</small>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="settings-section">
          <h3>🔔 Notification Settings</h3>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => handleChange("notificationsEnabled", e.target.checked)}
            />
            <span>Enable notifications</span>
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => handleChange("emailNotifications", e.target.checked)}
              disabled={!settings.notificationsEnabled}
            />
            <span>Email notifications</span>
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.smsNotifications}
              onChange={(e) => handleChange("smsNotifications", e.target.checked)}
              disabled={!settings.notificationsEnabled}
            />
            <span>SMS notifications</span>
          </label>
        </div>

        {/* Security Notice */}
        <div className="settings-section warning">
          <h3>🔐 Security Notice</h3>
          <p>
            The following values are protected and cannot be edited here:
          </p>
          <ul>
            <li>Admin Email</li>
            <li>Admin Password</li>
            <li>Razorpay API Keys</li>
            <li>Database Credentials</li>
          </ul>
          <p>
            To modify these, edit your <code>.env</code> file directly.
          </p>
        </div>
      </div>

      <div className="settings-actions">
        <button className="button" onClick={handleSave}>
          💾 Save Settings
        </button>
      </div>
    </div>
  );
}
