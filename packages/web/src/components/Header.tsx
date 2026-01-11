import React from 'react';
import { Settings, Github } from 'lucide-react';

interface HeaderProps {
    onSettingsClick?: () => void;
}

function Header({ onSettingsClick }: HeaderProps) {
    return (
        <header className="header">
            <div className="header-inner">
                <div className="logo">
                    <div className="logo-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span className="logo-text">FundTracer</span>
                    <span className="logo-subtext">by DT</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-icon"
                        aria-label="GitHub"
                    >
                        <Github size={18} />
                    </a>
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={onSettingsClick}
                        aria-label="Settings"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Header;
