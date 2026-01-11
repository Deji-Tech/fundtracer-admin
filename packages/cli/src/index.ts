#!/usr/bin/env node
// ============================================================
// FundTracer by DT - CLI Entry Point
// ============================================================

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { analyzeCommand } from './commands/analyze.js';
import { compareCommand } from './commands/compare.js';
import { configCommand } from './commands/config.js';
import { interactiveCommand } from './commands/interactive.js';

// Display banner
console.log(chalk.cyan(figlet.textSync('FundTracer', { font: 'Small' })));
console.log(chalk.dim('  by DT - Blockchain Wallet Analyzer\n'));

const program = new Command();

program
    .name('fundtracer')
    .description('Blockchain wallet analysis tool for tracing funds and detecting suspicious activity')
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
    .description('Compare multiple wallet addresses for links')
    .option('-c, --chain <chain>', 'Blockchain network', 'ethereum')
    .option('-d, --depth <number>', 'Maximum depth for funding tree', '2')
    .option('-o, --output <format>', 'Output format (table, json)', 'table')
    .action(compareCommand);

// Config command
program
    .command('config')
    .description('Configure API keys and settings')
    .option('--set-key <chain:key>', 'Set API key for a chain (e.g., ethereum:YOUR_KEY)')
    .option('--show', 'Show current configuration')
    .option('--reset', 'Reset configuration to defaults')
    .action(configCommand);

// Interactive mode
program
    .command('interactive')
    .alias('i')
    .description('Start interactive mode')
    .action(interactiveCommand);

program.parse();
