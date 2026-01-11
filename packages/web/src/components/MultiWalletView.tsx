import React from 'react';
import { MultiWalletResult } from '@fundtracer/core';

interface MultiWalletViewProps {
    result: MultiWalletResult;
}

function MultiWalletView({ result }: MultiWalletViewProps) {
    const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    return (
        <div className="stagger-children">
            {/* Correlation Score */}
            <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-lg)' }}>Multi-Wallet Analysis</h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                            Comparing {result.wallets.length} wallets for shared activity and relationships
                        </p>
                    </div>

                    <div className="risk-score">
                        <span
                            className="risk-score-value"
                            style={{ color: result.correlationScore > 60 ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}
                        >
                            {result.correlationScore}%
                        </span>
                        <div>
                            <div className="risk-score-label">Correlation</div>
                            {result.isSybilLikely && (
                                <span className="risk-badge critical">
                                    Sybil Likely
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 'var(--space-4)' }}>
                <div className="stat-card">
                    <div className="stat-label">Common Funding Sources</div>
                    <div className="stat-value" style={{ color: result.commonFundingSources.length > 0 ? 'var(--color-warning-text)' : undefined }}>
                        {result.commonFundingSources.length}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Common Destinations</div>
                    <div className="stat-value">{result.commonDestinations.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Shared Projects</div>
                    <div className="stat-value">{result.sharedProjects.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Direct Transfers</div>
                    <div className="stat-value" style={{ color: result.directTransfers.length > 0 ? 'var(--color-danger-text)' : undefined }}>
                        {result.directTransfers.length}
                    </div>
                </div>
            </div>

            {/* Common Funding Sources */}
            {result.commonFundingSources.length > 0 && (
                <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
                        Common Funding Sources
                    </h3>
                    <p style={{ color: 'var(--color-warning-text)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
                        These wallets share the same funding sources, which may indicate a common origin.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                        {result.commonFundingSources.map((addr) => (
                            <a
                                key={addr}
                                href={`https://etherscan.io/address/${addr}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    padding: 'var(--space-2) var(--space-3)',
                                    background: 'var(--color-warning-bg)',
                                    borderRadius: 'var(--radius-md)',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--color-warning-text)',
                                }}
                            >
                                {formatAddress(addr)}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Common Destinations */}
            {result.commonDestinations.length > 0 && (
                <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
                        Common Destinations
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
                        These wallets have sent funds to the same addresses.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                        {result.commonDestinations.map((addr) => (
                            <a
                                key={addr}
                                href={`https://etherscan.io/address/${addr}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    padding: 'var(--space-2) var(--space-3)',
                                    background: 'var(--color-info-bg)',
                                    borderRadius: 'var(--radius-md)',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--color-info-text)',
                                }}
                            >
                                {formatAddress(addr)}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Direct Transfers */}
            {result.directTransfers.length > 0 && (
                <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
                        Direct Transfers Between Wallets
                    </h3>
                    <div className="alert danger" style={{ marginBottom: 'var(--space-4)' }}>
                        These wallets have sent funds directly to each other
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="tx-table">
                            <thead>
                                <tr>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Value</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.directTransfers.slice(0, 10).map((tx, i) => (
                                    <tr key={i}>
                                        <td className="tx-address">{formatAddress(tx.from)}</td>
                                        <td className="tx-address">{tx.to ? formatAddress(tx.to) : '-'}</td>
                                        <td className="tx-value outgoing">{tx.valueInEth.toFixed(4)} ETH</td>
                                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                                            {new Date(tx.timestamp * 1000).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Individual Wallet Cards */}
            <div className="card">
                <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
                    Individual Wallet Summaries
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                    {result.wallets.map((wallet) => (
                        <div
                            key={wallet.wallet.address}
                            style={{
                                padding: 'var(--space-4)',
                                background: 'var(--color-bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                borderLeft: `3px solid ${wallet.riskLevel === 'critical' || wallet.riskLevel === 'high'
                                        ? 'var(--color-danger-text)'
                                        : wallet.riskLevel === 'medium'
                                            ? 'var(--color-warning-text)'
                                            : 'var(--color-success-text)'
                                    }`,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                                    {formatAddress(wallet.wallet.address)}
                                </span>
                                <span className={`risk-badge ${wallet.riskLevel}`}>
                                    {wallet.overallRiskScore} pts
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
                                <div>
                                    <div style={{ color: 'var(--color-text-muted)' }}>Balance</div>
                                    <div style={{ fontFamily: 'var(--font-mono)' }}>{wallet.wallet.balanceInEth.toFixed(4)} ETH</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--color-text-muted)' }}>Transactions</div>
                                    <div style={{ fontFamily: 'var(--font-mono)' }}>{wallet.transactions.length}</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--color-text-muted)' }}>Suspicious Flags</div>
                                    <div style={{
                                        fontFamily: 'var(--font-mono)',
                                        color: wallet.suspiciousIndicators.length > 0 ? 'var(--color-warning-text)' : 'var(--color-success-text)'
                                    }}>
                                        {wallet.suspiciousIndicators.length}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--color-text-muted)' }}>Projects</div>
                                    <div style={{ fontFamily: 'var(--font-mono)' }}>{wallet.projectsInteracted.length}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default MultiWalletView;
