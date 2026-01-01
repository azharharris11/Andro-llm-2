
import React, { useState, useRef, useEffect } from 'react';
import { Globe, ImageIcon, Upload, X, Target, ChevronDown, ChevronUp, MessageSquare, Mic, Camera, Save, FolderOpen, Trash2, Zap, Settings, Sliders } from 'lucide-react';
import { ProjectContext, MarketAwareness, FunnelStage, CopyFramework, LanguageRegister, StrategyMode } from '../types';
import { analyzeImageContext, analyzeLandingPageContext } from '../services/geminiService';
import { scrapeLandingPage } from '../services/firecrawlService';

// UI Component for Editable Dropdowns (Local to ConfigModal now)
const EditableSelect = ({ label, value, onChange, options, placeholder }: { label: string, value: string, onChange: (val: string) => void, options: string[], placeholder: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative group w-full">
      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{label}</label>
      <div className="relative">
        <input 
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all pr-8"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      {isOpen && options && options.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-[200px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((opt, i) => (
            <button
              key={i}
              className="w-full text-left px-4 py-3 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 border-b border-slate-50 last:border-0 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault(); 
                onChange(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: ProjectContext;
    onUpdateProject: (updates: Partial<ProjectContext>) => void;
    onContextAnalyzed: (context: ProjectContext) => void;
}

interface SavedProfile {
    name: string;
    context: ProjectContext;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, project, onUpdateProject, onContextAnalyzed }) => {
    const [landingPageUrl, setLandingPageUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
    
    // Client Profiles State
    const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
    const [profileName, setProfileName] = useState('');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    
    // Advanced Toggle
    const [showAdvanced, setShowAdvanced] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const productRefInputRef = useRef<HTMLInputElement>(null);

    // Load profiles on mount
    useEffect(() => {
        const saved = localStorage.getItem('andromeda_profiles');
        if (saved) {
            try {
                setSavedProfiles(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load profiles", e);
            }
        }
    }, []);

    const saveProfile = () => {
        if (!profileName) return alert("Please enter a profile name (e.g. 'Klien Keripik')");
        const newProfile: SavedProfile = { name: profileName, context: project };
        // Check if exists, update it
        const existingIdx = savedProfiles.findIndex(p => p.name === profileName);
        let updated = [];
        if (existingIdx >= 0) {
            updated = [...savedProfiles];
            updated[existingIdx] = newProfile;
        } else {
            updated = [...savedProfiles, newProfile];
        }
        setSavedProfiles(updated);
        localStorage.setItem('andromeda_profiles', JSON.stringify(updated));
        alert(`Profile '${profileName}' saved!`);
        setShowProfileMenu(false);
    };

    const loadProfile = (profile: SavedProfile) => {
        if (confirm(`Load profile '${profile.name}'? Current unsaved changes will be lost.`)) {
            onContextAnalyzed(profile.context); // Overwrite everything
            setProfileName(profile.name);
            setShowProfileMenu(false);
        }
    };

    const deleteProfile = (e: React.MouseEvent, name: string) => {
        e.stopPropagation();
        if (confirm(`Delete profile '${name}'?`)) {
            const updated = savedProfiles.filter(p => p.name !== name);
            setSavedProfiles(updated);
            localStorage.setItem('andromeda_profiles', JSON.stringify(updated));
        }
    };

    if (!isOpen) return null;

    const handleAwarenessChange = (awareness: MarketAwareness) => {
        let derivedFunnelStage = FunnelStage.TOF;
        switch (awareness) {
          case MarketAwareness.UNAWARE:
          case MarketAwareness.PROBLEM_AWARE:
            derivedFunnelStage = FunnelStage.TOF;
            break;
          case MarketAwareness.SOLUTION_AWARE:
            derivedFunnelStage = FunnelStage.MOF;
            break;
          case MarketAwareness.PRODUCT_AWARE:
          case MarketAwareness.MOST_AWARE:
            derivedFunnelStage = FunnelStage.BOF;
            break;
        }
        onUpdateProject({
          marketAwareness: awareness,
          funnelStage: derivedFunnelStage
        });
    };

    const handleAnalyzeUrl = async () => {
        if (!landingPageUrl) return;
        setIsAnalyzing(true);
        try {
            const scrapeResult = await scrapeLandingPage(landingPageUrl);
            if (!scrapeResult.success || !scrapeResult.markdown) {
                alert("Failed to read the website. Please enter details manually.");
                setIsAnalyzing(false);
                return;
            }
            const context = await analyzeLandingPageContext(scrapeResult.markdown);
            onContextAnalyzed({ ...context, landingPageUrl });
        } catch (e) {
            console.error(e);
            alert("Analysis failed.");
        }
        setIsAnalyzing(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsAnalyzingImage(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            try {
                const context = await analyzeImageContext(base64);
                onContextAnalyzed(context);
            } catch (error) {
                console.error(error);
                alert("Could not analyze image.");
            }
            setIsAnalyzingImage(false);
        };
        reader.readAsDataURL(file);
    };

    const handleProductRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            onUpdateProject({ productReferenceImage: base64 });
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex overflow-hidden h-[85vh] ring-1 ring-slate-900/5">
             
             {/* LEFT PANEL: CONTEXT IMPORT */}
             <div className="w-1/3 bg-slate-50 p-6 border-r border-slate-200 overflow-y-auto custom-scrollbar">
                 <div className="mb-8">
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <FolderOpen className="w-3.5 h-3.5"/> Client & Profiles
                     </h3>
                     
                     <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
                         <div className="flex gap-2">
                            <input 
                                className="w-full bg-transparent border-none text-sm font-medium placeholder:text-slate-400 focus:ring-0 px-0" 
                                placeholder="Enter Client Name..." 
                                value={profileName} 
                                onChange={(e) => setProfileName(e.target.value)} 
                            />
                            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="px-2 py-1 text-slate-400 hover:text-slate-600"><ChevronDown className="w-4 h-4"/></button>
                         </div>
                         <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                            <button onClick={saveProfile} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors">
                                <Save className="w-3 h-3" /> Save Preset
                            </button>
                         </div>

                         {showProfileMenu && (
                             <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-[300px] overflow-y-auto">
                                 {savedProfiles.length === 0 && <div className="p-4 text-xs text-slate-400 text-center">No saved profiles yet.</div>}
                                 {savedProfiles.map((p, i) => (
                                     <div key={i} onClick={() => loadProfile(p)} className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 group/item">
                                         <span className="text-sm font-medium text-slate-700">{p.name}</span>
                                         <button onClick={(e) => deleteProfile(e, p.name)} className="text-slate-300 hover:text-red-500 opacity-0 group-item-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                                     </div>
                                 ))}
                             </div>
                         )}
                     </div>
                 </div>

                 <div className="h-px bg-slate-200 mb-8"></div>

                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <Zap className="w-3.5 h-3.5"/> Auto-Import Info
                 </h3>

                 <div className="space-y-4">
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                        <label className="text-[10px] font-bold text-slate-500 mb-2 block flex items-center gap-2"><Globe className="w-3 h-3" /> Website / Landing Page</label>
                        <div className="flex gap-2 mb-2">
                            <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs" placeholder="https://..." value={landingPageUrl} onChange={(e) => setLandingPageUrl(e.target.value)} />
                        </div>
                        <button onClick={handleAnalyzeUrl} disabled={isAnalyzing} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                            {isAnalyzing ? "Scanning..." : "Auto-Fill from URL"}
                        </button>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
                        <label className="text-[10px] font-bold text-slate-500 mb-2 block flex items-center gap-2"><ImageIcon className="w-3 h-3" /> Analyze Product Image</label>
                        <div className="w-full h-24 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-colors" onClick={() => fileInputRef.current?.click()}>
                            {isAnalyzingImage ? (
                                <div className="flex flex-col items-center gap-2"><div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div><span className="text-[10px] text-blue-600 font-medium">Reading...</span></div>
                            ) : (
                                <><Upload className="w-5 h-5 text-slate-300 mb-1" /><span className="text-[10px] text-slate-400">Upload Image</span></>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>
                 </div>
             </div>

             {/* RIGHT PANEL: EDIT FIELDS */}
             <div className="w-2/3 p-8 overflow-y-auto custom-scrollbar flex flex-col relative">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>

                <div className="mb-8">
                    <h2 className="text-2xl font-display font-bold text-slate-900 mb-1">Project Brief</h2>
                    <p className="text-sm text-slate-500">Fill in the essentials. AI will figure out the rest.</p>
                </div>
                
                {/* 1. ESSENTIALS (GROUPED) */}
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="col-span-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Product Name <span className="text-red-500">*</span></label>
                            <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="e.g. Lumina Sleep Mask" value={project.productName} onChange={e => onUpdateProject({ productName: e.target.value })} />
                        </div>
                        <div className="col-span-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1"><Globe className="w-3 h-3"/> Target Country <span className="text-red-500">*</span></label>
                            <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" value={project.targetCountry || ''} onChange={e => onUpdateProject({ targetCountry: e.target.value })} placeholder="e.g. Indonesia" />
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">What is it? (Value Proposition) <span className="text-red-500">*</span></label>
                            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none min-h-[80px]" rows={2} value={project.productDescription} onChange={e => onUpdateProject({ productDescription: e.target.value })} placeholder="Describe the product and the main problem it solves..." />
                        </div>
                    </div>

                    {/* STRATEGY SELECTOR (VISUAL) */}
                    <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100">
                        <label className="text-[10px] font-bold text-indigo-800 uppercase mb-3 block flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-indigo-600"/> Select Strategy Mode</label>
                        <div className="grid grid-cols-3 gap-3">
                                {Object.values(StrategyMode).map((mode) => {
                                    const isActive = project.strategyMode === mode;
                                    const [title, desc] = mode.split(' - ');
                                    return (
                                        <button 
                                        key={mode} 
                                        onClick={() => onUpdateProject({ strategyMode: mode })}
                                        className={`text-left p-3 rounded-xl border text-xs transition-all flex flex-col gap-1 relative overflow-hidden ${isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200' : 'bg-white text-slate-600 border-indigo-100 hover:border-indigo-300'}`}
                                        >
                                            <span className="font-bold relative z-10">{title}</span>
                                            <span className={`text-[10px] relative z-10 leading-tight ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>{desc}</span>
                                        </button>
                                    );
                                })}
                        </div>
                    </div>
                </div>

                {/* 2. OPTIONAL / ADVANCED TOGGLE */}
                <div className="mt-8">
                    <button 
                        onClick={() => setShowAdvanced(!showAdvanced)} 
                        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors select-none"
                    >
                        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {showAdvanced ? "Hide Advanced Settings" : "Show Advanced Strategy (Optional)"}
                    </button>
                </div>

                {showAdvanced && (
                    <div className="mt-4 p-6 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-6 animate-in slide-in-from-top-4 fade-in duration-300">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Target Audience</label>
                            <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" value={project.targetAudience} onChange={e => onUpdateProject({ targetAudience: e.target.value })} placeholder="e.g. Busy moms, Gamers" />
                        </div>
                        
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Language Style</label>
                            <select 
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm cursor-pointer outline-none"
                                value={project.languageRegister || LanguageRegister.CASUAL}
                                onChange={(e) => onUpdateProject({ languageRegister: e.target.value as LanguageRegister })}
                            >
                                {Object.values(LanguageRegister).map(lr => (
                                    <option key={lr} value={lr}>{lr}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <EditableSelect 
                                label="Brand Voice (Vibe)" 
                                value={project.brandVoice || ''} 
                                onChange={(val) => onUpdateProject({ brandVoice: val })} 
                                options={project.brandVoiceOptions || ['Witty', 'Professional', 'Empathetic', 'Bold', 'Minimalist']} 
                                placeholder="e.g. Witty, Gen-Z" 
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Market Awareness (Technical)</label>
                            <select className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm cursor-pointer outline-none" value={project.marketAwareness} onChange={(e) => handleAwarenessChange(e.target.value as MarketAwareness)}>
                                {Object.values(MarketAwareness).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        
                        <div className="col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Copy Framework (AI Default: Auto)</label>
                             <select className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm cursor-pointer outline-none" value={project.copyFramework} onChange={(e) => onUpdateProject({ copyFramework: e.target.value as CopyFramework })}>
                                {Object.values(CopyFramework).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        
                        <div className="col-span-2">
                             <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block flex items-center gap-2"><MessageSquare className="w-3 h-3"/> Brand Voice Examples (For Training)</label>
                             <textarea 
                                className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs focus:ring-2 focus:ring-blue-100 outline-none font-mono text-slate-600" 
                                rows={2} 
                                value={project.brandCopyExamples || ''} 
                                onChange={e => onUpdateProject({ brandCopyExamples: e.target.value })}
                                placeholder="Paste 1-2 examples of your previous best ads here so AI can mimic the style." 
                            />
                        </div>
                        
                        <div className="col-span-2 p-3 bg-purple-50 rounded-lg border border-purple-100 flex items-center justify-between">
                            <div>
                                <label className="text-[10px] font-bold text-purple-700 uppercase block">Image Gen Model</label>
                                <p className="text-[10px] text-purple-600/70">Pro model is slower but better quality.</p>
                            </div>
                            <select 
                                className="bg-white border border-purple-200 rounded-lg px-2 py-1 text-xs cursor-pointer text-purple-900 outline-none" 
                                value={project.imageModel || 'standard'} 
                                onChange={(e) => onUpdateProject({ imageModel: e.target.value as any })}
                            >
                                <option value="standard">Standard (Fast)</option>
                                <option value="pro">Pro (High Quality)</option>
                            </select>
                        </div>
                    </div>
                )}
                
                {/* 3. PRODUCT REF IMAGE (ALWAYS VISIBLE BUT SMALL) */}
                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4">
                     <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg flex flex-col items-center justify-center cursor-pointer overflow-hidden flex-shrink-0" onClick={() => productRefInputRef.current?.click()}>
                        {project.productReferenceImage ? (<img src={project.productReferenceImage} className="w-full h-full object-cover" />) : <Camera className="w-5 h-5 text-slate-300" />}
                     </div>
                     <div className="flex-1">
                         <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Product Reference Photo (Optional)</label>
                         <p className="text-xs text-slate-400">Upload a photo so AI knows what your product looks like.</p>
                     </div>
                     <input type="file" ref={productRefInputRef} className="hidden" accept="image/*" onChange={handleProductRefUpload}/>
                </div>

                <div className="mt-auto pt-8">
                    <button onClick={onClose} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2">
                        Start Campaign <Zap className="w-4 h-4 fill-white" />
                    </button>
                </div>
             </div>
          </div>
        </div>
    );
};

export default ConfigModal;
