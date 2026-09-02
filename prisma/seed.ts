import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "jeevadharan24@gmail.com";
  const password = process.env.ADMIN_PASSWORD || "jeevankt@321";
  const passwordHash = crypto.createHash("sha256").update(password).digest("hex");

  await prisma.admin.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash }
  });

  const fashion = await prisma.category.upsert({
    where: { name: "Featured" },
    update: {},
    create: { name: "Featured" }
  });

  const products = [
    {
      name: "Classic Black Tee",
      slug: "classic-black-tee",
      description: "Premium everyday cotton t-shirt.",
      price: 799,
      originalPrice: 999,
      stock: 25,
      sku: "VELA-TEE-001",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
      featured: true,
      bestseller: true
    },
    {
      name: "Minimal Hoodie",
      slug: "minimal-hoodie",
      description: "Soft, comfortable hoodie for everyday wear.",
      price: 1499,
      originalPrice: 1799,
      stock: 15,
      sku: "VELA-HOOD-001",
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80",
      featured: true,
      bestseller: false
    },
    {
      name: "Everyday Cap",
      slug: "everyday-cap",
      description: "Clean unisex cap with an adjustable fit.",
      price: 499,
      originalPrice: 599,
      stock: 40,
      sku: "VELA-CAP-001",
      image: "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80",
      featured: false,
      bestseller: true
    }
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: p,
      create: { ...p, categoryId: fashion.id }
    });
  }
}

main().finally(() => prisma.$disconnect());