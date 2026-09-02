# Vela Store

A full-stack starter e-commerce website with React + Express + Prisma + SQLite and optional Razorpay payments.

## Requirements
- Node.js 20+
- npm

## Setup

```bash
npm install
copy .env.example .env
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run dev
```

Open http://localhost:5173

## Admin

Open http://localhost:5173/admin.

The demo login is controlled by `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

**Important:** The included admin token approach is intentionally a simple local-development starter. Before production, replace it with a proper server-side session/JWT implementation and a secure cookie strategy.

## Razorpay

Put your Razorpay credentials in `.env`:

```env
RAZORPAY_KEY_ID="rzp_..."
RAZORPAY_KEY_SECRET="..."
```

Restart the server. Without Razorpay keys, checkout uses a demo/no-payment path so you can test the website flow.

## Instagram

Set:

```env
VITE_INSTAGRAM_URL="https://instagram.com/yourpage"
```

## Production checklist

- Use PostgreSQL instead of SQLite if needed.
- Use Cloudinary/S3 for product images.
- Replace demo admin authentication with secure sessions.
- Add HTTPS.
- Configure CORS to your production domain.
- Add email/WhatsApp order notifications.
- Configure Razorpay webhooks and robust payment reconciliation.
- Add shipping/returns/privacy/terms pages.
- Never use demo credentials in production.
