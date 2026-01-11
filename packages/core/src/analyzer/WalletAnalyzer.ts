// ============================================================
// FundTracer by DT - Main Wallet Analyzer
// ============================================================

import { BaseProvider } from '../providers/BaseProvider.js';
import { FundingTreeBuilder } from './FundingTreeBuilder.js';
import { SuspiciousDetector } from './SuspiciousDetector.js';
import {
    AnalysisResult,
    WalletInfo,
    Transaction,
    FundingNode,
    FundingTreeConfig,
    FilterOptions,
    ProgressCallback,
    ProjectInteraction,
    AnalysisSummary,
    MultiWalletResult,
    ChainId,
} from '../types.js';
import { ProviderFactory, ApiKeyConfig } from '../providers/ProviderFactory.js';

// Known contract addresses for project identification
const KNOWN_PROJECTS: Record<string, { name: string; category: ProjectInteraction['category'] }> = {
    '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { name: 'Uniswap V2 Router', category: 'defi' },
    '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': { name: 'Uniswap V3 Router', category: 'defi' },
    '0xe592427a0aece92de3edee1f18e0157c05861564': { name: 'Uniswap V3 Router', category: 'defi' },
    '0x1111111254eeb25477b68fb85ed929f73a960582': { name: '1inch Router', category: 'defi' },
    '0xdef1c0ded9bec7f1a1670819833240f027b25eff': { name: '0x Exchange Proxy', category: 'defi' },
    '0x881d40237659c251811cec9c364ef91dc08d300c': { name: 'Metamask Swap', category: 'defi' },
    '0x00000000006c3852cbef3e08e8df289169ede581': { name: 'OpenSea Seaport', category: 'nft' },
    '0x74312363e45dcaba76c59ec49a7aa8a65a67eed3': { name: 'X2Y2', category: 'nft' },
    '0x59728544b08ab483533076417fbbb2fd0b17ce3a': { name: 'LooksRare', category: 'nft' },
    '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad': { name: 'Uniswap Universal Router', category: 'defi' },
};

export class WalletAnalyzer {
    private providerFactory: ProviderFactory;
    private onProgress?: ProgressCallback;

    constructor(apiKeys: ApiKeyConfig, onProgress?: ProgressCallback) {
        this.providerFactory = new ProviderFactory(apiKeys);
        this.onProgress = onProgress;
    }

    /** Analyze a single wallet */
    async analyze(
        address: string,
        chainId: ChainId,
        options: {
            treeConfig?: Partial<FundingTreeConfig>;
            filters?: FilterOptions;
        } = {}
    ): Promise<AnalysisResult> {
        const provider = this.providerFactory.getProvider(chainId);
        const normalizedAddr = address.toLowerCase();

        // Progress update
        this.reportProgress('Fetching wallet info', 1, 6, 'Getting basic wallet information...');

        // Get wallet info
        const walletInfo = await provider.getWalletInfo(normalizedAddr);

        // Progress update
        this.reportProgress('Fetching transactions', 2, 6, 'Retrieving transaction history...');

        // Get all transactions
        const [normalTxs, internalTxs, tokenTransfers] = await Promise.all([
            provider.getTransactions(normalizedAddr, options.filters),
            provider.getInternalTransactions(normalizedAddr, options.filters),
            provider.getTokenTransfers(normalizedAddr, options.filters),
        ]);

        // Combine and dedupe transactions
        const allTxs = this.mergeTransactions(normalTxs, internalTxs);

        // Progress update
        this.reportProgress('Building funding tree', 3, 6, 'Tracing funding sources...');

        // Build funding trees
        const treeBuilder = new FundingTreeBuilder(provider, this.onProgress);
        const [fundingSources, fundingDestinations] = await Promise.all([
            treeBuilder.buildSourceTree(normalizedAddr, options.treeConfig),
            treeBuilder.buildDestinationTree(normalizedAddr, options.treeConfig),
        ]);

        // Progress update
        this.reportProgress('Detecting suspicious activity', 4, 6, 'Analyzing patterns...');

        // Detect suspicious activity
        const detector = new SuspiciousDetector();
        const walletAge = walletInfo.firstTxTimestamp
            ? Math.floor((Date.now() / 1000 - walletInfo.firstTxTimestamp) / 86400)
            : undefined;

        const suspiciousIndicators = detector.detect({
            transactions: allTxs,
            fundingSources,
            fundingDestinations,
            walletAge,
        });

        const overallRiskScore = detector.calculateRiskScore(suspiciousIndicators);
        const riskLevel = detector.getRiskLevel(overallRiskScore);

        // Progress update
        this.reportProgress('Analyzing projects', 5, 6, 'Identifying protocol interactions...');

        // Identify project interactions
        const projectsInteracted = this.identifyProjects(allTxs);

        // Group same-block transactions
        const sameBlockTransactions = detector.groupByBlock(allTxs);

        // Progress update
        this.reportProgress('Generating summary', 6, 6, 'Finalizing analysis...');

        // Generate summary
        const summary = this.generateSummary(allTxs, fundingSources, fundingDestinations);

        return {
            wallet: walletInfo,
            transactions: allTxs,
            fundingSources,
            fundingDestinations,
            suspiciousIndicators,
            overallRiskScore,
            riskLevel,
            projectsInteracted,
            sameBlockTransactions,
            summary,
        };
    }

    /** Compare multiple wallets */
    async compareWallets(
        addresses: string[],
        chainId: ChainId,
        options: {
            treeConfig?: Partial<FundingTreeConfig>;
        } = {}
    ): Promise<MultiWalletResult> {
        // Analyze each wallet
        const analyses = await Promise.all(
            addresses.map(addr => this.analyze(addr, chainId, options))
        );

        // Find common funding sources
        const allSourceAddresses = analyses.map(a =>
            this.flattenTreeAddresses(a.fundingSources)
        );
        const commonFundingSources = this.findCommonElements(allSourceAddresses);

        // Find common destinations
        const allDestAddresses = analyses.map(a =>
            this.flattenTreeAddresses(a.fundingDestinations)
        );
        const commonDestinations = this.findCommonElements(allDestAddresses);

        // Find shared projects
        const allProjects = analyses.flatMap(a => a.projectsInteracted);
        const projectCounts = new Map<string, number>();
        for (const p of allProjects) {
            projectCounts.set(p.contractAddress, (projectCounts.get(p.contractAddress) || 0) + 1);
        }
        const sharedProjects = allProjects.filter(
            p => projectCounts.get(p.contractAddress)! === addresses.length
        );

        // Find direct transfers between wallets
        const normalizedAddrs = addresses.map(a => a.toLowerCase());
        const directTransfers = analyses.flatMap(a =>
            a.transactions.filter(tx =>
                normalizedAddrs.includes(tx.from) && tx.to && normalizedAddrs.includes(tx.to)
            )
        );

        // Calculate correlation score
        const correlationScore = this.calculateCorrelation(
            commonFundingSources.length,
            commonDestinations.length,
            sharedProjects.length,
            directTransfers.length
        );

        return {
            wallets: analyses,
            commonFundingSources,
            commonDestinations,
            sharedProjects: this.dedupeProjects(sharedProjects),
            directTransfers,
            correlationScore,
            isSybilLikely: correlationScore > 60,
        };
    }

    /** Merge and dedupe transactions */
    private mergeTransactions(
        normalTxs: Transaction[],
        internalTxs: Transaction[]
    ): Transaction[] {
        const txMap = new Map<string, Transaction>();

        for (const tx of normalTxs) {
            txMap.set(tx.hash, tx);
        }

        for (const tx of internalTxs) {
            if (!txMap.has(tx.hash)) {
                txMap.set(tx.hash, tx);
            }
        }

        return Array.from(txMap.values())
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    /** Identify project interactions */
    private identifyProjects(transactions: Transaction[]): ProjectInteraction[] {
        const projectMap = new Map<string, ProjectInteraction>();

        for (const tx of transactions) {
            if (!tx.to) continue;
            const addr = tx.to.toLowerCase();

            // Check known projects
            const known = KNOWN_PROJECTS[addr];

            // Only track contract interactions
            if (tx.category === 'contract_call' || known) {
                const existing = projectMap.get(addr);

                if (existing) {
                    existing.interactionCount++;
                    existing.totalValueInEth += tx.valueInEth;
                    existing.lastInteraction = Math.max(existing.lastInteraction, tx.timestamp);
                } else {
                    projectMap.set(addr, {
                        contractAddress: addr,
                        projectName: known?.name,
                        category: known?.category || 'unknown',
                        interactionCount: 1,
                        totalValueInEth: tx.valueInEth,
                        firstInteraction: tx.timestamp,
                        lastInteraction: tx.timestamp,
                    });
                }
            }
        }

        return Array.from(projectMap.values())
            .sort((a, b) => b.interactionCount - a.interactionCount);
    }

    /** Generate analysis summary */
    private generateSummary(
        transactions: Transaction[],
        sources: FundingNode,
        destinations: FundingNode
    ): AnalysisSummary {
        const successfulTxs = transactions.filter(tx => tx.status === 'success').length;
        const failedTxs = transactions.filter(tx => tx.status === 'failed').length;

        const totalSent = transactions
            .filter(tx => !tx.isIncoming)
            .reduce((sum, tx) => sum + tx.valueInEth, 0);

        const totalReceived = transactions
            .filter(tx => tx.isIncoming)
            .reduce((sum, tx) => sum + tx.valueInEth, 0);

        const uniqueAddresses = new Set<string>();
        for (const tx of transactions) {
            uniqueAddresses.add(tx.from);
            if (tx.to) uniqueAddresses.add(tx.to);
        }

        const timestamps = transactions.map(tx => tx.timestamp).filter(t => t > 0);
        const activityPeriodDays = timestamps.length > 1
            ? Math.ceil((Math.max(...timestamps) - Math.min(...timestamps)) / 86400)
            : 1;

        return {
            totalTransactions: transactions.length,
            successfulTxs,
            failedTxs,
            totalValueSentEth: totalSent,
            totalValueReceivedEth: totalReceived,
            uniqueInteractedAddresses: uniqueAddresses.size,
            topFundingSources: sources.children
                .slice(0, 5)
                .map(c => ({ address: c.address, valueEth: c.totalValueInEth })),
            topFundingDestinations: destinations.children
                .slice(0, 5)
                .map(c => ({ address: c.address, valueEth: c.totalValueInEth })),
            activityPeriodDays,
            averageTxPerDay: transactions.length / activityPeriodDays,
        };
    }

    /** Flatten tree addresses */
    private flattenTreeAddresses(node: FundingNode): string[] {
        const addresses = [node.address];
        for (const child of node.children) {
            addresses.push(...this.flattenTreeAddresses(child));
        }
        return addresses;
    }

    /** Find common elements across arrays */
    private findCommonElements(arrays: string[][]): string[] {
        if (arrays.length === 0) return [];
        if (arrays.length === 1) return arrays[0];

        return arrays[0].filter(item =>
            arrays.every(arr => arr.includes(item))
        );
    }

    /** Calculate correlation score */
    private calculateCorrelation(
        commonSources: number,
        commonDests: number,
        sharedProjects: number,
        directTransfers: number
    ): number {
        let score = 0;

        score += Math.min(30, commonSources * 10);
        score += Math.min(25, commonDests * 8);
        score += Math.min(25, sharedProjects * 5);
        score += Math.min(20, directTransfers * 4);

        return Math.min(100, score);
    }

    /** Dedupe projects by address */
    private dedupeProjects(projects: ProjectInteraction[]): ProjectInteraction[] {
        const seen = new Set<string>();
        return projects.filter(p => {
            if (seen.has(p.contractAddress)) return false;
            seen.add(p.contractAddress);
            return true;
        });
    }

    /** Report progress */
    private reportProgress(stage: string, current: number, total: number, message: string): void {
        if (this.onProgress) {
            this.onProgress({ stage, current, total, message });
        }
    }
}
