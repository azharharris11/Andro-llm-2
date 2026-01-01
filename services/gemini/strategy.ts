
import { Type } from "@google/genai";
import { ProjectContext, GenResult, StoryOption, BigIdeaOption, MechanismOption, HVCOOption, MafiaOffer, MassDesireOption, LanguageRegister, MarketAwareness, StrategyMode } from "../../types";
import { ai, extractJSON } from "./client";

const getLanguageInstruction = (country: string, register: LanguageRegister): string => {
    const isIndo = country?.toLowerCase().includes("indonesia");
    if (!isIndo) return `LANGUAGE: Native language of ${country}.`;

    if (register === LanguageRegister.SLANG) {
        return `LANGUAGE: Bahasa Indonesia (Gaya santai, manusiawi, bukan bahasa bot). Gunakan 'Gue/Lo' jika produknya gaya hidup, atau 'Aku/Kamu' jika lebih personal. Pakai kata sambung natural seperti 'jujurly', 'parah banget', 'sumpah', 'asli'.`;
    } else if (register === LanguageRegister.PROFESSIONAL) {
        return `LANGUAGE: Bahasa Indonesia (Formal Profesional). Gunakan 'Anda/Saya'. Fokus pada kredibilitas dan solusi nyata.`;
    } else {
        return `LANGUAGE: Bahasa Indonesia (Casual Sehari-hari). Gunakan 'Aku/Kamu' atau 'Kita'. Seperti ngobrol santai dengan teman atau tetangga.`;
    }
};

// --- 0. MASS DESIRE DISCOVERY (ANDROMEDA LEVEL 3) ---
export const generateMassDesires = async (project: ProjectContext): Promise<GenResult<MassDesireOption[]>> => {
  const model = "gemini-3-flash-preview";
  const langInstruction = getLanguageInstruction(project.targetCountry || "Indonesia", project.languageRegister || LanguageRegister.CASUAL);

  const prompt = `
    ROLE: Consumer Psychologist (Direct Response Specialist).
    TASK: Analyze the product and identify the 3 deepest "Mass Desires" (Life Force 8) that drive purchase.

    PRODUCT: ${project.productName}
    DESC: ${project.productDescription}
    AUDIENCE: ${project.targetAudience}

    FRAMEWORK (LIFE FORCE 8):
    1. Survival / Life Extension
    2. Enjoyment of Food/Beverage
    3. Freedom from Pain/Fear
    4. Sexual Companionship
    5. Comfortable Living Conditions
    6. Superiority / Status / Winning
    7. Care & Protection of Loved Ones
    8. Social Approval

    ${langInstruction}
    
    OUTPUT JSON (3 items):
    - type: Which Life Force 8 category (e.g., "Freedom from Pain/Danger").
    - headline: A raw, emotional statement of the desire (e.g., "Stop waking up tired").
    - description: Why this desire is unfulfilled right now.
    - marketSymptom: What are they specifically searching for or complaining about on Reddit/Forums?
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            headline: { type: Type.STRING },
            description: { type: Type.STRING },
            marketSymptom: { type: Type.STRING }
          },
          required: ["type", "headline", "description", "marketSymptom"]
        }
      }
    }
  });

  const desires = extractJSON<any[]>(response.text || "[]");
  return {
    data: desires.map((d, i) => ({ ...d, id: `desire-${i}` })),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};

// --- 1. HEADLINE AUDIT (SABRI SUBY STYLE) ---
export const auditHeadlineSabri = async (headline: string, audience: string): Promise<string> => {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Role: Sabri Suby (Ruthless Copy Editor).
    Task: Rate this headline based on the 4 U's: Urgent, Unique, Ultra-Specific, Useful.
    Headline: "${headline}"
    Target Audience: ${audience}
    Output: A short, harsh critique (max 2 sentences) and a Score /10. 
    If score < 7, rewrite it to be better.
  `;
  const response = await ai.models.generateContent({ model, contents: prompt });
  return response.text || "Audit failed.";
};

// --- 2. MAFIA OFFER GENERATOR ---
export const generateMafiaOffer = async (project: ProjectContext): Promise<GenResult<MafiaOffer>> => {
  const model = "gemini-3-flash-preview";
  const register = project.languageRegister || LanguageRegister.CASUAL;
  const langInstruction = getLanguageInstruction(project.targetCountry || "Indonesia", register);
  
  const prompt = `
    ROLE: Sabri Suby (Offer Architect).
    TASK: Ubah penawaran biasa jadi "MAFIA OFFER" (Penawaran yang mustahil ditolak).
    
    PRODUCT: ${project.productName}
    DESC: ${project.productDescription}
    
    FORMULA:
    1. BOLD PROMISE: Hasil nyata dalam waktu tertentu (e.g. "Double your traffic in 30 days").
    2. VALUE STACK: 3-5 Bonuses that kill objections (e.g. Free Setup, Checklists, Scripts).
    3. RISK REVERSAL: The "Insane" Guarantee (e.g. "I'll pay you $100 if you don't like it").
    4. SCARCITY: Alasan kenapa harus sekarang (e.g. "Only 5 spots left").
    
    ${langInstruction}
    **OUTPUT JSON:** headline, valueStack (array), riskReversal, scarcity.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING },
          valueStack: { type: Type.ARRAY, items: { type: Type.STRING } },
          riskReversal: { type: Type.STRING },
          scarcity: { type: Type.STRING }
        },
        required: ["headline", "valueStack", "riskReversal"]
      }
    }
  });

  return {
      data: extractJSON<MafiaOffer>(response.text || "{}"),
      inputTokens: response.usageMetadata?.promptTokenCount || 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount || 0
    };
};

// --- 3. BIG IDEA GENERATOR (BRIDGE BETWEEN PERSONA & CREATIVE) ---
export const generateBigIdeas = async (
    project: ProjectContext, 
    story?: StoryOption,
    context?: any // Flexible context (Persona/Desire)
): Promise<GenResult<BigIdeaOption[]>> => {
  const model = "gemini-3-flash-preview";
  const register = project.languageRegister || LanguageRegister.CASUAL;
  const langInstruction = getLanguageInstruction(project.targetCountry || "Indonesia", register);

  let inputContext = "";
  if (context && context.meta) {
      inputContext = `
      TARGET PERSONA: ${context.meta.name}
      MOTIVATION: ${context.meta.motivation}
      PAIN POINT (Visceral Symptom): ${context.meta.visceralSymptoms?.[0] || "General Pain"}
      `;
  } else if (story) {
      inputContext = `STORY: "${story.narrative}"`;
  }

  const prompt = `
    ROLE: Direct Response Strategist (Big Idea Developer).
    TASK: Generate 3 "Big Ideas" (New Opportunity Concepts) that bridge the gap between the Persona's Pain and our Solution.
    
    PRODUCT: ${project.productName} - ${project.productDescription}
    
    INPUT CONTEXT:
    ${inputContext}
    
    LOGIC: 
    A Big Idea must "Blame" the old way (Mechanism of Problem) and offer a "New Hope" (Mechanism of Solution).
    It must be intellectually interesting, not just a benefit claim.
    
    ${langInstruction}
    **OUTPUT JSON (3 Variasi):** headline, concept, targetBelief (apa keyakinan lama yang dihancurkan?).
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            headline: { type: Type.STRING },
            concept: { type: Type.STRING },
            targetBelief: { type: Type.STRING }
          },
          required: ["headline", "concept", "targetBelief"]
        }
      }
    }
  });

  const ideas = extractJSON<any[]>(response.text || "[]");
  return {
    data: ideas.map((s, i) => ({ ...s, id: `idea-${i}` })),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};

// --- 4. MECHANISM GENERATOR (AWAM VERSION) ---
export const generateMechanisms = async (
    project: ProjectContext, 
    bigIdea: BigIdeaOption,
    persona?: any // NEW: Add Persona Context for tailoring naming
): Promise<GenResult<MechanismOption[]>> => {
  const model = "gemini-3-flash-preview";
  const register = project.languageRegister || LanguageRegister.CASUAL;
  const langInstruction = getLanguageInstruction(project.targetCountry || "Indonesia", register);
  
  let personaInstruction = "";
  if (persona) {
      personaInstruction = `
      **TARGET PERSONA CONTEXT:**
      Name: ${persona.name}
      Profile: ${persona.profile}
      
      ADJUSTMENT RULE:
      - If the persona is "Skeptic/Logic": Naming must sound secure, tested, and reliable (e.g., "Protocol", "Shield").
      - If the persona is "Anxious/Urgent": Naming must sound fast and instant (e.g., "Flash", "Zap", "Snap").
      - If the persona is "Status/Aspirer": Naming must sound premium and exclusive (e.g., "Gold Standard", "Elite").
      `;
  }

  const prompt = `
    ROLE: Copywriter Spesialis Bahasa Awam.
    TASK: Jelaskan cara kerja produk dengan bahasa yang sangat simpel (Bahasa Warung/Pasar).

    INPUT:
    Product: ${project.productName}
    Deskripsi: ${project.productDescription}
    Big Idea: ${bigIdea.concept}
    
    ${personaInstruction}

    RULES PENAMAAN (scientificPseudo):
    - JANGAN pakai istilah lab/teknis: Protokol, Enkapsulasi, Bio-aktif.
    - GUNAKAN kata aksi nyata: Trik, Rahasia, Cara, Formula, Teknik, Racikan.
    - Contoh: "Teknik Serap Cepat", "Racikan Anti-Meler", "Rahasia Sol Empuk".

    ${langInstruction}
    **OUTPUT JSON (3 Variasi):**
    - ump: Masalah inti (Analogi awam).
    - ums: Solusi instan (Cara kerja simpel).
    - scientificPseudo: Nama 'Fitur' yang gampang diingat (Maks 3 kata).
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            ump: { type: Type.STRING },
            ums: { type: Type.STRING },
            scientificPseudo: { type: Type.STRING }
          },
          required: ["ump", "ums", "scientificPseudo"]
        }
      }
    }
  });

  const mechs = extractJSON<any[]>(response.text || "[]");
  return {
    data: mechs.map((s, i) => ({ ...s, id: `mech-${i}` })),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};

// --- 5. VIRAL HOOK GENERATOR ---
export const generateHooks = async (
  project: ProjectContext, 
  bigIdea: BigIdeaOption, 
  mechanism: MechanismOption,
  story: StoryOption,
  massDesire?: MassDesireOption // NEW: Add Mass Desire Context
): Promise<GenResult<string[]>> => {
  const model = "gemini-3-flash-preview";
  const strategyMode = project.strategyMode || StrategyMode.LOGIC;
  const langInstruction = getLanguageInstruction(project.targetCountry || "Indonesia", project.languageRegister || LanguageRegister.CASUAL);
  
  const awareness = project.marketAwareness || MarketAwareness.PROBLEM_AWARE;

  let hookInstruction = "";
  if (awareness === MarketAwareness.UNAWARE) {
      hookInstruction = `
      **UNAWARE STAGE HOOKS (RADICAL & NATIVE):**
      1. **BANNED TOPICS:** Do NOT mention the product name, the brand, or the specific solution in the hook.
      2. **PATTERN INTERRUPT:** Start with a "Weird Fact", a "Common Lie", or a "Polarizing Opinion".
      3. **VISUAL CUE:** Reference something visual in the user's daily life.
      4. **TRIGGER THE DESIRE:** The hook must implicitly promise "${massDesire?.headline || 'Relief'}" without stating it directly.
      5. **EXAMPLES:** 
         - "If your sink smells like this..." (Home)
         - "Stop throwing away rice water." (Beauty)
         - "The real reason you wake up at 3AM." (Health)
      `;
  } else {
      hookInstruction = `
      **DIRECT RESPONSE HOOKS (OFFER/MECHANISM):**
      Focus on the Mechanism, the Benefit, or the Offer.
      ${strategyMode === StrategyMode.OFFER ? 'Boleh sebut nama produk: ' + project.productName : 'JANGAN sebut nama produk. Gunakan: "Trik ini", "Rahasia ini", "Satu hal ini".'}
      `;
  }

  const prompt = `
    ROLE: Media Buyer & Viral Hook Writer.
    TASK: Buat 10 Headline/Hook Meta Ads.

    CONTEXT:
    Story: ${story.narrative}
    UMP: ${mechanism.ump}
    UMS: ${mechanism.ums}
    Mode: ${strategyMode}
    ${massDesire ? `Core Desire: ${massDesire.headline}` : ''}
    
    ${hookInstruction}

    GENERAL RULES:
    1. Hook harus "Punchy" (Singkat dan nendang).
    2. Fokus pada "Hasil Nyata" atau "Keresahan Terbesar".
    3. **VOC RULE**: MUST use "Coliseum Keywords" (Insider slang or verbatim words used by the tribe). e.g. "Pejuang Garis Dua" instead of "Women trying to conceive".

    ${langInstruction}
    Output 10 hooks dalam bentuk JSON string array.
  `;
  
   const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  return {
    data: extractJSON(response.text || "[]"),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
}

// --- 6. AD ANGLES GENERATOR (UPDATED FOR MASS DESIRE) ---
export const generateAngles = async (
    project: ProjectContext, 
    personaName: string, 
    personaMotivation: string,
    massDesire?: MassDesireOption, // New Optional Input
    mechanism?: MechanismOption, // Optional Input
    story?: StoryOption // Optional Input
): Promise<GenResult<any[]>> => {
  const model = "gemini-3-flash-preview";
  const awareness = project.marketAwareness || MarketAwareness.PROBLEM_AWARE;
  const langInstruction = getLanguageInstruction(project.targetCountry || "Indonesia", project.languageRegister || LanguageRegister.CASUAL);

  let contextInjection = `PERSONA: ${personaName}\nMOTIVATION: ${personaMotivation}`;
  
  if (massDesire) {
      contextInjection += `
      CORE MASS DESIRE: ${massDesire.headline} (${massDesire.type})
      MARKET SYMPTOM: ${massDesire.marketSymptom}
      `;
  }
  
  if (mechanism) {
      contextInjection += `
      MECHANISM (LOGIC):
      - UMP (Enemy): ${mechanism.ump}
      - UMS (Solution): ${mechanism.ums}
      `;
  }
  
  if (story) {
      contextInjection += `
      STORY (EMOTION):
      - Narrative: ${story.narrative}
      - Theme: ${story.emotionalTheme}
      `;
  }

  const prompt = `
    ROLE: Meta Ads Strategist.
    TASK: Generate 3 DISTINCT Creative Angles based on the provided context.
    
    AWARENESS LEVEL: ${awareness}
    PRODUCT: ${project.productName}
    
    ${contextInjection}
    
    ANGLE MATRIX RULES:
    1. Angle 1 (LOGIC/MECHANISM): Focus on the "How it works" or the logic switch.
    2. Angle 2 (PAIN/VISCERAL): Focus on the deep symptom or fear.
    3. Angle 3 (BENEFIT/DREAM): Focus on the status or end result.

    ${langInstruction}
    **OUTPUT JSON (3 items):** headline, painPoint, testingTier, hook.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            painPoint: { type: Type.STRING },
            testingTier: { type: Type.STRING },
            hook: { type: Type.STRING }
          },
          required: ["headline", "painPoint", "testingTier", "hook"]
        }
      }
    }
  });

  return {
    data: extractJSON(response.text || "[]"),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};

// --- 7. EXPRESS PROMO MODE ---
export const generateExpressAngles = async (project: ProjectContext): Promise<GenResult<any[]>> => {
  const model = "gemini-3-flash-preview";
  const langInstruction = getLanguageInstruction(project.targetCountry || "Indonesia", project.languageRegister || LanguageRegister.CASUAL);
  
  const prompt = `
    ROLE: E-Commerce Campaign Manager (Flash Sale Specialist).
    TASK: Generate 3 "Hard Sell" promo angles. Focus on SCARCITY, DEAL VALUE, and UGC VIBE.
    
    ${langInstruction}
    **OUTPUT JSON:** headline, hook, testingTier: "TIER 3: SPRINT".
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            hook: { type: Type.STRING },
            testingTier: { type: Type.STRING }
          },
          required: ["headline", "hook"]
        }
      }
    }
  });

  return {
    data: extractJSON(response.text || "[]"),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};

// --- 8. HVCO (LEAD MAGNET) GENERATOR ---
export const generateHVCOIdeas = async (project: ProjectContext, painPoint: string): Promise<GenResult<HVCOOption[]>> => {
  const model = "gemini-3-flash-preview";
  const langInstruction = getLanguageInstruction(project.targetCountry || "Indonesia", project.languageRegister || LanguageRegister.CASUAL);

  const prompt = `
    ROLE: Direct Response Strategist (Sabri Suby Style).
    TASK: Buat 3 High Value Content Offer (HVCO) / Lead Magnet.
    
    PRODUCT: ${project.productName}
    PAIN: ${painPoint}
    
    CRITERIA: Harus terdengar seperti "Rahasia yang dilarang" atau "Sistem 3 Langkah".
    FORMAT: PDF/Video/Checklist.
    
    ${langInstruction}
    **OUTPUT JSON:** title, format, hook.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            format: { type: Type.STRING },
            hook: { type: Type.STRING }
          },
          required: ["title", "format", "hook"]
        }
      }
    }
  });
  
  return {
    data: extractJSON<HVCOOption[]>(response.text || "[]"),
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0
  };
};
