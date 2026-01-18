import React, { useState, useEffect } from 'react';

interface LogLine {
    time: string;
    message: string;
    status?: 'success' | 'warning' | 'info' | 'loading';
}

const terminalLogs: LogLine[] = [
    { time: '00:00:01.234', message: 'Connecting to blockchain...', status: 'info' },
    { time: '00:00:01.456', message: 'Fetching wallet transactions', status: 'loading' },
    { time: '00:00:02.103', message: 'Found 847 transactions', status: 'success' },
    { time: '00:00:02.345', message: 'Building funding tree...', status: 'loading' },
    { time: '00:00:03.012', message: 'Identified 12 funding sources', status: 'success' },
    { time: '00:00:03.567', message: 'Running sybil detection...', status: 'loading' },
    { time: '00:00:04.234', message: 'Cross-referencing known entities', status: 'info' },
    { time: '00:00:04.891', message: 'Matched: Binance Hot Wallet', status: 'success' },
    { time: '00:00:05.123', message: 'Analyzing activity patterns', status: 'loading' },
    { time: '00:00:05.678', message: 'Activity period: 423 days', status: 'success' },
    { time: '00:00:06.012', message: 'Risk score: LOW', status: 'success' },
    { time: '00:00:06.345', message: 'Analysis complete ✓', status: 'success' },
];

function TerminalAnimation() {
    const [visibleLines, setVisibleLines] = useState<LogLine[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < terminalLogs.length) {
            const timer = setTimeout(() => {
                setVisibleLines(prev => [...prev, terminalLogs[currentIndex]]);
                setCurrentIndex(prev => prev + 1);
            }, 400 + Math.random() * 300);
            return () => clearTimeout(timer);
        } else {
            // Reset after a pause
            const resetTimer = setTimeout(() => {
                setVisibleLines([]);
                setCurrentIndex(0);
            }, 3000);
            return () => clearTimeout(resetTimer);
        }
    }, [currentIndex]);

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'success': return '#10B981';
            case 'warning': return '#F59E0B';
            case 'info': return '#6B7280';
            case 'loading': return '#3B82F6';
            default: return '#9CA3AF';
        }
    };

    const getStatusPrefix = (status?: string) => {
        switch (status) {
            case 'success': return '✓';
            case 'warning': return '⚠';
            case 'info': return '→';
            case 'loading': return '◌';
            default: return ' ';
        }
    };

    return (
        <div style={{
            background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
            borderRadius: '12px',
            padding: '0',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto',
        }}>
            {/* Terminal Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F56' }} />
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFBD2E' }} />
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27C93F' }} />
                </div>
                <div style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.5)',
                    fontFamily: 'ui-monospace, monospace',
                }}>
                    fundtracer — analysis
                </div>
            </div>

            {/* Terminal Content */}
            <div style={{
                padding: '16px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '12px',
                lineHeight: '1.8',
                minHeight: '200px',
                maxHeight: '260px',
                overflowY: 'auto',
            }}>
                {visibleLines.map((line, index) => (
                    <div
                        key={index}
                        style={{
                            display: 'flex',
                            gap: '12px',
                            opacity: 0,
                            animation: 'terminalFadeIn 0.3s ease forwards',
                        }}
                    >
                        <span style={{ color: 'rgba(255,255,255,0.3)', minWidth: '85px' }}>
                            {line.time}
                        </span>
                        <span style={{ color: getStatusColor(line.status), minWidth: '12px' }}>
                            {getStatusPrefix(line.status)}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.85)' }}>
                            {line.message}
                        </span>
                    </div>
                ))}
                {currentIndex < terminalLogs.length && (
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginTop: '4px',
                    }}>
                        <span style={{ color: 'rgba(255,255,255,0.3)', minWidth: '85px' }}>
                            --:--:--.---
                        </span>
                        <span style={{
                            color: '#3B82F6',
                            animation: 'terminalBlink 1s infinite',
                        }}>
                            ▋
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TerminalAnimation;
