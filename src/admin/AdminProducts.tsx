import { useEffect, useState } from "react";

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  stock: number;
  sku?: string | null;
  image: string;
  active: boolean;
  featured: boolean;
  bestseller: boolean;
  categoryId?: number | null;
};

export default function AdminProducts({ token }: { token: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    stock: "",
    sku: "",
    image: "",
    featured: false,
    bestseller: false,
    active: true,
  });
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    try {
      const r = await fetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        setProducts(await r.json());
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      stock: "",
      sku: "",
      image: "",
      featured: false,
      bestseller: false,
      active: true,
    });
    setError("");
    setShowForm(true);
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description,
      price: String(product.price),
      originalPrice: String(product.originalPrice || ""),
      stock: String(product.stock),
      sku: product.sku || "",
      image: product.image,
      featured: product.featured,
      bestseller: product.bestseller,
      active: product.active,
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.price || !formData.stock || !formData.image) {
      setError("Name, price, stock, and image are required.");
      return;
    }

    try {
      const slug = slugify(formData.name);
      const payload = {
        name: formData.name,
        slug,
        description: formData.description,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        stock: Number(formData.stock),
        sku: formData.sku || null,
        image: formData.image,
        featured: formData.featured,
        bestseller: formData.bestseller,
        active: formData.active,
      };

      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/admin/products/${editingId}` : "/api/admin/products";

      const r = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const data = await r.json();
        setError(data.error || `Failed to ${editingId ? "update" : "add"} product`);
        return;
      }

      setShowForm(false);
      fetchProducts();
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const r = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!r.ok) {
        alert("Failed to delete product");
        return;
      }

      fetchProducts();
    } catch (err) {
      console.error("Failed to delete product:", err);
      alert("Error deleting product");
    }
  };

  if (loading) return <div className="admin-content-loading">Loading products...</div>;

  return (
    <div className="admin-products">
      <div className="admin-section-header">
        <h2>Product Management</h2>
        <button className="button" onClick={handleAddClick}>
          + Add New Product
        </button>
      </div>

      {showForm && (
        <div className="admin-form-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingId ? "Edit Product" : "Add New Product"}</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>
                ✕
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Beautiful Ceramic Mug"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="299"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Original Price (₹)</label>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    placeholder="499"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="50"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="SKU-001"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Image URL *</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-checkboxes">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  />
                  <span>Featured Product</span>
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={formData.bestseller}
                    onChange={(e) => setFormData({ ...formData, bestseller: e.target.checked })}
                  />
                  <span>Bestseller</span>
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="button">
                  {editingId ? "Update Product" : "Add Product"}
                </button>
                <button
                  type="button"
                  className="button outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="products-table">
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>SKU</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  No products found. Add your first product!
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <img src={p.image} alt={p.name} className="table-product-image" />
                  </td>
                  <td>
                    <div>
                      <p className="product-name">{p.name}</p>
                      <p className="product-slug">{p.slug}</p>
                    </div>
                  </td>
                  <td>{money(p.price)}</td>
                  <td>
                    <span className={p.stock <= 5 ? "low-stock" : ""}>{p.stock}</span>
                  </td>
                  <td>{p.sku || "-"}</td>
                  <td>
                    <div className="status-badges">
                      {p.active && <span className="badge active">Active</span>}
                      {p.featured && <span className="badge featured">Featured</span>}
                      {p.bestseller && <span className="badge bestseller">Bestseller</span>}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => handleEditClick(p)}
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(p.id)}
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
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
