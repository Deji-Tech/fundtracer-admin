#!/usr/bin/env node
/**
 * FundTracer by DT - Interactive CLI
 * Blockchain wallet forensics from your terminal.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { analyzeCommand } from './commands/analyze.js';
import { compareCommand } from './commands/compare.js';
import { configCommand } from './commands/config.js';
import { interactiveCommand } from './commands/interactive.js';
import { getApiKeys } from './utils.js';

// Gradient ASCII Art Banner
const banner = `
${chalk.hex('#00BFFF')('  ███████╗')}${chalk.hex('#1E90FF')('██╗   ██╗')}${chalk.hex('#4169E1')('███╗   ██╗')}${chalk.hex('#6A5ACD')('██████╗ ')}${chalk.hex('#9370DB')('████████╗')}${chalk.hex('#BA55D3')('██████╗ ')}${chalk.hex('#DA70D6')(' █████╗ ')}${chalk.hex('#FF69B4')(' ██████╗')}${chalk.hex('#FF1493')('███████╗')}${chalk.hex('#FF6B6B')('██████╗ ')}
${chalk.hex('#00BFFF')('  ██╔════╝')}${chalk.hex('#1E90FF')('██║   ██║')}${chalk.hex('#4169E1')('████╗  ██║')}${chalk.hex('#6A5ACD')('██╔══██╗')}${chalk.hex('#9370DB')('╚══██╔══╝')}${chalk.hex('#BA55D3')('██╔══██╗')}${chalk.hex('#DA70D6')('██╔══██╗')}${chalk.hex('#FF69B4')('██╔════╝')}${chalk.hex('#FF1493')('██╔════╝')}${chalk.hex('#FF6B6B')('██╔══██╗')}
${chalk.hex('#00BFFF')('  █████╗  ')}${chalk.hex('#1E90FF')('██║   ██║')}${chalk.hex('#4169E1')('██╔██╗ ██║')}${chalk.hex('#6A5ACD')('██║  ██║')}${chalk.hex('#9370DB')('   ██║   ')}${chalk.hex('#BA55D3')('██████╔╝')}${chalk.hex('#DA70D6')('███████║')}${chalk.hex('#FF69B4')('██║     ')}${chalk.hex('#FF1493')('█████╗  ')}${chalk.hex('#FF6B6B')('██████╔╝')}
${chalk.hex('#00BFFF')('  ██╔══╝  ')}${chalk.hex('#1E90FF')('██║   ██║')}${chalk.hex('#4169E1')('██║╚██╗██║')}${chalk.hex('#6A5ACD')('██║  ██║')}${chalk.hex('#9370DB')('   ██║   ')}${chalk.hex('#BA55D3')('██╔══██╗')}${chalk.hex('#DA70D6')('██╔══██║')}${chalk.hex('#FF69B4')('██║     ')}${chalk.hex('#FF1493')('██╔══╝  ')}${chalk.hex('#FF6B6B')('██╔══██╗')}
${chalk.hex('#00BFFF')('  ██║     ')}${chalk.hex('#1E90FF')('╚██████╔╝')}${chalk.hex('#4169E1')('██║ ╚████║')}${chalk.hex('#6A5ACD')('██████╔╝')}${chalk.hex('#9370DB')('   ██║   ')}${chalk.hex('#BA55D3')('██║  ██║')}${chalk.hex('#DA70D6')('██║  ██║')}${chalk.hex('#FF69B4')('╚██████╗')}${chalk.hex('#FF1493')('███████╗')}${chalk.hex('#FF6B6B')('██║  ██║')}
${chalk.hex('#00BFFF')('  ╚═╝     ')}${chalk.hex('#1E90FF')(' ╚═════╝ ')}${chalk.hex('#4169E1')('╚═╝  ╚═══╝')}${chalk.hex('#6A5ACD')('╚═════╝ ')}${chalk.hex('#9370DB')('   ╚═╝   ')}${chalk.hex('#BA55D3')('╚═╝  ╚═╝')}${chalk.hex('#DA70D6')('╚═╝  ╚═╝')}${chalk.hex('#FF69B4')(' ╚═════╝')}${chalk.hex('#FF1493')('╚══════╝')}${chalk.hex('#FF6B6B')('╚═╝  ╚═╝')}
`;

const subtitle = chalk.dim('                              by DT • Blockchain Wallet Forensics Tool');

/** Show provider status */
function showProviderStatus(): void {
    const keys = getApiKeys();

    console.log(chalk.bold('  Provider Status:'));

    // Core providers
    const providers = [
        { name: 'Alchemy', key: keys.alchemy, desc: 'Primary RPC' },
        { name: 'Moralis', key: keys.moralis, desc: 'Fast Funding (10x)' },
        { name: 'Dune', key: keys.dune, desc: 'Contract Analysis' },
    ];

    for (const p of providers) {
        if (p.key) {
            console.log(`  ${chalk.green('✓')} ${p.name.padEnd(10)} ${chalk.dim(p.desc)}`);
        } else {
            console.log(`  ${chalk.red('✗')} ${p.name.padEnd(10)} ${chalk.dim('Not configured')}`);
        }
    }
    console.log();
}

/** Show tips based on configuration */
function showTips(): void {
    const keys = getApiKeys();
    const hasAlchemy = !!keys.alchemy;
    const hasMoralis = !!keys.moralis;
    const hasDune = !!keys.dune;

    console.log(chalk.bold('  Quick Start:'));

    if (!hasAlchemy) {
        console.log(chalk.yellow('  ⚠ No API keys configured! Run setup first:'));
        console.log(chalk.cyan('    fundtracer config --set-key alchemy:YOUR_KEY'));
        console.log();
        console.log(chalk.dim('  Get a free Alchemy key: https://dashboard.alchemy.com/'));
        return;
    }

    console.log(`  ${chalk.gray('1.')} Analyze a wallet: ${chalk.cyan('fundtracer analyze 0x...')}`);
    console.log(`  ${chalk.gray('2.')} Compare wallets:  ${chalk.cyan('fundtracer compare 0x... 0x...')}`);
    console.log(`  ${chalk.gray('3.')} View config:      ${chalk.cyan('fundtracer config --show')}`);

    // Speed tips
    if (!hasMoralis || !hasDune) {
        console.log();
        console.log(chalk.dim('  Speed Tips:'));
        if (!hasMoralis) {
            console.log(chalk.dim('  • Add Moralis for 10x faster funding tracing'));
        }
        if (!hasDune) {
            console.log(chalk.dim('  • Add Dune for faster contract analysis'));
        }
    }
}

// Show banner when running without arguments or with interactive mode
const args = process.argv.slice(2);
const isInteractive = args.length === 0 || args[0] === 'interactive' || args[0] === 'i';

if (isInteractive && args.length === 0) {
    console.log(banner);
    console.log(subtitle);
    console.log();
    showProviderStatus();
    showTips();
    console.log();

    // Start interactive mode automatically
    interactiveCommand();
} else {
    // Show smaller banner for commands
    if (args[0] !== '--help' && args[0] !== '-h' && args[0] !== '--version' && args[0] !== '-V') {
        console.log(chalk.cyan.bold('\n  FundTracer') + chalk.dim(' by DT\n'));
    }

    const program = new Command();

    program
        .name('fundtracer')
        .description('Blockchain wallet forensics tool for tracing funds and detecting suspicious activity')
        .version('1.0.0');

    // Analyze command
    program
        .command('analyze <address>')
        .description('Analyze a single wallet address')
        .option('-c, --chain <chain>', 'Blockchain network (ethereum, linea, arbitrum, base)', 'ethereum')
        .option('-d, --depth <number>', 'Maximum depth for funding tree', '3')
        .option('-o, --output <format>', 'Output format (table, json, tree)', 'table')
        .option('--min-value <eth>', 'Minimum transaction value in ETH', '0')
        .option('--export <file>', 'Export results to file')
        .action(analyzeCommand);

    // Compare command
    program
        .command('compare <addresses...>')
        .alias('sybil')
        .description('Compare multiple wallet addresses for Sybil detection')
        .option('-c, --chain <chain>', 'Blockchain network', 'ethereum')
        .option('-d, --depth <number>', 'Maximum depth for funding tree', '2')
        .option('-o, --output <format>', 'Output format (table, json)', 'table')
        .action(compareCommand);

    // Config command
    program
        .command('config')
        .description('Configure API keys and settings')
        .option('--set-key <provider:key>', 'Set API key (alchemy, moralis, dune, etherscan...)')
        .option('--show', 'Show current configuration')
        .option('--reset', 'Reset configuration to defaults')
        .action(configCommand);

    // Interactive mode
    program
        .command('interactive')
        .alias('i')
        .description('Start interactive mode with full banner')
        .action(() => {
            console.log(banner);
            console.log(subtitle);
            console.log();
            showProviderStatus();
            showTips();
            console.log();
            interactiveCommand();
        });

    program.parse();
}

