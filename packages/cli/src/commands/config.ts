// ============================================================
// FundTracer CLI - Config Command
// ============================================================

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ChainId, getEnabledChains, ApiKeyConfig } from '@fundtracer/core';

const CONFIG_DIR = path.join(os.homedir(), '.fundtracer');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

interface Config {
    apiKeys: ApiKeyConfig;
    defaultChain: ChainId;
    defaultDepth: number;
}

const DEFAULT_CONFIG: Config = {
    apiKeys: {
        alchemy: '',
    },
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
    console.log('  fundtracer config --set-key <provider:key>  Set API key (alchemy, moralis)');
    console.log('  fundtracer config --reset             Reset to default configuration');
    console.log();
    console.log('Examples:');
    console.log('  fundtracer config --set-key alchemy:YOUR_ALCHEMY_KEY');
    console.log('  fundtracer config --set-key moralis:YOUR_MORALIS_KEY');
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

    // Alchemy
    const alchemyKey = config.apiKeys.alchemy;
    if (alchemyKey) {
        const masked = alchemyKey.slice(0, 4) + '...' + alchemyKey.slice(-4);
        console.log(`  ${chalk.green('✓')} Alchemy: ${chalk.dim(masked)}`);
    } else {
        console.log(`  ${chalk.red('✗')} Alchemy: ${chalk.dim('Not configured')}`);
    }

    // Moralis
    const moralisKey = config.apiKeys.moralis;
    if (moralisKey) {
        const masked = moralisKey.slice(0, 4) + '...' + moralisKey.slice(-4);
        console.log(`  ${chalk.green('✓')} Moralis: ${chalk.dim(masked)}`);
    } else {
        console.log(`  ${chalk.yellow('?')} Moralis: ${chalk.dim('Not configured (Optional)')}`);
    }

    console.log();
    console.log(chalk.bold('Defaults:'));
    console.log(`  Default Chain: ${config.defaultChain}`);
    console.log(`  Default Depth: ${config.defaultDepth}`);
}

function setApiKey(keyString: string) {
    const [provider, key] = keyString.split(':');

    if (!provider || !key) {
        console.error(chalk.red('✗ Invalid format. Use: --set-key <provider>:<api_key>'));
        process.exit(1);
    }

    if (provider !== 'alchemy' && provider !== 'moralis') {
        console.error(chalk.red(`✗ Invalid provider: ${provider}`));
        console.log(chalk.dim('Valid providers: alchemy, moralis'));
        process.exit(1);
    }

    const config = loadConfig();
    config.apiKeys[provider as keyof ApiKeyConfig] = key;
    saveConfig(config);

    console.log(chalk.green(`✓ API key for ${provider} saved successfully`));
}

function resetConfig() {
    saveConfig(DEFAULT_CONFIG);
    console.log(chalk.green('✓ Configuration reset to defaults'));
}
