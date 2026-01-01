
import { StrategyMode, CreativeFormat, MarketAwareness } from "../../types";
import { generateWithRetry } from "./client";
import { PromptContext } from "./imageUtils";

/**
 * ANDROMEDA LEVEL 2: AWARENESS MAPPING
 * Returns specific visual logic based on how much the prospect knows.
 */
const getAwarenessVisualLogic = (awareness: MarketAwareness): string => {
    switch (awareness) {
        case MarketAwareness.UNAWARE:
            return "UNAWARE STAGE (CRITICAL): DO NOT SHOW THE PRODUCT PACKAGING. I repeat: NO PRODUCT. The user doesn't know it exists. Focus 100% on a 'Visual Metaphor' (e.g., a melting clock for lost time), an 'Anomaly' (something that looks 'wrong' or 'glitched'), or a shocking specific symptom. The goal is purely CURIOSITY and PATTERN INTERRUPT.";
        case MarketAwareness.PROBLEM_AWARE:
            return "PROBLEM AWARE STAGE: Focus on the SYMPTOM. Show the 'Visceral Pain'. A close-up of the body part hurting, or the messy room, or the frustration. Emphasize the 'Before' state. Product can appear subtly as a saviour, but pain is the hero.";
        case MarketAwareness.SOLUTION_AWARE:
            return "SOLUTION AWARE STAGE: Focus on the MECHANISM. Show 'Us vs Them', a diagram, an X-Ray of the effect, or a unique ingredient. Show WHY the old way failed and this new way works.";
        case MarketAwareness.PRODUCT_AWARE:
        case MarketAwareness.MOST_AWARE:
            return "MOST AWARE STAGE: HERO SHOT & MAFIA OFFER. Show the product looking majestic with a 'Value Stack' visualization (e.g., product + bonuses + guarantee badge). High contrast, professional, 'Ready to Ship' vibe. Focus on the OFFER and SCARCITY.";
        default:
            return "General Direct Response Visual.";
    }
};

const getFormatVisualGuide = (format: CreativeFormat): string => {
    switch (format) {
        // --- NATIVE / SOCIAL (UX FAMILIARITY BIAS) ---
        
        case CreativeFormat.IG_STORY_TEXT:
            return "Style: NATIVE IG STORY TEXT STACK. Vertical 9:16. The background is a blurry/dimmed lifestyle photo (candid). FOREGROUND: Multiple distinct text bubbles (White background blocks with Black text) stacked vertically in the center. The text is long, narrative, and tells a story. Look like a real user 'curhat' (venting) session.";
            
        case CreativeFormat.PHONE_NOTES:
            return "Style: APPLE NOTES UI REALISM. The image must look EXACTLY like a screenshot of the iPhone Notes app. Paper texture background (off-white or yellow). Top UI bar visible ('< Notes' and 'Share' icon). The text is typed in the default San Francisco font. Add some hand-drawn red circles or underlines for emphasis.";
            
        case CreativeFormat.TWITTER_REPOST:
            return "Style: X/TWITTER POST SCREENSHOT. Sharp, high-res UI. White or Dark mode background. Must include: Circular Profile Picture, Username, Handle (@name), The Tweet Body Text, and the bottom action bar (Reply, Retweet, Like, Share icons). Make it look embedded in a feed.";
            
        case CreativeFormat.HANDHELD_TWEET:
             return "Style: POV PHOTO OF PHONE. A realistic first-person shot of a hand holding an iPhone. The screen is displaying a viral Tweet/Post. The background is a blurry coffee shop or street (bokeh). Focus is sharp on the phone screen text.";
             
        case CreativeFormat.GMAIL_UX:
            return "Style: GMAIL INBOX UI. A clean white interface. List of emails. The 'Target' email is highlighted or at the top. BOLD subject line. Star icon is yellow. Must look like a screenshot of a browser or mobile app inbox.";

        case CreativeFormat.DM_NOTIFICATION:
        case CreativeFormat.REMINDER_NOTIF:
            return "Style: IPHONE LOCKSCREEN NOTIFICATIONS. Background is a dimmed personal wallpaper. Foreground: A stack of 2-3 glassy notification bubbles (Glassmorphism). App icons (Green for Messages, Blue for Calendar) visible on the left of the bubble. Text is sharp black on translucent white.";

        case CreativeFormat.CHAT_CONVERSATION:
            return "Style: IMESSAGE/WHATSAPP SCREEN. Vertical layout. Chat bubbles. Incoming messages (Grey/White) on left. Outgoing messages (Blue/Green) on right. 'Read 10:41 AM' small text at bottom. Background is default chat wallpaper. Looks like a leaked private conversation.";

        case CreativeFormat.SOCIAL_COMMENT_STACK:
            return "Style: FLOATING COMMENT BUBBLES. A high-quality product or lifestyle shot in the background. OVERLAID: 3-4 distinct social media comment bubbles with profile pics. They are floating/stacked on top of the product to show social proof.";

        case CreativeFormat.SEARCH_BAR:
            return "Style: GOOGLE SEARCH HOMEPAGE. Clean white background. The Google logo (multi-colored) above. A search bar in the center with the query typed in. A blinking cursor '|' at the end of the text. Minimalist and spacious.";

        // --- DATA & LOGIC (THE PROOF) ---
        
        case CreativeFormat.US_VS_THEM:
            return "Style: SPLIT COMPARISON TABLE. Divide the image vertically. Left Side (Them): Desaturated, grey/red tones, 'X' icons, sad vibe. Right Side (Us): Vibrant, brand colors, Green Checkmark icons, happy vibe. Clear headers at top.";

        case CreativeFormat.BEFORE_AFTER:
        case CreativeFormat.OLD_ME_VS_NEW_ME:
            return "Style: VISCERAL SPLIT SCREEN. A sharp vertical division line. Left: Darker lighting, messy, problem visible, sad posture. Right: Bright lighting, clean, solution visible, glowing posture. The contrast must be immediate.";
            
        case CreativeFormat.GRAPH_CHART:
            return "Style: DATA VISUALIZATION. A clean upward-trending line graph or bar chart. The line is Green. The background is white or light grid. A red circle highlights the 'Breakthrough' point on the graph. It looks like a financial or health report.";
            
        case CreativeFormat.MECHANISM_XRAY:
            return "Style: 3D X-RAY / CROSS-SECTION. A scientific visualization. Show the inside of the product or the human body. Glowing particles, layers revealed. High-tech, medical, or engineering aesthetic. Prove 'How it works'.";
            
        case CreativeFormat.ANNOTATED_PRODUCT:
        case CreativeFormat.BENEFIT_POINTERS:
            return "Style: PRODUCT ANATOMY. High-res hero shot of the product in center. Thin, elegant leader lines radiating out to specific parts. At the end of each line is a small text label. Clean studio lighting.";

        case CreativeFormat.TESTIMONIAL_HIGHLIGHT:
            return "Style: HIGHLIGHTED DOCUMENT. A close-up photo of a printed page or a screen showing a text review. A bright NEON YELLOW highlighter marker has drawn a line over the most important sentence. Depth of field blurs the edges.";
            
        case CreativeFormat.VENN_DIAGRAM:
            return "Style: VENN DIAGRAM. Two or three overlapping circles with distinct translucent colors. The center intersection is bright and glowing. Text labels floating in each section. Clean vector style.";

        // --- PATTERN INTERRUPT ---
        
        case CreativeFormat.UGLY_VISUAL:
            return "Style: THE UGLY AD AESTHETIC. Intentionally bad design. Clashing colors (e.g. Yellow background with Red text). Use MS Paint style arrows drawn crudely. Low-resolution feel. It must look like a scam or a meme to break banner blindness. NO professional polish.";
            
        case CreativeFormat.MS_PAINT:
            return "Style: MS PAINT DRAWING. Crude stick figures, bucket-fill colors, pixelated brush strokes. Looks like a 5-year-old or a shitposter made it. White canvas background.";
            
        case CreativeFormat.REDDIT_THREAD:
            return "Style: REDDIT DARK MODE UI. Black background. Grey card container. Upvote/Downvote arrows (Orange/Blue) on the left. Title text in white. 'Join' button visible. Looks like a viral screenshot.";
            
        case CreativeFormat.STICKY_NOTE_REALISM:
             return "Style: REAL STICKY NOTE. A macro photo of a yellow Post-it note stuck on a fridge, mirror, or laptop. Handwritten text in black Sharpie/Marker. Realistic paper texture and shadow.";

        case CreativeFormat.BIG_FONT:
            return "Style: KINETIC TYPOGRAPHY. 80% of the image is text. Massive, bold, sans-serif font. High contrast (Black on Yellow, or White on Red). The text interacts with the background elements slightly.";
            
        case CreativeFormat.BILLBOARD:
            return "Style: OUTDOOR BILLBOARD. A realistic photo of a billboard on a highway or Times Square. The ad content is displayed on the billboard structure. Cinematic lighting (sunset or city lights).";

        // --- CAROUSELS ---
        
        case CreativeFormat.CAROUSEL_EDUCATIONAL:
            return "Style: CAROUSEL SLIDE DECK. Flat vector design. Solid pastel background. Clean typography hierarchy (Big Header, Small Body). Icons illustrating the points. Looks like an Instagram educational post.";
            
        case CreativeFormat.CAROUSEL_PHOTO_DUMP:
            return "Style: AESTHETIC PHOTO DUMP. Flash photography. Uncurated, messy-chic vibe. A mix of textures, close-ups, and lifestyle shots. Film grain overlay. Looks like a Gen-Z weekend update.";

        case CreativeFormat.PRESS_FEATURE:
            return "Style: MAGAZINE SPREAD. A layout looking like Vogue, Forbes, or NYT. Serif typography. Professional photography. 'Featured in' badges visible. Authority and Trust aesthetic.";
            
        case CreativeFormat.LEAD_MAGNET_3D:
             return "Style: 3D BOOK MOCKUP. A realistic 3D render of a book, PDF guide, or report. It's standing up or floating. Drop shadow. The cover design is visible and catchy. 'Free Download' badge.";

        // --- DEFAULTS ---
        case CreativeFormat.AESTHETIC_MINIMAL:
            return "Style: High-end editorial (Beige/Cream tones). Serif fonts, plenty of white space. Aspirational and premium.";
        case CreativeFormat.UGC_MIRROR:
            return "Style: Raw mirror selfie. Flash photography, messy room background. 100% authentic human connection.";
        case CreativeFormat.CHECKLIST_TODO:
            return "Style: Handwritten to-do list on a clipboard or notepad. Problems are crossed out, solutions are checked.";

        default:
            return "Style: High-quality, native social media asset. Realistic lighting, sharp focus, authentic texture. Avoid generic stock photo look.";
    }
};

export const generateAIWrittenPrompt = async (ctx: PromptContext): Promise<string> => {
    const { 
        project, format, parsedAngle, visualScene, visualStyle,
        culturePrompt, congruenceRationale, aspectRatio,
        rawPersona, embeddedText, safety, enhancer,
        fullStoryContext 
    } = ctx;

    const isOfferHeavy = project.strategyMode === StrategyMode.OFFER;
    const marketAwareness = project.marketAwareness || MarketAwareness.PROBLEM_AWARE;

    // LEVEL 2: AWARENESS MAPPING LOGIC
    // We override general visual directives with specific awareness-level instructions.
    const awarenessLogic = getAwarenessVisualLogic(marketAwareness);

    // Baseline Style Override for Native Formats
    const isNativeStory = [
        CreativeFormat.IG_STORY_TEXT, 
        CreativeFormat.PHONE_NOTES, 
        CreativeFormat.LONG_TEXT,
        CreativeFormat.UGC_MIRROR
    ].includes(format);

    let styleInstruction = "Style: Professional Ad.";
    if (isNativeStory) {
        styleInstruction = "Style: AMATEUR UGC. No professional lighting. Camera shake/grain allowed. Looks like a friend sent it. 'Authenticity Bias'.";
    } else if (isOfferHeavy) {
        styleInstruction = "Style: HARD HITTING PROMOTIONAL. High contrast, focus on the deal/badge/text.";
    }

    const strategicContext = {
        campaign: {
            product: project.productName,
            brandVoice: project.brandVoice || "Adaptable",
            // Menambahkan mekanisme agar visual selaras dengan logika solusi
            mechanismUMS: fullStoryContext?.mechanism?.ums 
        },
        persona: {
            identity: rawPersona?.profile || "General Audience",
            // Fokus pada micro-moment penderitaan/kebutuhan persona
            visceralContext: rawPersona?.visceralSymptoms?.join(", ") 
        },
        narrative: {
            angle: parsedAngle.cleanAngle,
            textToRender: embeddedText, // CRITICAL FOR ONE-SHOT
            specificAction: visualScene, // Adegan dari Creative Director
            visualMood: visualStyle,     // Gaya dari Creative Director
            congruenceRationale: congruenceRationale || "Prove the claim"
        },
        execution: {
            format: format,
            formatRule: getFormatVisualGuide(format),
            awarenessLogic: awarenessLogic, // NEW INJECTION
            culture: culturePrompt,
            aspectRatio: aspectRatio
        }
    };

    const systemPrompt = `
    ROLE: Senior AI Prompt Engineer & Creative Director.
    TASK: Translate a Creative Concept into a single, high-conversion Image Generation Prompt.

    --- STRATEGIC CONTEXT ---
    ${JSON.stringify(strategicContext, null, 2)}

    --- DIRECTIVES ---
    1. CORE COMPOSITION: Execute the scene "${visualScene}" precisely. 
    2. VISUAL DNA: Strictly follow the style "${visualStyle}" and format rule: "${getFormatVisualGuide(format)}".
    3. MARKET AWARENESS RULE: ${awarenessLogic} (This is CRITICAL - Do not show product if UNAWARE).
    4. NO STOCK LOOK: ${styleInstruction}. Avoid smooth, generic AI lighting. Make it "Thoughtful but not pretty".
    5. TEXT RENDERING: The image MUST include the text "${embeddedText}" clearly visible in the scene (e.g., on the screen, sign, or overlay).
    6. CONGRUENCE: The visual must prove the text. "${congruenceRationale || 'Visual evidence of the claim'}".
    
    --- TECHNICAL PARAMETERS ---
    - Style Enhancer: ${enhancer}
    - Safety & Quality: ${safety}
    - Localization: ${culturePrompt}

    Output ONLY the raw prompt string for the image generator.
    `;
    
    try {
        const response = await generateWithRetry({
            model: "gemini-3-flash-preview", 
            contents: systemPrompt
        });
        return response.text?.trim() || "";
    } catch (e) {
        // Fallback jika API gagal
        return `${format} style. ${visualScene}. ${visualStyle}. ${culturePrompt}. RENDER TEXT: "${embeddedText}"`; 
    }
};
