// ============================================================
// FundTracer CLI - Compare Command
// ============================================================

import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import {
    WalletAnalyzer,
    ChainId,
    MultiWalletResult,
} from '@fundtracer/core';
import { getApiKeys, formatAddress, formatEth } from '../utils.js';
import fs from 'fs';

interface CompareOptions {
    chain: string;
    depth: string;
    output: 'table' | 'json';
}

export async function compareCommand(addresses: string[], options: CompareOptions) {
    const chainId = options.chain as ChainId;
    const depth = parseInt(options.depth, 10);

    // Validate addresses
    for (const addr of addresses) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
            console.error(chalk.red(`✗ Invalid address format: ${addr}`));
            process.exit(1);
        }
    }

    if (addresses.length < 2) {
        console.error(chalk.red('✗ Please provide at least 2 addresses to compare'));
        process.exit(1);
    }

    const spinner = ora({
        text: `Analyzing ${addresses.length} wallets...`,
        color: 'cyan',
    }).start();

    try {
        const apiKeys = getApiKeys();
        const analyzer = new WalletAnalyzer(apiKeys, (progress) => {
            spinner.text = `${progress.stage}: ${progress.message}`;
        });

        const result = await analyzer.compareWallets(addresses, chainId, {
            treeConfig: { maxDepth: depth },
        });

        spinner.succeed('Comparison complete!');
        console.log();

        if (options.output === 'json') {
            console.log(JSON.stringify(result, null, 2));
        } else {
            outputComparisonTable(result);
        }

    } catch (error) {
        spinner.fail('Comparison failed');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
    }
}

function outputComparisonTable(result: MultiWalletResult) {
    // Correlation score
    const correlationColor = result.correlationScore > 60 ? chalk.red : chalk.green;

    console.log(chalk.bold.cyan('═══ Multi-Wallet Comparison ═══\n'));
    console.log(`Correlation Score: ${correlationColor.bold(` ${result.correlationScore}% `)}`);

    if (result.isSybilLikely) {
        console.log(chalk.bgRed.white.bold(' ⚠ SYBIL ACTIVITY LIKELY '));
    }
    console.log();

    // Summary stats
    const statsTable = new Table({
        head: ['Metric', 'Value'],
        style: { head: ['cyan'] },
    });

    statsTable.push(
        ['Wallets Analyzed', result.wallets.length.toString()],
        ['Common Funding Sources', result.commonFundingSources.length.toString()],
        ['Common Destinations', result.commonDestinations.length.toString()],
        ['Shared Projects', result.sharedProjects.length.toString()],
        ['Direct Transfers', result.directTransfers.length.toString()],
    );
    console.log(statsTable.toString());
    console.log();

    // Common funding sources
    if (result.commonFundingSources.length > 0) {
        console.log(chalk.bold.yellow('⚠ Common Funding Sources:'));
        result.commonFundingSources.forEach(addr => {
            console.log(`  ${chalk.yellow('•')} ${formatAddress(addr)}`);
        });
        console.log();
    }

    // Common destinations
    if (result.commonDestinations.length > 0) {
        console.log(chalk.bold.blue('→ Common Destinations:'));
        result.commonDestinations.forEach(addr => {
            console.log(`  ${chalk.blue('•')} ${formatAddress(addr)}`);
        });
        console.log();
    }

    // Direct transfers
    if (result.directTransfers.length > 0) {
        console.log(chalk.bold.red('↔ Direct Transfers Between Wallets:'));
        const transfersTable = new Table({
            head: ['From', 'To', 'Value'],
            style: { head: ['red'] },
        });

        result.directTransfers.slice(0, 10).forEach(tx => {
            transfersTable.push([
                formatAddress(tx.from),
                tx.to ? formatAddress(tx.to) : '-',
                `${formatEth(tx.valueInEth)} ETH`,
            ]);
        });
        console.log(transfersTable.toString());
        console.log();
    }

    // Individual wallet summaries
    console.log(chalk.bold.cyan('═══ Individual Wallet Summaries ═══\n'));

    const walletsTable = new Table({
        head: ['Address', 'Balance', 'Transactions', 'Risk Score'],
        style: { head: ['cyan'] },
    });

    result.wallets.forEach(wallet => {
        const riskColor =
            wallet.riskLevel === 'critical' || wallet.riskLevel === 'high' ? chalk.red :
                wallet.riskLevel === 'medium' ? chalk.yellow : chalk.green;

        walletsTable.push([
            formatAddress(wallet.wallet.address),
            `${formatEth(wallet.wallet.balanceInEth)} ETH`,
            wallet.transactions.length.toString(),
            riskColor(`${wallet.overallRiskScore} (${wallet.riskLevel})`),
        ]);
    });
    console.log(walletsTable.toString());
}
