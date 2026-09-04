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

/* =========================================================
   RAZORPAY
========================================================= */

const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

/* =========================================================
   HELPERS
========================================================= */

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function adminAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization;

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  next();
}

const VALID_ORDER_STATUSES = [
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

/* =========================================================
   PUBLIC PRODUCT APIs
========================================================= */

/**
 * Get all active products
 */
app.get("/api/products", async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        active: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(products);
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    res.status(500).json({
      error: "Failed to load products",
    });
  }
});

/**
 * Get single product by slug
 */
app.get("/api/products/:slug", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: {
        slug: req.params.slug,
      },
      include: {
        category: true,
      },
    });

    if (!product || !product.active) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    res.json(product);
  } catch (error) {
    console.error("GET PRODUCT ERROR:", error);

    res.status(500).json({
      error: "Failed to load product",
    });
  }
});

/* =========================================================
   ADMIN LOGIN
========================================================= */

app.post("/api/admin/login", async (req, res) => {
  try {
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
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    return res.status(500).json({
      error: "Login failed",
    });
  }
});

/* =========================================================
   ADMIN - PRODUCTS
========================================================= */

/**
 * Get all products including inactive products
 */
app.get("/api/admin/products", adminAuth, async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(products);
  } catch (error) {
    console.error("ADMIN PRODUCTS ERROR:", error);

    res.status(500).json({
      error: "Failed to load products",
    });
  }
});

/**
 * Create product
 */
app.post("/api/admin/products", adminAuth, async (req, res) => {
  try {
    const p = req.body;

    if (!p.name || p.price === undefined || !p.image) {
      return res.status(400).json({
        error: "Name, price and image are required",
      });
    }

    const slug = p.slug
      ? slugify(String(p.slug))
      : slugify(String(p.name));

    const product = await prisma.product.create({
      data: {
        name: String(p.name),
        slug,
        description: p.description || "",
        price: Number(p.price),
        originalPrice:
          p.originalPrice !== undefined &&
          p.originalPrice !== null &&
          p.originalPrice !== ""
            ? Number(p.originalPrice)
            : null,
        stock: Number(p.stock || 0),
        sku: p.sku ? String(p.sku) : null,
        image: String(p.image),
        active: p.active !== false,
        featured: Boolean(p.featured),
        bestseller: Boolean(p.bestseller),
        categoryId:
          p.categoryId !== undefined &&
          p.categoryId !== null &&
          p.categoryId !== ""
            ? Number(p.categoryId)
            : null,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json(product);
  } catch (error: any) {
    console.error("CREATE PRODUCT ERROR:", error);

    if (error?.code === "P2002") {
      return res.status(409).json({
        error: "Product slug or SKU already exists",
      });
    }

    res.status(500).json({
      error: "Failed to create product",
    });
  }
});

/**
 * Update product
 */
app.put("/api/admin/products/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = req.body;

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "Invalid product ID",
      });
    }

    if (!p.name || p.price === undefined || !p.image) {
      return res.status(400).json({
        error: "Name, price and image are required",
      });
    }

    const slug = p.slug
      ? slugify(String(p.slug))
      : slugify(String(p.name));

    const product = await prisma.product.update({
      where: {
        id,
      },
      data: {
        name: String(p.name),
        slug,
        description: p.description || "",
        price: Number(p.price),
        originalPrice:
          p.originalPrice !== undefined &&
          p.originalPrice !== null &&
          p.originalPrice !== ""
            ? Number(p.originalPrice)
            : null,
        stock: Number(p.stock || 0),
        sku: p.sku ? String(p.sku) : null,
        image: String(p.image),
        active: p.active !== false,
        featured: Boolean(p.featured),
        bestseller: Boolean(p.bestseller),

        // IMPORTANT: category update included
        categoryId:
          p.categoryId !== undefined &&
          p.categoryId !== null &&
          p.categoryId !== ""
            ? Number(p.categoryId)
            : null,
      },
      include: {
        category: true,
      },
    });

    res.json(product);
  } catch (error: any) {
    console.error("UPDATE PRODUCT ERROR:", error);

    if (error?.code === "P2002") {
      return res.status(409).json({
        error: "Product slug or SKU already exists",
      });
    }

    if (error?.code === "P2025") {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    res.status(500).json({
      error: "Failed to update product",
    });
  }
});

/**
 * Delete product
 */
app.delete("/api/admin/products/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "Invalid product ID",
      });
    }

    await prisma.product.delete({
      where: {
        id,
      },
    });

    res.json({
      ok: true,
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE PRODUCT ERROR:", error);

    if (error?.code === "P2025") {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    if (error?.code === "P2003") {
      return res.status(409).json({
        error:
          "This product cannot be deleted because it is associated with existing orders.",
      });
    }

    res.status(500).json({
      error: "Failed to delete product",
    });
  }
});

/* =========================================================
   ADMIN - ORDERS
========================================================= */

/**
 * Get all orders
 */
app.get("/api/admin/orders", adminAuth, async (_req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        customer: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(orders);
  } catch (error) {
    console.error("ADMIN ORDERS ERROR:", error);

    res.status(500).json({
      error: "Failed to load orders",
    });
  }
});

/**
 * Get single admin order
 */
app.get("/api/admin/orders/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const order = await prisma.order.findUnique({
      where: {
        id,
      },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    res.json(order);
  } catch (error) {
    console.error("ADMIN ORDER ERROR:", error);

    res.status(500).json({
      error: "Failed to load order",
    });
  }
});

/**
 * Update order status
 *
 * PENDING
 * CONFIRMED
 * PROCESSING
 * PACKED
 * SHIPPED
 * OUT_FOR_DELIVERY
 * DELIVERED
 * CANCELLED
 * RETURNED
 */
app.put("/api/admin/orders/:id/status", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = String(req.body.status || "").toUpperCase();

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "Invalid order ID",
      });
    }

    if (!VALID_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        error: "Invalid order status",
        allowedStatuses: VALID_ORDER_STATUSES,
      });
    }

    const existingOrder = await prisma.order.findUnique({
      where: {
        id,
      },
    });

    if (!existingOrder) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    const oldStatus = existingOrder.orderStatus;

    const order = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: {
          id,
        },
        data: {
          orderStatus: status,
        },
        include: {
          items: true,
          customer: true,
        },
      });

      // Create notification only when status actually changes
      if (oldStatus !== status) {
        await tx.notification.create({
          data: {
            type: "ORDER_STATUS_CHANGED",
            title: "Order Status Updated",
            message: `Order ${updatedOrder.orderNumber} changed from ${oldStatus} to ${status}.`,
            orderId: updatedOrder.id,
          },
        });
      }

      return updatedOrder;
    });

    res.json(order);
  } catch (error) {
    console.error("UPDATE ORDER STATUS ERROR:", error);

    res.status(500).json({
      error: "Failed to update order status",
    });
  }
});

/* =========================================================
   CREATE ORDER
========================================================= */

app.post("/api/orders", async (req, res) => {
  try {
    const { customer, items } = req.body;

    /* -------------------------
       Validate checkout
    ------------------------- */

    if (
      !customer?.name ||
      !customer?.phone ||
      !customer?.address ||
      !customer?.city ||
      !customer?.state ||
      !customer?.pincode ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        error: "Please complete all required checkout details.",
      });
    }

    /* -------------------------
       Load products
    ------------------------- */

    const ids = items.map((item: any) => Number(item.productId));

    if (ids.some((id: number) => !Number.isInteger(id))) {
      return res.status(400).json({
        error: "Invalid product ID.",
      });
    }

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: ids,
        },
        active: true,
      },
    });

    const byId = new Map(
      products.map((product) => [product.id, product])
    );

    let subtotal = 0;

    const orderItems: {
      productId: number;
      name: string;
      price: number;
      quantity: number;
    }[] = [];

    /* -------------------------
       Validate stock & price
    ------------------------- */

    for (const item of items) {
      const product = byId.get(Number(item.productId));
      const qty = Number(item.quantity);

      if (
        !product ||
        !Number.isInteger(qty) ||
        qty < 1 ||
        product.stock < qty
      ) {
        return res.status(400).json({
          error: `Insufficient stock for ${
            product?.name || "a product"
          }.`,
        });
      }

      subtotal += product.price * qty;

      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: qty,
      });
    }

    /* -------------------------
       Shipping
    ------------------------- */

    const shipping = subtotal >= 2000 ? 0 : 99;
    const total = subtotal + shipping;

    /* -------------------------
       Unique order number
    ------------------------- */

    const orderNumber = `VELA-${Date.now()
      .toString()
      .slice(-8)}`;

    /* =====================================================
       DATABASE TRANSACTION
    ===================================================== */

    const order = await prisma.$transaction(async (tx) => {
      /* -------------------------
         Find/Create Customer
      ------------------------- */

      let customerRecord = await tx.customer.findUnique({
        where: {
          phone: String(customer.phone),
        },
      });

      if (customerRecord) {
        customerRecord = await tx.customer.update({
          where: {
            id: customerRecord.id,
          },
          data: {
            name: String(customer.name),
            email:
              customer.email || customerRecord.email,

            address: String(customer.address),
            city: String(customer.city),
            state: String(customer.state),
            pincode: String(customer.pincode),

            totalOrders: {
              increment: 1,
            },

            totalSpent: {
              increment: total,
            },
          },
        });
      } else {
        customerRecord = await tx.customer.create({
          data: {
            name: String(customer.name),
            phone: String(customer.phone),
            email: customer.email
              ? String(customer.email)
              : null,

            address: String(customer.address),
            city: String(customer.city),
            state: String(customer.state),
            pincode: String(customer.pincode),

            totalOrders: 1,
            totalSpent: total,
          },
        });
      }

      /* -------------------------
         Decrement stock
      ------------------------- */

      for (const item of orderItems) {
        const updatedProduct = await tx.product.update({
          where: {
            id: item.productId,
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        /* -------------------------
           Low stock notification
        ------------------------- */

        if (updatedProduct.stock <= 5) {
          await tx.notification.create({
            data: {
              type: "LOW_STOCK",
              title: "Low Stock Alert",
              message: `${updatedProduct.name} stock is now ${updatedProduct.stock}.`,
            },
          });
        }
      }

      /* -------------------------
         Create order
      ------------------------- */

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,

          customerId: customerRecord.id,

          // Snapshot
          customerName: String(customer.name),
          phone: String(customer.phone),
          email: customer.email
            ? String(customer.email)
            : "",

          address: String(customer.address),
          city: String(customer.city),
          state: String(customer.state),
          pincode: String(customer.pincode),

          subtotal,
          shipping,
          total,

          paymentStatus: razorpay
            ? "PENDING"
            : "PENDING",

          orderStatus: "PENDING",

          items: {
            create: orderItems,
          },
        },

        include: {
          items: true,
          customer: true,
        },
      });

      /* -------------------------
         New order notification
      ------------------------- */

      await tx.notification.create({
        data: {
          type: "NEW_ORDER",
          title: "New Order Received",
          message: `Order ${createdOrder.orderNumber} from ${customer.name} for ₹${total}.`,
          orderId: createdOrder.id,
        },
      });

      return createdOrder;
    });

    /* =====================================================
       RAZORPAY
    ===================================================== */

    if (razorpay) {
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(total * 100),
        currency: "INR",
        receipt: order.orderNumber,
      });

      const updatedOrder = await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          razorpayOrderId: razorpayOrder.id,
        },
        include: {
          items: true,
          customer: true,
        },
      });

      return res.json({
        order: updatedOrder,

        razorpay: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key: process.env.RAZORPAY_KEY_ID,
        },
      });
    }

    /* =====================================================
       DEMO PAYMENT MODE
    ===================================================== */

    return res.json({
      order,
      razorpay: null,
      demoPayment: true,
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);

    res.status(500).json({
      error: "Failed to create order",
    });
  }
});

/* =========================================================
   PAYMENT VERIFICATION
========================================================= */

app.post("/api/payments/verify", async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      return res.status(400).json({
        error: "Payment verification data is incomplete.",
      });
    }

    /* -------------------------
       Generate signature
    ------------------------- */

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        error: "Invalid payment signature.",
      });
    }

    /* -------------------------
       Verify order
    ------------------------- */

    const existingOrder = await prisma.order.findUnique({
      where: {
        id: Number(orderId),
      },
    });

    if (!existingOrder) {
      return res.status(404).json({
        error: "Order not found.",
      });
    }

    if (
      existingOrder.razorpayOrderId &&
      existingOrder.razorpayOrderId !== razorpay_order_id
    ) {
      return res.status(400).json({
        error: "Razorpay order does not match.",
      });
    }

    /* -------------------------
       Mark paid
    ------------------------- */

    const order = await prisma.order.update({
      where: {
        id: Number(orderId),
      },
      data: {
        paymentStatus: "PAID",
        orderStatus: "CONFIRMED",
        razorpayPaymentId: razorpay_payment_id,
      },
      include: {
        items: true,
        customer: true,
      },
    });

    /* -------------------------
       Payment notification
    ------------------------- */

    await prisma.notification.create({
      data: {
        type: "PAYMENT_RECEIVED",
        title: "Payment Received",
        message: `Payment received for order ${order.orderNumber}.`,
        orderId: order.id,
      },
    });

    res.json({
      ok: true,
      order,
    });
  } catch (error) {
    console.error("PAYMENT VERIFY ERROR:", error);

    res.status(500).json({
      error: "Payment verification failed",
    });
  }
});

/* =========================================================
   PUBLIC ORDER TRACKING
========================================================= */

app.get("/api/orders/:orderNumber", async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: {
        orderNumber: req.params.orderNumber,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    res.json(order);
  } catch (error) {
    console.error("TRACK ORDER ERROR:", error);

    res.status(500).json({
      error: "Failed to load order",
    });
  }
});

/* =========================================================
   ADMIN - NOTIFICATIONS
========================================================= */

/**
 * Get notifications
 */
app.get(
  "/api/admin/notifications",
  adminAuth,
  async (_req, res) => {
    try {
      const notifications =
        await prisma.notification.findMany({
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                customerName: true,
                total: true,
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },

          take: 100,
        });

      res.json(notifications);
    } catch (error) {
      console.error("NOTIFICATIONS ERROR:", error);

      res.status(500).json({
        error: "Failed to load notifications",
      });
    }
  }
);

/**
 * Mark notification as read
 */
app.put(
  "/api/admin/notifications/:id/read",
  adminAuth,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      const notification =
        await prisma.notification.update({
          where: {
            id,
          },
          data: {
            read: true,
          },
        });

      res.json(notification);
    } catch (error: any) {
      console.error("READ NOTIFICATION ERROR:", error);

      if (error?.code === "P2025") {
        return res.status(404).json({
          error: "Notification not found",
        });
      }

      res.status(500).json({
        error: "Failed to update notification",
      });
    }
  }
);

/**
 * Mark all notifications as read
 */
app.put(
  "/api/admin/notifications/read-all",
  adminAuth,
  async (_req, res) => {
    try {
      await prisma.notification.updateMany({
        where: {
          read: false,
        },
        data: {
          read: true,
        },
      });

      res.json({
        ok: true,
      });
    } catch (error) {
      console.error("READ ALL NOTIFICATIONS ERROR:", error);

      res.status(500).json({
        error: "Failed to mark notifications as read",
      });
    }
  }
);

/**
 * Unread notification count
 */
app.get(
  "/api/admin/notifications/unread/count",
  adminAuth,
  async (_req, res) => {
    try {
      const count = await prisma.notification.count({
        where: {
          read: false,
        },
      });

      res.json({
        count,
      });
    } catch (error) {
      console.error(
        "UNREAD NOTIFICATION COUNT ERROR:",
        error
      );

      res.status(500).json({
        error: "Failed to get notification count",
      });
    }
  }
);

/* =========================================================
   ADMIN - CUSTOMERS
========================================================= */

/**
 * Get customers
 */
app.get(
  "/api/admin/customers",
  adminAuth,
  async (_req, res) => {
    try {
      const customers = await prisma.customer.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json(customers);
    } catch (error) {
      console.error("CUSTOMERS ERROR:", error);

      res.status(500).json({
        error: "Failed to load customers",
      });
    }
  }
);

/**
 * Get customer details
 */
app.get(
  "/api/admin/customers/:id",
  adminAuth,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      const customer = await prisma.customer.findUnique({
        where: {
          id,
        },
        include: {
          orders: {
            include: {
              items: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      if (!customer) {
        return res.status(404).json({
          error: "Customer not found",
        });
      }

      res.json(customer);
    } catch (error) {
      console.error("CUSTOMER DETAIL ERROR:", error);

      res.status(500).json({
        error: "Failed to load customer",
      });
    }
  }
);

/* =========================================================
   ADMIN - DASHBOARD STATS
========================================================= */

app.get("/api/admin/stats", adminAuth, async (_req, res) => {
  try {
    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    /* -------------------------
       Valid sales orders
    ------------------------- */

    const validSalesOrders =
      await prisma.order.findMany({
        where: {
          orderStatus: {
            notIn: ["CANCELLED", "RETURNED"],
          },
        },
        select: {
          total: true,
        },
      });

    const totalSales = validSalesOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );

    /* -------------------------
       Total orders
    ------------------------- */

    const totalOrders = await prisma.order.count();

    /* -------------------------
       Today's sales
    ------------------------- */

    const todayOrders =
      await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startOfToday,
          },
          orderStatus: {
            notIn: ["CANCELLED", "RETURNED"],
          },
        },
        select: {
          total: true,
        },
      });

    const todaysSales = todayOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );

    /* -------------------------
       Pending orders
    ------------------------- */

    const pendingOrders = await prisma.order.count({
      where: {
        orderStatus: "PENDING",
      },
    });

    /* -------------------------
       Products sold
    ------------------------- */

    const validOrderItems =
      await prisma.orderItem.findMany({
        where: {
          order: {
            orderStatus: {
              notIn: ["CANCELLED", "RETURNED"],
            },
          },
        },
        select: {
          quantity: true,
        },
      });

    const productsSold = validOrderItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    /* -------------------------
       Low stock
    ------------------------- */

    const lowStockProducts =
      await prisma.product.findMany({
        where: {
          active: true,
          stock: {
            lte: 5,
          },
        },
        orderBy: {
          stock: "asc",
        },
      });

    /* -------------------------
       Cancelled / Returned
    ------------------------- */

    const cancelledOrders =
      await prisma.order.count({
        where: {
          orderStatus: "CANCELLED",
        },
      });

    const returnedOrders =
      await prisma.order.count({
        where: {
          orderStatus: "RETURNED",
        },
      });

    /* -------------------------
       Customers
    ------------------------- */

    const totalCustomers =
      await prisma.customer.count();

    /* -------------------------
       Notifications
    ------------------------- */

    const recentNotifications =
      await prisma.notification.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      });

    const unreadCount =
      await prisma.notification.count({
        where: {
          read: false,
        },
      });

    res.json({
      totalSales,
      totalOrders,
      todaysSales,
      totalCustomers,
      productsSold,
      pendingOrders,
      cancelledOrders,
      returnedOrders,
      lowStockProducts,
      recentNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error("DASHBOARD STATS ERROR:", error);

    res.status(500).json({
      error: "Failed to load dashboard statistics",
    });
  }
});

/* =========================================================
   ADMIN - ANALYTICS
========================================================= */

app.get(
  "/api/admin/analytics",
  adminAuth,
  async (_req, res) => {
    try {
      const now = new Date();

      /* =====================================================
         LAST 30 DAYS
      ===================================================== */

      const startDate = new Date(now);

      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(startDate.getDate() - 29);

      const orders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        include: {
          items: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      /* =====================================================
         DAILY SALES
      ===================================================== */

      const dailySales: Record<string, number> = {};

      const dailyOrders: Record<string, number> = {};

      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);

        date.setHours(0, 0, 0, 0);

        date.setDate(date.getDate() - i);

        const dateString =
          date.toISOString().split("T")[0];

        dailySales[dateString] = 0;
        dailyOrders[dateString] = 0;
      }

      /* =====================================================
         BEST SELLERS
      ===================================================== */

      const productSales: Record<
        number,
        {
          productId: number;
          name: string;
          quantity: number;
          sales: number;
        }
      > = {};

      let totalRevenue = 0;

      let validOrderCount = 0;
      let cancelledCount = 0;
      let returnedCount = 0;

      for (const order of orders) {
        const dateString =
          order.createdAt.toISOString().split("T")[0];

        if (
          order.orderStatus === "CANCELLED"
        ) {
          cancelledCount++;
          continue;
        }

        if (
          order.orderStatus === "RETURNED"
        ) {
          returnedCount++;
          continue;
        }

        totalRevenue += order.total;
        validOrderCount++;

        if (dailySales[dateString] !== undefined) {
          dailySales[dateString] += order.total;
          dailyOrders[dateString] += 1;
        }

        for (const item of order.items) {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              productId: item.productId,
              name: item.name,
              quantity: 0,
              sales: 0,
            };
          }

          productSales[item.productId].quantity +=
            item.quantity;

          productSales[item.productId].sales +=
            item.price * item.quantity;
        }
      }

      const bestSellingProducts =
        Object.values(productSales)
          .sort(
            (a, b) =>
              b.quantity - a.quantity
          )
          .slice(0, 10);

      /* =====================================================
         ORDER STATUS COUNTS
      ===================================================== */

      const orderCountByStatus: Record<
        string,
        number
      > = {
        PENDING: 0,
        CONFIRMED: 0,
        PROCESSING: 0,
        PACKED: 0,
        SHIPPED: 0,
        OUT_FOR_DELIVERY: 0,
        DELIVERED: 0,
        CANCELLED: 0,
        RETURNED: 0,
      };

      for (const order of orders) {
        if (
          orderCountByStatus[
            order.orderStatus
          ] !== undefined
        ) {
          orderCountByStatus[
            order.orderStatus
          ]++;
        }
      }

      /* =====================================================
         RETURN / CANCELLATION RATES
      ===================================================== */

      const totalOrders = orders.length;

      const cancellationRate =
        totalOrders > 0
          ? (cancelledCount / totalOrders) * 100
          : 0;

      const returnRate =
        totalOrders > 0
          ? (returnedCount / totalOrders) * 100
          : 0;

      /* =====================================================
         RESPONSE
      ===================================================== */

      res.json({
        dailySales,
        dailyOrders,

        bestSellingProducts,

        orderCountByStatus,

        totalOrders,
        validOrderCount,
        totalRevenue,

        cancelledOrders: cancelledCount,
        returnedOrders: returnedCount,

        cancellationRate,
        returnRate,
      });
    } catch (error) {
      console.error("ANALYTICS ERROR:", error);

      res.status(500).json({
        error: "Failed to load analytics",
      });
    }
  }
);

/* =========================================================
   ADMIN - FINANCE
========================================================= */

/**
 * Finance summary
 *
 * NOTE:
 * Current Prisma schema does NOT contain:
 * commission
 * refund amount
 * shipping cost
 * other charges
 * profit
 *
 * So we calculate only values that actually exist.
 * No fake finance values.
 */
app.get(
  "/api/admin/finance",
  adminAuth,
  async (_req, res) => {
    try {
      const orders = await prisma.order.findMany({
        select: {
          id: true,
          orderNumber: true,
          subtotal: true,
          shipping: true,
          total: true,
          paymentStatus: true,
          orderStatus: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const receivedOrders = orders.filter(
        (order) =>
          order.paymentStatus === "PAID" &&
          !["CANCELLED", "RETURNED"].includes(
            order.orderStatus
          )
      );

      const receivedAmount =
        receivedOrders.reduce(
          (sum, order) =>
            sum + order.total,
          0
        );

      const salesAmount = orders
        .filter(
          (order) =>
            !["CANCELLED", "RETURNED"].includes(
              order.orderStatus
            )
        )
        .reduce(
          (sum, order) =>
            sum + order.total,
          0
        );

      const refundOrders = orders.filter(
        (order) =>
          order.orderStatus === "RETURNED"
      );

      const cancelledOrders = orders.filter(
        (order) =>
          order.orderStatus === "CANCELLED"
      );

      res.json({
        sales: salesAmount,

        received: receivedAmount,

        refunds: {
          available: false,
          amount: null,
          message:
            "Refund amount is not stored separately in the current database schema.",
          orderCount: refundOrders.length,
        },

        commission: {
          available: false,
          amount: null,
          message:
            "Commission data is not available in the current database schema.",
        },

        shipping: {
          collected: orders.reduce(
            (sum, order) =>
              sum + order.shipping,
            0
          ),
          actualCost: null,
          message:
            "Actual shipping cost is not stored in the current database schema.",
        },

        otherCharges: {
          available: false,
          amount: null,
        },

        netEarnings: {
          available: false,
          amount: null,
          message:
            "Net earnings cannot be calculated accurately without cost, commission, refund and other charge fields.",
        },

        settlementHistory: [],

        cancelledOrders:
          cancelledOrders.length,

        returnedOrders:
          refundOrders.length,
      });
    } catch (error) {
      console.error("FINANCE ERROR:", error);

      res.status(500).json({
        error: "Failed to load finance data",
      });
    }
  }
);

/* =========================================================
   ADMIN - LOW STOCK
========================================================= */

app.get(
  "/api/admin/products/low-stock",
  adminAuth,
  async (_req, res) => {
    try {
      const products =
        await prisma.product.findMany({
          where: {
            active: true,
            stock: {
              lte: 5,
            },
          },
          orderBy: {
            stock: "asc",
          },
        });

      res.json(products);
    } catch (error) {
      console.error("LOW STOCK ERROR:", error);

      res.status(500).json({
        error: "Failed to load low stock products",
      });
    }
  }
);

/* =========================================================
   ADMIN - ORDER STATUS SUMMARY
========================================================= */

app.get(
  "/api/admin/orders/status-summary",
  adminAuth,
  async (_req, res) => {
    try {
      const summary: Record<
        string,
        number
      > = {};

      for (const status of VALID_ORDER_STATUSES) {
        summary[status] =
          await prisma.order.count({
            where: {
              orderStatus: status,
            },
          });
      }

      res.json(summary);
    } catch (error) {
      console.error(
        "ORDER STATUS SUMMARY ERROR:",
        error
      );

      res.status(500).json({
        error:
          "Failed to load order status summary",
      });
    }
  }
);

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "Pretty Picks API",
    timestamp: new Date().toISOString(),
  });
});

/* =========================================================
   404 API HANDLER
========================================================= */

app.use("/api", (_req, res) => {
  res.status(404).json({
    error: "API route not found",
  });
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
  (
    error: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("GLOBAL SERVER ERROR:", error);

    if (res.headersSent) {
      return;
    }

    res.status(500).json({
      error: "Internal server error",
    });
  }
);

/* =========================================================
   SERVER START
========================================================= */

export default app;

if (process.env.NODE_ENV !== "production") {
  const port = Number(
    process.env.PORT || 3000
  );

  app.listen(
    port,
    "0.0.0.0",
    () => {
      console.log(
        `Pretty Picks server running on http://localhost:${port}`
      );
    }
  );
}