import React, { useState, useEffect, useCallback } from 'react';
import { searchContracts, lookupContract } from '../api';

interface ContractResult {
    address: string;
    name: string;
    type: string;
    symbol?: string;
}

interface ContractSearchProps {
    onSelect?: (address: string, name: string) => void;
    placeholder?: string;
}

function ContractSearch({ onSelect, placeholder = "Search contracts..." }: ContractSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ContractResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                // Check if it's an address first
                if (/^0x[a-fA-F0-9]{40}$/.test(query)) {
                    const res = await lookupContract(query);
                    if (res.success && res.name) {
                        setResults([{
                            address: res.address,
                            name: res.name,
                            type: res.type || 'contract',
                            symbol: res.symbol
                        }]);
                    } else {
                        setResults([{
                            address: query.toLowerCase(),
                            name: 'Unknown Contract',
                            type: 'contract'
                        }]);
                    }
                } else {
                    const res = await searchContracts(query);
                    if (res.success) {
                        setResults(res.results);
                    }
                }
            } catch (e) {
                console.error('Search error:', e);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            const selected = results[selectedIndex];
            if (selected && onSelect) {
                onSelect(selected.address, selected.name);
                setQuery('');
                setIsOpen(false);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    }, [results, selectedIndex, onSelect]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'token': return '🪙';
            case 'protocol': return '⚡';
            default: return '📄';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'token': return 'var(--color-primary)';
            case 'protocol': return 'var(--color-accent)';
            default: return 'var(--color-text-muted)';
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        setSelectedIndex(-1);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    style={{
                        width: '100%',
                        padding: 'var(--space-3)',
                        paddingRight: 'var(--space-8)',
                        background: 'var(--color-bg-elevated)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-text-primary)',
                        fontSize: 'var(--text-base)',
                    }}
                />
                {isLoading && (
                    <span style={{
                        position: 'absolute',
                        right: 'var(--space-3)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--color-text-muted)',
                    }}>
                        ⏳
                    </span>
                )}
                {!isLoading && query && (
                    <span style={{
                        position: 'absolute',
                        right: 'var(--space-3)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                    }} onClick={() => { setQuery(''); setResults([]); }}>
                        ✕
                    </span>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 'var(--space-1)',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 1000,
                }}>
                    {results.map((result, index) => (
                        <div
                            key={result.address}
                            onClick={() => {
                                if (onSelect) {
                                    onSelect(result.address, result.name);
                                }
                                setQuery('');
                                setIsOpen(false);
                            }}
                            style={{
                                padding: 'var(--space-3)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-2)',
                                background: index === selectedIndex ? 'var(--color-bg-hover)' : 'transparent',
                                borderBottom: index < results.length - 1 ? '1px solid var(--color-border)' : 'none',
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <span style={{ fontSize: '18px' }}>{getTypeIcon(result.type)}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontWeight: 500,
                                    color: 'var(--color-text-primary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {result.name}
                                </div>
                                <div style={{
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--color-text-muted)',
                                    fontFamily: 'monospace',
                                }}>
                                    {result.address.slice(0, 10)}...{result.address.slice(-8)}
                                </div>
                            </div>
                            <span style={{
                                fontSize: 'var(--text-xs)',
                                padding: 'var(--space-1) var(--space-2)',
                                background: getTypeColor(result.type),
                                color: 'white',
                                borderRadius: 'var(--radius-sm)',
                                textTransform: 'capitalize',
                            }}>
                                {result.type}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 'var(--space-1)',
                    padding: 'var(--space-4)',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text-muted)',
                    textAlign: 'center',
                    zIndex: 1000,
                }}>
                    No contracts found
                </div>
            )}
        </div>
    );
}

export default ContractSearch;
