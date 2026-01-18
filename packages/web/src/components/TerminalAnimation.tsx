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
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (currentIndex < terminalLogs.length && !isComplete) {
            // 30% slower: base 520ms + random 0-390ms (was 400ms + 0-300ms)
            const timer = setTimeout(() => {
                setVisibleLines(prev => [...prev, terminalLogs[currentIndex]]);
                setCurrentIndex(prev => prev + 1);
            }, 520 + Math.random() * 390);
            return () => clearTimeout(timer);
        } else if (currentIndex >= terminalLogs.length && !isComplete) {
            // Mark as complete - no repeat
            setIsComplete(true);
        }
    }, [currentIndex, isComplete]);

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'success': return '#A0A0A0'; // Light grey for success
            case 'warning': return '#888888';
            case 'info': return '#666666'; // Dark grey
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

    return (
        <div style={{
            // Glossy black/grey gradient
            background: 'linear-gradient(165deg, #2a2a2a 0%, #1a1a1a 30%, #0d0d0d 70%, #1a1a1a 100%)',
            borderRadius: '12px',
            padding: '0',
            overflow: 'hidden',
            // Glossy effect with subtle border glow
            boxShadow: `
                0 25px 50px -12px rgba(0, 0, 0, 0.7),
                0 0 0 1px rgba(255,255,255,0.08),
                inset 0 1px 0 rgba(255,255,255,0.1)
            `,
            width: '100%',
            maxWidth: '650px', // Wider
            margin: '0 auto',
        }}>
            {/* Terminal Header - Glossy ash */}
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

            {/* Terminal Content - Darker with grey text */}
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
                            animation: 'terminalFadeIn 0.4s ease forwards', // 30% slower (was 0.3s)
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
                            animation: 'terminalBlink 1.3s infinite', // 30% slower (was 1s)
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
