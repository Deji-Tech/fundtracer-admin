import React, { useState } from 'react';
import { ChainId, CHAINS, SybilAnalysisResult } from '@fundtracer/core';
import { analyzeSybilAddresses, fetchDuneInteractors } from '../api';
import {
    Search,
    AlertTriangle,
    CheckCircle,
    Users,
    Download,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    Copy,
    Filter,
    Loader2,
    Database,
    Key,
    ArrowRight,
    ArrowLeft
} from 'lucide-react';

interface SybilDetectorProps {
    onBack?: () => void;
}

type WizardStep = 'fetch' | 'analyze' | 'results';

function SybilDetector({ onBack }: SybilDetectorProps) {
    // Wizard state
    const [step, setStep] = useState<WizardStep>('fetch');

    // Fetch step state
    const [contractAddress, setContractAddress] = useState('');
    const [chain, setChain] = useState<ChainId>('linea');
    const [fetchLimit, setFetchLimit] = useState(1000);
    const [useCustomDuneKey, setUseCustomDuneKey] = useState(false);
    const [customDuneKey, setCustomDuneKey] = useState('');
    const [fetching, setFetching] = useState(false);

    // Fetched addresses
    const [fetchedAddresses, setFetchedAddresses] = useState<string[]>([]);
    const [manualAddresses, setManualAddresses] = useState('');

    // Analysis state
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SybilAnalysisResult | null>(null);
    const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());
    const [filterMinScore, setFilterMinScore] = useState(0);

    // Parse addresses from manual input
    const parseAddresses = (text: string): string[] => {
        const cleaned = text
            .replace(/[,;\t\n\r]+/g, ' ')
            .split(' ')
            .map(s => s.trim().toLowerCase())
            .filter(s => /^0x[a-f0-9]{40}$/i.test(s));
        return [...new Set(cleaned)];
    };

    const parsedManual = parseAddresses(manualAddresses);
    const allAddresses = [...new Set([...fetchedAddresses, ...parsedManual])];

    // Fetch addresses from Dune
    const handleFetch = async () => {
        if (!contractAddress.trim()) {
            setError('Please enter a contract address');
            return;
        }
        if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
            setError('Invalid contract address format');
            return;
        }

        setFetching(true);
        setError(null);

        try {
            const response = await fetchDuneInteractors(contractAddress, chain, {
                limit: fetchLimit,
                customApiKey: useCustomDuneKey ? customDuneKey : undefined,
            });

            if (response.success && response.wallets) {
                setFetchedAddresses(response.wallets);
                setStep('analyze');
            } else {
                setError(response.error || 'Failed to fetch from Dune');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch from Dune');
        } finally {
            setFetching(false);
        }
    };

    // Analyze the addresses
    const handleAnalyze = async () => {
        if (allAddresses.length < 10) {
            setError('Need at least 10 addresses for meaningful analysis');
            return;
        }

        setAnalyzing(true);
        setError(null);
        setResult(null);

        try {
            const response = await analyzeSybilAddresses(allAddresses, chain);
            if (response.success && response.result) {
                setResult(response.result);
                setStep('results');
            } else {
                setError('Analysis failed');
            }
        } catch (err: any) {
            setError(err.message || 'Analysis failed');
        } finally {
            setAnalyzing(false);
        }
    };

    const toggleCluster = (source: string) => {
        const newExpanded = new Set(expandedClusters);
        if (newExpanded.has(source)) {
            newExpanded.delete(source);
        } else {
            newExpanded.add(source);
        }
        setExpandedClusters(newExpanded);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const exportClusters = () => {
        if (!result) return;
        const explorerUrl = CHAINS[chain].explorer;
        const data = result.flaggedClusters.map(c => ({
            fundingSource: c.fundingSource,
            fundingSourceExplorer: `${explorerUrl}/address/${c.fundingSource}`,
            label: c.fundingSourceLabel || 'Unknown',
            walletCount: c.totalWallets,
            sybilScore: c.sybilScore,
            wallets: c.wallets.map(w => ({
                address: w.address,
                addressExplorer: `${explorerUrl}/address/${w.address}`,
                fundingTxHash: w.fundingTxHash,
                fundingTxExplorer: w.fundingTxHash ? `${explorerUrl}/tx/${w.fundingTxHash}` : null,
                fundingAmount: w.fundingAmount,
            })),
        }));
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sybil-clusters-${contractAddress.slice(0, 10)}.json`;
        a.click();
    };

    const getRiskColor = (score: number) => {
        if (score >= 80) return '#ef4444';
        if (score >= 50) return '#f59e0b';
        return '#22c55e';
    };

    const getRiskLabel = (score: number) => {
        if (score >= 80) return 'High Risk';
        if (score >= 50) return 'Medium Risk';
        return 'Low Risk';
    };

    const filteredClusters = result?.clusters.filter(c => c.sybilScore >= filterMinScore) || [];
    const chainConfig = CHAINS[chain];

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
                padding: 'var(--space-4)',
                background: 'linear-gradient(135deg, rgba(40, 40, 45, 0.95) 0%, rgba(25, 25, 30, 0.95) 100%)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-1)', color: '#fff' }}>
                            Sybil Detection
                        </h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                            Find wallets sharing common funding sources
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        {step !== 'fetch' && (
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setStep('fetch');
                                    setResult(null);
                                    setError(null);
                                }}
                            >
                                <ArrowLeft size={16} /> Start Over
                            </button>
                        )}
                        {onBack && (
                            <button className="btn btn-ghost" onClick={onBack}>
                                ← Back
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Steps */}
                <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                    {['fetch', 'analyze', 'results'].map((s, i) => (
                        <div key={s} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            opacity: step === s ? 1 : 0.5
                        }}>
                            <div style={{
                                width: 24, height: 24, borderRadius: '50%',
                                background: step === s ? 'var(--color-primary)' : 'var(--color-surface-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 'var(--text-xs)', fontWeight: 600, color: 'white'
                            }}>
                                {i + 1}
                            </div>
                            <span style={{ fontSize: 'var(--text-sm)', textTransform: 'capitalize' }}>{s}</span>
                            {i < 2 && <ArrowRight size={14} style={{ marginLeft: 'var(--space-2)' }} />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step 1: Fetch from Dune */}
            {step === 'fetch' && (
                <div style={{ padding: 'var(--space-4)' }}>
                    <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>
                        <Database size={18} style={{ marginRight: 8 }} />
                        Step 1: Fetch Contract Interactors from Dune
                    </h3>

                    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
                        <div style={{ flex: 2, minWidth: 250 }}>
                            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 4, display: 'block' }}>
                                Contract Address
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder="0x..."
                                value={contractAddress}
                                onChange={(e) => setContractAddress(e.target.value)}
                                style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                            />
                        </div>

                        <div style={{ minWidth: 140 }}>
                            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 4, display: 'block' }}>
                                Chain
                            </label>
                            <select
                                className="input"
                                value={chain}
                                onChange={(e) => setChain(e.target.value as ChainId)}
                                style={{ width: '100%', height: 42 }}
                            >
                                {Object.entries(CHAINS).map(([id, config]) => (
                                    <option key={id} value={id}>{config.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ minWidth: 100 }}>
                            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 4, display: 'block' }}>
                                Limit
                            </label>
                            <input
                                type="number"
                                className="input"
                                value={fetchLimit}
                                onChange={(e) => setFetchLimit(parseInt(e.target.value) || 1000)}
                                min={100}
                                max={10000}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    {/* Custom Dune API Key Option */}
                    <div style={{
                        background: 'var(--color-surface)',
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-4)'
                    }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={useCustomDuneKey}
                                onChange={(e) => setUseCustomDuneKey(e.target.checked)}
                            />
                            <Key size={14} />
                            <span style={{ fontSize: 'var(--text-sm)' }}>Use my own Dune API key</span>
                        </label>
                        {useCustomDuneKey && (
                            <input
                                type="password"
                                className="input"
                                placeholder="Enter your Dune API key..."
                                value={customDuneKey}
                                onChange={(e) => setCustomDuneKey(e.target.value)}
                                style={{ width: '100%', marginTop: 'var(--space-2)' }}
                            />
                        )}
                    </div>

                    {error && (
                        <div className="alert danger" style={{ marginBottom: 'var(--space-4)' }}>
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    <button
                        className="btn btn-primary"
                        onClick={handleFetch}
                        disabled={fetching || !contractAddress.trim()}
                        style={{ width: '100%', height: 48 }}
                    >
                        {fetching ? (
                            <>
                                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                Fetching from Dune... (may take 20-30s)
                            </>
                        ) : (
                            <>
                                <Database size={18} />
                                Fetch Interactors from Dune
                            </>
                        )}
                    </button>

                    {/* Or paste manually */}
                    <div style={{ textAlign: 'center', margin: 'var(--space-4) 0', color: 'var(--color-text-muted)' }}>
                        — or paste addresses manually —
                    </div>

                    <textarea
                        className="input"
                        placeholder="Paste wallet addresses here (one per line, or comma-separated)..."
                        value={manualAddresses}
                        onChange={(e) => setManualAddresses(e.target.value)}
                        style={{ width: '100%', height: 100, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}
                    />
                    {parsedManual.length > 0 && (
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', marginTop: 'var(--space-2)' }}>
                            {parsedManual.length} valid addresses detected
                        </p>
                    )}

                    {parsedManual.length >= 10 && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setStep('analyze')}
                            style={{ width: '100%', height: 48, marginTop: 'var(--space-3)' }}
                        >
                            <ArrowRight size={18} />
                            Continue with {parsedManual.length} Addresses
                        </button>
                    )}
                </div>
            )}

            {/* Step 2: Review & Analyze */}
            {step === 'analyze' && (
                <div style={{ padding: 'var(--space-4)' }}>
                    <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>
                        <Users size={18} style={{ marginRight: 8 }} />
                        Step 2: Review & Analyze
                    </h3>

                    <div style={{
                        background: 'var(--color-surface)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-4)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Addresses to analyze:</span>
                            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-primary)' }}>
                                {allAddresses.length}
                            </span>
                        </div>
                        {fetchedAddresses.length > 0 && (
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                                • {fetchedAddresses.length} from Dune
                            </p>
                        )}
                        {parsedManual.length > 0 && (
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                                • {parsedManual.length} manually added
                            </p>
                        )}
                    </div>

                    {/* Add more addresses */}
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                        <label style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 8, display: 'block' }}>
                            Add more addresses (optional):
                        </label>
                        <textarea
                            className="input"
                            placeholder="Paste additional addresses..."
                            value={manualAddresses}
                            onChange={(e) => setManualAddresses(e.target.value)}
                            style={{ width: '100%', height: 80, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}
                        />
                    </div>

                    {error && (
                        <div className="alert danger" style={{ marginBottom: 'var(--space-4)' }}>
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    <button
                        className="btn btn-primary"
                        onClick={handleAnalyze}
                        disabled={analyzing || allAddresses.length < 10}
                        style={{ width: '100%', height: 48 }}
                    >
                        {analyzing ? (
                            <>
                                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                Analyzing {allAddresses.length} wallets...
                            </>
                        ) : (
                            <>
                                <Search size={18} />
                                Analyze {allAddresses.length} Wallets for Sybil Patterns
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Step 3: Results */}
            {step === 'results' && result && (
                <div style={{ padding: 'var(--space-4)' }}>
                    {/* Summary */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: 'var(--space-3)',
                        marginBottom: 'var(--space-4)'
                    }}>
                        <div style={{ background: 'var(--color-surface)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{result.totalInteractors}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Wallets Analyzed</div>
                        </div>
                        <div style={{ background: 'var(--color-surface)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{result.clusters.length}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Clusters Found</div>
                        </div>
                        <div style={{ background: 'var(--color-surface)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#ef4444' }}>{result.flaggedClusters.length}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Suspicious</div>
                        </div>
                        <div style={{ background: 'var(--color-surface)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#ef4444' }}>
                                {result.flaggedClusters.reduce((acc, c) => acc + c.totalWallets, 0)}
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Flagged Wallets</div>
                        </div>
                    </div>

                    {/* Filter & Export */}
                    <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <Filter size={14} />
                            <span style={{ fontSize: 'var(--text-sm)' }}>Min Score:</span>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={filterMinScore}
                                onChange={(e) => setFilterMinScore(parseInt(e.target.value))}
                                style={{ width: 100 }}
                            />
                            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{filterMinScore}</span>
                        </div>
                        <button className="btn btn-ghost" onClick={exportClusters}>
                            <Download size={14} /> Export
                        </button>
                    </div>

                    {/* Clusters List */}
                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                        {filteredClusters.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-muted)' }}>
                                <CheckCircle size={48} style={{ marginBottom: 'var(--space-2)', color: 'var(--color-success)' }} />
                                <p>No suspicious clusters found at this threshold!</p>
                            </div>
                        ) : (
                            filteredClusters.map((cluster) => (
                                <div
                                    key={cluster.fundingSource}
                                    style={{
                                        border: '1px solid var(--color-surface-border)',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: 'var(--space-2)',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div
                                        onClick={() => toggleCluster(cluster.fundingSource)}
                                        style={{
                                            padding: 'var(--space-3)',
                                            background: 'var(--color-surface)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                            {expandedClusters.has(cluster.fundingSource) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            <Users size={16} />
                                            <span style={{ fontWeight: 500 }}>{cluster.totalWallets} wallets</span>
                                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                                                funded by {cluster.fundingSourceLabel || cluster.fundingSource?.slice(0, 10) + '...'}
                                            </span>
                                        </div>
                                        <div style={{
                                            padding: '4px 8px',
                                            borderRadius: 'var(--radius-sm)',
                                            background: getRiskColor(cluster.sybilScore) + '20',
                                            color: getRiskColor(cluster.sybilScore),
                                            fontSize: 'var(--text-xs)',
                                            fontWeight: 600
                                        }}>
                                            {cluster.sybilScore}% - {getRiskLabel(cluster.sybilScore)}
                                        </div>
                                    </div>

                                    {expandedClusters.has(cluster.fundingSource) && (
                                        <div style={{ padding: 'var(--space-3)', borderTop: '1px solid var(--color-surface-border)' }}>
                                            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                                                <a
                                                    href={`${chainConfig.explorer}/address/${cluster.fundingSource}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}
                                                >
                                                    View Funder <ExternalLink size={12} />
                                                </a>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                                                {cluster.wallets.map(w => (
                                                    <div
                                                        key={w.address}
                                                        onClick={() => copyToClipboard(w.address)}
                                                        style={{
                                                            fontSize: 'var(--text-xs)',
                                                            fontFamily: 'var(--font-mono)',
                                                            padding: '2px 6px',
                                                            background: 'var(--color-surface)',
                                                            borderRadius: 'var(--radius-sm)',
                                                            cursor: 'pointer'
                                                        }}
                                                        title="Click to copy"
                                                    >
                                                        {w.address.slice(0, 6)}...{w.address.slice(-4)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SybilDetector;
