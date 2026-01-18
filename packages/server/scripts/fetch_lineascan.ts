
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, '../src/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'known_contracts.json');

interface ContractData {
    name: string;
    type: 'token' | 'protocol' | 'contract';
    source: string;
    symbol?: string;
    url?: string;
    decimals?: number;
}

// Fetch contract name from Lineascan address page
async function fetchContractName(address: string): Promise<{ name: string; type: 'token' | 'contract' } | null> {
    try {
        const response = await axios.get(`https://lineascan.build/address/${address}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);

        // Try to find contract name - usually in title or header
        let name = '';
        let type: 'token' | 'contract' = 'contract';

        // Check for token name (has token symbol)
        const tokenTitle = $('span.text-secondary.small').first().text().trim();
        if (tokenTitle && tokenTitle.includes('(') && tokenTitle.includes(')')) {
            // Format: "Token Name (SYMBOL)"
            name = tokenTitle.replace(/\s*\([^)]+\)\s*$/, '').trim();
            type = 'token';
        }

        // Check page title
        if (!name) {
            const pageTitle = $('title').text();
            // Format: "Contract Name | Address 0x... | Linea Mainnet"
            const titleMatch = pageTitle.match(/^([^|]+)/);
            if (titleMatch && !titleMatch[1].includes('0x')) {
                name = titleMatch[1].trim();
            }
        }

        // Check for contract name in header
        if (!name) {
            const headerName = $('h1.h5').first().text().trim();
            if (headerName && !headerName.startsWith('0x')) {
                name = headerName;
            }
        }

        // Check for verified contract name
        if (!name) {
            const contractName = $('span[data-highlight-target]').first().text().trim();
            if (contractName && !contractName.startsWith('0x')) {
                name = contractName;
            }
        }

        // Check for token info
        if (!name) {
            const tokenInfo = $('#ContentPlaceHolder1_tr_tokeninfo').text();
            if (tokenInfo) {
                const match = tokenInfo.match(/([A-Za-z0-9\s]+)\s*\(/);
                if (match) {
                    name = match[1].trim();
                    type = 'token';
                }
            }
        }

        if (name && name.length > 1 && name.length < 100) {
            return { name, type };
        }

        return null;
    } catch (error: any) {
        return null;
    }
}

// Fetch verified contracts with names from the table
async function fetchVerifiedContractsWithNames(page: number): Promise<Map<string, string>> {
    const url = page === 1
        ? 'https://lineascan.build/contractsVerified'
        : `https://lineascan.build/contractsVerified/${page}`;

    const contractNames = new Map<string, string>();

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);

        // The table has rows with address and contract name
        $('table tbody tr').each((_, row) => {
            const cells = $(row).find('td');

            // First cell usually has the address link
            const addressLink = $(cells[0]).find('a[href*="/address/0x"]').attr('href');
            // Second cell usually has the contract name
            const contractName = $(cells[1]).text().trim();

            if (addressLink && contractName) {
                const match = addressLink.match(/0x[a-fA-F0-9]{40}/);
                if (match) {
                    contractNames.set(match[0].toLowerCase(), contractName);
                }
            }
        });

        console.log(`Page ${page}: Found ${contractNames.size} contracts with names`);
    } catch (error: any) {
        console.error(`Error fetching page ${page}:`, error.message);
    }

    return contractNames;
}

async function main() {
    console.log('Fetching contracts with names from Lineascan...\n');

    // Load existing contracts
    let contractsMap: Record<string, ContractData> = {};
    try {
        const existing = await fs.readFile(OUTPUT_FILE, 'utf-8');
        contractsMap = JSON.parse(existing);
        console.log(`Loaded ${Object.keys(contractsMap).length} existing contracts`);
    } catch (e) {
        console.log('No existing contracts file, starting fresh');
    }

    // 1. Fetch all verified contracts with names from the table (500 contracts, 20 pages)
    console.log('\n=== Fetching Verified Contracts with Names ===');
    for (let page = 1; page <= 20; page++) {
        const contractNames = await fetchVerifiedContractsWithNames(page);

        for (const [address, name] of contractNames) {
            contractsMap[address] = {
                name: name,
                type: 'contract',
                source: 'lineascan-verified'
            };
        }

        await new Promise(r => setTimeout(r, 300));
    }

    // 2. Fix contracts without proper names
    console.log('\n=== Fixing Contracts Without Names ===');
    const addressesToFix = Object.entries(contractsMap)
        .filter(([_, data]) =>
            data.name === 'Linea Contract' ||
            data.name === 'Verified Contract' ||
            data.name === 'Unknown'
        )
        .map(([addr]) => addr);

    console.log(`Found ${addressesToFix.length} contracts needing name lookup`);

    let fixed = 0;
    let failed = 0;

    for (let i = 0; i < addressesToFix.length; i++) {
        const address = addressesToFix[i];

        process.stdout.write(`\rProcessing ${i + 1}/${addressesToFix.length} (Fixed: ${fixed}, Failed: ${failed})`);

        const result = await fetchContractName(address);

        if (result) {
            contractsMap[address] = {
                ...contractsMap[address],
                name: result.name,
                type: result.type
            };
            fixed++;
        } else {
            // Keep as is but mark source
            contractsMap[address].name = `Contract ${address.slice(0, 10)}...`;
            failed++;
        }

        // Rate limit - 300ms between requests
        await new Promise(r => setTimeout(r, 300));

        // Save every 100 contracts
        if ((i + 1) % 100 === 0) {
            await fs.writeFile(OUTPUT_FILE, JSON.stringify(contractsMap, null, 2));
            console.log(`\nSaved progress at ${i + 1} contracts`);
        }
    }

    console.log(`\n\nTotal fixed: ${fixed}`);
    console.log(`Total failed: ${failed}`);
    console.log(`Total known addresses: ${Object.keys(contractsMap).length}`);

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(contractsMap, null, 2));
    console.log(`Saved to ${OUTPUT_FILE}`);
}

main();
