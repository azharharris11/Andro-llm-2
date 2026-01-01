
import { Type } from "@google/genai";
import { ProjectContext, CreativeFormat, GenResult, MarketAwareness } from "../../types";
import { ai, extractJSON, generateWithRetry } from "./client";
import { 
    PromptContext, 
    ENHANCERS, 
    getSafetyGuidelines, 
    getCulturePrompt, 
    getPersonaVisualContext, 
    parseAngle, 
    getSubjectFocus 
} from "./imageUtils";
import { generateAIWrittenPrompt } from "./imagePrompts";

export const generateCreativeImage = async (
  project: ProjectContext,
  persona: any,
  angle: string,
  format: CreativeFormat,
  visualScene: string,
  visualStyle: string,
  aspectRatio: string = "1:1",
  embeddedText: string, // NEW: Passed directly from Strategy
  referenceImageBase64?: string,
  congruenceRationale?: string
): Promise<GenResult<{ imageUrl: string | null; finalPrompt: string }>> => {
  
  const model = project.imageModel === 'pro' 
      ? "gemini-3-pro-image-preview" 
      : "gemini-2.5-flash-image";

  console.log(`🎨 Generating Image using Model: ${model} | Format: ${format}`);
  
  const country = project.targetCountry || "USA";
  const parsedAngle = parseAngle(angle);
  const culturePrompt = getCulturePrompt(country);
  const personaVisuals = getPersonaVisualContext(persona);
  
  // 2. GET PSYCHOLOGICAL BLOCKING
  const subjectFocus = getSubjectFocus(
    project.marketAwareness || MarketAwareness.PROBLEM_AWARE, 
    personaVisuals, 
    parsedAngle, 
    project
  );

  const isUglyFormat = [
    CreativeFormat.UGLY_VISUAL, 
    CreativeFormat.MS_PAINT, 
    CreativeFormat.MEME, 
    CreativeFormat.CARTOON, 
    CreativeFormat.STICKY_NOTE_REALISM
  ].includes(format);

  const isNativeStory = [
    CreativeFormat.UGC_MIRROR, CreativeFormat.PHONE_NOTES, CreativeFormat.TWITTER_REPOST, 
    CreativeFormat.SOCIAL_COMMENT_STACK, CreativeFormat.HANDHELD_TWEET, CreativeFormat.EDUCATIONAL_RANT,
    CreativeFormat.CHAT_CONVERSATION, CreativeFormat.DM_NOTIFICATION, CreativeFormat.REMINDER_NOTIF
  ].includes(format);

  // DETERMINE ENHANCER
  let appliedEnhancer = ENHANCERS.PROFESSIONAL;
  if (isUglyFormat) appliedEnhancer = ENHANCERS.AUTHENTIC_UGC;
  else if (isNativeStory || format === CreativeFormat.CAROUSEL_REAL_STORY) appliedEnhancer = ENHANCERS.UGC;

  // DEFINE MISSING CONTEXT VARIABLES
  const safety = getSafetyGuidelines(isUglyFormat);
  const moodPrompt = `Lighting: ${visualStyle || "Natural, Authentic"}. Mood: High conversion direct response.`;

  const fullStoryContext = {
      story: persona.storyData,
      mechanism: persona.mechanismData,
      bigIdea: persona.bigIdeaData
  };

  // 4. PACK FULL CONTEXT
  const ctx: PromptContext = {
      project, format, parsedAngle, visualScene, visualStyle, 
      textCopyInstruction: "", 
      personaVisuals, moodPrompt, culturePrompt, 
      subjectFocus,
      enhancer: appliedEnhancer,
      safety,
      fullStoryContext,
      congruenceRationale,
      aspectRatio,
      rawPersona: persona,
      embeddedText // Now using the passed argument
  };

  const finalPrompt = await generateAIWrittenPrompt(ctx);

  const parts: any[] = [{ text: finalPrompt }];
  
  // Handle Reference Images
  if (referenceImageBase64) {
      const base64Data = referenceImageBase64.split(',')[1] || referenceImageBase64;
      parts.unshift({ inlineData: { mimeType: "image/png", data: base64Data } });
      parts.push({ text: "Maintain character/environment but change the pose/action as described." });
  } else if (project.productReferenceImage) {
      const base64Data = project.productReferenceImage.split(',')[1] || project.productReferenceImage;
      parts.unshift({ inlineData: { mimeType: "image/png", data: base64Data } });
      parts.push({ text: "Use the product/subject in the provided image as reference." });
  }

  try {
    const response = await generateWithRetry({
      model,
      contents: { parts },
      config: { imageConfig: { aspectRatio: aspectRatio === "1:1" ? "1:1" : "9:16" } }
    });

    let imageUrl: string | null = null;
    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
        }
    }
    return {
      data: { imageUrl, finalPrompt },
      inputTokens: response.usageMetadata?.promptTokenCount || 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount || 0
    };
  } catch (error) {
    console.error("Image Gen Error", error);
    return { data: { imageUrl: null, finalPrompt }, inputTokens: 0, outputTokens: 0 };
  }
};

export const generateCarouselSlides = async (
  project: ProjectContext,
  format: CreativeFormat,
  angle: string,
  visualScene: string,
  visualStyle: string,
  fullStrategyContext: any,
  congruenceRationale?: string
): Promise<GenResult<{ imageUrls: string[]; prompts: string[] }>> => {
    const model = "gemini-3-flash-preview";
    const imageModel = project.imageModel === 'pro' ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image";

    // 1. Generate Prompts for 3 Slides
    const promptGenPrompt = `
      ROLE: Creative Director.
      TASK: Create 3 distinct image prompts for a carousel ad (Slide 1, 2, 3) for ${project.productName}.
      
      CONTEXT:
      Format: ${format}
      Angle/Hook: ${angle}
      Scene Direction: ${visualScene}
      Style: ${visualStyle}
      
      SLIDE STRUCTURE:
      Slide 1: The Hook/Problem (Visual: ${visualScene}).
      Slide 2: The Agitation/Education (Visual: Deepen the problem or show the mechanism).
      Slide 3: The Solution/Product (Visual: Product Hero Shot or Outcome).
      
      CRITICAL:
      - Prompts must be highly detailed for an AI image generator.
      - Maintain consistency in style/character across slides.
      
      OUTPUT JSON:
      {
          "slides": [
              "Full detailed image prompt for slide 1...",
              "Full detailed image prompt for slide 2...",
              "Full detailed image prompt for slide 3..."
          ]
      }
    `;

    let slidePrompts: string[] = [];
    let promptTokens = 0;
    
    try {
        const response = await generateWithRetry({
            model,
            contents: promptGenPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        slides: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["slides"]
                }
            }
        });
        const data = extractJSON<{slides: string[]}>(response.text || "{}");
        slidePrompts = data.slides || [];
        promptTokens += (response.usageMetadata?.promptTokenCount || 0);
    } catch (e) {
        console.error("Failed to generate slide prompts", e);
        slidePrompts = [visualScene, visualScene, visualScene]; 
    }

    // 2. Generate Images for each Slide
    const imageUrls: string[] = [];
    let outputTokens = 0;

    for (const slidePrompt of slidePrompts) {
        try {
            const imageRes = await generateWithRetry({
                model: imageModel,
                contents: { parts: [{ text: slidePrompt }] },
                config: { imageConfig: { aspectRatio: "1:1" } }
            });

            if (imageRes.candidates && imageRes.candidates[0].content.parts) {
                for (const part of imageRes.candidates[0].content.parts) {
                    if (part.inlineData) {
                        imageUrls.push(`data:image/png;base64,${part.inlineData.data}`);
                        break;
                    }
                }
            }
            outputTokens += (imageRes.usageMetadata?.candidatesTokenCount || 0);
        } catch (e) {
            console.error("Slide Image Gen Error", e);
        }
    }

    return {
        data: { imageUrls, prompts: slidePrompts },
        inputTokens: promptTokens,
        outputTokens: outputTokens
    };
};
