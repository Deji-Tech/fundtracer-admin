# FundTracer by DT

A professional blockchain forensics and wallet analysis tool designed for identifying suspicious on-chain activity, tracing fund flows, and detecting Sybil behavior across EVM networks.

![FundTracer Dashboard](https://api.screenshotone.com/take?url=http%3A%2F%2Flocalhost%3A5173&access_key=YOUR_KEY) 

## Core Features

- **Wallet Analysis**: Deep-dive into any EVM address to trace funding sources and destinations.
- **Contract Analysis**: Analyze contract interactors to identify coordinated behavior and shared funding groups.
- **Sybil Detection**: Multi-wallet comparison to detect non-organic patterns (wash trading, circular funding, identical funding amounts).
- **Behavior Profiling**: Advanced heuristics to detect rapid movement, fresh wallet activity, and dust attacks.
- **Professional Analytics**: Designed with a deep-black forensics aesthetic for a serious, focused experience.

## Tech Stack

- **Monorepo**: npm workspaces
- **Frontend**: React + Vite + D3.js (Visualizations)
- **Engine**: TypeScript Core (@fundtracer/core)
- **Backend**: Express.js + Firebase Admin SDK
- **Auth**: Google Authentication (Identity Platform)
- **Security**: Server-side API key management (Protects your Etherscan keys)

## Project Structure

```text
├── packages/
│   ├── core/      # Analysis logic, providers, and heuristics
│   ├── web/       # React dashboard with D3 visualizations
│   ├── server/    # Secure API server with auth and rate limiting
│   └── cli/       # Terminal-based analysis tool
```

## Security Design

FundTracer is designed with security as a priority:
- **API Hiding**: Etherscan API keys are managed exclusively on the server. The client never sees your keys.
- **Access Control**: Integrated with Firebase Auth to prevent unauthorized use.
- **Rate Limiting**: Built-in usage limits (7/day for free users) with support for custom user API keys.

## Quick Start

### 1. Prerequisites
- Node.js v18+
- A [Firebase Project](https://console.firebase.google.com)
- An [Etherscan API Key](https://etherscan.io/apis)

### 2. Configuration
Create a `.env` file in `packages/server/`:
```env
DEFAULT_ETHERSCAN_API_KEY=your_key
FIREBASE_PROJECT_ID=your_id
FIREBASE_CLIENT_EMAIL=your_email
FIREBASE_PRIVATE_KEY="your_private_key"
```

Update `packages/web/src/firebase.ts` with your client-side config.

### 3. Installation
```bash
npm install
```

### 4. Development
```bash
# Start the API server
npm run dev:server

# Start the web dashboard
npm run dev
```

## Credits

Developed by **DT Development**. Licensed under MIT.
