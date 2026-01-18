import React, { useState, useMemo } from 'react';
import { Transaction, ChainId, TxCategory, TxStatus, CHAINS } from '@fundtracer/core';

interface TransactionListProps {
    transactions: Transaction[];
    chain: ChainId;
}

type SortField = 'timestamp' | 'value' | 'status';
type SortDirection = 'asc' | 'desc';

function TransactionList({ transactions, chain }: TransactionListProps) {
    const [sortField, setSortField] = useState<SortField>('timestamp');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [filterCategory, setFilterCategory] = useState<TxCategory | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<TxStatus | 'all'>('all');
    const [page, setPage] = useState(0);
    const pageSize = 25;

    const chainConfig = CHAINS[chain];

    const filteredAndSorted = useMemo(() => {
        let result = [...transactions];

        // Apply filters
        if (filterCategory !== 'all') {
            result = result.filter(tx => tx.category === filterCategory);
        }
        if (filterStatus !== 'all') {
            result = result.filter(tx => tx.status === filterStatus);
        }

        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'timestamp':
                    comparison = a.timestamp - b.timestamp;
                    break;
                case 'value':
                    comparison = a.valueInEth - b.valueInEth;
                    break;
                case 'status':
                    comparison = a.status.localeCompare(b.status);
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [transactions, filterCategory, filterStatus, sortField, sortDirection]);

    const paginatedTxs = filteredAndSorted.slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil(filteredAndSorted.length / pageSize);

    const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    const formatDate = (timestamp: number) => new Date(timestamp * 1000).toLocaleString();
    const formatHash = (hash: string) => `${hash.slice(0, 10)}...${hash.slice(-8)}`;

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const categories: TxCategory[] = ['transfer', 'contract_call', 'token_transfer', 'dex_swap', 'nft_transfer', 'bridge'];

    return (
        <div>
            {/* Filters */}
            <div className="filter-panel">
                <div className="filter-group">
                    <label className="filter-label">Category</label>
                    <select
                        className="filter-select"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value as TxCategory | 'all')}
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Status</label>
                    <select
                        className="filter-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as TxStatus | 'all')}
                    >
                        <option value="all">All</option>
                        <option value="success">Success</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>

                <div style={{ flex: 1 }} />

                <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', alignSelf: 'flex-end' }}>
                    Showing {filteredAndSorted.length} of {transactions.length} transactions
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table className="tx-table">
                    <thead>
                        <tr>
                            <th>Hash</th>
                            <th
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleSort('timestamp')}
                            >
                                Time {sortField === 'timestamp' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>From</th>
                            <th>To</th>
                            <th
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleSort('value')}
                            >
                                Value {sortField === 'value' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>Category</th>
                            <th
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleSort('status')}
                            >
                                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedTxs.map((tx) => (
                            <tr key={tx.hash}>
                                <td>
                                    <a
                                        href={`${chainConfig.explorer}/tx/${tx.hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="tx-hash"
                                    >
                                        {formatHash(tx.hash)}
                                    </a>
                                </td>
                                <td style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                                    {tx.timestamp > 0 ? formatDate(tx.timestamp) : <span title="Timestamp missing">-</span>}
                                </td>
                                <td>
                                    <a
                                        href={`${chainConfig.explorer}/address/${tx.from}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="tx-address"
                                        style={{ color: 'var(--color-text-primary)' }}
                                        title={tx.from}
                                    >
                                        {(tx as any).fromLabel || formatAddress(tx.from)}
                                    </a>
                                    {(tx as any).fromType === 'token' && (
                                        <span style={{ marginLeft: '4px', fontSize: '10px', color: 'var(--color-primary)' }}>🪙</span>
                                    )}
                                    {(tx as any).fromType === 'protocol' && (
                                        <span style={{ marginLeft: '4px', fontSize: '10px', color: 'var(--color-accent)' }}>⚡</span>
                                    )}
                                </td>
                                <td>
                                    {tx.to ? (
                                        <>
                                            <a
                                                href={`${chainConfig.explorer}/address/${tx.to}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="tx-address"
                                                style={{
                                                    color: (tx as any).toLabel ? 'var(--color-primary)' : 'var(--color-text-primary)',
                                                    fontWeight: (tx as any).toLabel ? 500 : 400
                                                }}
                                                title={tx.to}
                                            >
                                                {(tx as any).toLabel || formatAddress(tx.to)}
                                            </a>
                                            {(tx as any).toType === 'token' && (
                                                <span style={{ marginLeft: '4px', fontSize: '10px', color: 'var(--color-primary)' }} title="Token Contract">🪙</span>
                                            )}
                                            {(tx as any).toType === 'protocol' && (
                                                <span style={{ marginLeft: '4px', fontSize: '10px', color: 'var(--color-accent)' }} title="Protocol">⚡</span>
                                            )}
                                            {(tx as any).toType === 'contract' && (
                                                <span style={{ marginLeft: '4px', fontSize: '10px', color: 'var(--color-text-muted)' }} title="Known Contract">📄</span>
                                            )}
                                        </>
                                    ) : (
                                        <span style={{ color: 'var(--color-text-muted)' }}>Contract Creation</span>
                                    )}
                                </td>
                                <td>
                                    <span className={`tx-value ${tx.isIncoming ? 'incoming' : 'outgoing'}`}>
                                        {tx.isIncoming ? '+' : '-'}{tx.valueInEth.toFixed(4)} {
                                            (tx.category === 'token_transfer' && tx.tokenTransfers && tx.tokenTransfers.length > 0)
                                                ? tx.tokenTransfers[0].tokenSymbol
                                                : 'ETH'
                                        }
                                    </span>
                                </td>
                                <td>
                                    <span style={{
                                        fontSize: 'var(--text-xs)',
                                        padding: 'var(--space-1) var(--space-2)',
                                        background: 'var(--color-bg-elevated)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--color-text-muted)',
                                    }}>
                                        {tx.category.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td>
                                    <span className={`tx-status ${tx.status}`}>
                                        {tx.status === 'success' ? '✓' : '✗'} {tx.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    marginTop: 'var(--space-4)'
                }}>
                    <button
                        className="btn btn-ghost"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                    >
                        ← Prev
                    </button>

                    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                        Page {page + 1} of {totalPages}
                    </span>

                    <button
                        className="btn btn-ghost"
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}

export default TransactionList;
