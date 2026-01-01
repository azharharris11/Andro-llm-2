
import { Type } from "@google/genai";
import { ProjectContext, NodeData, PredictionMetrics, GenResult, AdCopy, LanguageRegister, MarketAwareness, FunnelStage, StrategyMode } from "../../types";
import { ai, extractJSON } from "./client";

export const checkAdCompliance = async (adCopy: AdCopy): Promise<string> => {
  const model = "gemini-3-flash-preview";
  const prompt = `
    ROLE: Facebook/TikTok Ad Policy Expert.
    
    TASK: Review the following ad copy for policy violations.
    
    HEADLINE: ${adCopy.headline}
    PRIMARY TEXT: ${adCopy.primaryText}
    
    CHECKLIST:
    1. Personal Attributes (Directly asserting user has a disability, medical condition, or financial status).
    2. Before/After claims (Unrealistic results).
    3. Misleading/False Claims.
    4. Profanity/Glitch text.
    
    OUTPUT:
    Return "Compliant" if it passes.
    If it fails, return a short warning explaining WHY (max 1 sentence).
  `;

  try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });
      return response.text?.trim() || "Compliance Check Failed";
  } catch (e) {
      console.error("Compliance Check Error", e);
      return "Error checking compliance.";
  }
};

export const predictCreativePerformance = async (
    project: ProjectContext, 
    node: NodeData
): Promise<GenResult<PredictionMetrics>> => {
    const model = "gemini-2.5-flash";

    const prompt = `
      ROLE: Senior Media Buyer & Creative Strategist (Direct Response Audit).
      
      TASK: Audit this creative asset and predict its potential performance on Meta/TikTok.
      Do NOT be nice. Be critical.
      
      CONTEXT:
      Product: ${project.productName}
      Target Audience: ${project.targetAudience}
      Country: ${project.targetCountry}
      
      CREATIVE ASSET TO AUDIT:
      Format: ${node.format}
      Headline: "${node.adCopy?.headline || node.title}"
      Primary Text: "${node.adCopy?.primaryText || ''}"
      Visual Description: "${node.description || 'See image'}"
      Insight/Angle: "${node.meta?.angle || ''}"
      
      SCORING CRITERIA:
      1. Hook Strength: Does it stop the scroll in 0.5s? (Pattern Interrupt)
      2. Clarity: Is the offer/benefit immediately understood?
      3. Emotional Resonance: Does it hit a nerve or just state facts?
      4. Congruency: Does the visual prove the text? (The Golden Thread)
      
      OUTPUT JSON:
      - score: Number 0-100 (Winning ads are usually 85+).
      - hookStrength: Enum (Weak, Moderate, Strong, Viral).
      - clarity: Enum (Confusing, Clear, Crystal Clear).
      - emotionalResonance: Enum (Flat, Engaging, Visceral).
      - reasoning: Max 2 sentences. Brutally honest feedback on WHY it got this score.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER },
                        hookStrength: { type: Type.STRING, enum: ["Weak", "Moderate", "Strong", "Viral"] },
                        clarity: { type: Type.STRING, enum: ["Confusing", "Clear", "Crystal Clear"] },
                        emotionalResonance: { type: Type.STRING, enum: ["Flat", "Engaging", "Visceral"] },
                        reasoning: { type: Type.STRING }
                    },
                    required: ["score", "hookStrength", "reasoning"]
                }
            }
        });

        const data = extractJSON<PredictionMetrics>(response.text || "{}");
        
        return {
            data: data,
            inputTokens: response.usageMetadata?.promptTokenCount || 0,
            outputTokens: response.usageMetadata?.candidatesTokenCount || 0
        };

    } catch (e) {
        console.error("Prediction Error", e);
        return { 
            data: { score: 0, hookStrength: 'Weak', clarity: 'Confusing', emotionalResonance: 'Flat', reasoning: "Analysis failed." }, 
            inputTokens: 0, 
            outputTokens: 0 
        };
    }
};

export const recommendStrategy = async (project: ProjectContext): Promise<StrategyMode> => {
    const model = "gemini-3-flash-preview";
    const prompt = `
        ROLE: Marketing Strategist.
        TASK: Determine the single best Strategy Playbook for this product.
        
        PRODUCT: ${project.productName}
        DESCRIPTION: ${project.productDescription}
        AUDIENCE: ${project.targetAudience}
        
        OPTIONS:
        1. LOGIC (The Doctor): High trust, high price, health, B2B, or complex problem-solving. Needs mechanism and proof.
        2. VISUAL (The Artist): Lifestyle, fashion, food, low risk, impulse buy. Needs aesthetics and vibe.
        3. OFFER (The Merchant): Commodity, dropshipping, flash sale, discount-heavy. Needs scarcity.
        
        OUTPUT JSON:
        { "mode": "LOGIC" | "VISUAL" | "OFFER" }
    `;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { mode: { type: Type.STRING } }
                }
            }
        });
        const data = extractJSON<{mode: string}>(response.text || "{}");
        // Validate
        if (["LOGIC", "VISUAL", "OFFER"].includes(data.mode)) {
            return data.mode as StrategyMode;
        }
        return StrategyMode.LOGIC;
    } catch (e) {
        return StrategyMode.LOGIC;
    }
};

export const analyzeLandingPageContext = async (markdown: string): Promise<ProjectContext> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `You are a Data Analyst for a Direct Response Agency. 
    Analyze the following raw data (Landing Page Content) to extract the foundational truths.
    
    RAW DATA:
    ${markdown.substring(0, 30000)}

    TASKS:
    1. Determine the 'Market Awareness' level.
       - If it explains "What is X?", it's Unaware/Problem Aware.
       - If it compares "Us vs Them", it's Solution Aware.
       - If it's a hard offer page, it's Product/Most Aware.
    2. Analyze Tone/Register.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          productName: { type: Type.STRING },
          productDescription: { type: Type.STRING, description: "A punchy, benefit-driven 1-sentence value prop." },
          targetAudience: { type: Type.STRING, description: "Specific demographics and psychographics." },
          targetCountry: { type: Type.STRING },
          brandVoice: { type: Type.STRING },
          brandVoiceOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
          offer: { type: Type.STRING, description: "The primary hook or deal found on the page." },
          brandCopyExamples: { type: Type.STRING, description: "2-3 raw sentences/headlines found on the page." },
          languageRegister: { type: Type.STRING, enum: [
             'Street/Slang (Gue/Lo) - Gen Z/Lifestyle', 
             'Casual/Polite (Aku/Kamu) - General Wellness/Mom', 
             'Formal/Professional (Anda/Saya) - B2B/Luxury/Medical'
          ]},
          marketAwareness: { type: Type.STRING, enum: [
             'Unaware (No knowledge of problem)',
             'Problem Aware (Knows problem, seeks solution)',
             'Solution Aware (Knows solutions, comparing options)',
             'Product Aware (Knows you, needs a deal)',
             'Most Aware (Ready to buy, needs urgency)'
          ]}
        },
        required: ["productName", "productDescription", "targetAudience"]
      }
    }
  });

  const data = extractJSON<Partial<ProjectContext>>(response.text || "{}");
  
  // Auto-derive funnel stage
  let derivedFunnel = FunnelStage.TOF;
  if (data.marketAwareness?.includes("Solution")) derivedFunnel = FunnelStage.MOF;
  if (data.marketAwareness?.includes("Product") || data.marketAwareness?.includes("Most")) derivedFunnel = FunnelStage.BOF;

  return {
    productName: data.productName || "Unknown Product",
    productDescription: data.productDescription || "",
    targetAudience: data.targetAudience || "General Audience",
    targetCountry: data.targetCountry || "USA",
    brandVoice: data.brandVoice || "Professional",
    brandVoiceOptions: data.brandVoiceOptions || [],
    offer: data.offer || "Shop Now",
    offerOptions: [],
    brandCopyExamples: data.brandCopyExamples || "",
    landingPageUrl: "",
    languageRegister: data.languageRegister as LanguageRegister || LanguageRegister.CASUAL,
    marketAwareness: data.marketAwareness as MarketAwareness || MarketAwareness.PROBLEM_AWARE,
    funnelStage: derivedFunnel
  } as ProjectContext;
};

export const analyzeImageContext = async (base64Image: string): Promise<ProjectContext> => {
  const base64Data = base64Image.split(',')[1] || base64Image;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Data } },
        { text: "Analyze this product image. Extract Product Name, Description, Target Audience. Infer Brand Voice, Offers, Language Register and Market Awareness Level." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          productName: { type: Type.STRING },
          productDescription: { type: Type.STRING },
          targetAudience: { type: Type.STRING },
          targetCountry: { type: Type.STRING },
          brandVoice: { type: Type.STRING },
          brandVoiceOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
          offer: { type: Type.STRING },
          brandCopyExamples: { type: Type.STRING },
          languageRegister: { type: Type.STRING, enum: [
             'Street/Slang (Gue/Lo) - Gen Z/Lifestyle', 
             'Casual/Polite (Aku/Kamu) - General Wellness/Mom', 
             'Formal/Professional (Anda/Saya) - B2B/Luxury/Medical'
          ]},
          marketAwareness: { type: Type.STRING, enum: [
             'Unaware (No knowledge of problem)',
             'Problem Aware (Knows problem, seeks solution)',
             'Solution Aware (Knows solutions, comparing options)',
             'Product Aware (Knows you, needs a deal)',
             'Most Aware (Ready to buy, needs urgency)'
          ]}
        },
        required: ["productName", "productDescription"]
      }
    }
  });

  const data = extractJSON<Partial<ProjectContext>>(response.text || "{}");

  // Auto-derive funnel stage
  let derivedFunnel = FunnelStage.TOF;
  if (data.marketAwareness?.includes("Solution")) derivedFunnel = FunnelStage.MOF;
  if (data.marketAwareness?.includes("Product") || data.marketAwareness?.includes("Most")) derivedFunnel = FunnelStage.BOF;

  return {
    productName: data.productName || "Analyzed Product",
    productDescription: data.productDescription || "A revolutionary product.",
    targetAudience: data.targetAudience || "General Audience",
    targetCountry: data.targetCountry || "USA", 
    brandVoice: data.brandVoice || "Visual & Aesthetic",
    brandVoiceOptions: data.brandVoiceOptions || [],
    offer: data.offer || "Check it out",
    offerOptions: [],
    brandCopyExamples: data.brandCopyExamples || "",
    languageRegister: data.languageRegister as LanguageRegister || LanguageRegister.CASUAL,
    marketAwareness: data.marketAwareness as MarketAwareness || MarketAwareness.PROBLEM_AWARE,
    funnelStage: derivedFunnel
  } as ProjectContext;
};
