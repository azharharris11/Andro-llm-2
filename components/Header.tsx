
import React, { useState, useMemo } from 'react';
import { Microscope, Package, Activity, BrainCircuit, BarChart3, Search, LayoutGrid, Cpu } from 'lucide-react';
import { ViewMode, NodeData } from '../types';

interface HeaderProps {
    activeView: ViewMode;
    labNodesCount: number;
    vaultNodesCount: number;
    simulating: boolean;
    onRunSimulation: () => void;
    diversityScore?: number; 
    onAutoLayout?: () => void;
    onSearch?: (query: string) => void;
    nodes?: NodeData[]; // Pass nodes to calculate total cost
}

const Header: React.FC<HeaderProps> = ({ activeView, labNodesCount, vaultNodesCount, simulating, onRunSimulation, diversityScore = 0, onAutoLayout, onSearch, nodes = [] }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSearch && searchQuery) onSearch(searchQuery);
    };

    const getScoreColor = (score: number) => {
        if (score === 0) return 'text-slate-300';
        if (score <= 1) return 'text-red-500';
        if (score <= 2) return 'text-orange-500';
        if (score <= 3) return 'text-blue-500';
        return 'text-emerald-500';
    };

    // Calculate Total Cost
    const totalTokens = useMemo(() => {
        return nodes.reduce((acc, node) => acc + (node.inputTokens || 0) + (node.outputTokens || 0), 0);
    }, [nodes]);

    const formatCost = (tokens: number) => {
        if (tokens < 1000) return `${tokens} toks`;
        if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}k toks`;
        return `${(tokens / 1000000).toFixed(2)}M toks`;
    };

    return (
        <div className="absolute top-0 left-0 w-full h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-6">
                <div>
                    <h1 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        {activeView === 'LAB' ? <><Microscope className="w-4 h-4"/> Testing Lab</> : <><Package className="w-4 h-4 text-amber-500"/> Creative Vault</>}
                    </h1>
                    <p className="text-xs text-slate-400 font-mono">{activeView === 'LAB' ? `${labNodesCount} Assets Active` : `${vaultNodesCount} Winning Assets`}</p>
                </div>
                
                {activeView === 'LAB' && (
                    <div className="hidden md:flex items-center gap-6">
                        <div className="flex flex-col border-l border-slate-200 pl-6">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <BarChart3 className="w-3 h-3"/> Diversity
                            </span>
                            <div className={`text-sm font-bold flex items-center gap-1 ${getScoreColor(diversityScore)}`}>
                                Level {diversityScore}/4
                                <div className="flex gap-0.5 ml-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className={`w-2 h-1 rounded-full ${i <= diversityScore ? 'bg-current' : 'bg-slate-200'}`}></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                         <div className="flex flex-col border-l border-slate-200 pl-6">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Cpu className="w-3 h-3"/> Resources
                            </span>
                            <div className="text-sm font-bold text-slate-700 font-mono">
                                {formatCost(totalTokens)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-3">
                 {/* SEARCH BAR */}
                 {activeView === 'LAB' && (
                     <form onSubmit={handleSearch} className="relative hidden md:block group">
                        <input 
                            className="bg-slate-100 hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-blue-300 rounded-full py-1.5 pl-9 pr-3 text-xs w-[150px] focus:w-[200px] transition-all outline-none" 
                            placeholder="Find Asset..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                     </form>
                 )}

                 {activeView === 'LAB' && onAutoLayout && (
                    <button onClick={onAutoLayout} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors" title="Auto Layout">
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                 )}

                 {activeView === 'LAB' && (
                     <button onClick={onRunSimulation} disabled={simulating} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2">
                        <BrainCircuit className={`w-4 h-4 ${simulating ? 'animate-pulse text-indigo-500' : 'text-indigo-500'}`} />
                        {simulating ? 'Auditing Assets...' : 'Run Global Audit'}
                     </button>
                 )}
            </div>
        </div>
    );
};
export default Header;
