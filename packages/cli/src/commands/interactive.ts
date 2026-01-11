// ============================================================
// FundTracer CLI - Interactive Mode
// ============================================================

import chalk from 'chalk';
import inquirer from 'inquirer';
import { ChainId, getEnabledChains } from '@fundtracer/core';
import { analyzeCommand } from './analyze.js';
import { compareCommand } from './compare.js';

export async function interactiveCommand() {
    console.log(chalk.cyan('\nWelcome to FundTracer Interactive Mode!\n'));

    while (true) {
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: '🔍 Analyze a wallet', value: 'analyze' },
                    { name: '🔗 Compare multiple wallets', value: 'compare' },
                    { name: '⚙️  Configure settings', value: 'config' },
                    { name: '❌ Exit', value: 'exit' },
                ],
            },
        ]);

        if (action === 'exit') {
            console.log(chalk.dim('\nGoodbye! 👋\n'));
            process.exit(0);
        }

        switch (action) {
            case 'analyze':
                await interactiveAnalyze();
                break;
            case 'compare':
                await interactiveCompare();
                break;
            case 'config':
                await interactiveConfig();
                break;
        }

        console.log('\n');
    }
}

async function interactiveAnalyze() {
    const chains = getEnabledChains();

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'address',
            message: 'Enter wallet address:',
            validate: (input) => {
                if (/^0x[a-fA-F0-9]{40}$/.test(input)) {
                    return true;
                }
                return 'Please enter a valid Ethereum address (0x...)';
            },
        },
        {
            type: 'list',
            name: 'chain',
            message: 'Select blockchain:',
            choices: chains.map(c => ({ name: c.name, value: c.id })),
        },
        {
            type: 'list',
            name: 'depth',
            message: 'Funding tree depth:',
            choices: [
                { name: '1 - Quick scan', value: '1' },
                { name: '2 - Standard', value: '2' },
                { name: '3 - Deep (recommended)', value: '3' },
                { name: '5 - Very deep (slower)', value: '5' },
            ],
            default: '3',
        },
        {
            type: 'list',
            name: 'output',
            message: 'Output format:',
            choices: [
                { name: 'Table - Easy to read', value: 'table' },
                { name: 'Tree - Visualize funding flow', value: 'tree' },
                { name: 'JSON - Machine readable', value: 'json' },
            ],
        },
    ]);

    console.log();
    await analyzeCommand(answers.address, {
        chain: answers.chain,
        depth: answers.depth,
        output: answers.output,
    });
}

async function interactiveCompare() {
    const chains = getEnabledChains();
    const addresses: string[] = [];

    console.log(chalk.dim('Enter wallet addresses (empty to finish):\n'));

    let i = 1;
    while (true) {
        const { address } = await inquirer.prompt([
            {
                type: 'input',
                name: 'address',
                message: `Wallet #${i}:`,
                validate: (input) => {
                    if (input === '') {
                        if (addresses.length < 2) {
                            return 'Please enter at least 2 addresses';
                        }
                        return true;
                    }
                    if (/^0x[a-fA-F0-9]{40}$/.test(input)) {
                        return true;
                    }
                    return 'Please enter a valid address or leave empty to finish';
                },
            },
        ]);

        if (address === '') break;
        addresses.push(address);
        i++;
    }

    const { chain } = await inquirer.prompt([
        {
            type: 'list',
            name: 'chain',
            message: 'Select blockchain:',
            choices: chains.map(c => ({ name: c.name, value: c.id })),
        },
    ]);

    console.log();
    await compareCommand(addresses, {
        chain,
        depth: '2',
        output: 'table',
    });
}

async function interactiveConfig() {
    const chains = getEnabledChains();

    const { chain } = await inquirer.prompt([
        {
            type: 'list',
            name: 'chain',
            message: 'Select chain to configure:',
            choices: chains.map(c => ({ name: c.name, value: c.id })),
        },
    ]);

    const { apiKey } = await inquirer.prompt([
        {
            type: 'password',
            name: 'apiKey',
            message: `Enter API key for ${chain}:`,
            mask: '*',
        },
    ]);

    if (apiKey) {
        const { configCommand } = await import('./config.js');
        await configCommand({ setKey: `${chain}:${apiKey}` });
    }
}
