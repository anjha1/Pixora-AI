# Pixora AI

A modern AI-powered image editing platform built with Next.js, Tailwind CSS, and Framer Motion.

## Features

- 🎨 AI-powered image editing with ImageKit
- 🔐 User authentication with Google OAuth
- 📊 Usage tracking and limits for free users
- 💳 Pro subscription with unlimited uploads
- 🎯 Real-time image processing
- 📱 Responsive design

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file with:
   ```env
   # Database
   DATABASE_URL="mongodb://localhost:27017/pixora"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   
   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # ImageKit
   IMAGEKIT_PUBLIC_KEY="your-imagekit-public-key"
   IMAGEKIT_PRIVATE_KEY="your-imagekit-private-key"
   IMAGEKIT_URL_ENDPOINT="your-imagekit-url-endpoint"
   
   # Stripe
   STRIPE_SECRET_KEY="your-stripe-secret-key"
   STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
   STRIPE_PRICE_ID="your-stripe-price-id"
   STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
   ```

3. **Set up database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## Usage Limits

- **Free Plan:** 3 uploads per month
- **Pro Plan:** Unlimited uploads
- Users are prompted to upgrade when they reach their limit

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

