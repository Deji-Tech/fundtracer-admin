// ============================================================
// FundTracer CLI - Config Command
// ============================================================

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ChainId, getEnabledChains } from '@fundtracer/core';

const CONFIG_DIR = path.join(os.homedir(), '.fundtracer');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

interface Config {
    apiKeys: Partial<Record<ChainId, string>>;
    defaultChain: ChainId;
    defaultDepth: number;
}

const DEFAULT_CONFIG: Config = {
    apiKeys: {},
    defaultChain: 'ethereum',
    defaultDepth: 3,
};

interface ConfigOptions {
    setKey?: string;
    show?: boolean;
    reset?: boolean;
}

export async function configCommand(options: ConfigOptions) {
    ensureConfigDir();

    if (options.reset) {
        resetConfig();
        return;
    }

    if (options.setKey) {
        setApiKey(options.setKey);
        return;
    }

    if (options.show) {
        showConfig();
        return;
    }

    // Default: show help
    console.log(chalk.cyan('FundTracer Configuration\n'));
    console.log('Usage:');
    console.log('  fundtracer config --show              Show current configuration');
    console.log('  fundtracer config --set-key <chain:key>  Set API key for a chain');
    console.log('  fundtracer config --reset             Reset to default configuration');
    console.log();
    console.log('Examples:');
    console.log('  fundtracer config --set-key ethereum:YOUR_ETHERSCAN_API_KEY');
    console.log('  fundtracer config --set-key linea:YOUR_LINEASCAN_API_KEY');
}

function ensureConfigDir() {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
}

function loadConfig(): Config {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
            return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
        }
    } catch {
        // Ignore errors, return default
    }
    return DEFAULT_CONFIG;
}

function saveConfig(config: Config) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function showConfig() {
    const config = loadConfig();

    console.log(chalk.cyan('Current Configuration:\n'));
    console.log(`Config file: ${chalk.dim(CONFIG_FILE)}\n`);

    console.log(chalk.bold('API Keys:'));
    const chains = getEnabledChains();

    for (const chain of chains) {
        const key = config.apiKeys[chain.id];
        if (key) {
            const masked = key.slice(0, 4) + '...' + key.slice(-4);
            console.log(`  ${chalk.green('✓')} ${chain.name}: ${chalk.dim(masked)}`);
        } else {
            console.log(`  ${chalk.red('✗')} ${chain.name}: ${chalk.dim('Not configured')}`);
        }
    }

    console.log();
    console.log(chalk.bold('Defaults:'));
    console.log(`  Default Chain: ${config.defaultChain}`);
    console.log(`  Default Depth: ${config.defaultDepth}`);
}

function setApiKey(keyString: string) {
    const [chain, key] = keyString.split(':');

    if (!chain || !key) {
        console.error(chalk.red('✗ Invalid format. Use: --set-key <chain>:<api_key>'));
        process.exit(1);
    }

    const validChains: ChainId[] = ['ethereum', 'linea', 'arbitrum', 'base', 'optimism', 'polygon'];
    if (!validChains.includes(chain as ChainId)) {
        console.error(chalk.red(`✗ Invalid chain: ${chain}`));
        console.log(chalk.dim(`Valid chains: ${validChains.join(', ')}`));
        process.exit(1);
    }

    const config = loadConfig();
    config.apiKeys[chain as ChainId] = key;
    saveConfig(config);

    console.log(chalk.green(`✓ API key for ${chain} saved successfully`));
}

function resetConfig() {
    saveConfig(DEFAULT_CONFIG);
    console.log(chalk.green('✓ Configuration reset to defaults'));
}
