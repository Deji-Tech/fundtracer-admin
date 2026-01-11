import React from 'react';

function ComingSoonModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="coming-soon-bg" onClick={onClose}>
            <div className="coming-soon-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="coming-soon-title">Premium Coming Soon</h2>

                <p className="coming-soon-text">
                    Premium data providers are being integrated for deeper analytics,
                    faster queries, and advanced threat detection capabilities.
                </p>

                <div style={{
                    display: 'flex',
                    gap: 'var(--space-2)',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    marginBottom: 'var(--space-8)'
                }}>
                    {['Dune Analytics', 'Covalent', 'The Graph', 'Alchemy'].map((provider, i) => (
                        <div
                            key={provider}
                            className="animate-fade-in"
                            style={{
                                padding: 'var(--space-2) var(--space-3)',
                                background: 'var(--color-bg-tertiary)',
                                border: '1px solid var(--color-surface-border)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 'var(--text-xs)',
                                color: 'var(--color-text-muted)',
                                animationDelay: `${i * 0.05}s`,
                            }}
                        >
                            {provider}
                        </div>
                    ))}
                </div>

                <button className="btn btn-primary" onClick={onClose}>
                    Understood
                </button>
            </div>
        </div>
    );
}

export default ComingSoonModal;
