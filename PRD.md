# Localyze — Product Requirements Document (PRD)

## 🎯 Project Overview
Localyze is a production-grade, real-time hyperlocal crisis verification and intelligence platform. It combines decentralized validation with a multi-agent AI pipeline to transform unverified local reports into a trusted, real-time intelligence feed.

---

## 🎨 PART 1: UI/UX DESIGN SYSTEM

### Core Philosophy
- **Minimalism**: Clean, fast, and crisis-friendly. Zero visual clutter.
- **Grayscale Aesthetic**: Strict use of Black, White, and Gray with a singular subtle blue accent (`blue-600`) for primary actions.
- **Typography**: High-quality modern typography (Outfit / Geist) with large font sizes for readability during emergencies.
- **No Generic Vibrant Colors**: Avoid plain red, bright green, or neon glows. Use curated, high-contrast shades.

### Page-Specific Requirements
- **Landing Page**: Professional, high-contrast, focusing on metrics and trust.
- **Auth**: Simplified grayscale forms with clear status feedback.
- **Dashboard**: Full-screen interactive map with floating high-contrast badges for "Live" or "Simulation" modes.
- **Validator Panel**: List-centric, high-density verification cards with priority indicators.

---

## 📰 PART 2: HYPERLOCAL LIVE NEWS SYSTEM

### Core Behavior
- **Hyperlocal radius**: 5–20 km radius filtering (user-adjustable).
- **Proximity**: Updates based on GPS (primary) with IP fallback.
- **Categories**:
    - 🔴 **CRITICAL**: Accidents, disasters, medical emergencies. (Pulsing indicators, pinned to top).
    - 🟠 **IMPORTANT**: Traffic, roadblocks, police checks.
    - 🟢 **GENERAL**: Local market updates, utility notices.
- **Behavior**: Auto-updating, Auto-scroll (pause on interaction), and Tap-to-Expand.
- **Filtering**: Range slider to dynamically scan the immediate area.

### Advanced Simulation Logic
- **Clustering**: Group similar events into a single "Cluster ID" to prevent feed flooding.
- **Live Lifecycle**: Events transition from `LIVE` ➔ `UPDATING` ➔ `RESOLVED`.
- **Scaling**: Severity scores (1-10) determine visual prominence.
- **Economic Gating**: 
    - **Free Access**: General & Critical alerts.
    - **Subscription (Pro)**: Advanced insights, agent reasoning, and detailed breakdown.

---

## 🤖 ARCHITECTURE: MULTI-AGENT PIPELINE

### Workflow (LangGraph)
1. **Spam Detection**: LLM-based filter for gibberish or irrelevant data.
2. **Triage**: Rapid risk assessment (Severity score + emergency level).
3. **Classifier**: Categorization into specific sub-types (e.g., Industrial, Medical).
4. **RAG (Retrieval-Augmented Generation)**: Integration with Pinecone/Vector DB for historical context.
5. **Decision Engine**: Final structured JSON generation and validator assignment.

### Trust & Rewards
- **経済学 (Economics)**: Seekers pay a small fee (₹50) to trigger agent-led verification.
- **Bounty**: Dynamic calculation based on risk level (₹20 – ₹150).
- **Consensus**: Multiple validators required for final confirmation.
- **Trust Score**: Validators build reputation (+10 per correct verify, -20 per failure).

---

## ⚙️ TECHNICAL SPECIFICATIONS
- **Frontend**: Next.js 16 (App Router), Tailwind CSS v4, React 19.
- **Backend API**: Next.js Server Actions & API Routes.
- **AI**: Google Gemini 1.5 Flash via LangChain.
- **Database**: Firebase Firestore (Simulation fallback enabled).
- **Map Engine**: Leaflet + React Leaflet.
- **Payments**: Razorpay (Simulation mode support).
