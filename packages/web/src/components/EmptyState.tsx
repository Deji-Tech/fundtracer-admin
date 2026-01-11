import React from 'react';
import { Search } from 'lucide-react';

function EmptyState() {
    return (
        <div className="card">
            <div className="empty-state">
                <div className="empty-state-icon">
                    <Search size={32} />
                </div>
                <h3 className="empty-state-title">No Analysis Yet</h3>
                <p className="empty-state-text">
                    Enter a wallet or contract address above to trace funding sources,
                    analyze transactions, and detect suspicious activity patterns.
                </p>
            </div>
        </div>
    );
}

export default EmptyState;
