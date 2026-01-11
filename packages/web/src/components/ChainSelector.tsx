import React from 'react';
import { ChainId, CHAINS } from '@fundtracer/core';

interface ChainSelectorProps {
    selectedChain: ChainId;
    onSelect: (chainId: ChainId) => void;
}

function ChainSelector({ selectedChain, onSelect }: ChainSelectorProps) {
    const chains = Object.values(CHAINS);

    return (
        <div className="chain-selector">
            {chains.map((chain) => (
                <button
                    key={chain.id}
                    className={`chain-btn ${selectedChain === chain.id ? 'active' : ''} ${!chain.enabled ? 'disabled' : ''}`}
                    onClick={() => onSelect(chain.id)}
                >
                    <span className="chain-dot" />
                    {chain.name}
                    {!chain.enabled && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: 'var(--space-1)' }}>
                            soon
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}

export default ChainSelector;
