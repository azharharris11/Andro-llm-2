
import React, { useState } from 'react';
import { NodeData, NodeType, CampaignStage } from '../types';
import { User, Zap, Image as ImageIcon, Target, Award, Ghost, Cpu, Lightbulb, BookOpen, MessageCircle, Activity, Video, Magnet, Flame, CheckCircle2, FileText, Globe, Loader2, Info, Lock, Link as LinkIcon, ArrowRight } from 'lucide-react';

interface NodeProps {
  data: NodeData;
  selected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onAction: (action: string, id: string, optionId?: string) => void;
  isGridView?: boolean; 
  isDimmed?: boolean; // New prop for visual hierarchy
}

// Simple Tooltip Component
const Tooltip: React.FC<{ text: string }> = ({ text }) => {
    return (
        <div className="group relative inline-block ml-1">
            <Info className="w-3 h-3 text-slate-300 hover:text-blue-500 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-32 bg-slate-800 text-white text-[9px] p-2 rounded z-50 shadow-xl pointer-events-none">
                {text}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
            </div>
        </div>
    );
};

const Node: React.FC<NodeProps> = ({ data, selected, onClick, onAction, isGridView = false, isDimmed = false }) => {
  
  const isScaling = data.stage === CampaignStage.SCALING;
  const hasParent = !!data.parentId && !isGridView;
  const showOutputHandle = !isGridView && (data.type !== NodeType.CREATIVE || (data.type === NodeType.CREATIVE && isScaling));
  const isGhost = data.isGhost;
  
  // Angle Validation State
  const isValidated = data.validationStatus === 'VALIDATED';
  
  // Strategy Alignment (Golden Thread Check)
  // If it's a creative and has mechanismData/bigIdeaData inherited, it is "Aligned".
  const isStrategyAligned = data.type === NodeType.CREATIVE && data.mechanismData && data.massDesireData;

  // Dynamic Loading Message
  const getLoadingText = () => {
      if (!data.isLoading) return "";
      if (data.type === NodeType.CREATIVE) return "Designing...";
      if (data.type === NodeType.PERSONA) return "Psycho-analyzing...";
      if (data.type === NodeType.STORY_NODE) return "Researching...";
      return "Thinking...";
  };

  const getStatusStyles = () => {
    if (isGhost) return {
        container: 'bg-slate-50/30 ring-1 ring-slate-200 border border-dashed border-slate-300 opacity-60 grayscale',
        header: 'bg-slate-100/50 border-b border-slate-200 text-slate-400',
        text: 'text-slate-400',
        accent: 'text-slate-400',
        iconBg: 'bg-slate-100',
        handle: 'bg-slate-200'
    };
    if (isScaling) return {
      container: 'bg-white ring-1 ring-amber-200 shadow-xl shadow-amber-500/5',
      header: 'bg-amber-50/50 border-b border-amber-100 text-amber-800',
      text: 'text-amber-950',
      accent: 'text-amber-600',
      iconBg: 'bg-amber-100',
      handle: 'bg-amber-400'
    };
    if (selected) return {
      container: 'bg-white ring-2 ring-blue-600 shadow-2xl shadow-blue-500/20',
      header: 'bg-blue-50/50 border-b border-blue-100 text-blue-700',
      text: 'text-slate-900',
      accent: 'text-blue-600',
      iconBg: 'bg-blue-100',
      handle: 'bg-blue-500'
    };
    
    // ... (Special Node Styles)
    if (data.type === NodeType.LANDING_PAGE_NODE) return {
        container: 'bg-white ring-1 ring-indigo-200 shadow-lg shadow-indigo-500/10',
        header: 'bg-indigo-50/50 border-b border-indigo-100 text-indigo-800',
        text: 'text-slate-900',
        accent: 'text-indigo-600',
        iconBg: 'bg-indigo-100',
        handle: 'bg-indigo-400'
     };
    
    if (data.type === NodeType.STORY_NODE) return {
       container: 'bg-white ring-1 ring-orange-200 shadow-lg shadow-orange-500/10',
       header: 'bg-orange-50/50 border-b border-orange-100 text-orange-800',
       text: 'text-slate-900',
       accent: 'text-orange-600',
       iconBg: 'bg-orange-100',
       handle: 'bg-orange-400'
    };
    if (data.type === NodeType.BIG_IDEA_NODE) return {
        container: 'bg-white ring-1 ring-yellow-200 shadow-lg shadow-yellow-500/10',
        header: 'bg-yellow-50/50 border-b border-yellow-100 text-yellow-800',
        text: 'text-slate-900',
        accent: 'text-yellow-600',
        iconBg: 'bg-yellow-100',
        handle: 'bg-yellow-400'
     };
    if (data.type === NodeType.MECHANISM_NODE) return {
        container: 'bg-white ring-1 ring-cyan-200 shadow-lg shadow-cyan-500/10',
        header: 'bg-cyan-50/50 border-b border-cyan-100 text-cyan-800',
        text: 'text-slate-900',
        accent: 'text-cyan-600',
        iconBg: 'bg-cyan-100',
        handle: 'bg-cyan-400'
     };
    if (data.type === NodeType.HOOK_NODE) return {
        container: 'bg-white ring-1 ring-pink-200 shadow-lg shadow-pink-500/10',
        header: 'bg-pink-50/50 border-b border-pink-100 text-pink-800',
        text: 'text-slate-900',
        accent: 'text-pink-600',
        iconBg: 'bg-pink-100',
        handle: 'bg-pink-400'
     };
    if (data.type === NodeType.SALES_LETTER) return {
        container: 'bg-white ring-1 ring-emerald-200 shadow-lg shadow-emerald-500/10',
        header: 'bg-emerald-50/50 border-b border-emerald-100 text-emerald-800',
        text: 'text-slate-900',
        accent: 'text-emerald-600',
        iconBg: 'bg-emerald-100',
        handle: 'bg-emerald-400'
     };
    if (data.type === NodeType.HVCO_NODE) return {
        container: 'bg-white ring-1 ring-teal-200 shadow-lg shadow-teal-500/10',
        header: 'bg-teal-50/50 border-b border-teal-100 text-teal-800',
        text: 'text-slate-900',
        accent: 'text-teal-600',
        iconBg: 'bg-teal-100',
        handle: 'bg-teal-400'
     };
    if (data.type === NodeType.MASS_DESIRE_NODE) return {
        container: 'bg-white ring-1 ring-rose-200 shadow-lg shadow-rose-500/10',
        header: 'bg-rose-50/50 border-b border-rose-100 text-rose-800',
        text: 'text-slate-900',
        accent: 'text-rose-600',
        iconBg: 'bg-rose-100',
        handle: 'bg-rose-400'
     };

    return {
      container: 'bg-white ring-1 ring-slate-200 shadow-md hover:shadow-xl', 
      header: 'bg-slate-50/50 border-b border-slate-100 text-slate-500',
      text: 'text-slate-800',
      accent: 'text-slate-500',
      iconBg: 'bg-slate-100',
      handle: 'bg-slate-300'
    };
  };

  const styles = getStatusStyles();

  const getIcon = () => {
    if (isGhost) return <Ghost className={`w-3.5 h-3.5 ${styles.accent}`} />;
    if (isScaling) return <Award className={`w-3.5 h-3.5 ${styles.accent}`} />;
    switch (data.type) {
      case NodeType.ROOT: return <Zap className="w-3.5 h-3.5 text-purple-600" />;
      case NodeType.PERSONA: return <User className="w-3.5 h-3.5 text-teal-600" />;
      case NodeType.ANGLE: return <Target className="w-3.5 h-3.5 text-pink-600" />;
      case NodeType.CREATIVE: return <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />;
      case NodeType.STORY_NODE: return <MessageCircle className="w-3.5 h-3.5 text-orange-600" />;
      case NodeType.BIG_IDEA_NODE: return <Lightbulb className="w-3.5 h-3.5 text-yellow-600" />;
      case NodeType.MECHANISM_NODE: return <Cpu className="w-3.5 h-3.5 text-cyan-600" />;
      case NodeType.LANDING_PAGE_NODE: return <Globe className="w-3.5 h-3.5 text-indigo-600" />;
      case NodeType.MASS_DESIRE_NODE: return <Flame className="w-3.5 h-3.5 text-rose-600" />;
      default: return <Zap className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const containerClass = isGridView 
    ? `relative w-full h-full flex flex-col rounded-xl border-0 transition-all duration-300 ${styles.container} ${selected ? 'ring-2 ring-amber-400' : ''}`
    : `absolute w-[360px] rounded-xl border-0 node-interactive node-enter flex flex-col ${styles.container} ${selected ? 'z-50 scale-[1.02]' : 'z-10'} ${isValidated ? 'ring-2 ring-emerald-400' : ''} ${isDimmed ? 'opacity-40 grayscale-[0.8] blur-[0.5px] scale-95' : 'opacity-100'}`;

  const styleProp = isGridView ? {} : { left: data.x, top: data.y, transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)' };

  return (
    <div
      onClick={onClick}
      className={containerClass}
      style={styleProp}
      data-id={data.id} 
    >
      {!isGridView && !isGhost && (
        <>
          {hasParent && (
            <div className="absolute left-0 top-[50px] -translate-x-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center z-[-1]">
                <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm node-handle ${styles.handle}`}></div>
            </div>
          )}
          {showOutputHandle && (
            <div className="absolute right-0 top-[50px] translate-x-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center z-[-1]">
                <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm node-handle ${styles.handle}`}></div>
            </div>
          )}
        </>
      )}

      <div className={`h-10 flex items-center justify-between px-4 rounded-t-xl ${styles.header}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-1 rounded-md ${styles.iconBg}`}>
             {getIcon()}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest font-mono opacity-80">
             {isGhost ? 'ARCHIVED' : (isScaling ? 'VAULT ASSET' : data.type.replace('_NODE', ' ').replace('LANDING PAGE', 'LP'))}
          </span>
        </div>
        <div className="flex items-center gap-2">
            {data.isLoading ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    <span className="text-[9px] font-bold">{getLoadingText()}</span>
                </div>
            ) : (
                <>
                {/* STRATEGY ALIGNED INDICATOR */}
                {isStrategyAligned && (
                     <div className="flex items-center gap-1 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 text-indigo-700" title="Strategy Aligned: Connected to Mechanism & Desire">
                         <LinkIcon className="w-2.5 h-2.5" />
                         <span className="text-[9px] font-bold">Aligned</span>
                     </div>
                )}
                
                {/* Validation Checkmark */}
                {isValidated && (
                    <div className="flex items-center gap-1 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-700" title="Validated Angle">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span className="text-[9px] font-bold">OK</span>
                    </div>
                )}
                </>
            )}
        </div>
      </div>

      <div className={`p-4 flex flex-col gap-3 bg-white/50 rounded-b-xl flex-1 ${isGhost ? 'opacity-50' : ''}`}>
        
        {data.type === NodeType.CREATIVE && data.imageUrl && (
           <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-slate-100 group shadow-sm bg-slate-50 select-none pointer-events-none">
             <img src={data.imageUrl} alt="Creative" className="w-full h-full object-cover mix-blend-multiply" />
             {/* Icons for Carousel/Video removed for brevity, keeping existing structure */}
             <div className="absolute bottom-2 left-2 right-2 flex justify-between">
                <span className="inline-block px-2 py-1 bg-white/90 backdrop-blur-sm border border-slate-100 shadow-sm rounded text-[10px] text-slate-800 font-medium truncate max-w-[180px]">
                    {data.format}
                </span>
             </div>
           </div>
        )}

        <div>
          <h3 className={`text-sm font-display font-semibold leading-snug ${styles.text}`}>
            {data.title}
          </h3>
          {data.description && !isGridView && (
            <p className="mt-2 text-xs text-slate-500 leading-relaxed font-light border-l-2 border-slate-100 pl-2 line-clamp-2">
              {data.description}
            </p>
          )}

          {/* VISCERAL SYMPTOMS DIAGNOSIS (Persona Node Only) */}
          {data.type === NodeType.PERSONA && data.meta?.visceralSymptoms && (
            <div className="mt-2 space-y-1">
                {data.meta.visceralSymptoms.slice(0, 2).map((symptom: string, i: number) => (
                    <div key={i} className="text-[10px] text-slate-600 bg-red-50/50 p-1.5 rounded border border-red-100 flex items-start gap-1.5">
                        <Activity className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">{symptom}</span>
                    </div>
                ))}
            </div>
          )}
        </div>
        
        {/* BIG IDEA NODE */}
        {data.type === NodeType.BIG_IDEA_NODE && data.bigIdeaData && (
             <div className="mt-1">
                 <div className="text-[10px] text-slate-600 mb-1 flex items-center gap-1">
                    <b>Concept:</b> {data.bigIdeaData.concept}
                 </div>
                 <div className="text-[10px] text-yellow-700 bg-yellow-50 p-1.5 rounded border border-yellow-100"><b>Shift:</b> {data.bigIdeaData.targetBelief}</div>
             </div>
        )}

        {/* MECHANISM NODE WITH TOOLTIPS */}
        {data.type === NodeType.MECHANISM_NODE && data.mechanismData && (
             <div className="mt-1 grid grid-cols-1 gap-1.5">
                 <div className="text-[9px] text-red-600 bg-red-50 p-1.5 rounded border border-red-100 flex items-center gap-1">
                    <Tooltip text="Unique Mechanism of Problem. The 'Villain' or cause of the pain." />
                    <b>UMP (Enemy):</b> {data.mechanismData.ump}
                 </div>
                 <div className="text-[9px] text-emerald-600 bg-emerald-50 p-1.5 rounded border border-emerald-100 flex items-center gap-1">
                    <Tooltip text="Unique Mechanism of Solution. How your product solves it differently." />
                    <b>UMS (Solution):</b> {data.mechanismData.ums}
                 </div>
             </div>
        )}

        {/* QUALITATIVE PREDICTION SCORE */}
        {data.prediction && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden mt-auto">
                <div className="flex items-center justify-between p-2 bg-white border-b border-slate-100">
                     <span className="text-[10px] font-bold text-slate-400 uppercase">Audit Score</span>
                     <div className={`px-2 py-0.5 rounded text-[11px] font-bold ${data.prediction.score > 80 ? 'bg-emerald-100 text-emerald-700' : data.prediction.score > 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                         {data.prediction.score}/100
                     </div>
                </div>
            </div>
        )}
      </div>

      <div className="p-1.5 bg-slate-50/80 border-t border-slate-100 rounded-b-xl">
        {!isGridView && !data.prediction && !isGhost && (
            <>
            {/* GUIDED ONBOARDING ROOT BUTTONS */}
            {data.type === NodeType.ROOT && (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Step 1: Psychology</span>
                    </div>
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAction('generate_desires', data.id); }}
                        className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-start px-3 gap-2 shadow-sm text-left"
                    >
                        <div className="w-5 h-5 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-mono">1</div>
                        <div className="flex flex-col">
                            <span className="leading-none">Find Mass Desires</span>
                            <span className="text-[9px] text-rose-100 font-normal">Why do they buy?</span>
                        </div>
                        <Flame className="w-3.5 h-3.5 ml-auto opacity-80" />
                    </button>
                </div>
            )}
            
            {/* MASS DESIRE ACTIONS (Level 2) */}
            {data.type === NodeType.MASS_DESIRE_NODE && (
                <button 
                onClick={(e) => { e.stopPropagation(); onAction('expand_personas', data.id); }}
                className="w-full py-2 bg-white hover:bg-teal-50 hover:border-teal-200 text-teal-600 text-xs font-bold rounded-lg border border-slate-200 transition-all flex items-center justify-between px-3 gap-2 shadow-sm"
                >
                    <div className="flex items-center gap-2">
                         <User className="w-3.5 h-3.5" /> 
                         Identify Personas
                    </div>
                    <ArrowRight className="w-3 h-3 opacity-50" />
                </button>
            )}

            {/* PERSONA ACTIONS (Level 3 - The Bridge) */}
            {data.type === NodeType.PERSONA && (
                <div className="flex flex-col gap-1.5">
                    <button 
                    onClick={(e) => { e.stopPropagation(); onAction('generate_big_ideas', data.id); }}
                    className="w-full py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg border border-yellow-200 transition-all flex items-center justify-start px-3 gap-2 shadow-sm text-left"
                    >
                        <Lightbulb className="w-3.5 h-3.5" /> 
                        <div className="flex flex-col">
                            <span className="leading-none">Generate Big Ideas</span>
                            <span className="text-[9px] text-yellow-600/70 font-normal">The Strategic Bridge</span>
                        </div>
                    </button>
                </div>
            )}
            
            {/* BIG IDEA ACTIONS (Level 4 - Execution) */}
            {data.type === NodeType.BIG_IDEA_NODE && (
                 <div className="grid grid-cols-2 gap-1.5">
                     <button 
                     onClick={(e) => { e.stopPropagation(); onAction('generate_mechanisms', data.id); }}
                     className="w-full py-2 bg-white hover:bg-cyan-50 hover:border-cyan-200 text-cyan-600 text-[10px] font-bold rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-1 shadow-sm"
                     >
                     <Cpu className="w-3 h-3" /> Mechanisms
                     </button>
                     <button 
                     onClick={(e) => { e.stopPropagation(); onAction('start_story_flow', data.id); }}
                     className="w-full py-2 bg-white hover:bg-orange-50 hover:border-orange-200 text-orange-600 text-[10px] font-bold rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-1 shadow-sm"
                     >
                     <BookOpen className="w-3 h-3" /> Stories
                     </button>
                 </div>
            )}

            {/* MECHANISM ACTIONS */}
            {data.type === NodeType.MECHANISM_NODE && (
                <button 
                onClick={(e) => { e.stopPropagation(); onAction('generate_hooks', data.id); }}
                className="w-full py-2 bg-white hover:bg-pink-50 hover:border-pink-200 text-pink-600 text-xs font-bold rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm mt-1"
                >
                <Target className="w-3 h-3" /> Generate Viral Hooks
                </button>
            )}

            {/* ANGLE NODE - SMART VALIDATION */}
            {data.type === NodeType.ANGLE && (
                <div className="flex flex-col gap-1">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onAction('toggle_validation', data.id); }}
                        className={`w-full py-1.5 text-[10px] font-bold rounded-lg border transition-all flex items-center justify-center gap-2 ${
                            isValidated 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                     >
                        {isValidated ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-400"></div>}
                        {isValidated ? 'Angle Validated' : 'Validate Angle'}
                     </button>

                    <button 
                    onClick={(e) => { e.stopPropagation(); onAction('generate_creatives', data.id); }}
                    disabled={!isValidated} // VISUAL DISABLE
                    className={`w-full py-2 text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-2 shadow-sm ${
                        isValidated 
                        ? 'bg-white hover:bg-indigo-50 border-slate-200 text-indigo-600 cursor-pointer' 
                        : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                    >
                        {isValidated ? <Sparkles className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {isValidated ? 'Generate Formats' : 'Locked'}
                    </button>
                    {!isValidated && (
                        <div className="text-[9px] text-center text-slate-400 font-medium">
                            Validate angle above to unlock
                        </div>
                    )}
                </div>
            )}
            
            {/* Generic Create Shortcut */}
            {data.type !== NodeType.ROOT && 
             data.type !== NodeType.MASS_DESIRE_NODE && 
             data.type !== NodeType.PERSONA && 
             data.type !== NodeType.BIG_IDEA_NODE && 
             data.type !== NodeType.ANGLE && 
             data.type !== NodeType.CREATIVE && (
                <button 
                 onClick={(e) => { e.stopPropagation(); onAction('open_format_selector', data.id); }}
                 className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                 >
                 <ImageIcon className="w-3 h-3" /> Create Creative (Shortcut)
                 </button>
            )}
            
            {data.type === NodeType.STORY_NODE && (
                <button 
                 onClick={(e) => { e.stopPropagation(); onAction('generate_hooks', data.id); }}
                 className="w-full py-2 bg-white hover:bg-pink-50 hover:border-pink-200 text-pink-600 text-xs font-bold rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm mt-1"
                 >
                 <Target className="w-3 h-3" /> Create Hooks from Story
                 </button>
            )}
            </>
        )}
      </div>
    </div>
  );
};

export default Node;
import { Sparkles } from 'lucide-react';
