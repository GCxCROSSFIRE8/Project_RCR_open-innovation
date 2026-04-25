# Localyze 

### Real-Time Hyperlocal Crisis Intelligence Platform

**Localyze** is a decentralized, AI-powered verification network designed to solve the "Last-Mile Verification" problem during crises. It transforms local reports into high-fidelity intelligence using an autonomous multi-agent pipeline and geospatial proof-of-presence.

---

## ✨ Production Features

### 📰 Hyperlocal Live News System
- **Geofenced Feed**: Intelligent news filtering within a 5-25km radius.
- **Dynamic Simulation Engine**: Realistic, real-time civic & emergency updates generated based on user location.
- **Incident Clustering**: Merges similar reports into unified clusters to prevent information overload.
- **Status Lifecycle**: Track incidents from **LIVE** to **UPDATING** to **RESOLVED**.
- **Proximity Gating**: 500m physical verification constraint for validators.

### 🤖 Multi-Agent AI Architecture
Powered by **LangGraph** & **Google Gemini**, our agentic pipeline performs:
1. **Spam Guard**: Instantly rejects invalid or malicious reports.
2. **Emergency Triage**: Prioritizes life-threatening events within milliseconds.
3. **Deep Classifier**: Categorizes reports for targeted emergency response.
4. **Decision Engine**: Calculates dynamic bounties and verifies network consensus.

### 🎨 Clean Minimalist UX
- **Grayscale Design**: A state-of-the-art, high-contrast B&W UI designed for maximum readability.
- **Zero-Friction Auth**: Seamless simulation mode for instant feature testing.
- **Interactive Map**: Real-time crisis markers with Leaflet integration.
- **Pro Subscription**: Advanced intelligence insights gated for premium users.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16 (Turbopack)](https://nextjs.org/)
- **AI Stack**: [LangGraph](https://langchain.com/) + [Google Gemini 1.5 Flash](https://aistudio.google.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [Firebase Firestore](https://firebase.google.com/) (with robust LocalStorage Simulation)
- **Maps**: [Leaflet](https://leafletjs.com/)
- **Payments**: [Razorpay](https://razorpay.com/) (Simulated fallback enabled)

---

## 🚀 Getting Started

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/GCxCROSSFIRE8/Project_RCR_open-innovation.git
cd RapidCrisisResponse_open

# Install dependencies
npm install
```

### 2. Run in Simulation Mode
The app is designed to work **without any API keys** out of the box.
```bash
npm run dev
```
Open `http://localhost:3000`. You will automatically enter **Simulation Mode** with a demo profile and live simulated events around Delhi.

### 3. Production Configuration
To enable Live Mode, add these keys to your `.env.local`:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`

---

## 📐 Project Structure

```
src/
├── app/              # Next.js App Router (Pages & API)
├── components/       # UI Components (Map, Feed, Modals)
├── context/          # Global Auth & Mode Management
├── lib/
│   ├── agents/      # LangGraph Multi-Agent Nodes
│   ├── hooks.ts     # Geolocation & Utility Hooks
│   ├── simulation/  # Local Incident Generation Engine
│   └── firebase.ts  # Database Handlers (Live vs Mock)
```

---

## 🔒 License
© 2026 Localyze. Built for resilience, verified by the community.
