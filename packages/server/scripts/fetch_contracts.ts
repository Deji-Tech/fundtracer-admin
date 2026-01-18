
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, '../src/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'known_contracts.json');

const EXPONENT_KEYWORDS = [
    'Owlto', 'Mendi', 'EchoDEX', 'HorizonDEX', 'PancakeSwap', 'ZeroLend',
    'iZUMi', 'ZKEX', 'Gridex', 'KyberSwap', 'Angle', 'LineaBank', 'Beefy',
    'SyncSwap', 'Stargate', 'Axelar', 'LI.FI', 'Across', 'Rhinofi', 'Zonic',
    'HAPI', 'Trusta', 'DMAIL', 'Sidus', 'Layer3', 'AlphaMind', 'Linea',
    'Velocore', 'Lynex', 'Nile', 'SpartaDex', 'Vooi', 'zkDX'
];

interface Token {
    chainId: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
}

interface DefiLlamaProtocol {
    id: string;
    name: string;
    slug: string;
    chains: string[];
    chainTvls: Record<string, number>;
    url: string;
    address?: string;
}

interface ContractData {
    name: string;
    type: 'token' | 'protocol' | 'contract';
    source: string;
    symbol?: string;
    url?: string;
    decimals?: number;
}

async function fetchLineaTokens() {
    console.log('Fetching Linea Token List...');
    try {
        const shortlistUrl = 'https://raw.githubusercontent.com/Consensys/linea-token-list/main/json/linea-mainnet-token-shortlist.json';
        const fullListUrl = 'https://raw.githubusercontent.com/Consensys/linea-token-list/main/json/linea-mainnet-token-list.json';

        const [shortlistRes, fullListRes] = await Promise.all([
            axios.get(shortlistUrl).catch(e => ({ data: { tokens: [] } })),
            axios.get(fullListUrl).catch(e => ({ data: { tokens: [] } }))
        ]);

        const tokens: Token[] = [
            ...(shortlistRes.data.tokens || []),
            ...(fullListRes.data.tokens || [])
        ];

        return tokens.filter(t => t.chainId === 59144);
    } catch (error) {
        console.error('Error fetching token list:', error);
        return [];
    }
}

async function fetchDefiLlamaProtocols() {
    console.log('Fetching DefiLlama Protocols...');
    try {
        const response = await axios.get('https://api.llama.fi/protocols');
        const allProtocols = response.data as DefiLlamaProtocol[];

        const lineaProtocols = allProtocols.filter(p =>
            p.chains.some(c => c.toLowerCase() === 'linea')
        );

        const keywordProtocols = allProtocols.filter(p => {
            if (lineaProtocols.find(lp => lp.id === p.id)) return false;
            return EXPONENT_KEYWORDS.some(k => p.name.toLowerCase().includes(k.toLowerCase()));
        });

        console.log(`Found ${lineaProtocols.length} Linea protocols.`);
        console.log(`Found ${keywordProtocols.length} additional potential Exponent apps.`);

        return [...lineaProtocols, ...keywordProtocols];
    } catch (error) {
        console.error('Error fetching DefiLlama protocols:', error);
        return [];
    }
}

async function fetchVerifiedContractsWithNames(page: number): Promise<Map<string, { name: string; compiler?: string }>> {
    const url = page === 1
        ? 'https://lineascan.build/contractsVerified'
        : `https://lineascan.build/contractsVerified/${page}`;

    const contractNames = new Map<string, { name: string; compiler?: string }>();

    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);

        $('table tbody tr').each((_, row) => {
            const cells = $(row).find('td');
            const addressLink = $(cells[0]).find('a[href*="/address/0x"]').attr('href');
            const contractName = $(cells[1]).text().trim();
            const compiler = $(cells[2]).text().trim();

            if (addressLink && contractName) {
                const match = addressLink.match(/0x[a-fA-F0-9]{40}/);
                if (match) {
                    contractNames.set(match[0].toLowerCase(), { name: contractName, compiler });
                }
            }
        });
    } catch (error: any) {
        console.error(`Error fetching page ${page}:`, error.message);
    }

    return contractNames;
}

async function fetchTokensPage(page: number): Promise<Map<string, { name: string; symbol: string }>> {
    const url = page === 1
        ? 'https://lineascan.build/tokens'
        : `https://lineascan.build/tokens?p=${page}`;

    const tokens = new Map<string, { name: string; symbol: string }>();

    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);

        $('table tbody tr').each((_, row) => {
            const cells = $(row).find('td');
            const addressLink = $(cells[1]).find('a[href*="/token/0x"]').attr('href');
            const tokenName = $(cells[1]).find('.hash-tag').text().trim();
            const tokenSymbol = $(cells[1]).find('.text-muted').text().replace(/[()]/g, '').trim();

            if (addressLink && tokenName) {
                const match = addressLink.match(/0x[a-fA-F0-9]{40}/);
                if (match) {
                    tokens.set(match[0].toLowerCase(), { name: tokenName, symbol: tokenSymbol });
                }
            }
        });
    } catch (error: any) {
        // Ignore errors
    }

    return tokens;
}

async function main() {
    console.log('=== Comprehensive Linea Contract Fetch ===\n');

    // Load existing contracts
    let contractsMap: Record<string, ContractData> = {};
    try {
        const existing = await fs.readFile(OUTPUT_FILE, 'utf-8');
        contractsMap = JSON.parse(existing);
        console.log(`Loaded ${Object.keys(contractsMap).length} existing contracts\n`);
    } catch (e) {
        console.log('Starting fresh\n');
    }

    // 1. Fetch Linea Token List
    console.log('=== Phase 1: Linea Token List ===');
    const tokens = await fetchLineaTokens();
    let added = 0;
    for (const token of tokens) {
        const addr = token.address.toLowerCase();
        if (!contractsMap[addr]) {
            contractsMap[addr] = {
                name: token.name,
                symbol: token.symbol,
                decimals: token.decimals,
                type: 'token',
                source: 'linea-token-list'
            };
            added++;
        }
    }
    console.log(`Added ${added} tokens from Linea Token List\n`);

    // 2. Fetch DefiLlama Protocols
    console.log('=== Phase 2: DefiLlama Protocols ===');
    const protocols = await fetchDefiLlamaProtocols();
    const sortedProtocols = protocols.sort((a, b) =>
        (b.chainTvls['Linea'] || 0) - (a.chainTvls['Linea'] || 0)
    );

    added = 0;
    for (const p of sortedProtocols) {
        try {
            const detailRes = await axios.get(`https://api.llama.fi/protocol/${p.slug}`, { timeout: 10000 });
            const data = detailRes.data;

            let address = data.address;
            if (typeof address === 'string') {
                if (address.includes(':')) {
                    address = address.split(':')[1];
                }
            }

            if (address && address.startsWith('0x') &&
                (data.chain === 'Linea' || data.chains?.includes('Linea') || p.chains.some(c => c.toLowerCase() === 'linea'))) {
                const key = address.toLowerCase();
                if (!contractsMap[key]) {
                    contractsMap[key] = {
                        name: p.name,
                        type: 'protocol',
                        source: 'defillama',
                        url: p.url
                    };
                    added++;
                }
            }
        } catch (err) {
            // Skip failed
        }
        await new Promise(r => setTimeout(r, 50));
    }
    console.log(`Added ${added} protocols from DefiLlama\n`);

    // 3. Fetch Lineascan Verified Contracts (all 20 pages = 500)
    console.log('=== Phase 3: Lineascan Verified Contracts ===');
    added = 0;
    for (let page = 1; page <= 20; page++) {
        const contracts = await fetchVerifiedContractsWithNames(page);
        for (const [addr, info] of contracts) {
            if (!contractsMap[addr]) {
                contractsMap[addr] = {
                    name: info.name,
                    type: 'contract',
                    source: 'lineascan-verified'
                };
                added++;
            }
        }
        process.stdout.write(`\rPage ${page}/20 - Added ${added} new`);
        await new Promise(r => setTimeout(r, 300));
    }
    console.log(`\nTotal added from verified contracts: ${added}\n`);

    // 4. Fetch Lineascan Token List (additional tokens)
    console.log('=== Phase 4: Lineascan Token Pages ===');
    added = 0;
    for (let page = 1; page <= 10; page++) {
        const tokens = await fetchTokensPage(page);
        if (tokens.size === 0) break;

        for (const [addr, info] of tokens) {
            if (!contractsMap[addr]) {
                contractsMap[addr] = {
                    name: info.name,
                    symbol: info.symbol,
                    type: 'token',
                    source: 'lineascan-tokens'
                };
                added++;
            }
        }
        process.stdout.write(`\rPage ${page} - Added ${added} tokens`);
        await new Promise(r => setTimeout(r, 300));
    }
    console.log(`\nTotal added from token pages: ${added}\n`);

    // Save
    console.log('=== Saving Results ===');
    console.log(`Total known addresses: ${Object.keys(contractsMap).length}`);
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(contractsMap, null, 2));
    console.log(`Saved to ${OUTPUT_FILE}`);
}

main();
