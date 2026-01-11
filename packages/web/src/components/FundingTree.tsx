import React, { useRef, useEffect, useState } from 'react';
import { FundingNode, CHAINS, ChainId } from '@fundtracer/core';
import * as d3 from 'd3';

interface FundingTreeProps {
    node: FundingNode;
    direction: 'source' | 'destination';
    chain?: ChainId;
}

function FundingTree({ node, direction, chain = 'ethereum' }: FundingTreeProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedNode, setSelectedNode] = useState<FundingNode | null>(null);

    const chainConfig = CHAINS[chain];

    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = 450;
        const margin = { top: 20, right: 120, bottom: 20, left: 120 };

        // Clear previous content
        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // Create hierarchy
        const root = d3.hierarchy(node);

        // Create tree layout
        const treeLayout = d3.tree<FundingNode>()
            .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);

        const treeData = treeLayout(root);

        // Draw links
        g.selectAll('.tree-link')
            .data(treeData.links())
            .join('path')
            .attr('class', 'tree-link')
            .attr('d', d3.linkHorizontal<any, any>()
                .x(d => d.y)
                .y(d => d.x)
            )
            .style('fill', 'none')
            .style('stroke', '#2a2a2a')
            .style('stroke-width', d => Math.max(1, Math.min(3, Math.log(d.target.data.totalValueInEth + 1))));

        // Draw nodes
        const nodes = g.selectAll('.tree-node')
            .data(treeData.descendants())
            .join('g')
            .attr('class', 'tree-node')
            .attr('transform', d => `translate(${d.y}, ${d.x})`)
            .style('cursor', 'pointer')
            .on('click', (event, d) => setSelectedNode(d.data));

        // Node circles
        nodes.append('circle')
            .attr('r', d => Math.max(5, Math.min(12, d.data.totalValueInEth * 2 + 5)))
            .style('fill', d => d.depth === 0 ? '#e5e5e5' : '#1a1a1a')
            .style('stroke', d => {
                if (d.data.suspiciousScore > 50) return '#f87171';
                if (d.data.suspiciousScore > 25) return '#fbbf24';
                return '#4a4a4a';
            })
            .style('stroke-width', 1.5)
            .on('mouseenter', function () {
                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr('r', function () {
                        return parseFloat(d3.select(this).attr('r')) * 1.2;
                    })
                    .style('fill', '#4a4a4a');
            })
            .on('mouseleave', function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr('r', Math.max(5, Math.min(12, d.data.totalValueInEth * 2 + 5)))
                    .style('fill', d.depth === 0 ? '#e5e5e5' : '#1a1a1a');
            });

        // Node labels
        nodes.append('text')
            .attr('dy', -12)
            .attr('text-anchor', 'middle')
            .style('font-size', '9px')
            .style('fill', '#555555')
            .style('font-family', 'JetBrains Mono, monospace')
            .text(d => `${d.data.address.slice(0, 6)}...${d.data.address.slice(-4)}`);

        // Value labels
        nodes.filter(d => d.data.totalValueInEth > 0)
            .append('text')
            .attr('dy', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '8px')
            .style('fill', direction === 'source' ? '#4ade80' : '#f87171')
            .style('font-family', 'JetBrains Mono, monospace')
            .text(d => `${d.data.totalValueInEth.toFixed(4)} ETH`);

    }, [node, direction]);

    const formatValue = (val: number) => val < 0.0001 ? '<0.0001' : val.toFixed(4);

    return (
        <div style={{ position: 'relative' }}>
            <div ref={containerRef} className="tree-container">
                <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
            </div>

            {/* Selected node details */}
            {selectedNode && (
                <div
                    className="animate-fade-in"
                    style={{
                        position: 'absolute',
                        top: 'var(--space-4)',
                        right: 'var(--space-4)',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-surface-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-4)',
                        maxWidth: 280,
                        zIndex: 10,
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            Depth {selectedNode.depth}
                        </span>
                        <button
                            className="btn btn-ghost"
                            onClick={() => setSelectedNode(null)}
                            style={{ padding: 'var(--space-1)', fontSize: 'var(--text-sm)' }}
                        >
                            x
                        </button>
                    </div>

                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-3)', wordBreak: 'break-all' }}>
                        {selectedNode.address}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
                        <div>
                            <div style={{ color: 'var(--color-text-muted)' }}>Value</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                {formatValue(selectedNode.totalValueInEth)} ETH
                            </div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-text-muted)' }}>Transactions</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                {selectedNode.txCount}
                            </div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-text-muted)' }}>Children</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                {selectedNode.children.length}
                            </div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--color-text-muted)' }}>Risk Score</div>
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

                    <a
                        href={`${chainConfig.explorer}/address/${selectedNode.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{ width: '100%', marginTop: 'var(--space-3)', justifyContent: 'center' }}
                    >
                        View on Explorer
                    </a>
                </div>
            )}

            {/* Legend */}
            <div style={{
                position: 'absolute',
                bottom: 'var(--space-3)',
                left: 'var(--space-3)',
                display: 'flex',
                gap: 'var(--space-4)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e5e5e5' }} />
                    Root
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid #4ade80', background: 'transparent' }} />
                    Low Risk
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid #fbbf24', background: 'transparent' }} />
                    Medium
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid #f87171', background: 'transparent' }} />
                    High Risk
                </div>
            </div>
        </div>
    );
}

export default FundingTree;
