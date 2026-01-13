# FundTracer CLI

Blockchain wallet forensics from your terminal. Trace funds, detect Sybil clusters, and analyze suspicious activity.

## Prerequisites

You need **at least one** API key to use FundTracer:

| Provider | Purpose | Required? | Speed | Get Key |
|----------|---------|-----------|-------|---------|
| **Alchemy** | Primary RPC (transactions, balances) | ✅ Recommended | Fast | [dashboard.alchemy.com](https://dashboard.alchemy.com/) |
| **Moralis** | Optimized funding source lookup | Optional | 10x faster tracing | [admin.moralis.io](https://admin.moralis.io/) |
| **Dune** | Contract analysis via SQL | Optional | Fast for contracts | [dune.com/settings/api](https://dune.com/settings/api) |
| **Etherscan** | Fallback explorer API | Optional | Slower | [etherscan.io/myapikey](https://etherscan.io/myapikey) |

> **Note**: All providers have generous free tiers. Alchemy alone is sufficient for most use cases.

---

## Installation

```bash
# From project root
npm run build
cd packages/cli && npm link

# Verify installation
fundtracer --version
```

---

## Configuration

Set your API keys before first use:

```bash
# Required: Set Alchemy key
fundtracer config --set-key alchemy:YOUR_ALCHEMY_KEY

# Optional: Add Moralis for 10x faster funding tracing
fundtracer config --set-key moralis:YOUR_MORALIS_KEY

# Optional: Add Dune for fast contract analysis
fundtracer config --set-key dune:YOUR_DUNE_KEY

# View current config
fundtracer config --show
```

You can also set keys via environment variables:
```bash
export ALCHEMY_API_KEY=your_key
export MORALIS_API_KEY=your_key
export DUNE_API_KEY=your_key
```

---

## Commands

### Analyze a Wallet

```bash
fundtracer analyze <address> [options]

# Examples:
fundtracer analyze 0x123...abc --chain ethereum
fundtracer analyze 0x456...def --chain linea --depth 5
fundtracer analyze 0x789...ghi --output json --export report.json
```

**Options:**
| Flag | Description | Default |
|------|-------------|---------|
| `-c, --chain <chain>` | Network (ethereum, linea, arbitrum, base) | ethereum |
| `-d, --depth <n>` | Funding tree depth (1-5) | 3 |
| `-o, --output <fmt>` | Output format (table, json, tree) | table |
| `--export <file>` | Save results to file | - |

---

### Sybil Detection

Compare wallets to detect Sybil clusters:

```bash
fundtracer compare <addr1> <addr2> [addr3...] [options]
# Alias:
fundtracer sybil <addr1> <addr2> [addr3...] [options]

# Example:
fundtracer sybil 0x111... 0x222... 0x333... --chain linea
```

**Output includes:**
- Correlation Score (0-100%)
- Common Funding Sources
- Shared Project Interactions
- Direct Transfers between wallets

---

### Interactive Mode

Launch the full interactive experience:

```bash
fundtracer
# or
fundtracer interactive
```

Shows provider status and guided prompts.

---

## Speed Comparison

| Operation | Alchemy Only | + Moralis | + Dune |
|-----------|-------------|-----------|--------|
| Wallet Analysis | ~5-10s | ~2-3s | ~2-3s |
| Funding Trace (depth 3) | ~15-30s | ~3-5s | ~3-5s |
| Contract Interactors | ~60s+ | ~60s+ | ~5-10s |
| Sybil Compare (5 wallets) | ~60s | ~15s | ~15s |

---

## Troubleshooting

**"No API keys configured"**
- Run: `fundtracer config --set-key alchemy:YOUR_KEY`

**Rate limit errors**
- Wait a few seconds and retry
- Consider upgrading to paid tier for heavy usage

**Timeouts on deep analysis**
- Reduce depth: `--depth 2`
- Use Moralis for faster tracing

---

## Supported Chains

- Ethereum Mainnet
- Linea
- Arbitrum One
- Base
- Optimism
- Polygon
