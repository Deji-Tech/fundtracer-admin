import React, { useState, useEffect } from 'react';

// Hook to detect mobile devices
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
}

interface LogLine {
    time: string;
    message: string;
    shortMessage?: string; // For mobile
    status?: 'success' | 'warning' | 'info' | 'loading';
}

const terminalLogs: LogLine[] = [
    { time: '00:01.23', message: 'Connecting to blockchain...', shortMessage: 'Connecting...', status: 'info' },
    { time: '00:01.45', message: 'Fetching wallet transactions', shortMessage: 'Fetching txs', status: 'loading' },
    { time: '00:02.10', message: 'Found 847 transactions', shortMessage: '847 txs found', status: 'success' },
    { time: '00:02.34', message: 'Building funding tree...', shortMessage: 'Building tree', status: 'loading' },
    { time: '00:03.01', message: 'Identified 12 funding sources', shortMessage: '12 sources', status: 'success' },
    { time: '00:03.56', message: 'Running sybil detection...', shortMessage: 'Sybil check', status: 'loading' },
    { time: '00:04.23', message: 'Cross-referencing known entities', shortMessage: 'Cross-ref', status: 'info' },
    { time: '00:04.89', message: 'Matched: Binance Hot Wallet', shortMessage: 'Binance ✓', status: 'success' },
    { time: '00:05.12', message: 'Analyzing activity patterns', shortMessage: 'Patterns', status: 'loading' },
    { time: '00:05.67', message: 'Activity period: 423 days', shortMessage: '423 days', status: 'success' },
    { time: '00:06.01', message: 'Risk score: LOW', shortMessage: 'Risk: LOW', status: 'success' },
    { time: '00:06.34', message: 'Analysis complete ✓', shortMessage: 'Complete ✓', status: 'success' },
];

function TerminalAnimation() {
    const [visibleLines, setVisibleLines] = useState<LogLine[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const isMobile = useIsMobile();

    useEffect(() => {
        if (currentIndex < terminalLogs.length && !isComplete) {
            const timer = setTimeout(() => {
                setVisibleLines(prev => [...prev, terminalLogs[currentIndex]]);
                setCurrentIndex(prev => prev + 1);
            }, isMobile ? 350 : 520 + Math.random() * 390);
            return () => clearTimeout(timer);
        } else if (currentIndex >= terminalLogs.length && !isComplete) {
            setIsComplete(true);
        }
    }, [currentIndex, isComplete, isMobile]);

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'success': return '#A0A0A0';
            case 'warning': return '#888888';
            case 'info': return '#666666';
            case 'loading': return '#909090';
            default: return '#707070';
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

    // Mobile version - compact and simpler
    if (isMobile) {
        return (
            <div style={{
                background: 'linear-gradient(165deg, #252525 0%, #1a1a1a 50%, #0d0d0d 100%)',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 15px 30px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.06)',
                width: '100%',
                maxWidth: '320px',
                margin: '0 auto',
            }}>
                {/* Compact Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: 'rgba(50,50,50,0.3)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F56' }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27C93F' }} />
                    </div>
                    <div style={{
                        flex: 1,
                        textAlign: 'center',
                        fontSize: '10px',
                        color: 'rgba(140,140,140,0.7)',
                        fontFamily: 'monospace',
                    }}>
                        analysis
                    </div>
                </div>

                {/* Compact Content */}
                <div style={{
                    padding: '12px 14px',
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '11px',
                    lineHeight: '1.7',
                    minHeight: '140px',
                    maxHeight: '180px',
                    overflowY: 'auto',
                }}>
                    {visibleLines.map((line, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                gap: '8px',
                                opacity: 0,
                                animation: 'terminalFadeIn 0.3s ease forwards',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <span style={{ color: getStatusColor(line.status), minWidth: '12px' }}>
                                {getStatusPrefix(line.status)}
                            </span>
                            <span style={{ color: 'rgba(180,180,180,0.9)' }}>
                                {line.shortMessage || line.message}
                            </span>
                        </div>
                    ))}
                    {!isComplete && currentIndex < terminalLogs.length && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                            <span style={{ color: '#777', animation: 'terminalBlink 1s infinite' }}>▋</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Desktop version - full featured
    return (
        <div style={{
            background: 'linear-gradient(165deg, #2a2a2a 0%, #1a1a1a 30%, #0d0d0d 70%, #1a1a1a 100%)',
            borderRadius: '12px',
            padding: '0',
            overflow: 'hidden',
            boxShadow: `
                0 25px 50px -12px rgba(0, 0, 0, 0.7),
                0 0 0 1px rgba(255,255,255,0.08),
                inset 0 1px 0 rgba(255,255,255,0.1)
            `,
            width: '100%',
            maxWidth: '650px',
            margin: '0 auto',
        }}>
            {/* Terminal Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 18px',
                background: 'linear-gradient(180deg, rgba(70,70,70,0.4) 0%, rgba(40,40,40,0.3) 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F56', boxShadow: '0 0 4px rgba(255,95,86,0.4)' }} />
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFBD2E', boxShadow: '0 0 4px rgba(255,189,46,0.4)' }} />
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27C93F', boxShadow: '0 0 4px rgba(39,201,63,0.4)' }} />
                </div>
                <div style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: '12px',
                    color: 'rgba(160,160,160,0.7)',
                    fontFamily: 'ui-monospace, monospace',
                    letterSpacing: '0.5px',
                }}>
                    fundtracer — analysis
                </div>
            </div>

            {/* Terminal Content */}
            <div style={{
                padding: '20px 24px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '13px',
                lineHeight: '2',
                minHeight: '220px',
                maxHeight: '280px',
                overflowY: 'auto',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 100%)',
            }}>
                {visibleLines.map((line, index) => (
                    <div
                        key={index}
                        style={{
                            display: 'flex',
                            gap: '16px',
                            opacity: 0,
                            animation: 'terminalFadeIn 0.4s ease forwards',
                        }}
                    >
                        <span style={{ color: 'rgba(120,120,120,0.6)', minWidth: '95px' }}>
                            {line.time}
                        </span>
                        <span style={{ color: getStatusColor(line.status), minWidth: '14px' }}>
                            {getStatusPrefix(line.status)}
                        </span>
                        <span style={{ color: 'rgba(200,200,200,0.9)' }}>
                            {line.message}
                        </span>
                    </div>
                ))}
                {!isComplete && currentIndex < terminalLogs.length && (
                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        marginTop: '4px',
                    }}>
                        <span style={{ color: 'rgba(120,120,120,0.6)', minWidth: '95px' }}>
                            --:--:--.---
                        </span>
                        <span style={{
                            color: '#888888',
                            animation: 'terminalBlink 1.3s infinite',
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
