import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FundingNode, CHAINS, ChainId } from '@fundtracer/core';
import * as d3 from 'd3';
import {
    Search,
    Maximize2,
    Minimize2,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Download,
    Copy,
    ChevronDown,
    ChevronRight,
    Target,
    Layers,
    Eye,
    EyeOff,
    Move,
    MousePointer2
} from 'lucide-react';

interface FundingTreeProps {
    node: FundingNode;
    direction: 'source' | 'destination';
    chain?: ChainId;
    title?: string;
}

interface TreeNode extends d3.HierarchyPointNode<FundingNode> {
    _collapsed?: boolean;
    _highlighted?: boolean;
    _filtered?: boolean;
}

function FundingTree({ node, direction, chain = 'ethereum', title }: FundingTreeProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

    // State
    const [selectedNode, setSelectedNode] = useState<FundingNode | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FundingNode[]>([]);
    const [highlightedAddress, setHighlightedAddress] = useState<string | null>(null);
    const [showMinimap, setShowMinimap] = useState(true);
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const [showLabels, setShowLabels] = useState(true);
    const [showValues, setShowValues] = useState(true);
    const [filterMinValue, setFilterMinValue] = useState(0);
    const [hoveredNode, setHoveredNode] = useState<FundingNode | null>(null);

    const chainConfig = CHAINS[chain];

    // Flatten tree for searching
    const flattenTree = useCallback((n: FundingNode, depth = 0): FundingNode[] => {
        const result: FundingNode[] = [{ ...n, depth }];
        for (const child of n.children) {
            result.push(...flattenTree(child, depth + 1));
        }
        return result;
    }, []);

    // Search handler
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            setHighlightedAddress(null);
            return;
        }

        const allNodes = flattenTree(node);
        const matches = allNodes.filter(n =>
            n.address.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(matches);
    }, [node, flattenTree]);

    // Find path to address
    const findPathToAddress = useCallback((target: string, current: FundingNode, path: FundingNode[] = []): FundingNode[] | null => {
        const currentPath = [...path, current];
        if (current.address.toLowerCase() === target.toLowerCase()) {
            return currentPath;
        }
        for (const child of current.children) {
            const found = findPathToAddress(target, child, currentPath);
            if (found) return found;
        }
        return null;
    }, []);

    // Highlight and focus on address
    const focusOnAddress = useCallback((address: string) => {
        setHighlightedAddress(address);
        setSearchQuery('');
        setSearchResults([]);

        // Expand all nodes in path
        const path = findPathToAddress(address, node);
        if (path) {
            const newCollapsed = new Set(collapsedNodes);
            path.forEach(n => newCollapsed.delete(n.address));
            setCollapsedNodes(newCollapsed);
        }

        // Zoom to node after render
        setTimeout(() => {
            if (gRef.current && svgRef.current) {
                const targetNode = gRef.current.selectAll('.tree-node')
                    .filter((d: any) => d.data.address.toLowerCase() === address.toLowerCase());

                if (!targetNode.empty()) {
                    const nodeData = targetNode.datum() as TreeNode;
                    const svg = d3.select(svgRef.current);
                    const width = containerRef.current?.clientWidth || 800;
                    const height = isFullscreen ? window.innerHeight - 120 : 450;

                    svg.transition()
                        .duration(750)
                        .call(
                            zoomRef.current!.transform,
                            d3.zoomIdentity
                                .translate(width / 2, height / 2)
                                .scale(1.5)
                                .translate(-nodeData.y!, -nodeData.x!)
                        );
                }
            }
        }, 100);
    }, [node, collapsedNodes, findPathToAddress, isFullscreen]);

    // Toggle node collapse
    const toggleCollapse = useCallback((address: string) => {
        setCollapsedNodes(prev => {
            const next = new Set(prev);
            if (next.has(address)) {
                next.delete(address);
            } else {
                next.add(address);
            }
            return next;
        });
    }, []);

    // Zoom controls
    const handleZoom = useCallback((factor: number) => {
        if (svgRef.current && zoomRef.current) {
            const svg = d3.select(svgRef.current);
            svg.transition().duration(300).call(zoomRef.current.scaleBy, factor);
        }
    }, []);

    const handleResetZoom = useCallback(() => {
        if (svgRef.current && zoomRef.current) {
            const svg = d3.select(svgRef.current);
            svg.transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity);
            setZoomLevel(1);
        }
    }, []);

    // Export tree as PNG
    const handleExport = useCallback(() => {
        if (!svgRef.current) return;

        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width * 2;
            canvas.height = img.height * 2;
            ctx!.fillStyle = '#0a0a0a';
            ctx!.fillRect(0, 0, canvas.width, canvas.height);
            ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);

            const link = document.createElement('a');
            link.download = `fundtrace-${direction}-tree.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }, [direction]);

    // Copy address
    const copyAddress = useCallback((address: string) => {
        navigator.clipboard.writeText(address);
    }, []);

    // Main D3 effect
    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = isFullscreen ? window.innerHeight - 120 : 450;
        const margin = { top: 40, right: 180, bottom: 40, left: 180 };

        // Clear previous
        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)
            .style('background', 'radial-gradient(ellipse at center, #111 0%, #0a0a0a 100%)');

        // Create gradient for links
        const defs = svg.append('defs');

        const gradient = defs.append('linearGradient')
            .attr('id', `link-gradient-${direction}`)
            .attr('gradientUnits', 'userSpaceOnUse');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', direction === 'source' ? '#22c55e' : '#ef4444');

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#333');

        // Create container for zoom
        const g = svg.append('g')
            .attr('class', 'tree-container')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        gRef.current = g;

        // Filter collapsed nodes
        const filterCollapsed = (n: FundingNode): FundingNode => {
            if (collapsedNodes.has(n.address)) {
                return { ...n, children: [] };
            }
            return { ...n, children: n.children.map(filterCollapsed) };
        };

        const filteredNode = filterCollapsed(node);

        // Create hierarchy
        const root = d3.hierarchy(filteredNode);

        // Tree layout
        const treeLayout = d3.tree<FundingNode>()
            .size([height - margin.top - margin.bottom, width - margin.left - margin.right])
            .separation((a, b) => (a.parent === b.parent ? 1 : 1.5));

        const treeData = treeLayout(root);

        // Draw links with animation
        g.selectAll('.tree-link')
            .data(treeData.links())
            .join('path')
            .attr('class', 'tree-link')
            .attr('d', d3.linkHorizontal<any, any>()
                .x(d => d.y)
                .y(d => d.x)
            )
            .style('fill', 'none')
            .style('stroke', (d: any) => {
                if (highlightedAddress && (
                    d.source.data.address === highlightedAddress ||
                    d.target.data.address === highlightedAddress
                )) {
                    return direction === 'source' ? '#22c55e' : '#ef4444';
                }
                return '#2a2a2a';
            })
            .style('stroke-width', (d: any) => {
                const value = d.target.data.totalValueInEth;
                if (value < filterMinValue) return 0;
                return Math.max(1.5, Math.min(4, Math.log(value + 1) * 1.5));
            })
            .style('stroke-opacity', (d: any) =>
                highlightedAddress && d.target.data.address !== highlightedAddress ? 0.3 : 0.8
            )
            .style('transition', 'all 0.3s ease');

        // Draw nodes
        const nodes = g.selectAll('.tree-node')
            .data(treeData.descendants())
            .join('g')
            .attr('class', 'tree-node')
            .attr('transform', d => `translate(${d.y}, ${d.x})`)
            .style('cursor', 'pointer')
            .style('opacity', (d: any) => {
                if (d.data.totalValueInEth < filterMinValue && d.depth > 0) return 0.2;
                if (highlightedAddress && d.data.address !== highlightedAddress) return 0.5;
                return 1;
            });

        // Node outer glow for highlighted
        nodes.filter((d: any) => d.data.address === highlightedAddress)
            .append('circle')
            .attr('r', 20)
            .style('fill', 'none')
            .style('stroke', direction === 'source' ? '#22c55e' : '#ef4444')
            .style('stroke-width', 2)
            .style('stroke-opacity', 0.5)
            .style('filter', 'blur(4px)');

        // Node circles with gradient fills
        nodes.append('circle')
            .attr('r', (d: any) => {
                const baseSize = Math.max(6, Math.min(14, d.data.totalValueInEth * 2 + 6));
                return d.data.address === highlightedAddress ? baseSize * 1.3 : baseSize;
            })
            .style('fill', (d: any) => {
                if (d.depth === 0) return '#1a1a1a';
                if (d.data.address === highlightedAddress) return direction === 'source' ? '#22c55e' : '#ef4444';
                if (d.data.suspiciousScore > 50) return '#7f1d1d';
                if (d.data.suspiciousScore > 25) return '#78350f';
                return '#1a1a1a';
            })
            .style('stroke', (d: any) => {
                if (d.data.address === highlightedAddress) return '#fff';
                if (d.data.suspiciousScore > 50) return '#f87171';
                if (d.data.suspiciousScore > 25) return '#fbbf24';
                if (d.depth === 0) return '#e5e5e5';
                return '#4a4a4a';
            })
            .style('stroke-width', (d: any) => d.data.address === highlightedAddress ? 3 : 1.5)
            .on('click', (event, d: any) => {
                event.stopPropagation();
                setSelectedNode(d.data);
            })
            .on('dblclick', (event, d: any) => {
                event.stopPropagation();
                toggleCollapse(d.data.address);
            })
            .on('mouseenter', function (event, d: any) {
                setHoveredNode(d.data);
                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr('r', parseFloat(d3.select(this).attr('r')) * 1.3)
                    .style('filter', 'drop-shadow(0 0 8px rgba(255,255,255,0.3))');
            })
            .on('mouseleave', function (event, d: any) {
                setHoveredNode(null);
                const baseSize = Math.max(6, Math.min(14, d.data.totalValueInEth * 2 + 6));
                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr('r', d.data.address === highlightedAddress ? baseSize * 1.3 : baseSize)
                    .style('filter', 'none');
            });

        // Collapse indicators
        nodes.filter((d: any) => {
            const originalNode = flattenTree(node).find(n => n.address === d.data.address);
            return !!(originalNode && originalNode.children.length > 0);
        })
            .append('circle')
            .attr('r', 4)
            .attr('cx', 16)
            .style('fill', (d: any) => collapsedNodes.has(d.data.address) ? '#555' : 'transparent')
            .style('stroke', '#555')
            .style('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('click', (event, d: any) => {
                event.stopPropagation();
                toggleCollapse(d.data.address);
            });

        // Node labels
        if (showLabels) {
            nodes.append('text')
                .attr('dy', -16)
                .attr('text-anchor', 'middle')
                .style('font-size', '10px')
                .style('fill', (d: any) => d.data.address === highlightedAddress ? '#fff' : '#666')
                .style('font-family', 'JetBrains Mono, monospace')
                .style('font-weight', (d: any) => d.data.address === highlightedAddress ? 600 : 400)
                .text((d: any) => `${d.data.address.slice(0, 6)}...${d.data.address.slice(-4)}`);
        }

        // Value labels
        if (showValues) {
            nodes.filter((d: any) => d.data.totalValueInEth > 0)
                .append('text')
                .attr('dy', 24)
                .attr('text-anchor', 'middle')
                .style('font-size', '9px')
                .style('fill', direction === 'source' ? '#4ade80' : '#f87171')
                .style('font-family', 'JetBrains Mono, monospace')
                .text((d: any) => `${d.data.totalValueInEth.toFixed(4)} ETH`);
        }

        // Setup zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 5])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
                setZoomLevel(event.transform.k);
            });

        zoomRef.current = zoom;
        svg.call(zoom);

        // Initial centering
        const bounds = g.node()!.getBBox();
        const fullWidth = bounds.width + margin.left + margin.right;
        const fullHeight = bounds.height + margin.top + margin.bottom;
        const scale = Math.min(width / fullWidth, height / fullHeight, 1);
        const translateX = (width - fullWidth * scale) / 2 + margin.left;
        const translateY = (height - fullHeight * scale) / 2 + margin.top;

        svg.call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));

    }, [node, direction, isFullscreen, collapsedNodes, highlightedAddress, showLabels, showValues, filterMinValue, flattenTree, toggleCollapse]);

    const formatValue = (val: number) => val < 0.0001 ? '<0.0001' : val.toFixed(4);

    return (
        <div
            className={`tree-wrapper ${isFullscreen ? 'fullscreen' : ''}`}
            style={{
                position: isFullscreen ? 'fixed' : 'relative',
                top: isFullscreen ? 0 : 'auto',
                left: isFullscreen ? 0 : 'auto',
                right: isFullscreen ? 0 : 'auto',
                bottom: isFullscreen ? 0 : 'auto',
                zIndex: isFullscreen ? 1000 : 1,
                background: isFullscreen ? '#0a0a0a' : 'transparent',
                padding: isFullscreen ? 'var(--space-4)' : 0,
            }}
        >
            {/* Toolbar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-2) var(--space-3)',
                background: 'rgba(20, 20, 20, 0.9)',
                borderRadius: isFullscreen ? 'var(--radius-lg)' : 'var(--radius-lg) var(--radius-lg) 0 0',
                borderBottom: '1px solid var(--color-surface-border)',
                gap: 'var(--space-2)',
                flexWrap: 'wrap',
            }}>
                {/* Title + Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1 }}>
                    <div style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                        color: direction === 'source' ? '#4ade80' : '#f87171',
                    }}>
                        {title || (direction === 'source' ? '📥 Funding Sources' : '📤 Fund Destinations')}
                    </div>

                    {/* Search Input */}
                    <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
                        <Search size={14} style={{
                            position: 'absolute',
                            left: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--color-text-muted)',
                        }} />
                        <input
                            type="text"
                            placeholder="Search address..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="input"
                            style={{
                                paddingLeft: 28,
                                height: 32,
                                fontSize: 'var(--text-xs)',
                                background: 'rgba(30, 30, 30, 0.8)',
                            }}
                        />

                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-surface-border)',
                                borderRadius: 'var(--radius-md)',
                                maxHeight: 200,
                                overflow: 'auto',
                                zIndex: 100,
                                marginTop: 4,
                            }}>
                                {searchResults.map((result, i) => (
                                    <div
                                        key={`${result.address}-${i}`}
                                        onClick={() => focusOnAddress(result.address)}
                                        style={{
                                            padding: 'var(--space-2)',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid var(--color-surface-border)',
                                            fontSize: 'var(--text-xs)',
                                            fontFamily: 'var(--font-mono)',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-hover)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <div>{result.address.slice(0, 10)}...{result.address.slice(-8)}</div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                                            {result.totalValueInEth.toFixed(4)} ETH • Depth {result.depth}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    {/* Toggle controls */}
                    <button
                        className="btn btn-ghost"
                        onClick={() => setShowLabels(!showLabels)}
                        title={showLabels ? 'Hide Labels' : 'Show Labels'}
                        style={{ padding: 6 }}
                    >
                        {showLabels ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>

                    <button
                        className="btn btn-ghost"
                        onClick={() => setShowMinimap(!showMinimap)}
                        title={showMinimap ? 'Hide Minimap' : 'Show Minimap'}
                        style={{ padding: 6 }}
                    >
                        <Layers size={16} />
                    </button>

                    <div style={{ width: 1, height: 20, background: 'var(--color-surface-border)', margin: '0 4px' }} />

                    {/* Zoom controls */}
                    <button className="btn btn-ghost" onClick={() => handleZoom(1.3)} title="Zoom In" style={{ padding: 6 }}>
                        <ZoomIn size={16} />
                    </button>
                    <span style={{
                        fontSize: 'var(--text-xs)',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--color-text-muted)',
                        minWidth: 40,
                        textAlign: 'center',
                    }}>
                        {Math.round(zoomLevel * 100)}%
                    </span>
                    <button className="btn btn-ghost" onClick={() => handleZoom(0.7)} title="Zoom Out" style={{ padding: 6 }}>
                        <ZoomOut size={16} />
                    </button>
                    <button className="btn btn-ghost" onClick={handleResetZoom} title="Reset View" style={{ padding: 6 }}>
                        <RotateCcw size={16} />
                    </button>

                    <div style={{ width: 1, height: 20, background: 'var(--color-surface-border)', margin: '0 4px' }} />

                    {/* Export & Fullscreen */}
                    <button className="btn btn-ghost" onClick={handleExport} title="Export as PNG" style={{ padding: 6 }}>
                        <Download size={16} />
                    </button>
                    <button
                        className="btn btn-ghost"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                        style={{ padding: 6 }}
                    >
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                </div>
            </div>

            {/* Tree Container */}
            <div
                ref={containerRef}
                className="tree-container"
                style={{
                    height: isFullscreen ? 'calc(100vh - 120px)' : 450,
                    overflow: 'hidden',
                    position: 'relative',
                    borderRadius: isFullscreen ? 'var(--radius-lg)' : '0 0 var(--radius-lg) var(--radius-lg)',
                    cursor: isPanning ? 'grabbing' : 'grab',
                }}
                onMouseDown={() => setIsPanning(true)}
                onMouseUp={() => setIsPanning(false)}
                onMouseLeave={() => setIsPanning(false)}
            >
                <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />

                {/* Hover tooltip */}
                {hoveredNode && (
                    <div style={{
                        position: 'absolute',
                        top: 10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(0, 0, 0, 0.9)',
                        border: '1px solid var(--color-surface-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-2) var(--space-3)',
                        fontSize: 'var(--text-xs)',
                        fontFamily: 'var(--font-mono)',
                        pointerEvents: 'none',
                        zIndex: 50,
                    }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Double-click to expand/collapse</span>
                    </div>
                )}
            </div>

            {/* Selected node details panel */}
            {selectedNode && (
                <div
                    className="animate-fade-in"
                    style={{
                        position: 'absolute',
                        top: 60,
                        right: 'var(--space-4)',
                        background: 'rgba(15, 15, 15, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid var(--color-surface-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-4)',
                        maxWidth: 300,
                        zIndex: 20,
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                        <span style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--color-text-muted)',
                            background: 'var(--color-surface-hover)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                        }}>
                            Depth {selectedNode.depth}
                        </span>
                        <button
                            className="btn btn-ghost"
                            onClick={() => setSelectedNode(null)}
                            style={{ padding: 4 }}
                        >
                            ✕
                        </button>
                    </div>

                    <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        marginBottom: 'var(--space-3)',
                        wordBreak: 'break-all',
                        background: 'var(--color-surface)',
                        padding: 'var(--space-2)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                    }}>
                        <span style={{ flex: 1 }}>{selectedNode.address}</span>
                        <button
                            className="btn btn-ghost"
                            onClick={() => copyAddress(selectedNode.address)}
                            style={{ padding: 4 }}
                            title="Copy address"
                        >
                            <Copy size={14} />
                        </button>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 'var(--space-3)',
                        fontSize: 'var(--text-xs)',
                        marginBottom: 'var(--space-3)',
                    }}>
                        <div style={{ background: 'var(--color-surface)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>Value</div>
                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 600,
                                color: direction === 'source' ? '#4ade80' : '#f87171',
                            }}>
                                {formatValue(selectedNode.totalValueInEth)} ETH
                            </div>
                        </div>
                        <div style={{ background: 'var(--color-surface)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>Transactions</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                {selectedNode.txCount}
                            </div>
                        </div>
                        <div style={{ background: 'var(--color-surface)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>Children</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                {selectedNode.children.length}
                            </div>
                        </div>
                        <div style={{ background: 'var(--color-surface)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ color: 'var(--color-text-muted)', marginBottom: 2 }}>Risk Score</div>
                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 600,
                                color: selectedNode.suspiciousScore > 50 ? 'var(--color-danger-text)' :
                                    selectedNode.suspiciousScore > 25 ? 'var(--color-warning-text)' : 'var(--color-success-text)'
                            }}>
                                {selectedNode.suspiciousScore}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => focusOnAddress(selectedNode.address)}
                            style={{ flex: 1, justifyContent: 'center', fontSize: 'var(--text-xs)' }}
                        >
                            <Target size={14} /> Focus
                        </button>
                        <a
                            href={`${chainConfig.explorer}/address/${selectedNode.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ flex: 1, justifyContent: 'center', fontSize: 'var(--text-xs)' }}
                        >
                            Explorer ↗
                        </a>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div style={{
                position: 'absolute',
                bottom: isFullscreen ? 'var(--space-4)' : 'var(--space-3)',
                left: 'var(--space-3)',
                display: 'flex',
                gap: 'var(--space-4)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                background: 'rgba(10, 10, 10, 0.8)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #e5e5e5', background: '#1a1a1a' }} />
                    Root
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #4ade80' }} />
                    Low Risk
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #fbbf24' }} />
                    Medium
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #f87171' }} />
                    High Risk
                </div>
            </div>

            {/* Keyboard shortcuts hint */}
            {isFullscreen && (
                <div style={{
                    position: 'absolute',
                    bottom: 'var(--space-4)',
                    right: 'var(--space-4)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                    background: 'rgba(10, 10, 10, 0.8)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                }}>
                    <kbd style={{ background: 'var(--color-surface)', padding: '2px 6px', borderRadius: 4, marginRight: 4 }}>ESC</kbd>
                    Exit fullscreen
                </div>
            )}
        </div>
    );
}

export default FundingTree;
