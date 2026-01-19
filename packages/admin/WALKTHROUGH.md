
# 🚀 FundTracer Admin Dashboard & Analytics Walkthrough

## 1. Admin Dashboard Overview
The new **Admin Dashboard** is a standalone application (`packages/admin`) running on port **5174**. It provides a comprehensive view of the FundTracer platform's health and usage.

**URL:** `http://localhost:5174`
**Login:** Google Auth (Restricted to whitelisted emails, e.g., `dejitech2@gmail.com`)

### Key Features:
- **📊 Real-time Analytics:** View total visitors, active users, revenue, and analysis counts.
- **👥 User Management:** Search users, manually assign tiers (Free/Pro/Max), verify Proof of Humanity (PoH), and blacklist/ban users.
- **🚫 Blacklist Enforcement:** Banned users are immediately blocked from the API with a 403 Forbidden error.
- **📈 Usage Charts:** visualize chain distribution (Ethereum vs. L2s) and feature usage (Wallet Analysis vs. Comparisons).
- **📝 Activity Feed:** Audit log of admin actions and user payments.

## 2. Real-Time Analytics Tracking
We've integrated tracking deep into the backend to capture real user behavior without impacting performance.

| Metric | How it's Tracked | Where it's Stored |
|---|---|---|
| **Site Visits** | `App.tsx` calls `/analytics/visit` on load | `analytics/daily_stats/visitors` |
| **Logins** | `/user/profile` endpoint | `analytics/user_activity/logins` |
| **Analysis** | `trackAnalysis()` in all `/analyze/*` routes | `analytics/daily_stats/analysisCount` & `featureUsage` |
| **Revenue** | Payment listener service | `analytics/revenue/payments` |

## 3. Blacklist Security System
A robust banning system was implemented to stop abusive users.

1.  **Admin Action:** Click "Ban" in the Admin Dashboard User tab.
2.  **Database Update:** Sets `blacklisted: true` on the user's Firestore document.
3.  **API Enforcement:** The `authMiddleware` checks this flag on **every authenticated request**.
4.  **Result:** Banned users receive a generic `403 Account Suspended` error immediately.

## 4. Deployment Status
-   **Admin App:** Ready to deploy (`npm run build` in `packages/admin`).
-   **Server:** Updated with new routes and middleware.
-   **Web App:** Updated to track visits.
-   **GitHub:** All code pushed to `master`.

## 5. Next Steps
-   **Deploy Admin App:** Follow `packages/admin/DEPLOYMENT.md` to deploy to pxxl.
-   **Configure Secrets:** Ensure production environment has `FIREBASE_XXX` keys.
