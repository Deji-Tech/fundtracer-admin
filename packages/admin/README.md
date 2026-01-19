# FundTracer Admin Dashboard

Admin dashboard for monitoring and managing the FundTracer platform.

## Features

- 📊 **Analytics Dashboard**: Visitor stats, revenue tracking, usage metrics
- 👥 **User Management**: View, search, and manage all users
- 🎫 **Tier Management**: Manually assign Free/Pro/Max tiers
- ✅ **PoH Verification**: Grant or revoke Proof of Humanity status
- 🚫 **Blacklist Control**: Ban/unban users from the platform
- 📈 **Charts**: Visual analytics for chains, features, and user distribution
- 📝 **Activity Log**: Recent admin actions and payments

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your Firebase config (same as main app)

4. Update admin email in `src/contexts/AuthContext.tsx`:
```typescript
const ADMIN_EMAILS = [
  'your@email.com', // Replace with actual admin email
];
```

## Development

```bash
npm run dev
```

The admin dashboard will run on `http://localhost:5174` (different from main app)

## Deployment

### Option 1: Netlify (Separate Site)
```bash
npm run build
```

Deploy the `dist/` folder to Netlify as a separate site (e.g., `admin.fundtracer.xyz`)

### Option 2: Vercel
```bash
vercel --prod
```

### Option 3: pxxl (User's Preference)
Follow pxxl deployment instructions with `dist/` folder

## Security

⚠️ **Important Security Notes:**

1. **Admin Access**: Only emails in `ADMIN_EMAILS` array can access the dashboard
2. **Separate Deployment**: Deploy on a different domain/subdomain from main app
3. **Firestore Rules**: Ensure Firestore rules restrict write access to admin users
4. **HTTPS Only**: Always use HTTPS in production

## Firestore Collections

The dashboard reads/writes to these collections:

- `users/` - User profiles and settings
- `analytics/revenue/payments` - Payment records
- `analytics/daily_stats/records` - Daily analytics
- `admin_actions/` - Log of all admin actions

##License

Private - Internal use only
