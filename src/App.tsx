import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Link,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import AdminDashboard from "./admin/AdminDashboard";

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

type CartItem = { product: Product; quantity: number };

type ProfileData = {
  name: string;
  phone: string;
  email: string;
};

type Address = {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
};

type SavedOrder = {
  orderNumber: string;
  createdAt: string;
  total: number;
};

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const instagramUrl = "https://www.instagram.com/prettypicks05/";

/* IMPORTANT: replace this with your real WhatsApp number.
   Country code + number only. Example: 919876543210 */
const WHATSAPP_NUMBER = "919962281251";

function waUrl(message = "Hi JP Store, I need help with my order.") {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function useCart() {
  const [cart, setCart] = useState<CartItem[]>(() =>
    readStorage<CartItem[]>("PJP Store-cart", [])
  );

  useEffect(() => {
    writeStorage("JP Store-cart", cart);
  }, [cart]);

  const add = (product: Product) =>
    setCart((current) => {
      const existing = current.find((x) => x.product.id === product.id);
      if (existing) {
        return current.map((x) =>
          x.product.id === product.id
            ? {
                ...x,
                quantity: Math.min(x.quantity + 1, product.stock),
              }
            : x
        );
      }
      return [...current, { product, quantity: 1 }];
    });

  const update = (id: number, quantity: number) =>
    setCart((current) =>
      current.map((x) =>
        x.product.id === id
          ? {
              ...x,
              quantity: Math.max(1, Math.min(quantity, x.product.stock)),
            }
          : x
      )
    );

  const remove = (id: number) =>
    setCart((current) => current.filter((x) => x.product.id !== id));

  const clear = () => setCart([]);

  return { cart, add, update, remove, clear };
}

function useWishlist() {
  const [ids, setIds] = useState<number[]>(() =>
    readStorage<number[]>("pp-wishlist", [])
  );

  useEffect(() => writeStorage("pp-wishlist", ids), [ids]);

  const toggle = (id: number) =>
    setIds((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id]
    );

  return { ids, toggle };
}

function Layout({
  children,
  count,
  wishlistCount,
}: {
  children: ReactNode;
  count: number;
  wishlistCount: number;
}) {
  return (
    <>
      <div className="announcement-bar">
        ✦ Curated with love · Free shipping above ₹2,000 ✦
      </div>

      <header>
        <Link className="logo" to="/">
          <img src="/logo.png" alt="JP Store" />
          <span>JP Store</span>
        </Link>

        <nav>
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/track">Track</Link>
          <Link to="/wishlist">♡ Wishlist ({wishlistCount})</Link>
          <Link to="/profile">👤 My Account</Link>
          <Link className="cart-link" to="/cart">
            🛒 Cart ({count})
          </Link>
        </nav>
      </header>

      <main>{children}</main>

      <a
        className="whatsapp-float"
        href={waUrl()}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp support"
        title="WhatsApp Support"
      >
        💬
      </a>

      <footer>
        <div className="footer-brand">
          <img src="/logo.jpeg" alt="JP Store" />
          <h2>JP Store</h2>
          <p>Pick your pretty. ♡</p>
        </div>

        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/profile">My Account</Link>
          <Link to="/track">Track Order</Link>
          <Link to="/wishlist">Wishlist</Link>
          <a href={instagramUrl} target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a href={waUrl()} target="_blank" rel="noreferrer">
            WhatsApp Support
          </a>
        </div>

        <div className="footer-bottom">
          © {new Date().getFullYear()} JP Store · Made with love ♡
        </div>
      </footer>
    </>
  );
}

function ProductCard({
  p,
  add,
  wished,
  onWishlist,
}: {
  p: Product;
  add: (p: Product) => void;
  wished: boolean;
  onWishlist: () => void;
}) {
  const discount =
    p.originalPrice && p.originalPrice > p.price
      ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
      : 0;

  return (
    <article className="card">
      <div className="product-image-wrap">
        {p.bestseller && <span className="product-badge">Bestseller</span>}
        {discount > 0 && (
          <span className="discount-badge">{discount}% OFF</span>
        )}
        <button
          className={`wishlist-heart ${wished ? "active" : ""}`}
          onClick={onWishlist}
          aria-label="Toggle wishlist"
        >
          {wished ? "♥" : "♡"}
        </button>
        <Link to={`/product/${p.slug}`}>
          <img src={p.image} alt={p.name} />
        </Link>
      </div>

      <div className="card-body">
        <div className="product-category">
          {p.bestseller ? "BESTSELLER" : "JP Store"}
        </div>
        <Link to={`/product/${p.slug}`}>
          <h3>{p.name}</h3>
          <p>{p.description}</p>
          <div className="price">
            {money(p.price)}
            {p.originalPrice && <del>{money(p.originalPrice)}</del>}
          </div>
        </Link>
        <div className="stock-text">
          {p.stock > 0
            ? p.stock <= 5
              ? `Only ${p.stock} left`
              : "In stock"
            : "Out of stock"}
        </div>
      </div>

      <button onClick={() => add(p)} disabled={!p.stock}>
        {p.stock ? "♡ Add to Cart" : "Out of Stock"}
      </button>
    </article>
  );
}

function Home({
  add,
  wishlist,
}: {
  add: (p: Product) => void;
  wishlist: ReturnType<typeof useWishlist>;
}) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(console.error);
  }, []);

  const featured = products.filter((p) => p.featured);
  const bestsellers = products.filter((p) => p.bestseller);

  const card = (p: Product) => (
    <ProductCard
      key={p.id}
      p={p}
      add={add}
      wished={wishlist.ids.includes(p.id)}
      onWishlist={() => wishlist.toggle(p.id)}
    />
  );

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <span>WELCOME TO JP Store</span>
          <h1>
            Pick your
            <br />
            <em>pretty.</em>
          </h1>
          <p>
            Discover beautiful little things curated with love, style and a
            touch of elegance.
          </p>
          <div className="hero-actions">
            <Link className="button" to="/shop">
              Explore Collection →
            </Link>
            <a
              className="hero-instagram"
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
            >
              Follow us on Instagram
            </a>
          </div>
        </div>
        <div className="hero-decoration">
          <img src="/logo.jpeg" alt="JP Store" />
        </div>
      </section>

      <section className="brand-intro">
        <div>
          <span className="eyebrow">A LITTLE SOMETHING SPECIAL</span>
          <h2>
            Pretty things,
            <br />
            picked for you.
          </h2>
          <p>
            At JP Store, we believe that the little things make life
            prettier. Explore our handpicked collection made to add a little
            joy to your day.
          </p>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow">OUR FAVOURITES</span>
              <h2>Featured Picks</h2>
              <p>A few JP Store we think you'll love.</p>
            </div>
            <Link to="/shop">View all →</Link>
          </div>
          <div className="grid">{featured.map(card)}</div>
        </section>
      )}

      {bestsellers.length > 0 && (
        <section className="section soft-section">
          <div className="section-head">
            <div>
              <span className="eyebrow">LOVED BY YOU</span>
              <h2>Bestsellers</h2>
              <p>Our most-loved JP Store.</p>
            </div>
            <Link to="/shop">Shop everything →</Link>
          </div>
          <div className="grid">{bestsellers.slice(0, 3).map(card)}</div>
        </section>
      )}

      <section className="why-section">
        <div className="section-head centered">
          <div>
            <span className="eyebrow">WHY JP Store</span>
            <h2>Picked with love ♡</h2>
          </div>
        </div>
        <div className="why-grid">
          <div className="why-card">
            <div className="why-icon">♡</div>
            <h3>Curated with Love</h3>
            <p>Every product is selected with care and attention.</p>
          </div>
          <div className="why-card">
            <div className="why-icon">✦</div>
            <h3>Wishlist & Account</h3>
            <p>Save favourites, addresses and order details in one place.</p>
          </div>
          <div className="why-card">
            <div className="why-icon">✓</div>
            <h3>Secure Checkout</h3>
            <p>Easy ordering and Razorpay payment support.</p>
          </div>
        </div>
      </section>

      <section className="support-banner">
        <div>
          <span className="eyebrow">NEED HELP?</span>
          <h2>We're just a WhatsApp away.</h2>
          <p>Questions about products, orders or delivery? Message us.</p>
        </div>
        <a className="button" href={waUrl()} target="_blank" rel="noreferrer">
          💬 Chat on WhatsApp
        </a>
      </section>
    </>
  );
}

function Shop({
  add,
  wishlist,
}: {
  add: (p: Product) => void;
  wishlist: ReturnType<typeof useWishlist>;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(console.error);
  }, []);

  const shown = useMemo(() => {
    const query = q.toLowerCase().trim();
    const result = products.filter(
      (p) =>
        p.active &&
        (p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query))
    );

    return [...result].sort((a, b) => {
      if (sort === "low") return a.price - b.price;
      if (sort === "high") return b.price - a.price;
      if (sort === "discount") {
        const da =
          a.originalPrice && a.originalPrice > a.price
            ? (a.originalPrice - a.price) / a.originalPrice
            : 0;
        const db =
          b.originalPrice && b.originalPrice > b.price
            ? (b.originalPrice - b.price) / b.originalPrice
            : 0;
        return db - da;
      }
      return b.id - a.id;
    });
  }, [products, q, sort]);

  return (
    <section className="section">
      <div className="shop-hero">
        <span className="eyebrow">JP Store COLLECTION</span>
        <h1>Shop Pretty</h1>
        <p>Find something beautiful for yourself or someone special.</p>
      </div>

      <div className="shop-toolbar">
        <strong>{shown.length} products</strong>
        <input
          className="search"
          placeholder="Search pretty things..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
          <option value="discount">Best Discount</option>
        </select>
      </div>

      {shown.length > 0 ? (
        <div className="grid">
          {shown.map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              add={add}
              wished={wishlist.ids.includes(p.id)}
              onWishlist={() => wishlist.toggle(p.id)}
            />
          ))}
        </div>
      ) : (
        <div className="empty">
          <div className="empty-icon">♡</div>
          <h2>No JP Store found</h2>
          <p>Try searching for something else.</p>
          <button className="button" onClick={() => setQ("")}>
            View All Products
          </button>
        </div>
      )}
    </section>
  );
}

function ProductPage({
  add,
  wishlist,
}: {
  add: (p: Product) => void;
  wishlist: ReturnType<typeof useWishlist>;
}) {
  const { slug } = useParams();
  const [p, setP] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Product not found");
        return r.json();
      })
      .then(setP)
      .catch(() => setP(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <section className="section"><div className="empty">Finding your pretty pick...</div></section>;
  if (!p) return <section className="section"><div className="empty"><h2>Product not found</h2><Link className="button" to="/shop">Back to Shop</Link></div></section>;

  const discount =
    p.originalPrice && p.originalPrice > p.price
      ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
      : 0;

  const wished = wishlist.ids.includes(p.id);

  return (
    <section className="product-page">
      <div className="product-gallery">
        <div className="product-main-image">
          {discount > 0 && <span className="discount-badge">{discount}% OFF</span>}
          <button className={`wishlist-heart product-wish ${wished ? "active" : ""}`} onClick={() => wishlist.toggle(p.id)}>
            {wished ? "♥" : "♡"}
          </button>
          <img src={p.image} alt={p.name} />
        </div>
      </div>

      <div className="product-details">
        <span className="eyebrow">JP Store · CURATED FOR YOU</span>
        <h1>{p.name}</h1>

        <div className="big-price">
          {money(p.price)}
          {p.originalPrice && <del>{money(p.originalPrice)}</del>}
        </div>

        {discount > 0 && (
          <div className="save-text">
            You save {money(p.originalPrice! - p.price)} ({discount}%)
          </div>
        )}

        <div className="product-description"><p>{p.description}</p></div>

        <div className={`availability ${p.stock <= 5 ? "low-stock" : ""}`}>
          <span className="availability-dot" />
          {p.stock > 0 ? `${p.stock} items available` : "Currently unavailable"}
        </div>

        <div className="product-actions">
          <button className="button product-add-button" onClick={() => add(p)} disabled={!p.stock}>
            {p.stock ? "♡ Add to Cart" : "Out of Stock"}
          </button>
          <button className="outline-button" onClick={() => wishlist.toggle(p.id)}>
            {wished ? "♥ Saved" : "♡ Save to Wishlist"}
          </button>
        </div>

        <div className="product-info-box">
          <div><strong>♡ Carefully Selected</strong><span>Picked with love by JP Store</span></div>
          <div><strong>✦ Secure Checkout</strong><span>Safe & secure online payment</span></div>
          <div><strong>↺ Need Help?</strong><a href={waUrl(`Hi JP Store, I have a question about ${p.name}.`)} target="_blank" rel="noreferrer">Chat on WhatsApp</a></div>
        </div>
      </div>
    </section>
  );
}

function Wishlist({
  add,
  wishlist,
}: {
  add: (p: Product) => void;
  wishlist: ReturnType<typeof useWishlist>;
}) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts).catch(console.error);
  }, []);

  const saved = products.filter((p) => wishlist.ids.includes(p.id));

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <span className="eyebrow">SAVED FOR LATER</span>
          <h1>My Wishlist</h1>
          <p>Your favourite JP Store, all in one place.</p>
        </div>
      </div>
      {!saved.length ? (
        <div className="empty">
          <div className="empty-icon">♡</div>
          <h2>Your wishlist is empty</h2>
          <p>Tap the heart on any product to save it.</p>
          <Link className="button" to="/shop">Explore Products →</Link>
        </div>
      ) : (
        <div className="grid">
          {saved.map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              add={add}
              wished
              onWishlist={() => wishlist.toggle(p.id)}
            />
          ))}
        </div>
      )}
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
  const subtotal = cart.reduce((sum, x) => sum + x.product.price * x.quantity, 0);
  const shipping = subtotal >= 2000 || subtotal === 0 ? 0 : 99;
  const total = subtotal + shipping;

  return (
    <section className="section cart-section">
      <div className="section-head">
        <div><span className="eyebrow">YOUR JP Store</span><h1>Your Cart</h1><p>Review your items before checkout.</p></div>
      </div>

      {!cart.length ? (
        <div className="empty">
          <div className="empty-icon">♡</div>
          <h2>Your cart is waiting</h2>
          <p>Looks like you haven't picked anything yet.</p>
          <Link className="button" to="/shop">Start Shopping →</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {cart.map((x) => (
              <div className="cart-row" key={x.product.id}>
                <img src={x.product.image} alt={x.product.name} />
                <div className="cart-product-info">
                  <span className="eyebrow">PRETTY PICK</span>
                  <h3>{x.product.name}</h3>
                  <p>{money(x.product.price)}</p>
                  <div className="quantity-control">
                    <button onClick={() => update(x.product.id, x.quantity - 1)} disabled={x.quantity <= 1}>−</button>
                    <b>{x.quantity}</b>
                    <button onClick={() => update(x.product.id, x.quantity + 1)} disabled={x.quantity >= x.product.stock}>+</button>
                    <button className="link-btn" onClick={() => remove(x.product.id)}>Remove</button>
                  </div>
                </div>
                <strong className="cart-item-total">{money(x.product.price * x.quantity)}</strong>
              </div>
            ))}
          </div>

          <div className="summary">
            <h2>Order Summary</h2>
            <p><span>Subtotal</span><b>{money(subtotal)}</b></p>
            <p><span>Shipping</span><b>{shipping ? money(shipping) : "Free"}</b></p>
            {subtotal > 0 && subtotal < 2000 && (
              <div className="shipping-note">Add {money(2000 - subtotal)} more for free shipping ♡</div>
            )}
            <hr />
            <p className="total"><span>Total</span><b>{money(total)}</b></p>
            <Link className="button full" to="/checkout">Proceed to Checkout →</Link>
            <Link className="continue-shopping" to="/shop">← Continue Shopping</Link>
          </div>
        </div>
      )}
    </section>
  );
}

function Checkout({ cart, clear }: { cart: CartItem[]; clear: () => void }) {
  const savedProfile = readStorage<ProfileData>("pp-profile", { name: "", phone: "", email: "" });
  const addresses = readStorage<Address[]>("pp-addresses", []);
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

  const [form, setForm] = useState({
    name: savedProfile.name,
    phone: savedProfile.phone,
    email: savedProfile.email,
    address: defaultAddress?.address || "",
    city: defaultAddress?.city || "",
    state: defaultAddress?.state || "",
    pincode: defaultAddress?.pincode || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal >= 2000 ? 0 : 99;
  const total = subtotal + shipping;

  const updateField = (key: string, value: string) => setForm((c) => ({ ...c, [key]: value }));

  const saveProfile = () => {
    writeStorage("pp-profile", { name: form.name, phone: form.phone, email: form.email });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    saveProfile();

    const nextAddresses = readStorage<Address[]>("pp-addresses", []);
    if (form.address && form.city && form.state && form.pincode) {
      const exists = nextAddresses.some(
        (a) => a.address === form.address && a.pincode === form.pincode
      );
      if (!exists) {
        writeStorage("pp-addresses", [
          ...nextAddresses,
          {
            id: crypto.randomUUID(),
            name: form.name,
            phone: form.phone,
            address: form.address,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
            isDefault: nextAddresses.length === 0,
          },
        ]);
      }
    }

    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form,
          items: cart.map((x) => ({ productId: x.product.id, quantity: x.quantity })),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Order failed");

      const saveOrder = (number: string, orderTotal: number) => {
        const current = readStorage<SavedOrder[]>("pp-orders", []);
        writeStorage("pp-orders", [
          { orderNumber: number, createdAt: new Date().toISOString(), total: orderTotal },
          ...current.filter((x) => x.orderNumber !== number),
        ]);
      };

      if (data.razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          const rz = new (window as any).Razorpay({
            key: data.razorpay.key,
            amount: data.razorpay.amount,
            currency: data.razorpay.currency,
            name: "JP Store",
            description: "JP Store Order",
            order_id: data.razorpay.id,
            prefill: { name: form.name, email: form.email, contact: form.phone },
            theme: { color: "#c9828e" },
            handler: async (resp: any) => {
              const vr = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: data.order.id, ...resp }),
              });
              if (!vr.ok) {
                setError("Payment verification failed.");
                setLoading(false);
                return;
              }
              saveOrder(data.order.orderNumber, data.order.total);
              clear();
              nav(`/success/${data.order.orderNumber}`);
            },
          });
          rz.open();
        };
        script.onerror = () => {
          setError("Unable to load payment gateway.");
          setLoading(false);
        };
        document.body.appendChild(script);
      } else {
        saveOrder(data.order.orderNumber, data.order.total);
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
    return <section className="section narrow"><div className="empty"><h1>Checkout</h1><p>Your cart is empty.</p><Link className="button" to="/shop">Go Shopping →</Link></div></section>;
  }

  const fields = [
    ["name", "Full Name", "text"],
    ["phone", "Mobile Number", "tel"],
    ["email", "Email Address", "email"],
    ["address", "Delivery Address", "text"],
    ["city", "City", "text"],
    ["state", "State", "text"],
    ["pincode", "Pincode", "text"],
  ];

  return (
    <section className="section checkout-section">
      <div className="checkout-heading">
        <span className="eyebrow">ALMOST THERE ♡</span>
        <h1>Checkout</h1>
        <p>Your saved profile and default address are automatically loaded.</p>
      </div>

      <div className="checkout-layout">
        <form onSubmit={submit} className="form checkout-form">
          <div className="form-card">
            <h2>Delivery Details</h2>
            {fields.map(([key, label, type]) => (
              <label key={key}>
                {label}
                <input
                  required={key !== "email"}
                  type={type}
                  value={(form as any)[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                />
              </label>
            ))}
            {error && <div className="error">{error}</div>}
          </div>
          <button className="button full" disabled={loading}>
            {loading ? "Processing..." : "Place Order & Pay →"}
          </button>
          <small className="secure-payment">♡ Secure payment through Razorpay when configured.</small>
        </form>

        <div className="checkout-summary">
          <h2>Your Order</h2>
          {cart.map((item) => (
            <div className="checkout-item" key={item.product.id}>
              <img src={item.product.image} alt={item.product.name} />
              <div><strong>{item.product.name}</strong><small>Qty: {item.quantity}</small></div>
              <b>{money(item.product.price * item.quantity)}</b>
            </div>
          ))}
          <hr />
          <p><span>Subtotal</span><b>{money(subtotal)}</b></p>
          <p><span>Shipping</span><b>{shipping ? money(shipping) : "Free"}</b></p>
          <p className="checkout-total"><span>Total</span><b>{money(total)}</b></p>
        </div>
      </div>
    </section>
  );
}

function Success() {
  const { number } = useParams();
  return (
    <section className="section narrow success-section">
      <div className="success-card">
        <div className="success-icon">✓</div>
        <span className="eyebrow">THANK YOU ♡</span>
        <h1>Order Placed!</h1>
        <p>Your JP Store order has been received successfully.</p>
        <div className="order-number"><small>ORDER NUMBER</small><strong>{number}</strong></div>
        <div className="success-actions">
          <Link className="button" to="/profile">My Orders</Link>
          <Link className="continue-shopping" to="/track">Track Order</Link>
          <Link className="continue-shopping" to="/shop">Continue Shopping →</Link>
        </div>
      </div>
    </section>
  );
}

function Track() {
  const [number, setNumber] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");

  const search = async () => {
    if (!number.trim()) return setError("Please enter your order number.");
    setError("");
    try {
      const r = await fetch(`/api/orders/${number.trim()}`);
      if (!r.ok) {
        setOrder(null);
        return setError("Order not found. Please check your order number.");
      }
      setOrder(await r.json());
    } catch {
      setOrder(null);
      setError("Unable to connect to the server.");
    }
  };

  const steps = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"];
  const current = order ? steps.indexOf(order.orderStatus) : -1;

  return (
    <section className="section narrow track-section">
      <div className="track-heading">
        <span className="eyebrow">ORDER STATUS</span>
        <h1>Track Your Order</h1>
        <p>Enter your JP Store order number to see the latest status.</p>
      </div>
      <div className="track-card">
        <div className="track">
          <input placeholder="VELA-12345678" value={number} onChange={(e) => setNumber(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
          <button className="button" onClick={search}>Track →</button>
        </div>
        {error && <p className="error">{error}</p>}
        {order && (
          <div className="order-box">
            <div className="order-status-icon">♡</div>
            <h2>{order.orderNumber}</h2>
            <div className="status-timeline">
              {steps.map((step, i) => (
                <div className={`status-step ${i <= current ? "done" : ""}`} key={step}>
                  <span>{i <= current ? "✓" : i + 1}</span>
                  <small>{step}</small>
                </div>
              ))}
            </div>
            <div className="order-detail"><span>Order Status</span><b>{order.orderStatus}</b></div>
            <div className="order-detail"><span>Payment</span><b>{order.paymentStatus}</b></div>
            <div className="order-detail"><span>Total</span><b>{money(order.total)}</b></div>
            <a className="whatsapp-button" href={waUrl(`Hi JP Store, I need help with order ${order.orderNumber}.`)} target="_blank" rel="noreferrer">💬 Ask about this order</a>
          </div>
        )}
      </div>
    </section>
  );
}

function Profile() {
  const [active, setActive] = useState("profile");
  const [profile, setProfile] = useState<ProfileData>(() =>
    readStorage<ProfileData>("pp-profile", { name: "", phone: "", email: "" })
  );
  const [orders, setOrders] = useState<SavedOrder[]>(() =>
    readStorage<SavedOrder[]>("pp-orders", [])
  );
  const [addresses, setAddresses] = useState<Address[]>(() =>
    readStorage<Address[]>("pp-addresses", [])
  );
  const [message, setMessage] = useState("");

  const saveProfile = () => {
    writeStorage("pp-profile", profile);
    setMessage("Profile saved successfully ♡");
    setTimeout(() => setMessage(""), 2500);
  };

  const removeAddress = (id: string) => {
    const next = addresses.filter((a) => a.id !== id);
    setAddresses(next);
    writeStorage("pp-addresses", next);
  };

  const makeDefault = (id: string) => {
    const next = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    setAddresses(next);
    writeStorage("pp-addresses", next);
  };

  const loadOrders = async () => {
    const stored = readStorage<SavedOrder[]>("pp-orders", []);
    const refreshed = await Promise.all(
      stored.map(async (saved) => {
        try {
          const r = await fetch(`/api/orders/${saved.orderNumber}`);
          if (!r.ok) return saved;
          const o = await r.json();
          return { ...saved, total: o.total };
        } catch {
          return saved;
        }
      })
    );
    setOrders(refreshed);
    writeStorage("pp-orders", refreshed);
  };

  useEffect(() => {
    if (active === "orders") loadOrders();
  }, [active]);

  return (
    <section className="section profile-page">
      <div className="profile-header">
        <div className="profile-avatar">{profile.name ? profile.name[0].toUpperCase() : "P"}</div>
        <div>
          <span className="eyebrow">MY ACCOUNT</span>
          <h1>{profile.name ? `Hello, ${profile.name}` : "Welcome to JP Store"}</h1>
          <p>Manage your profile, orders, wishlist and saved addresses.</p>
        </div>
      </div>

      <div className="profile-layout">
        <aside className="profile-sidebar">
          {[
            ["profile", "👤 Personal Information"],
            ["orders", "📦 My Orders"],
            ["wishlist", "♡ My Wishlist"],
            ["addresses", "📍 Saved Addresses"],
            ["payments", "💳 Payments"],            
            ["support", "💬 Help & Support"],
          ].map(([id, label]) => (
            <button className={active === id ? "profile-menu active" : "profile-menu"} key={id} onClick={() => setActive(id)}>
              {label}
            </button>
          ))}
        </aside>

        <div className="profile-content">
          {active === "profile" && (
            <div className="profile-card">
              <div className="profile-card-head"><div><span className="eyebrow">ACCOUNT</span><h2>Personal Information</h2></div><span>🔒</span></div>
              <div className="profile-form">
                <label>Full Name<input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
                <label>Mobile Number<input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></label>
                <label>Email Address<input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></label>
                <button className="button" onClick={saveProfile}>Save Changes</button>
                {message && <div className="success-message">{message}</div>}
              </div>
            </div>
          )}

          {active === "orders" && (
            <div className="profile-card">
              <div className="profile-card-head"><div><span className="eyebrow">PURCHASE HISTORY</span><h2>My Orders</h2></div></div>
              {!orders.length ? (
                <div className="address-empty"><div>📦</div><h3>No orders yet</h3><p>Your completed orders will appear here.</p><Link className="button" to="/shop">Start Shopping</Link></div>
              ) : (
                <div className="account-order-list">
                  {orders.map((o) => (
                    <div className="account-order" key={o.orderNumber}>
                      <div><span className="order-label">ORDER</span><strong>{o.orderNumber}</strong><small>{new Date(o.createdAt).toLocaleDateString("en-IN")}</small></div>
                      <b>{money(o.total)}</b>
                      <Link className="small-button" to={`/track?order=${o.orderNumber}`}>Track</Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {active === "wishlist" && <Wishlist add={() => {}} wishlist={useWishlist()} />}

          {active === "addresses" && (
            <div className="profile-card">
              <div className="profile-card-head"><div><span className="eyebrow">DELIVERY</span><h2>Saved Addresses</h2></div><Link className="small-button" to="/checkout">Add at Checkout</Link></div>
              {!addresses.length ? (
                <div className="address-empty"><div>📍</div><h3>No saved addresses</h3><p>Complete checkout once and your address will be saved here.</p></div>
              ) : addresses.map((a) => (
                <div className="address-card" key={a.id}>
                  {a.isDefault && <span className="default-badge">DEFAULT</span>}
                  <strong>{a.name}</strong><span>{a.phone}</span>
                  <p>{a.address}, {a.city}, {a.state} - {a.pincode}</p>
                  <div><button className="link-btn" onClick={() => makeDefault(a.id)}>Make Default</button><button className="link-btn danger-link" onClick={() => removeAddress(a.id)}>Delete</button></div>
                </div>
              ))}
            </div>
          )}

          {active === "payments" && (
            <div className="profile-card">
              <span className="eyebrow">PAYMENTS</span><h2>Payment Methods</h2>
              <div className="payment-info"><div className="payment-icon">₹</div><div><strong>Razorpay</strong><p>Secure online payments are handled by Razorpay during checkout.</p></div><span>✓</span></div>
              <p className="muted">Card, UPI and other methods depend on your Razorpay checkout configuration.</p>
            </div>
          )}



          {active === "support" && (
            <div className="profile-card">
              <span className="eyebrow">CUSTOMER CARE</span><h2>Help & Support</h2>
              <p>Need help with an order, product, delivery or payment?</p>
              <a className="whatsapp-button" href={waUrl()} target="_blank" rel="noreferrer">💬 Chat with JP Store on WhatsApp</a>
              <div className="support-options">
                <Link to="/track">📦 Track an Order</Link>
                <Link to="/shop">🛍 Browse Products</Link>
                <a href={instagramUrl} target="_blank" rel="noreferrer">📸 Instagram Support</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Admin() {
  const [token, setToken] = useState(localStorage.getItem("admin-token") || "");
  const [email, setEmail] = useState("prettypicks@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    try {
      setLoading(true);
      setError("");
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Login failed");
        return;
      }
      localStorage.setItem("admin-token", d.token);
      setToken(d.token);
      setPassword("");
    } catch (err) {
      setError("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("admin-token");
    setToken("");
  };

  if (!token) {
    return (
      <section className="section narrow admin-login">
        <div className="admin-login-card">
          <img src="/logo.jpeg" alt="JP Store" />
          <span className="eyebrow">JP Store</span>
          <h1>Admin Login</h1>
          <p>Manage your JP Store store.</p>
          <div className="form">
            <label>
              Email
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && login()}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && login()}
              />
            </label>
            {error && <div className="error-message">{error}</div>}
            <button
              className="button full"
              onClick={login}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login →"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <AdminDashboard
      token={token}
      onLogout={logout}
    />
  );
}

export default function App() {
  const cartHook = useCart();
  const wishlist = useWishlist();

  const cartCount = cartHook.cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Layout count={cartCount} wishlistCount={wishlist.ids.length}>
      <Routes>
        <Route path="/" element={<Home add={cartHook.add} wishlist={wishlist} />} />
        <Route path="/shop" element={<Shop add={cartHook.add} wishlist={wishlist} />} />
        <Route path="/product/:slug" element={<ProductPage add={cartHook.add} wishlist={wishlist} />} />
        <Route path="/wishlist" element={<Wishlist add={cartHook.add} wishlist={wishlist} />} />
        <Route path="/cart" element={<Cart {...cartHook} />} />
        <Route path="/checkout" element={<Checkout cart={cartHook.cart} clear={cartHook.clear} />} />
        <Route path="/success/:number" element={<Success />} />
        <Route path="/track" element={<Track />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Layout>
  );
}
