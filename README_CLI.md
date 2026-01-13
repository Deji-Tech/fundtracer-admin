# FundTracer CLI

FundTracer is a powerful blockchain wallet forensics tool available directly in your terminal. It helps you trace funds, analyze wallet behavior, and detect Sybil clusters using advanced heuristics and multiple data sources (Alchemy, Moralis, Dune).

## Installation

You can install the CLI globally or run it via `npx`.

### Prerequisites
- Node.js v16+
- API Keys:
  - **Alchemy** (Required for transaction data)
  - **Moralis** (Optional, for faster funding source detection)
  - **Dune** (Optional, for contract analysis)

### Install via NPM/Yarn
```bash
# From the project root
npm install -g @fundtracer/cli
```

Or run directly:
```bash
npx @fundtracer/cli
```

## Configuration

Before using the tool, configure your API keys:

```bash
# Set your Alchemy key (Required)
fundtracer config --set-key alchemy:YOUR_ALCHEMY_KEY

# Set your Moralis key (Optional, recommended for speed)
fundtracer config --set-key moralis:YOUR_MORALIS_KEY

# Check configuration
fundtracer config --show
```

## Commands

### Analyze a Wallet
Analyze a single wallet for funding sources, activity patterns, and suspicious behavior.

```bash
fundtracer analyze <wallet_address> [options]

# Example:
fundtracer analyze 0x123... --chain ethereum --depth 3
```

**Options:**
- `-c, --chain <chain>`: Network to analyze (ethereum, linea, arbitrum, base, optimism). Default: ethereum.
- `-d, --depth <number>`: Recursive depth for funding tree (1-5). Default: 3.
- `-o, --output <format>`: Output format (table, json, tree). Default: table.
- `--export <file>`: Save report to a file (JSON).

### Sybil Detection (Compare)
Detect Sybil clusters by analyzing multiple wallets for shared funding sources and interaction patterns.

```bash
fundtracer sybil <address1> <address2> ... [options]
# OR
fundtracer compare <address1> <address2> ... [options]
```

**Example:**
```bash
fundtracer sybil 0x123... 0x456... 0x789... --chain linea
```

**Output:**
- Correlation Score (0-100%)
- Common Funding Sources
- Shared Project Interactions
- Direct Transfers between wallets
- Individual Risk Scores

### Contract Analysis
(Server-side feature, accessible via UI or specialized scripts)

## Interactive Mode
Launch the full interactive dashboard in your terminal:

```bash
fundtracer interactive
# or simply
fundtracer
```

## Troubleshooting
- **Rate Limits:** If you encounter errors, ensure your API keys have sufficient credits.
- **Timeouts:** Deep analysis (depth > 3) can take time. Reduce depth if requests timeout.
