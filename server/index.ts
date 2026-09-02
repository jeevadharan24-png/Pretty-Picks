import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import Razorpay from "razorpay";
import { PrismaClient } from "@prisma/client";

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      })
    : null;

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function adminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || token !== process.env.ADMIN_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  next();
}

app.get("/api/products", async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: { createdAt: "desc" }
  });
  res.json(products);
});

app.get("/api/products/:slug", async (req, res) => {
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug }, include: { category: true } });
  if (!product || !product.active) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  return res.json({
    token: process.env.ADMIN_TOKEN,
    message: "Login successful",
  });
});
app.get("/api/admin/products", adminAuth, async (_req, res) => {
  res.json(await prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } }));
});

app.post("/api/admin/products", adminAuth, async (req, res) => {
  const p = req.body;
  const product = await prisma.product.create({
    data: {
      name: p.name,
      slug: p.slug || slugify(p.name),
      description: p.description || "",
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      stock: Number(p.stock || 0),
      sku: p.sku || null,
      image: p.image,
      active: p.active !== false,
      featured: !!p.featured,
      bestseller: !!p.bestseller,
      categoryId: p.categoryId ? Number(p.categoryId) : null
    }
  });
  res.json(product);
});

app.put("/api/admin/products/:id", adminAuth, async (req, res) => {
  const p = req.body;
  const product = await prisma.product.update({
    where: { id: Number(req.params.id) },
    data: {
      name: p.name,
      slug: p.slug || slugify(p.name),
      description: p.description || "",
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      stock: Number(p.stock || 0),
      sku: p.sku || null,
      image: p.image,
      active: p.active !== false,
      featured: !!p.featured,
      bestseller: !!p.bestseller
    }
  });
  res.json(product);
});

app.delete("/api/admin/products/:id", adminAuth, async (req, res) => {
  await prisma.product.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

app.get("/api/admin/orders", adminAuth, async (_req, res) => {
  res.json(await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } }));
});

app.put("/api/admin/orders/:id/status", adminAuth, async (req, res) => {
  const order = await prisma.order.update({
    where: { id: Number(req.params.id) },
    data: { orderStatus: req.body.status }
  });
  res.json(order);
});

app.post("/api/orders", async (req, res) => {
  const { customer, items } = req.body;
  if (!customer?.name || !customer?.phone || !customer?.address || !customer?.city || !customer?.state || !customer?.pincode || !items?.length) {
    return res.status(400).json({ error: "Please complete all required checkout details." });
  }

  const ids = items.map((i: any) => Number(i.productId));
  const products = await prisma.product.findMany({ where: { id: { in: ids }, active: true } });
  const byId = new Map(products.map(p => [p.id, p]));
  let subtotal = 0;
  const orderItems: any[] = [];

  for (const item of items) {
    const product = byId.get(Number(item.productId));
    const qty = Number(item.quantity);
    if (!product || !Number.isInteger(qty) || qty < 1 || product.stock < qty) {
      return res.status(400).json({ error: `Insufficient stock for ${product?.name || "a product"}.` });
    }
    subtotal += product.price * qty;
    orderItems.push({ productId: product.id, name: product.name, price: product.price, quantity: qty });
  }

  const shipping = subtotal >= 2000 ? 0 : 99;
  const total = subtotal + shipping;
  const orderNumber = `VELA-${Date.now().toString().slice(-8)}`;

  const order = await prisma.$transaction(async tx => {
    for (const item of orderItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      });
    }
    return tx.order.create({
      data: {
        orderNumber,
        customerName: customer.name,
        phone: customer.phone,
        email: customer.email || "",
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        subtotal,
        shipping,
        total,
        items: { create: orderItems }
      },
      include: { items: true }
    });
  });

  if (razorpay) {
    const rpOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: order.orderNumber
    });
    await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: rpOrder.id } });
    return res.json({ order, razorpay: { id: rpOrder.id, amount: rpOrder.amount, currency: rpOrder.currency, key: process.env.RAZORPAY_KEY_ID } });
  }

  res.json({ order, razorpay: null, demoPayment: true });
});

app.post("/api/payments/verify", async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(400).json({ error: "Payment verification data is incomplete." });
  }
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
  if (expected !== razorpay_signature) return res.status(400).json({ error: "Invalid payment signature." });

  const order = await prisma.order.update({
    where: { id: Number(orderId) },
    data: { paymentStatus: "PAID", orderStatus: "CONFIRMED", razorpayPaymentId: razorpay_payment_id }
  });
  res.json({ ok: true, order });
});

app.get("/api/orders/:orderNumber", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: { items: true }
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(Number(process.env.PORT || 3000), "0.0.0.0", () => {
  console.log(`Vela Store server running on http://localhost:${process.env.PORT || 3000}`);
});