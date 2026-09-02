import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Link,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";

type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  stock: number;
  image: string;
  featured: boolean;
  bestseller: boolean;
  active: boolean;
};

type CartItem = {
  product: Product;
  quantity: number;
};

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function useCart() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("Pretty Picks-cart") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("Pretty Picks-cart", JSON.stringify(cart));
  }, [cart]);

  const add = (product: Product) =>
    setCart((c) => {
      const existing = c.find((x) => x.product.id === product.id);

      if (existing) {
        return c.map((x) =>
          x.product.id === product.id
            ? {
                ...x,
                quantity: Math.min(x.quantity + 1, product.stock),
              }
            : x
        );
      }

      return [...c, { product, quantity: 1 }];
    });

  const update = (id: number, quantity: number) =>
    setCart((c) =>
      c.map((x) =>
        x.product.id === id
          ? {
              ...x,
              quantity: Math.max(
                1,
                Math.min(quantity, x.product.stock)
              ),
            }
          : x
      )
    );

  const remove = (id: number) =>
    setCart((c) => c.filter((x) => x.product.id !== id));

  const clear = () => setCart([]);

  return { cart, add, update, remove, clear };
}

function Layout({
  children,
  count,
}: {
  children: ReactNode;
  count: number;
}) {
  return (
    <>
      <header>
        <Link className="logo" to="/">
          Pretty Picks
        </Link>

        <nav>
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/track">Track Order</Link>

          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
          >
            Instagram
          </a>

          <Link className="cart-link" to="/cart">
            Cart ({count})
          </Link>
        </nav>
      </header>

      <main>{children}</main>

      <footer>
        © {new Date().getFullYear()} Pretty Picks · Shop with confidence
      </footer>
    </>
  );
}

function ProductCard({
  p,
  add,
}: {
  p: Product;
  add: (p: Product) => void;
}) {
  return (
    <article className="card">
      <Link to={`/product/${p.slug}`}>
        <img src={p.image} alt={p.name} />

        <div className="card-body">
          <h3>{p.name}</h3>
          <p>{p.description}</p>

          <div className="price">
            {money(p.price)}{" "}
            {p.originalPrice && <del>{money(p.originalPrice)}</del>}
          </div>
        </div>
      </Link>

      <button onClick={() => add(p)} disabled={!p.stock}>
        {p.stock ? "Add to Cart" : "Out of Stock"}
      </button>
    </article>
  );
}

function Home({ add }: { add: (p: Product) => void }) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(console.error);
  }, []);

  return (
    <>
      <section className="hero">
        <div>
          <span>NEW SEASON</span>

          <h1>
            Simple products.
            <br />
            Made to stand out.
          </h1>

          <p>
            Discover our latest collection and order directly online.
          </p>

          <Link className="button" to="/shop">
            Shop Now
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Featured</h2>
          <Link to="/shop">View all →</Link>
        </div>

        <div className="grid">
          {products
            .filter((p) => p.featured)
            .map((p) => (
              <ProductCard key={p.id} p={p} add={add} />
            ))}
        </div>
      </section>
    </>
  );
}

function Shop({ add }: { add: (p: Product) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(console.error);
  }, []);

  const shown = useMemo(
    () =>
      products.filter((p) =>
        p.name.toLowerCase().includes(q.toLowerCase())
      ),
    [products, q]
  );

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <h1>Shop</h1>
          <p>Browse all available products.</p>
        </div>

        <input
          className="search"
          placeholder="Search products..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="grid">
        {shown.map((p) => (
          <ProductCard key={p.id} p={p} add={add} />
        ))}
      </div>
    </section>
  );
}

function ProductPage({ add }: { add: (p: Product) => void }) {
  const { slug } = useParams();
  const [p, setP] = useState<Product | null>(null);

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then(setP)
      .catch(console.error);
  }, [slug]);

  if (!p) {
    return (
      <section className="section">
        <p>Loading...</p>
      </section>
    );
  }

  return (
    <section className="product-page">
      <img src={p.image} alt={p.name} />

      <div>
        <span className="muted">PRETTY PICKS</span>

        <h1>{p.name}</h1>

        <div className="big-price">
          {money(p.price)}{" "}
          {p.originalPrice && <del>{money(p.originalPrice)}</del>}
        </div>

        <p>{p.description}</p>
        <p>{p.stock} items available</p>

        <button
          className="button"
          onClick={() => add(p)}
          disabled={!p.stock}
        >
          {p.stock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </section>
  );
}

function Cart({
  cart,
  update,
  remove,
}: {
  cart: CartItem[];
  update: (id: number, q: number) => void;
  remove: (id: number) => void;
}) {
  const subtotal = cart.reduce(
    (s, x) => s + x.product.price * x.quantity,
    0
  );

  const shipping =
    subtotal >= 2000 || subtotal === 0 ? 0 : 99;

  return (
    <section className="section narrow">
      <h1>Your Cart</h1>

      {!cart.length ? (
        <div className="empty">
          <p>Your cart is empty.</p>

          <Link className="button" to="/shop">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {cart.map((x) => (
              <div className="cart-row" key={x.product.id}>
                <img src={x.product.image} alt={x.product.name} />

                <div>
                  <h3>{x.product.name}</h3>

                  <p>{money(x.product.price)}</p>

                  <div>
                    <button
                      onClick={() =>
                        update(x.product.id, x.quantity - 1)
                      }
                    >
                      -
                    </button>

                    <b>{x.quantity}</b>

                    <button
                      onClick={() =>
                        update(x.product.id, x.quantity + 1)
                      }
                    >
                      +
                    </button>

                    <button
                      className="link-btn"
                      onClick={() => remove(x.product.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <strong>
                  {money(x.product.price * x.quantity)}
                </strong>
              </div>
            ))}
          </div>

          <div className="summary">
            <p>
              Subtotal <b>{money(subtotal)}</b>
            </p>

            <p>
              Shipping <b>{shipping ? money(shipping) : "Free"}</b>
            </p>

            <hr />

            <p className="total">
              Total <b>{money(subtotal + shipping)}</b>
            </p>

            <Link className="button full" to="/checkout">
              Checkout
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

function Checkout({
  cart,
  clear,
}: {
  cart: CartItem[];
  clear: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nav = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: form,
          items: cart.map((x) => ({
            productId: x.product.id,
            quantity: x.quantity,
          })),
        }),
      });

      const data = await r.json();

      if (!r.ok) {
        throw new Error(data.error || "Order failed");
      }

      if (data.razorpay) {
        const script = document.createElement("script");

        script.src =
          "https://checkout.razorpay.com/v1/checkout.js";

        script.onload = () => {
          const rz = new (window as any).Razorpay({
            key: data.razorpay.key,
            amount: data.razorpay.amount,
            currency: data.razorpay.currency,
            name: "Pretty Picks",
            description: "Order payment",
            order_id: data.razorpay.id,

            prefill: {
              name: form.name,
              email: form.email,
              contact: form.phone,
            },

            handler: async (resp: any) => {
              const vr = await fetch("/api/payments/verify", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  orderId: data.order.id,
                  ...resp,
                }),
              });

              if (vr.ok) {
                clear();
                nav(`/success/${data.order.orderNumber}`);
              } else {
                setError("Payment verification failed.");
              }
            },
          });

          rz.open();
        };

        document.body.appendChild(script);
      } else {
        clear();
        nav(`/success/${data.order.orderNumber}`);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!cart.length) {
    return (
      <section className="section narrow">
        <h1>Checkout</h1>
        <p>Your cart is empty.</p>
      </section>
    );
  }

  return (
    <section className="section narrow">
      <h1>Checkout</h1>

      <form onSubmit={submit} className="form">
        {[
          "name",
          "phone",
          "email",
          "address",
          "city",
          "state",
          "pincode",
        ].map((key) => (
          <label key={key}>
            {key === "name"
              ? "Full Name"
              : key === "phone"
              ? "Mobile Number"
              : key === "email"
              ? "Email"
              : key === "address"
              ? "Address"
              : key === "pincode"
              ? "Pincode"
              : key[0].toUpperCase() + key.slice(1)}

            <input
              required={key !== "email"}
              type={key === "email" ? "email" : "text"}
              value={(form as any)[key]}
              onChange={(e) =>
                setForm({
                  ...form,
                  [key]: e.target.value,
                })
              }
            />
          </label>
        ))}

        {error && <div className="error">{error}</div>}

        <button className="button full" disabled={loading}>
          {loading ? "Processing..." : "Place Order & Pay"}
        </button>

        <small>
          Payments are securely processed by Razorpay when payment
          keys are configured.
        </small>
      </form>
    </section>
  );
}

function Success() {
  const { number } = useParams();

  return (
    <section className="section narrow center">
      <div className="success">✓</div>

      <h1>Order Placed!</h1>

      <p>
        Your order <b>{number}</b> has been received.
      </p>

      <Link className="button" to="/shop">
        Continue Shopping
      </Link>
    </section>
  );
}

function Track() {
  const [number, setNumber] = useState("");
  const [order, setOrder] = useState<any>();
  const [error, setError] = useState("");

  const search = async () => {
    setError("");

    const r = await fetch(`/api/orders/${number}`);

    if (!r.ok) {
      setError("Order not found.");
      setOrder(null);
      return;
    }

    setOrder(await r.json());
  };

  return (
    <section className="section narrow">
      <h1>Track Order</h1>

      <div className="track">
        <input
          placeholder="Pretty Picks-6369090002"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />

        <button className="button" onClick={search}>
          Track
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {order && (
        <div className="order-box">
          <h2>{order.orderNumber}</h2>

          <p>
            Status: <b>{order.orderStatus}</b>
          </p>

          <p>
            Payment: <b>{order.paymentStatus}</b>
          </p>

          <p>
            Total: <b>{money(order.total)}</b>
          </p>
        </div>
      )}
    </section>
  );
}


/* =========================
   ADMIN DASHBOARD
========================= */

function Admin() {
  const [token, setToken] = useState(
    localStorage.getItem("admin-token") || ""
  );

  const [email, setEmail] = useState("prettypicks@gmail.com");
  const [password, setPassword] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    stock: "",
    image: "",
  });

  const load = async (t = token) => {
    if (!t) return;

    const headers = {
      Authorization: `Bearer ${t}`,
    };

    try {
      const [p, o] = await Promise.all([
        fetch("/api/admin/products", {
          headers,
        }),
        fetch("/api/admin/orders", {
          headers,
        }),
      ]);

      if (p.ok) {
        setProducts(await p.json());
      }

      if (o.ok) {
        setOrders(await o.json());
      }

      if (p.status === 401 || o.status === 401) {
        localStorage.removeItem("admin-token");
        setToken("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      load(token);
    }
  }, [token]);

  const login = async () => {
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const d = await r.json();

      if (r.ok && d.token) {
        localStorage.setItem("admin-token", d.token);
        setToken(d.token);
        setPassword("");
        await load(d.token);
      } else {
        alert(d.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server connection failed");
    }
  };

  const add = async () => {
    if (!form.name || !form.price || !form.stock) {
      alert("Name, price and stock are required.");
      return;
    }

    try {
      const r = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          originalPrice: form.originalPrice
            ? Number(form.originalPrice)
            : null,
          stock: Number(form.stock),
          image: form.image,
        }),
      });

      const data = await r.json();

      if (r.ok) {
        setForm({
          name: "",
          description: "",
          price: "",
          originalPrice: "",
          stock: "",
          image: "",
        });

        await load();
      } else {
        alert(data.error || "Failed to add product");
      }
    } catch (err) {
      console.error(err);
      alert("Server connection failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("admin-token");
    setToken("");
    setProducts([]);
    setOrders([]);
  };

  if (!token) {
    return (
      <section className="section narrow">
        <h1>Admin Login</h1>

        <div className="form">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />

          <button className="button" onClick={login}>
            Login
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="admin-head">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage your store products and orders.</p>
        </div>

        <button onClick={logout}>Logout</button>
      </div>

      <div className="admin-grid">

        {/* ADD PRODUCT */}

        <div className="admin-panel">
          <h2>Add Product</h2>

          <div className="form">
            <input
              placeholder="Product Name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />

            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
            />

            <input
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={(e) =>
                setForm({
                  ...form,
                  price: e.target.value,
                })
              }
            />

            <input
              type="number"
              placeholder="Original Price"
              value={form.originalPrice}
              onChange={(e) =>
                setForm({
                  ...form,
                  originalPrice: e.target.value,
                })
              }
            />

            <input
              type="number"
              placeholder="Stock"
              value={form.stock}
              onChange={(e) =>
                setForm({
                  ...form,
                  stock: e.target.value,
                })
              }
            />

            <input
              placeholder="Image URL"
              value={form.image}
              onChange={(e) =>
                setForm({
                  ...form,
                  image: e.target.value,
                })
              }
            />

            <button className="button" onClick={add}>
              Add Product
            </button>
          </div>
        </div>


        {/* PRODUCTS */}

        <div className="admin-panel">
          <h2>Products ({products.length})</h2>

          {products.map((p) => (
            <div className="admin-item" key={p.id}>
              <img src={p.image} alt={p.name} />

              <div>
                <b>{p.name}</b>
                <small>
                  {money(p.price)} · Stock {p.stock}
                </small>
              </div>

              <button
                onClick={async () => {
                  if (!confirm("Delete product?")) return;

                  await fetch(
                    `/api/admin/products/${p.id}`,
                    {
                      method: "DELETE",
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );

                  await load();
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>


        {/* ORDERS */}

        <div className="admin-panel">
          <h2>Orders ({orders.length})</h2>

          {orders.map((o) => (
            <div className="admin-item" key={o.id}>
              <div>
                <b>{o.orderNumber}</b>

                <small>
                  {o.customerName} · {money(o.total)}
                </small>
              </div>

              <select
                value={o.orderStatus}
                onChange={async (e) => {
                  await fetch(
                    `/api/admin/orders/${o.id}/status`,
                    {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        status: e.target.value,
                      }),
                    }
                  );

                  await load();
                }}
              >
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="PACKED">PACKED</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}


/* =========================
   APP
========================= */

export default function App() {
  const cartHook = useCart();

  const cartCount = cartHook.cart.reduce(
    (s, x) => s + x.quantity,
    0
  );

  return (
    <Layout count={cartCount}>
      <Routes>
        <Route
          path="/"
          element={<Home add={cartHook.add} />}
        />

        <Route
          path="/shop"
          element={<Shop add={cartHook.add} />}
        />

        <Route
          path="/product/:slug"
          element={<ProductPage add={cartHook.add} />}
        />

        <Route
          path="/cart"
          element={<Cart {...cartHook} />}
        />

        <Route
          path="/checkout"
          element={
            <Checkout
              cart={cartHook.cart}
              clear={cartHook.clear}
            />
          }
        />

        <Route
          path="/success/:number"
          element={<Success />}
        />

        <Route
          path="/track"
          element={<Track />}
        />

        <Route
          path="/admin"
          element={<Admin />}
        />
      </Routes>
    </Layout>
  );
}