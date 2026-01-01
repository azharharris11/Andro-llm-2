
import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Canvas, { CanvasHandle } from './components/Canvas';
import Inspector from './components/Inspector';
import ConfigModal from './components/ConfigModal';
import FormatSelector from './components/FormatSelector';
import Node from './components/Node';

import { 
  NodeData, Edge, NodeType, ViewMode, ProjectContext, 
  CreativeFormat, CampaignStage, MarketAwareness, 
  LanguageRegister, FunnelStage, CopyFramework, TestingTier,
  StoryOption, BigIdeaOption, MechanismOption, HVCOOption, StrategyMode, MassDesireOption 
} from './types';

import * as GeminiService from './services/geminiService';

// Initial Data
const initialProject: ProjectContext = {
  productName: "Lumina",
  productDescription: "A smart sleep mask that uses light therapy to improve sleep quality.",
  targetAudience: "Insomniacs and biohackers",
  targetCountry: "USA",
  marketAwareness: MarketAwareness.PROBLEM_AWARE,
  funnelStage: FunnelStage.TOF,
  languageRegister: LanguageRegister.CASUAL,
  imageModel: 'standard', // Default
  strategyMode: StrategyMode.LOGIC // Changed default to Logic based on new structure
};

const initialNodes: NodeData[] = [
  {
    id: 'root-1',
    type: NodeType.ROOT,
    title: 'Campaign Root',
    description: 'Start here. Define your product strategy.',
    x: 100,
    y: 300
  }
];

const FORMAT_GROUPS: Record<string, CreativeFormat[]> = {
  "🔵 TOF (Unaware/Viral)": [
    CreativeFormat.UGLY_VISUAL,
    CreativeFormat.BIG_FONT,
    CreativeFormat.MEME,
    CreativeFormat.REDDIT_THREAD,
    CreativeFormat.MS_PAINT,
    CreativeFormat.CARTOON,
    CreativeFormat.STICKY_NOTE_REALISM,
    CreativeFormat.TWITTER_REPOST,
    CreativeFormat.HANDHELD_TWEET,
    CreativeFormat.REMINDER_NOTIF
  ],
  "🟠 MOF (Education/Trust)": [
    CreativeFormat.GMAIL_UX,
    CreativeFormat.LONG_TEXT,
    CreativeFormat.WHITEBOARD,
    CreativeFormat.IG_STORY_TEXT,
    CreativeFormat.STORY_QNA,
    CreativeFormat.STORY_POLL,
    CreativeFormat.CAROUSEL_EDUCATIONAL,
    CreativeFormat.CAROUSEL_REAL_STORY,
    CreativeFormat.BEFORE_AFTER,
    CreativeFormat.MECHANISM_XRAY,
    CreativeFormat.EDUCATIONAL_RANT
  ],
  "🔴 BOF (Conversion/Offer)": [
    CreativeFormat.TESTIMONIAL_HIGHLIGHT,
    CreativeFormat.PRESS_FEATURE,
    CreativeFormat.US_VS_THEM,
    CreativeFormat.BENEFIT_POINTERS,
    CreativeFormat.CAROUSEL_TESTIMONIAL,
    CreativeFormat.LEAD_MAGNET_3D,
    CreativeFormat.UGC_MIRROR,
    CreativeFormat.DM_NOTIFICATION,
    CreativeFormat.CHAT_CONVERSATION
  ]
};

const App: React.FC = () => {
  const [nodes, setNodes] = useState<NodeData[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [project, setProject] = useState<ProjectContext>(initialProject);
  const [activeView, setActiveView] = useState<ViewMode>('LAB');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [inspectorNodeId, setInspectorNodeId] = useState<string | null>(null);
  
  // Golden Thread State
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set());
  const [highlightedEdgeIds, setHighlightedEdgeIds] = useState<Set<string>>(new Set());
  
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isFormatSelectorOpen, setIsFormatSelectorOpen] = useState(false);
  const [pendingFormatParentId, setPendingFormatParentId] = useState<string | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<Set<CreativeFormat>>(new Set());

  const [simulating, setSimulating] = useState(false);
  const [diversityScore, setDiversityScore] = useState(0);

  const canvasRef = useRef<CanvasHandle>(null);

  // --- CALCULATE DIVERSITY SCORE ---
  useEffect(() => {
      let score = 0;
      const formats = new Set(nodes.filter(n => n.type === NodeType.CREATIVE).map(n => n.format));
      if (formats.size >= 3) score += 1;
      if (nodes.some(n => n.type === NodeType.MASS_DESIRE_NODE)) score += 1;
      if (nodes.filter(n => n.type === NodeType.ANGLE).length >= 3) score += 1;
      if (nodes.filter(n => n.type === NodeType.PERSONA).length >= 2) score += 1;
      setDiversityScore(score);
  }, [nodes]);
  
  // --- GOLDEN THREAD CALCULATION ---
  useEffect(() => {
    if (!selectedNodeId) {
        setHighlightedNodeIds(new Set());
        setHighlightedEdgeIds(new Set());
        return;
    }

    const nodeIds = new Set<string>();
    const edgeIds = new Set<string>();
    
    let currentId = selectedNodeId;
    nodeIds.add(currentId);

    // Trace Ancestry (Parents)
    while (currentId) {
        const parentEdge = edges.find(e => e.target === currentId);
        if (parentEdge) {
            edgeIds.add(parentEdge.id);
            currentId = parentEdge.source;
            nodeIds.add(currentId);
        } else {
            break;
        }
    }
    
    setHighlightedNodeIds(nodeIds);
    setHighlightedEdgeIds(edgeIds);

  }, [selectedNodeId, edges]);

  // --- AUTO LAYOUT ALGORITHM ---
  const handleAutoLayout = () => {
    const LEVEL_WIDTH = 450;
    const VERTICAL_SPACING = 300;
    
    const newNodes = [...nodes];
    const levels: Record<string, NodeData[]> = {};
    
    // Group by Hierarchy approximation
    const getLevel = (node: NodeData): number => {
        if (node.type === NodeType.ROOT) return 0;
        if (node.type === NodeType.MASS_DESIRE_NODE) return 1;
        if (node.type === NodeType.PERSONA) return 2;
        if (node.type === NodeType.BIG_IDEA_NODE) return 3; // Swapped to 3
        if (node.type === NodeType.STORY_NODE) return 4; // Story comes after Big Idea now
        if (node.type === NodeType.MECHANISM_NODE) return 4;
        if (node.type === NodeType.HOOK_NODE || node.type === NodeType.ANGLE) return 5;
        if (node.type === NodeType.CREATIVE || node.type === NodeType.SALES_LETTER) return 6;
        if (node.type === NodeType.LANDING_PAGE_NODE) return 7;
        return 0;
    };

    // Assign Levels
    newNodes.forEach(n => {
        const lvl = getLevel(n);
        if (!levels[lvl]) levels[lvl] = [];
        levels[lvl].push(n);
    });

    // Reposition
    Object.keys(levels).forEach(lvlKey => {
        const lvl = parseInt(lvlKey);
        const nodesInLevel = levels[lvl];
        nodesInLevel.forEach((node, idx) => {
            // Keep existing logical groupings roughly by sorting by parent Y if possible
            node.x = 100 + (lvl * LEVEL_WIDTH);
            node.y = 300 + (idx * VERTICAL_SPACING) - ((nodesInLevel.length * VERTICAL_SPACING) / 2);
        });
    });

    setNodes(newNodes);
  };
  
  // --- SEARCH FUNCTIONALITY ---
  const handleSearch = (query: string) => {
      const match = nodes.find(n => n.title.toLowerCase().includes(query.toLowerCase()) || n.format?.toLowerCase().includes(query.toLowerCase()));
      if (match && canvasRef.current) {
          canvasRef.current.flyTo(match.x, match.y, 1);
          setSelectedNodeId(match.id);
      }
  };

  // --- ANCESTRY TRAVERSAL ---
  const getAncestryContext = (startNodeId: string) => {
    let currentNode = nodes.find(n => n.id === startNodeId);
    let accumulatedContext: any = {};
    const mergeKeys = ['massDesireData', 'storyData', 'bigIdeaData', 'mechanismData', 'hvcoData', 'meta'];

    while (currentNode) {
        mergeKeys.forEach(key => {
            if ((currentNode as any)[key]) {
                if (key === 'meta') {
                    accumulatedContext.meta = { ...(currentNode as any).meta, ...accumulatedContext.meta };
                } else if (!accumulatedContext[key]) {
                    accumulatedContext[key] = (currentNode as any)[key];
                }
            }
        });
        if (currentNode.parentId) {
            currentNode = nodes.find(n => n.id === currentNode!.parentId);
        } else {
            currentNode = undefined;
        }
    }
    return accumulatedContext;
  };

  const addNode = (node: NodeData, parentId?: string) => {
      setNodes(prev => [...prev, node]);
      if (parentId) {
          const edge: Edge = {
              id: uuidv4(),
              source: parentId,
              target: node.id
          };
          setEdges(prev => [...prev, edge]);
      }
      return node;
  };

  const handleUpdateNode = (id: string, updates: Partial<NodeData>) => {
      setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const handleNodeAction = async (action: string, nodeId: string, optionId?: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      if (action === 'generate_desires') {
          handleUpdateNode(nodeId, { isLoading: true });
          const result = await GeminiService.generateMassDesires(project);
          handleUpdateNode(nodeId, { isLoading: false, outputTokens: (node.outputTokens || 0) + result.outputTokens });
          if (result.data) {
              result.data.forEach((d: MassDesireOption, i: number) => {
                  addNode({
                      id: uuidv4(),
                      type: NodeType.MASS_DESIRE_NODE,
                      title: d.headline,
                      description: d.description,
                      massDesireData: d,
                      x: node.x + 400,
                      y: node.y + (i - 1) * 250,
                      parentId: nodeId,
                      inputTokens: result.inputTokens
                  }, nodeId);
              });
          }
      }

      if (action === 'expand_personas') {
          handleUpdateNode(nodeId, { isLoading: true });
          // PASS THE MASS DESIRE DATA DOWN
          const massDesire = node.massDesireData;
          
          const result = await GeminiService.generatePersonas(project, massDesire);
          handleUpdateNode(nodeId, { isLoading: false, outputTokens: (node.outputTokens || 0) + result.outputTokens });
          if (result.data) {
              result.data.forEach((p: any, i: number) => {
                  addNode({
                      id: uuidv4(),
                      type: NodeType.PERSONA,
                      title: p.name,
                      description: p.profile,
                      meta: p,
                      massDesireData: massDesire, // Inherit Desire
                      x: node.x + 400,
                      y: node.y + (i - 1) * 250,
                      parentId: nodeId,
                      inputTokens: result.inputTokens
                  }, nodeId);
              });
          }
      }
      
      // REFACTORED: Generate Big Ideas from Persona (The Bridge)
      if (action === 'generate_big_ideas') {
          handleUpdateNode(nodeId, { isLoading: true });
          const ancestry = getAncestryContext(nodeId);
          // Combine local meta (Persona) with ancestry
          const context = { ...ancestry, meta: node.meta };
          
          const result = await GeminiService.generateBigIdeas(project, undefined, context);
          handleUpdateNode(nodeId, { isLoading: false });
          if (result.data) {
              result.data.forEach((idea: BigIdeaOption, i: number) => {
                  addNode({
                      id: uuidv4(),
                      type: NodeType.BIG_IDEA_NODE,
                      title: idea.headline,
                      description: idea.concept,
                      bigIdeaData: idea,
                      massDesireData: node.massDesireData,
                      meta: node.meta, // Pass persona data
                      x: node.x + 400,
                      y: node.y + (i - 1) * 300,
                      parentId: nodeId
                  }, nodeId);
              });
          }
      }

      // REFACTORED: Story now flows FROM Big Idea
      if (action === 'start_story_flow') {
          handleUpdateNode(nodeId, { isLoading: true });
          const ancestry = getAncestryContext(nodeId);
          const bigIdea = node.bigIdeaData;
          
          const result = await GeminiService.generateStoryResearch(project, bigIdea);
          handleUpdateNode(nodeId, { isLoading: false });
          if (result.data) {
              result.data.forEach((story: StoryOption, i: number) => {
                  addNode({
                      id: uuidv4(),
                      type: NodeType.STORY_NODE,
                      title: story.title,
                      description: story.narrative,
                      storyData: story,
                      bigIdeaData: node.bigIdeaData, // Inherit
                      massDesireData: ancestry.massDesireData, // Inherit
                      x: node.x + 400,
                      y: node.y + (i - 1) * 300,
                      parentId: nodeId
                  }, nodeId);
              });
          }
      }

      if (action === 'generate_mechanisms' && node.bigIdeaData) {
          handleUpdateNode(nodeId, { isLoading: true });
          const ancestry = getAncestryContext(nodeId);
          
          // CONTEXT PASSING: PASS PERSONA FOR NAMING LOGIC
          const result = await GeminiService.generateMechanisms(project, node.bigIdeaData, ancestry.meta);
          
          handleUpdateNode(nodeId, { isLoading: false });
          if (result.data) {
              result.data.forEach((mech: MechanismOption, i: number) => {
                  addNode({
                      id: uuidv4(),
                      type: NodeType.MECHANISM_NODE,
                      title: mech.scientificPseudo,
                      description: `UMP: ${mech.ump} | UMS: ${mech.ums}`,
                      mechanismData: mech,
                      bigIdeaData: node.bigIdeaData,
                      x: node.x + 400,
                      y: node.y + (i - 1) * 300,
                      parentId: nodeId
                  }, nodeId);
              });
          }
      }

      if (action === 'generate_hooks') {
           const ancestry = getAncestryContext(nodeId);
           const bigIdea = node.bigIdeaData || ancestry.bigIdeaData;
           const mechanism = node.mechanismData || ancestry.mechanismData;
           const story = node.storyData || ancestry.storyData;
           
           // Fallback objects if flow was skipped
           const safeBigIdea = bigIdea || { headline: "New Concept", concept: "Better Way", targetBelief: "Old Way" };
           const safeMechanism = mechanism || { ump: "Old Problem", ums: "New Soluton", scientificPseudo: "SmartMethod" };
           const safeStory = story || { narrative: node.description || "Brand Story", emotionalTheme: "Hope" };

           handleUpdateNode(nodeId, { isLoading: true });
           
           // CONTEXT PASSING: PASS MASS DESIRE FOR UNAWARE HOOKS
           const result = await GeminiService.generateHooks(
               project, 
               safeBigIdea, 
               safeMechanism, 
               safeStory, 
               ancestry.massDesireData // Passing the desire
           );
           
           handleUpdateNode(nodeId, { isLoading: false });
           if (result.data) {
               result.data.forEach((hook: string, i: number) => {
                   addNode({
                       id: uuidv4(),
                       type: NodeType.HOOK_NODE,
                       title: "Viral Hook",
                       description: hook,
                       hookData: hook,
                       mechanismData: safeMechanism,
                       bigIdeaData: safeBigIdea,
                       storyData: safeStory,
                       massDesireData: ancestry.massDesireData,
                       x: node.x + 400,
                       y: node.y + (i - 2) * 150,
                       parentId: nodeId
                   }, nodeId);
               });
           }
      }

      if (action === 'expand_angles') {
          handleUpdateNode(nodeId, { isLoading: true });
          
          // INTELLIGENT CONTEXT GATHERING
          const ancestry = getAncestryContext(nodeId);
          
          const personaName = ancestry.meta?.name || "General Audience";
          const personaMotivation = ancestry.meta?.motivation || "General Motivation";
          const massDesire = ancestry.massDesireData;
          
          // Determine if we are coming from Mechanism or Story
          const mechanismData = node.mechanismData || ancestry.mechanismData;
          const storyData = node.storyData || ancestry.storyData;
          
          const result = await GeminiService.generateAngles(
              project, 
              personaName, 
              personaMotivation, 
              massDesire,
              mechanismData,
              storyData
          );
          
          handleUpdateNode(nodeId, { isLoading: false });
          
          if (result.data) {
              result.data.forEach((a: any, i: number) => {
                  addNode({
                      id: uuidv4(),
                      type: NodeType.ANGLE,
                      title: a.headline,
                      description: `${a.testingTier}: ${a.hook}`,
                      meta: { ...ancestry.meta, angle: a.hook, ...a },
                      testingTier: a.testingTier,
                      validationStatus: 'PENDING', 
                      mechanismData: mechanismData, // Pass down logic
                      storyData: storyData, // Pass down emotion
                      bigIdeaData: ancestry.bigIdeaData, // Pass down concept
                      massDesireData: ancestry.massDesireData, // Pass down desire
                      x: node.x + 400,
                      y: node.y + (i - 1) * 250,
                      parentId: nodeId
                  }, nodeId);
              });
          }
      }
      
      if (action === 'toggle_validation') {
          const newStatus = node.validationStatus === 'VALIDATED' ? 'PENDING' : 'VALIDATED';
          handleUpdateNode(nodeId, { validationStatus: newStatus });
      }

      if (action === 'generate_hvco' && node.meta) {
           handleUpdateNode(nodeId, { isLoading: true });
           const pain = node.meta.visceralSymptoms?.[0] || "General Pain";
           const result = await GeminiService.generateHVCOIdeas(project, pain);
           handleUpdateNode(nodeId, { isLoading: false });
           if (result.data) {
               result.data.forEach((hvco: HVCOOption, i: number) => {
                   addNode({
                       id: uuidv4(),
                       type: NodeType.HVCO_NODE,
                       title: hvco.title,
                       description: hvco.hook,
                       hvcoData: hvco,
                       meta: node.meta,
                       x: node.x + 400,
                       y: node.y + (i - 1) * 200,
                       parentId: nodeId
                   }, nodeId);
               });
           }
      }

      if (action === 'generate_creatives' || action === 'open_format_selector') {
          // STRICT VALIDATION ENFORCEMENT MOVED TO UI STATE, but keeping strict logic here too
          if (node.type === NodeType.ANGLE && node.validationStatus !== 'VALIDATED') {
              return; // UI should handle disabling, but this is safety
          }
          setPendingFormatParentId(nodeId);
          setIsFormatSelectorOpen(true);
      }
      
      if (action === 'promote_creative') {
          handleUpdateNode(nodeId, { stage: CampaignStage.SCALING, isWinning: true });
      }

      if (action === 'generate_landing_page') {
          const ancestry = getAncestryContext(nodeId);
          handleUpdateNode(nodeId, { isLoading: true });
          
          const story = ancestry.storyData || { narrative: "General Brand Story", emotionalTheme: "Trust" };
          const bigIdea = ancestry.bigIdeaData || { headline: "New Opportunity", concept: "Better Way", targetBelief: "Old Way" };
          const mechanism = ancestry.mechanismData || { scientificPseudo: "Smart Tech", ums: "Works Fast", ump: "Slow Results" };
          const hook = node.adCopy?.headline || node.title;
          
          // CONTEXT PASSING: PASS COLISEUM KEYWORDS FOR COPYWRITING
          const coliseumKeywords = ancestry.meta?.coliseumKeywords || [];

          const result = await GeminiService.generateSalesLetter(project, story, bigIdea, mechanism, hook, coliseumKeywords);
          handleUpdateNode(nodeId, { isLoading: false });
          
          if (result.data) {
              addNode({
                  id: uuidv4(),
                  type: NodeType.LANDING_PAGE_NODE,
                  title: "Sales Page / Advertorial",
                  description: "Congruent Landing Page Draft",
                  fullSalesLetter: result.data,
                  x: node.x + 450,
                  y: node.y,
                  parentId: nodeId,
                  outputTokens: result.outputTokens
              }, nodeId);
          }
      }
  };

  const handleGenerateCreatives = async () => {
      if (!pendingFormatParentId) return;
      const parentNode = nodes.find(n => n.id === pendingFormatParentId);
      if (!parentNode) return;

      setIsFormatSelectorOpen(false);
      handleUpdateNode(pendingFormatParentId, { isLoading: true });
      
      const ancestry = getAncestryContext(pendingFormatParentId);
      const fullStrategyContext = {
          ...ancestry,
          ...parentNode // Merge parent (Angle) data directly
      };

      const formatsToGen = Array.from(selectedFormats) as CreativeFormat[];
      let verticalOffset = 0;

      // Use the ANGLE (hook) from the Angle Node
      let angleToUse = parentNode.title;
      if (parentNode.type === NodeType.ANGLE && parentNode.meta?.hook) angleToUse = parentNode.meta.hook;
      else if (parentNode.type === NodeType.HOOK_NODE && parentNode.hookData) angleToUse = parentNode.hookData;
      else if (parentNode.type === NodeType.BIG_IDEA_NODE && parentNode.bigIdeaData) angleToUse = `Show concept: ${parentNode.bigIdeaData.concept}`;
      else if (parentNode.type === NodeType.MECHANISM_NODE && parentNode.mechanismData) angleToUse = `Show the action of: ${parentNode.mechanismData.ums}`; 
      else if (parentNode.type === NodeType.HVCO_NODE && parentNode.hvcoData) angleToUse = parentNode.hvcoData.title;
      else if (parentNode.type === NodeType.STORY_NODE && parentNode.storyData) angleToUse = parentNode.storyData.title;

      for (const fmt of formatsToGen) {
          const isHVCO = parentNode.type === NodeType.HVCO_NODE;

          const strategyRes = await GeminiService.generateCreativeStrategy(
              project, fullStrategyContext, angleToUse, fmt, isHVCO
          );
          
          if (strategyRes.data) {
              const strategy = strategyRes.data;
              
              let imageUrl: string | null = null;
              let carouselImages: string[] = [];
              let imageTokens = 0;
              let finalGenerationPrompt = "";
              
              if (fmt.includes('Carousel')) {
                   const slidesRes = await GeminiService.generateCarouselSlides(
                       project, fmt, angleToUse, strategy.visualScene, strategy.visualStyle, fullStrategyContext,
                       strategy.congruenceRationale
                   );
                   if (slidesRes.data && slidesRes.data.imageUrls.length > 0) {
                       imageUrl = slidesRes.data.imageUrls[0];
                       carouselImages = slidesRes.data.imageUrls;
                       finalGenerationPrompt = slidesRes.data.prompts[0];
                       imageTokens = slidesRes.inputTokens + slidesRes.outputTokens;
                   }
              } else {
                   const imgRes = await GeminiService.generateCreativeImage(
                       project, 
                       fullStrategyContext, 
                       angleToUse, 
                       fmt, 
                       strategy.visualScene, 
                       strategy.visualStyle, 
                       "1:1", 
                       strategy.embeddedText,
                       undefined,
                       strategy.congruenceRationale
                   );
                   imageUrl = imgRes.data.imageUrl;
                   finalGenerationPrompt = imgRes.data.finalPrompt;
                   imageTokens = imgRes.inputTokens + imgRes.outputTokens;
              }

              addNode({
                   id: uuidv4(),
                   type: NodeType.CREATIVE,
                   title: strategy.headline,
                   description: strategy.visualScene,
                   format: fmt,
                   imageUrl: imageUrl || undefined,
                   carouselImages: carouselImages.length > 1 ? carouselImages : undefined,
                   adCopy: {
                       headline: strategy.headline,
                       primaryText: strategy.primaryText,
                       cta: strategy.cta
                   },
                   meta: { 
                       ...ancestry.meta, 
                       angle: angleToUse, 
                       concept: {
                           visualScene: strategy.visualScene,
                           visualStyle: strategy.visualStyle,
                           copyAngle: strategy.headline,
                           rationale: strategy.rationale,
                           congruenceRationale: strategy.congruenceRationale,
                           uglyAdStructure: strategy.uglyAdStructure
                       }, 
                       finalGenerationPrompt 
                   },
                   storyData: parentNode.storyData || ancestry.storyData,
                   bigIdeaData: parentNode.bigIdeaData || ancestry.bigIdeaData,
                   mechanismData: parentNode.mechanismData || ancestry.mechanismData,
                   massDesireData: parentNode.massDesireData || ancestry.massDesireData,
                   
                   x: parentNode.x + 450,
                   y: parentNode.y + verticalOffset,
                   parentId: parentNode.id,
                   
                   inputTokens: strategyRes.inputTokens + imageTokens,
                   outputTokens: strategyRes.outputTokens
               }, parentNode.id);
               verticalOffset += 400;
          }
      }
      
      handleUpdateNode(pendingFormatParentId, { isLoading: false });
      setSelectedFormats(new Set());
      setPendingFormatParentId(null);
  };

  const handleRunSimulation = async () => {
      setSimulating(true);
      const creatives = nodes.filter(n => n.type === NodeType.CREATIVE && n.stage !== CampaignStage.SCALING);
      
      for (const node of creatives) {
           handleUpdateNode(node.id, { isLoading: true });
           const pred = await GeminiService.predictCreativePerformance(project, node);
           handleUpdateNode(node.id, { isLoading: false, prediction: pred.data });
      }
      setSimulating(false);
  };
  
  const handleNodeMove = (id: string, x: number, y: number) => {
      setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  };
  
  const handleRegenerateCreative = async (id: string, aspectRatio: string) => {
      const node = nodes.find(n => n.id === id);
      if (!node || !node.meta?.concept) return;
      
      handleUpdateNode(id, { isLoading: true });
      const concept = node.meta.concept;
      
      const ancestry = getAncestryContext(id);
      const fullStrategyContext = { ...ancestry, ...node };
      
      const imgRes = await GeminiService.generateCreativeImage(
           project, fullStrategyContext, node.meta.angle, node.format!, 
           concept.visualScene, concept.visualStyle, aspectRatio,
           node.title,
           undefined, concept.congruenceRationale 
      );
      
      handleUpdateNode(id, { 
          isLoading: false, 
          imageUrl: imgRes.data.imageUrl || node.imageUrl,
          meta: { ...node.meta, finalGenerationPrompt: imgRes.data.finalPrompt } 
      });
  };

  const vaultNodes = nodes.filter(n => n.stage === CampaignStage.SCALING);

  return (
    <div className="flex w-full h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar activeView={activeView} setActiveView={setActiveView} onOpenConfig={() => setIsConfigOpen(true)} />
      
      <div className="flex-1 relative flex flex-col overflow-hidden">
        <Header 
            activeView={activeView} 
            labNodesCount={nodes.length} 
            vaultNodesCount={vaultNodes.length}
            simulating={simulating}
            onRunSimulation={handleRunSimulation}
            diversityScore={diversityScore}
            onAutoLayout={handleAutoLayout}
            onSearch={handleSearch}
            nodes={nodes} // PASS NODES TO HEADER
        />
        
        <div className="flex-1 relative">
           {activeView === 'LAB' ? (
               <Canvas 
                   ref={canvasRef}
                   nodes={nodes}
                   edges={edges}
                   onNodeAction={(action, id) => handleNodeAction(action, id)}
                   selectedNodeId={selectedNodeId}
                   onSelectNode={(id) => { setSelectedNodeId(id); if (id) setInspectorNodeId(id); else setInspectorNodeId(null); }}
                   onNodeMove={handleNodeMove}
                   highlightedEdgeIds={highlightedEdgeIds}
                   highlightedNodeIds={highlightedNodeIds}
               />
           ) : (
               <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto h-full">
                   {vaultNodes.map(node => (
                       <div key={node.id} className="relative h-[400px]">
                           <Node 
                               data={node} 
                               selected={selectedNodeId === node.id} 
                               onClick={() => { setSelectedNodeId(node.id); setInspectorNodeId(node.id); }} 
                               onAction={handleNodeAction}
                               isGridView={true}
                           />
                       </div>
                   ))}
                   {vaultNodes.length === 0 && (
                       <div className="col-span-full flex flex-col items-center justify-center text-slate-400 mt-20">
                           <p>No winning assets in the vault yet.</p>
                           <button onClick={() => setActiveView('LAB')} className="text-blue-600 font-bold mt-2">Go to Lab</button>
                       </div>
                   )}
               </div>
           )}
           
           {inspectorNodeId && (
               <div className="absolute top-0 right-0 bottom-0 z-20 pointer-events-none flex justify-end">
                   <Inspector 
                       node={nodes.find(n => n.id === inspectorNodeId)!} 
                       onClose={() => setInspectorNodeId(null)}
                       onUpdate={(id, data) => handleUpdateNode(id, data)}
                       onRegenerate={handleRegenerateCreative}
                       onPromote={(id) => handleNodeAction('promote_creative', id)}
                       onAnalyze={async (id) => {
                            const node = nodes.find(n => n.id === id);
                            if(node) {
                                handleUpdateNode(id, { isLoading: true });
                                const pred = await GeminiService.predictCreativePerformance(project, node);
                                handleUpdateNode(node.id, { isLoading: false, prediction: pred.data });
                            }
                       }}
                       project={project}
                   />
               </div>
           )}
        </div>
      </div>

      <ConfigModal 
          isOpen={isConfigOpen} 
          onClose={() => setIsConfigOpen(false)} 
          project={project}
          onUpdateProject={(updates) => setProject(prev => ({ ...prev, ...updates }))}
          onContextAnalyzed={(context) => setProject(prev => ({ ...prev, ...context }))}
      />

      <FormatSelector 
          isOpen={isFormatSelectorOpen}
          onClose={() => setIsFormatSelectorOpen(false)}
          selectedFormats={selectedFormats}
          onSelectFormat={(fmt) => {
              const next = new Set(selectedFormats);
              if (next.has(fmt)) next.delete(fmt);
              else next.add(fmt);
              setSelectedFormats(next);
          }}
          onConfirm={handleGenerateCreatives}
          formatGroups={FORMAT_GROUPS}
      />
    </div>
  );
};

export default App;
