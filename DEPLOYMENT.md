# Localyze Deployment Guide

This document outlines the steps to take Localyze from local development to a production environment. The application is now built with **Resilient SDK Initialization**, meaning it handles missing production environment variables gracefully without crashing the server.

## 1. Environment Configuration

Ensure your production environment (Vercel, Railway, or VPS) has the following variables set. 

> [!IMPORTANT]
> Do NOT use `test` keys for production. Replace them with Live keys from your dashboards.

| Variable | Source | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console | Client-side API key |
| `FIREBASE_PROJECT_ID` | Firebase Console | Admin SDK Project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase Service Account | Admin SDK Client Email |
| `FIREBASE_PRIVATE_KEY` | Firebase Service Account | Admin SDK Private Key (with `\n` preserved) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay Dashboard | Public key for frontend UI |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard | Backend secret for signature verification |
| `GEMINI_API_KEY` | Google AI Studio | API key for AI Crisis Analysis |

## 2. Platform Specifics

### Deploying to Vercel (Recommended)
1. **Push to GitHub**: Initialize a git repo and push your code.
2. **Import Project**: Link the repo to Vercel.
3. **Add Environment Variables**: Copy the values from your `.env.local` to the Vercel project settings.
4. **Deploy**: Vercel will automatically run `npm run build` and serve the application globally.

### Deploying to Firebase Hosting (Alternative)
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Run `firebase init hosting`.
3. Set the public directory to `.next`.
4. Run `npm run build` followed by `firebase deploy`.

## 3. Post-Deployment Checklist

- [ ] **Firestore Rules**: Update your Firestore Security Rules to restrict access to the `payments` and `earnings` collections (only allow Server/Admin access).
- [ ] **Razorpay Webhooks**: In production, consider adding a Webhook endpoint to sync payment status if the user closes the browser before verification.
- [ ] **Gemini Quotas**: Ensure your Google Cloud billing is active to avoid `429 Too Many Requests` during a real crisis.
- [ ] **CORS**: If using a custom domain, update your Razorpay allowed domains.

## 4. Maintenance

The system is designed to be low-maintenance.
- **AI Logs**: Monitor the console for `AI analysis is currently unavailable` to catch Gemini API outages.
- **Validator Audit**: Review the `validations` and `earnings` collections periodically to prevent fraud.
