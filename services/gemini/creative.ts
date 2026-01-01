
import { Type } from "@google/genai";
import { 
  ProjectContext, 
  CreativeFormat, 
  CreativeStrategyResult,
  GenResult, 
  StoryOption, 
  BigIdeaOption, 
  MechanismOption, 
  LanguageRegister, 
  StrategyMode,
  MarketAwareness,
  UglyAdStructure
} from "../../types";
import { ai, extractJSON, generateWithRetry } from "./client";
import { getFormatTextGuide } from "./imageText"; // IMPORT THE SOURCE OF TRUTH

export const generateSalesLetter = async (
  project: ProjectContext,
  story: StoryOption,
  bigIdea: BigIdeaOption,
  mechanism: MechanismOption,
  hook: string,
  coliseumKeywords: string[] = [] // NEW PARAMETER
): Promise<GenResult<string>> => {
  const model = "gemini-3-flash-preview";
  const country = project.targetCountry || "Indonesia";
  const awareness = project.marketAwareness || MarketAwareness.PROBLEM_AWARE;
  
  // 1. Build Keyword Instruction
  let keywordInstruction = "";
  if (coliseumKeywords && coliseumKeywords.length > 0) {
      keywordInstruction = `
      **CRITICAL VOCABULARY RULE (THE TRIBE LANGUAGE):**
      You MUST use the following insider slang/keywords naturally within the story:
      [${coliseumKeywords.join(", ")}].
      
      DO NOT TRANSLATE THESE. Use them raw to prove we are part of the community.
      `;
  }

  let structureInstruction = "";
  if (awareness === MarketAwareness.UNAWARE) {
      structureInstruction = `
      **FRAMEWORK: 8-STEP INDIRECT STORY LEAD (Andromeda Standard for UNAWARE)**
      
      1. ** The Hook (Behavior/Emotion):** Start with a specific behavior or feeling (e.g., "The sound Max makes at 2 AM"). NO PRODUCT MENTION.
      2. ** Instant Identity:** Call out who this is for indirectly (e.g., "If you're a light sleeper...").
      3. ** Amplify Emotion:** Twist the knife. Describe the visceral pain/shame/frustration.
      4. ** The Real Problem (UMP):** Reveal the *real* enemy (The Mechanism of the Problem). Why other solutions failed.
      5. ** The New Mechanism (UMS):** Introduce the new concept/shift (Big Idea). Still no product name.
      6. ** The Discovery:** How was this found? (The "Epiphany" moment).
      7. ** The Transformation:** What life looks like now.
      8. ** The Offer/CTA:** ONLY NOW introduce ${project.productName} and the offer.
      
      TONE: Confessional, vulnerable, "I found this weird thing...".
      `;
  } else if (awareness === MarketAwareness.PROBLEM_AWARE) {
      structureInstruction = `
      **FRAMEWORK: PAS (Problem - Agitate - Solution)**
      1. Call out the Pain/Symptom immediately.
      2. Agitate: "It gets worse if ignored..."
      3. Introduce the Mechanism (Why it happens).
      4. Introduce the Solution (${project.productName}).
      5. Social Proof & Offer.
      `;
  } else {
      structureInstruction = `
      **FRAMEWORK: DIRECT RESPONSE OFFER (Mafia Style)**
      1. BOLD PROMISE: What result in what timeframe?
      2. THE MECHANISM: Why it works (Scientific/Logical proof).
      3. VALUE STACK: Everything they get.
      4. RISK REVERSAL: The "Insane" Guarantee.
      5. SCARCITY: Why buy now?
      `;
  }

  const prompt = `
    ROLE: Direct Response Copywriter (Long Form / Advertorial Specialist).
    TARGET COUNTRY: ${country}. 
    
    TASK: Write a high-converting Sales Letter (long-form Facebook Ad) in the NATIVE language of ${country}.
    
    ${structureInstruction}
    
    STRATEGY STACK (MUST CONNECT ALL DOTS):
    1. HOOK: "${hook}" (The attention grabber).
    2. STORY: "${story.narrative}" (The emotional bridge).
    3. THE SHIFT (Big Idea): "${bigIdea.headline}" - "${bigIdea.concept}" (The new perspective).
    4. THE SOLUTION (Mechanism): "${mechanism.scientificPseudo}" - "${mechanism.ums}" (The specific logic of how it works).
    5. OFFER: ${project.offer} for ${project.productName}.
    
    PRODUCT DETAILS:
    ${project.productDescription}

    ${keywordInstruction}
    
    FORMAT: Markdown. Short paragraphs (1-2 sentences). Use bolding for emphasis on core benefits.
  `;

  const response = await generateWithRetry({
    model,
    contents: prompt
  });

  return {
    data: response.text || "",
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};

/**
 * ONE-SHOT STRATEGY GENERATOR
 * Combines Visual Concept, Visual Text Overlay, and Ad Copy into a single reasoning step.
 * Reduces latency and ensures congruency between what is seen (Image) and what is read (Copy).
 */
export const generateCreativeStrategy = async (
  project: ProjectContext, 
  fullStrategyContext: any, 
  angle: string, 
  format: CreativeFormat,
  isHVCOFlow: boolean = false
): Promise<GenResult<CreativeStrategyResult>> => {
  const model = "gemini-3-flash-preview";
  const strategyMode = project.strategyMode || StrategyMode.LOGIC;
  const country = project.targetCountry || "Indonesia";
  const register = project.languageRegister || LanguageRegister.CASUAL;
  
  // Robust Extraction for Context
  const persona = fullStrategyContext || {};
  const personaPain = persona.visceralSymptoms ? persona.visceralSymptoms.join(", ") : "General frustration";
  const mech = fullStrategyContext?.mechanismData;
  const bigIdea = fullStrategyContext?.bigIdeaData;
  const story = fullStrategyContext?.storyData;
  const massDesire = fullStrategyContext?.massDesireData; // FIX: Extract Mass Desire
  
  // CONTEXT AGGREGATION: COLISEUM KEYWORDS (The Secret Sauce)
  const coliseumKeywords = persona.meta?.coliseumKeywords || persona.coliseumKeywords || [];
  let keywordInstruction = "";
  
  if (coliseumKeywords.length > 0) {
      keywordInstruction = `
      **MANDATORY VOCABULARY (Coliseum Keywords):**
      You MUST use the following exact insider words/slang naturally in the copy: 
      [${coliseumKeywords.join(", ")}].
      Do NOT translate these words. Use them raw to prove you belong to the tribe.
      `;
  } else if (register === LanguageRegister.SLANG) {
      keywordInstruction = `
      **MANDATORY TONE:**
      Use NATIVE slang. If Indonesian: "Gue/Lo", "Anjrit", "Sumpah", "Valid".
      If English: "ngl", "fr", "literally".
      `;
  }

  // FORCE NATIVE/UGLY MODE (Andromeda Standard)
  const strategyInstruction = `
    **MANDATORY NATIVE RULE (Andromeda Standard):**
    - DO NOT make this look like a professional ad. It must look like an organic user post.
    - VISUAL: "Thoughtful but Not Pretty". Use amateur aesthetics, low-res vibes, or screenshots (Notes App, WhatsApp, Reddit).
    - PATTERN INTERRUPT: Use "strange visuals" or "visual anomalies" to stop the scroll.
    - NO BRANDING: No polished logos or brand colors. Use system fonts (Arial, Helvetica, San Francisco).
    - PLATFORM UI: Mimic the UX of the platform (Twitter thread, Gmail inbox, iPhone notification) perfectly.
  `;

  // USE THE SOURCE OF TRUTH FOR FORMAT INSTRUCTIONS
  const formatInstruction = getFormatTextGuide(format);

  const prompt = `
    # ROLE: World-Class native Ad Specialist (Native Advertising Expert)

    TASK: Design a Creative Asset that is "Invisible" (cannot be detected as an ad by the brain's filter).

    **PRINCIPLES:**
    1. **Authenticity Bias:** People trust raw content more than polished studios.
    2. **Banner Blindness:** Professional ads get ignored. Native ads get read.

    **CONTEXT:**
    Format: ${format}
    Target Country: ${country} (Native Language for Copy & Embedded Text)
    Language Register: ${register}

    **CORE INPUTS (ROOT CONTEXT):**
    Product: ${project.productName} - ${project.productDescription}
    Winning Hook/Angle: "${angle}"
    Mechanism Logic: ${mech?.ums || "Standard benefit"}
    
    **PERSONA DATA (RESEARCH CONTEXT):**
    Who: ${persona.name || "Target User"}
    Symptoms: ${personaPain}
    ${massDesire ? `CORE DESIRE (Life Force 8): "${massDesire.headline}" (${massDesire.type})` : ''} 
    ${story ? `Narrative Context: ${story.narrative}` : ''}
    ${bigIdea ? `Big Idea Shift: ${bigIdea.concept}` : ''}
    
    ${keywordInstruction}

    **STRATEGIC GUIDELINES:**
    ${strategyInstruction}
    ${formatInstruction}
    
    **TASK:** 
    Design the COMPLETE Creative Asset in one cohesive step.
    1. **Visual Scene:** A detailed description of the image action that proves the hook.
    2. **Embedded Text (Overlay):** The specific text that appears ON the image.
    3. **Ad Copy (Caption):** The primary text and headline for the ad post.

    **CRITICAL:** 
    - The *Embedded Text* and *Visual Scene* must work together to create "Congruence" (The image proves the text).
    - **PSYCHOLOGICAL ALIGNMENT:** The tone must match the Core Desire (${massDesire?.type || "General"}). If it's Fear, be urgent. If it's Status, be aspirational.
    
    **native AD FORMULA (MANDATORY):**
    You MUST fill the 'uglyAdStructure' object with:
    - keyword: The specific tribe keyword used.
    - emotion: The raw emotion being triggered.
    - qualifier: Who specifically is this ad for?
    - outcome: The transformation promised.

    **OUTPUT JSON:**
    - visualScene: Specific action/setup for the image generator.
    - visualStyle: Camera type, lighting, mood.
    - embeddedText: The exact text string to render on the image (Native Language).
    - primaryText: Ad caption (Native Language).
    - headline: Ad headline (Max 7 words, Native Language).
    - cta: Button text (e.g. Shop Now).
    - rationale: Why this combination hooks the persona.
    - congruenceRationale: How the image visually proves the text claim.
    - uglyAdStructure: { keyword, emotion, qualifier, outcome } (MANDATORY).
  `;

  try {
    const response = await generateWithRetry({
      model,
      contents: prompt,
      config: {
        temperature: 1.0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            visualScene: { type: Type.STRING },
            visualStyle: { type: Type.STRING },
            embeddedText: { type: Type.STRING },
            primaryText: { type: Type.STRING },
            headline: { type: Type.STRING },
            cta: { type: Type.STRING },
            rationale: { type: Type.STRING },
            congruenceRationale: { type: Type.STRING },
            uglyAdStructure: {
                type: Type.OBJECT,
                properties: {
                    keyword: { type: Type.STRING },
                    emotion: { type: Type.STRING },
                    qualifier: { type: Type.STRING },
                    outcome: { type: Type.STRING }
                },
                required: ["keyword", "emotion", "qualifier", "outcome"]
            }
          },
          required: ["visualScene", "visualStyle", "embeddedText", "primaryText", "headline", "cta", "rationale", "uglyAdStructure"]
        }
      }
    });

    return {
      data: extractJSON(response.text || "{}"),
      inputTokens: response.usageMetadata?.promptTokenCount || 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount || 0
    };
  } catch (error) {
    console.error("Creative Strategy Generation Error", error);
    throw error;
  }
};
