# YieldPay (Production-Ready Monorepo)

Telegram Mini App prototype on the TON ecosystem with **separate frontend and backend**.

## Structure

- `frontend/` — Next.js (latest), TypeScript, Tailwind, shadcn-style UI components, TON Connect UI
- `backend/` — Node.js + Express + TypeScript, Tonstakers SDK + STON.fi pricing (live), mock staking assignment

## Local Development

### 1) Install

```bash
npm install
```

### 2) Run backend

```bash
npm run dev:backend
```

Backend runs on `http://localhost:4000`.

### 3) Run frontend

```bash
npm run dev:frontend
```

Frontend runs on `http://localhost:3000`.

## Environment

Copy and edit:

- `backend/.env.example` → `backend/.env`

## Notes (TON staking)

Staking via Tonstakers is a **user-signed** transaction. In a production TON mini app, the backend typically:

- fetches rates/APY server-side
- returns a **transaction payload** for TonConnect signing
- verifies receipts / on-chain status if needed

This repo is built so it runs fully today, and can be extended to “real stake tx building” cleanly.

# YieldPass (Local Prototype)

Mobile-first local prototype of **YieldPass** built with:

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- `@tonconnect/ui-react`
- Framer Motion + Lucide

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## What’s simulated

- **In-memory backend**: `src/lib/store.ts` stores stake, yield, subscriptions, and history.
- **Yield engine**: accrues yield every **5 seconds** using **24.08% APY**.
- **Subscriptions**: Netflix ($8.99), ChatGPT ($20), Telegram Premium ($4.99) with live progress.
- **STON.fi swap (simulated)**: when yield covers cost, “Pay with Yield” triggers a fake swap and marks the subscription as **PAID**.

## TON Connect

- Provider is configured in `src/components/Providers.tsx`
- Manifest lives at `public/tonconnect-manifest.json`

