# Localyze — Real-Time Paid Crisis Verification Platform

<p align="center">
  <img src="public/vercel.svg" alt="Localyze" width="120" />
</p>

<p align="center">
  <b>Transform local eyes into global truth.</b><br/>
  A decentralized, AI-powered crisis verification network with geospatial constraints and economic incentives.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2.3-black?logo=next.js" />
  <img src="https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase" />
  <img src="https://img.shields.io/badge/Gemini-AI-4285F4?logo=google" />
  <img src="https://img.shields.io/badge/Razorpay-Payments-0C2451?logo=razorpay" />
  <img src="https://img.shields.io/badge/LangGraph-Agent-1C3C3C?logo=langchain" />
</p>

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Architecture](#architecture)
6. [Environment Variables](#environment-variables)
7. [Getting Started](#getting-started)
8. [Simulation Mode](#simulation-mode)
9. [API Routes](#api-routes)
10. [AI Agent Workflow](#ai-agent-workflow)
11. [Pages & Routes](#pages--routes)
12. [Database Schema](#database-schema)
13. [Deployment](#deployment)
14. [Post-Deployment Checklist](#post-deployment-checklist)
15. [License](#license)

---

## Overview

**Localyze** solves the "Last-Mile Verification" problem in disaster management. During crises, social media is flooded with unverified reports, rumors, and panic. Localyze creates a **trusted network of local validators** who physically verify emergency reports in exchange for financial rewards.

The platform combines:

- **Geospatial Proof-of-Presence** — Validators must be within 500m of a crisis to verify it
- **AI-Assisted Risk Profiling** — Google Gemini analyzes every report for severity and urgency
- **Economic Incentives** — Validators earn ₹20–₹100 per verification based on risk level
- **Autonomous AI Agents** — A LangGraph-powered agent pipeline triages crises, calculates bounties, and matches validators automatically

> **Live Demo:** The app runs in **Simulation Mode** by default — zero configuration required for full local testing.

---

## Key Features

| Feature                             | Description                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **AI Crisis Triage**                | Every report is analyzed by a Gemini-powered LangGraph agent that classifies risk (LOW / MEDIUM / HIGH) and generates actionable summaries |
| **Dynamic Bounty System**           | Validator rewards scale automatically with crisis severity: ₹20 (LOW), ₹50 (MEDIUM), ₹100 (HIGH)                                           |
| **500m Proximity Validation**       | Geospatial constraint ensures validators are physically present near the crisis location using Haversine distance calculation              |
| **Real-Time Crisis Map**            | Interactive Leaflet map with CartoDB dark theme showing live crisis markers colored by risk level                                          |
| **Dual-Mode Operation**             | **Live Mode** with Firebase + Razorpay, or **Simulation Mode** with zero-config mock services                                              |
| **Firebase Authentication**         | Email/password with verification + Google OAuth, with automatic profile creation                                                           |
| **Razorpay Integration**            | ₹50 seeker fee per crisis report, with automatic simulation fallback when keys are missing                                                 |
| **Trust Score System**              | Validators earn +10 trust points per confirmation, building reputation over time                                                           |
| **Auto-Refreshing Validator Panel** | Real-time polling (every 4s) of pending verifications with AI-generated context                                                            |
| **Resilient SDK Initialization**    | App never crashes from missing environment variables — gracefully falls back to simulation                                                 |

---

## Tech Stack

| Layer                | Technology                                        |
| -------------------- | ------------------------------------------------- |
| **Framework**        | Next.js 16.2.3 (App Router)                       |
| **UI Library**       | React 19.2.4                                      |
| **Language**         | TypeScript 5                                      |
| **Styling**          | Tailwind CSS v4, Geist font                       |
| **State Management** | React Context API                                 |
| **Database**         | Firebase Firestore                                |
| **Authentication**   | Firebase Auth (Email/Password + Google OAuth)     |
| **AI / LLM**         | Google Gemini 1.5 Flash via LangChain + LangGraph |
| **Payment Gateway**  | Razorpay                                          |
| **Maps**             | Leaflet + React-Leaflet + GeoFire Common          |
| **Icons**            | Lucide React                                      |
| **Linting**          | ESLint 9 + eslint-config-next                     |

---

## Project Structure

```
RapidCrisisResponse_open/
├── public/                     # Static assets (SVGs, icons)
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API Routes
│   │   │   ├── agent-run/      # Run AI agent standalone
│   │   │   ├── create-order/   # Create Razorpay order
│   │   │   ├── create-request/ # Submit crisis + trigger agent
│   │   │   ├── list-requests/  # Fetch pending requests
│   │   │   ├── validate-request/ # Validator confirm/reject
│   │   │   └── verify-payment/ # Verify Razorpay signature
│   │   ├── auth/               # Login / Signup page
│   │   ├── dashboard/          # Main crisis map dashboard
│   │   ├── profile/            # User profile & stats
│   │   ├── validator/          # Validator verification panel
│   │   ├── whitepaper/         # Protocol documentation page
│   │   ├── layout.tsx          # Root layout with AuthProvider
│   │   ├── page.tsx            # Landing page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── CreateRequestModal.tsx  # Crisis submission modal
│   │   ├── Map.tsx                 # Dynamic Leaflet map wrapper
│   │   └── LeafletMap.tsx          # Interactive crisis map
│   ├── context/
│   │   └── AuthContext.tsx         # Firebase auth + mock mode logic
│   ├── lib/
│   │   ├── agents/
│   │   │   ├── graph.ts        # LangGraph workflow (triage → manager → tools → extract)
│   │   │   ├── state.ts        # Agent state channels definition
│   │   │   └── tools.ts        # Dynamic bounty + nearby validator tools
│   │   ├── firebase.ts         # Client Firebase (with mock fallback)
│   │   ├── firebase-admin.ts   # Admin SDK (with mock fallback)
│   │   ├── gemini.ts           # Direct Gemini REST API service
│   │   ├── mock-db.ts          # In-memory MockDB (global singleton)
│   │   ├── mock-services.ts    # Mock Auth + Firestore with localStorage
│   │   └── razorpay.ts         # Razorpay config (auto simulation fallback)
│   └── middleware.ts           # Route protection middleware
├── AGENTS.md                   # Agent coding rules
├── CLAUDE.md                   # AI assistant context
├── DEPLOYMENT.md               # Production deployment guide
├── README.md                   # This file
├── next.config.ts              # Next.js configuration
├── package.json                # Dependencies & scripts
├── postcss.config.mjs          # PostCSS configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

---

## Architecture

### Data Flow: Crisis Submission

```
User submits crisis
    ↓
[Razorpay] Create Order (₹50)
    ↓
Payment verified (live or simulated)
    ↓
[API /create-request]
    ├── Run LangGraph Agent (Triage → Manager → Tools → Extract)
    │   ├── Risk Classification (LOW/MEDIUM/HIGH)
    │   ├── Dynamic Bounty Calculation
    │   └── Nearby Validator Search
    │
    └── Atomic Firestore Transaction
        ├── Create request document
        ├── Attach AI summary + bounty
        └── Mark payment as used
    ↓
Real-time map update + Validator panel notification
```

### Data Flow: Crisis Validation

```
Validator opens /validator panel
    ↓
Auto-poll /api/list-requests every 4 seconds
    ↓
Validator clicks Confirm / Reject
    ↓
[API /validate-request]
    ├── Verify validator within 500m (skipped in simulation)
    ├── Atomic Firestore Transaction
    │   ├── Update request status (verified / rejected)
    │   ├── Create validation record
    │   ├── Create earning record (₹bounty)
    │   └── Update validator profile (+trust, +earnings, +count)
    ↓
Validator balance updates in real time
```

---

## Environment Variables

Create a `.env.local` file in the project root for local development. For production, configure these in your hosting platform (Vercel, etc.).

### Required for Live Mode

| Variable                                   | Source                              | Description                                        |
| ------------------------------------------ | ----------------------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Firebase Console → Project Settings | Client-side Firebase API key                       |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Firebase Console                    | Auth domain (e.g., `project-id.firebaseapp.com`)   |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Firebase Console                    | Firebase project identifier                        |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Firebase Console                    | Cloud Storage bucket                               |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console                    | FCM sender ID                                      |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Firebase Console                    | Firebase app ID                                    |
| `FIREBASE_PROJECT_ID`                      | Firebase Service Account            | Admin SDK project ID                               |
| `FIREBASE_CLIENT_EMAIL`                    | Firebase Service Account JSON       | Admin SDK client email                             |
| `FIREBASE_PRIVATE_KEY`                     | Firebase Service Account JSON       | Admin SDK private key (preserve `\n`)              |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`              | Razorpay Dashboard → API Keys       | Razorpay public key for frontend                   |
| `RAZORPAY_KEY_SECRET`                      | Razorpay Dashboard → API Keys       | Razorpay secret for backend signature verification |
| `GEMINI_API_KEY`                           | Google AI Studio                    | Google Generative AI API key                       |

> **Note:** If any Firebase or Razorpay variables are missing, the app **automatically switches to Simulation Mode** — no crashes, full functionality.

---

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20 LTS)
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd RapidCrisisResponse_open

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Script  | Command         | Description                             |
| ------- | --------------- | --------------------------------------- |
| `dev`   | `npm run dev`   | Start development server with Turbopack |
| `build` | `npm run build` | Build for production                    |
| `start` | `npm run start` | Start production server                 |
| `lint`  | `npm run lint`  | Run ESLint                              |

---

## Simulation Mode

Localyze is designed to be **fully functional without any API keys**. This makes onboarding, demos, and local development seamless.

### How It Works

When `NEXT_PUBLIC_FIREBASE_API_KEY` is missing or set to `mock_key`:

- **Authentication:** Bypassed — a demo profile (`Demo User`, trust score 85) is auto-injected
- **Database:** In-memory MockDB with `localStorage` persistence for the client, global singleton for server API routes
- **Payments:** Razorpay signature checks bypassed; simulated orders created instantly
- **AI Agent:** A mock LangChain model simulates a 3-turn conversation (triage → tools → summary)
- **Map:** Pre-loaded demo crisis markers in Delhi

### Simulation User Credentials

| Field             | Value              |
| ----------------- | ------------------ |
| Name              | `Demo User`        |
| Email             | `demo@localyze.ai` |
| Role              | `seeker`           |
| Trust Score       | `85`               |
| Total Requests    | `5`                |
| Total Validations | `2`                |
| Earnings          | `₹120`             |

### Switching to Live Mode

1. Add your production Firebase, Razorpay, and Gemini keys to `.env.local`
2. Restart the dev server (`npm run dev`)
3. The app will automatically use real services

---

## API Routes

| Route                   | Method | Description                                                                                                                |
| ----------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| `/api/create-order`     | `POST` | Creates a Razorpay order (or simulated order). Returns `orderId`, `paymentDocId`, and `amount`.                            |
| `/api/verify-payment`   | `POST` | Verifies Razorpay payment signature (bypassed in simulation). Updates payment status to `paid` or `simulated_paid`.        |
| `/api/create-request`   | `POST` | Main crisis submission endpoint. Triggers the LangGraph agent, runs Firestore transaction to create the request document.  |
| `/api/list-requests`    | `GET`  | Returns all pending crisis requests. Supports `?isSimulation=true` query param.                                            |
| `/api/validate-request` | `POST` | Processes validator confirm/reject actions. Includes 500m proximity check, updates user earnings & trust score atomically. |
| `/api/agent-run`        | `POST` | Standalone endpoint to run the AI crisis agent. Returns risk level, bounty, and validator assignments.                     |

### Example: Create a Crisis Request

```bash
curl -X POST http://localhost:3000/api/create-request \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "mock_user_001",
    "text": "Flash flood reported near Central Park",
    "lat": 28.6139,
    "lng": 77.2090,
    "paymentDocId": "sim_payment_123"
  }'
```

---

## AI Agent Workflow

The autonomous crisis agent is built with **LangGraph** and consists of 4 nodes:

### Node 1: `triage`

- **Input:** Crisis description text
- **Action:** Classifies risk as LOW, MEDIUM, or HIGH using Gemini (or mock model)
- **Output:** `riskLevel`, updates status to `SEARCHING_VALIDATORS`

### Node 2: `manager`

- **Input:** Risk level + crisis text
- **Action:** Decides which tools to invoke:
  - `calculate_dynamic_bounty` — determines validator reward
  - `find_nearby_validators` — locates validators within 5km
- **Output:** AI message with `tool_calls`

### Node 3: `tools` (ToolNode)

- **Action:** Executes the invoked tools
  - Returns bounty amount (₹20 / ₹50 / ₹100)
  - Returns best validator match + nearby validator list

### Node 4: `extract`

- **Input:** Tool results from conversation history
- **Action:** Parses bounty amount, validator list, and best match
- **Output:** Final structured state with `bountyAmount`, `validatorsFound`, `assignedValidator`, status `COMPLETED`

### Conditional Routing

```
START → triage → manager
                    ↓
              has tool_calls?
            YES ↓          ↓ NO
          tools → manager  extract → END
```

---

## Pages & Routes

| Route               | Page                | Description                                                                                |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------ |
| `/`                 | **Landing Page**    | Marketing page with features, stats, and CTAs                                              |
| `/auth`             | **Authentication**  | Login / Signup with email verification, Google OAuth, password reset                       |
| `/auth?mode=signup` | **Signup**          | Direct link to registration tab                                                            |
| `/dashboard`        | **Crisis Map**      | Full-screen interactive map with floating action button to report crises                   |
| `/validator`        | **Validator Panel** | Auto-refreshing list of pending verifications with AI summaries and confirm/reject actions |
| `/profile`          | **User Profile**    | Trust score circle, stats grid (requests, validations, earnings), activity feed            |
| `/whitepaper`       | **Whitepaper**      | Protocol documentation: geospatial proof, AI risk profiling, economic incentives           |

---

## Database Schema

### Firestore Collections

#### `users`

```typescript
{
  id: string; // Firebase UID
  name: string;
  email: string;
  role: "seeker" | "validator";
  trustScore: number; // Default: 50
  totalRequests: number;
  totalValidations: number;
  earnings: number; // Total INR earned
  createdAt: string; // ISO timestamp
}
```

#### `requests`

```typescript
{
  id: string;
  userId: string;
  text: string; // Crisis description
  lat: number;
  lng: number;
  geohash: string; // GeoFire geohash for spatial queries
  status: "pending" | "verified" | "rejected";
  risk: "LOW" | "MEDIUM" | "HIGH";
  bounty: number; // Dynamic validator reward
  agentStatus: string; // e.g., 'COMPLETED'
  aiSummary: string; // AI-generated crisis summary
  aiAdvice: string; // AI recommendation
  paymentId: string;
  createdAt: string;
}
```

#### `payments`

```typescript
{
  id: string;
  userId: string;
  amount: number;
  status: 'created' | 'paid' | 'simulated_paid';
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  usedForRequest: boolean;
  isSimulation: boolean;
  createdAt: string;
  verifiedAt?: string;
}
```

#### `validations`

```typescript
{
  id: string;
  requestId: string;
  validatorId: string;
  response: "confirm" | "reject";
  timestamp: string;
}
```

#### `earnings`

```typescript
{
  id: string;
  validatorId: string;
  requestId: string;
  payoutAmount: number;
  status: "pending" | "paid";
}
```

---

## Deployment

### Option 1: Vercel (Recommended)

1. **Push to GitHub**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Framework preset: **Next.js**

3. **Configure Environment Variables**
   - Copy all variables from `.env.local` into Vercel Project Settings → Environment Variables
   - **Never use test keys in production**

4. **Deploy**
   - Vercel automatically runs `npm run build` and deploys globally
   - Custom domains can be configured in Project Settings

### Option 2: Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize hosting
firebase init hosting

# Build the application
npm run build

# Deploy
firebase deploy
```

> Set the public directory to `.next` (or `out` if using static export).

---

## Post-Deployment Checklist

Before going live, complete these critical steps:

- [ ] **Firestore Security Rules:** Restrict `payments` and `earnings` collections to server/admin access only
- [ ] **Razorpay Webhooks:** Add a webhook endpoint to sync payment status if users close the browser before verification completes
- [ ] **Gemini API Quotas:** Ensure Google Cloud billing is active to prevent `429 Too Many Requests` during high-traffic events
- [ ] **CORS Configuration:** If using a custom domain, add it to Razorpay's allowed domains list
- [ ] **Firestore Indexes:** Create composite indexes for geospatial + status queries if scaling beyond demo
- [ ] **SSL Certificate:** Ensure HTTPS is enforced (Vercel and Firebase Hosting do this automatically)

### Maintenance Notes

- Monitor server logs for `AI analysis is currently unavailable` to catch Gemini API outages
- Periodically audit the `validations` and `earnings` collections to prevent fraud
- Review trust score distributions to ensure validator quality

---

## License

© 2026 Localyze AI. All Rights Reserved.

Distributed Crisis Verification Protocol. Built with Next.js, Firebase, and Google Gemini.

---

<p align="center">
  <b>Built for resilience. Verified by the community. Powered by AI.</b>
</p>
