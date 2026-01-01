
import { ProjectContext, CreativeFormat } from "../../types";
import { ParsedAngle } from "./imageUtils";
import { ai, generateWithRetry } from "./client";

/**
 * SOURCE OF TRUTH FOR EMBEDDED TEXT STYLES.
 * Defines exactly how text should look and sound for every single format.
 */
export const getFormatTextGuide = (format: CreativeFormat): string => {
    const baseGuide = "**TEXT OVERLAY RULE:**";
    
    switch (format) {
        // --- NATIVE SOCIAL UI (Familiarity Bias) ---
        
        case CreativeFormat.IG_STORY_TEXT:
            return `${baseGuide} IG STORY NARRATIVE STACK (LONG FORM).
            Format: Generate a "Mini-Story" split into 3-4 distinct sentences/blocks.
            Structure:
            1. The Pain/Past ("Dulu aku sering banget...").
            2. The Realization/Discovery ("Ternyata masalahnya ada di...").
            3. The Result/Solution ("Sejak pakai ini, akhirnya...").
            Style: White background blocks with Black text (Native IG style). Casual, vulnerable, "Curhat" tone.`;

        case CreativeFormat.PHONE_NOTES:
            return `${baseGuide} APPLE NOTES STRUCTURE.
            Format: Strict Apple Notes UI Text.
            Line 1: Title (Bold, warm greeting or "Note to self").
            Line 2: Date stamp (e.g., "Today at 9:41 AM").
            Line 3-6: A bulleted list of realizations or "Don't forget" items.
            Tone: Intimate, personal, raw logic.`;

        case CreativeFormat.TWITTER_REPOST:
        case CreativeFormat.HANDHELD_TWEET:
            return `${baseGuide} TWITTER/X POST STRUCTURE.
            Format: Standard Tweet UI.
            Line 1: Handle & Name (@username · 2h).
            Line 2: The Hook/Controversial Statement (Main Body).
            Line 3: The Validation/Punchline.
            Line 4: Metrics (e.g., 1.2k Retweets, 4.5k Likes).
            Tone: Short, punchy, "Hot Take", lowercase allowed for authenticity.`;
        
        case CreativeFormat.GMAIL_UX:
            return `${baseGuide} GMAIL INBOX ROW STRUCTURE.
            Format: A single unread email row.
            1. Sender: Brand Name or Personal Name (e.g., "Sarah form Lumina").
            2. Subject: BOLD and Urgent (e.g., "Order #2441: We need to talk...").
            3. Snippet: The first 5 words of a juicy sentence (e.g., "Your results are ready to view...").
            Tone: High urgency, curiosity gap.`;
        
        case CreativeFormat.DM_NOTIFICATION:
        case CreativeFormat.REMINDER_NOTIF:
            return `${baseGuide} LOCKSCREEN NOTIFICATION STACK.
            Format: 2-3 Stacked Notifications.
            Notif 1 (App: Calendar): "Reminder: Your goal starts today."
            Notif 2 (App: Messages): "Mom: Did you try that thing yet?"
            Notif 3 (App: Bank/Health): "Alert: Positive change detected."
            Tone: Personal, urgent, dopamine-triggering.`;
        
        case CreativeFormat.CHAT_CONVERSATION:
            return `${baseGuide} IMESSAGE/WHATSAPP THREAD.
            Format: A back-and-forth dialogue (2-3 bubbles).
            Bubble 1 (Grey/Left): Skeptical question ("Does it actually work tho?").
            Bubble 2 (Blue/Right): Photo proof or emphatic "YES. Look at this...".
            Bubble 3 (Blue/Right): "Literally saved my life lol".
            Tone: Slang, abbreviations (lol, omg, rn), fast-paced.`;
            
        case CreativeFormat.SEARCH_BAR:
            return `${baseGuide} GOOGLE SEARCH QUERY.
            Format: Text inside a search bar.
            Text: A specific "Long-tail" question the user asks in private.
            Example: "why do I feel tired after sleeping 8 hours" or "best remedy for [problem]".
            Must end with a typing cursor "|".`;

        // --- DATA & LOGIC (The Proof) ---
        
        case CreativeFormat.US_VS_THEM:
            return `${baseGuide} COMPARISON TABLE TEXT.
            Column A Header: "Other Brands" (or "Old Way").
            Column B Header: "Us" (or "New Way").
            Row 1: "Expensive" vs "Affordable".
            Row 2: "Slow" vs "Instant".
            Row 3: "Chemicals" vs "Natural".
            Style: Binary, brutal, very short words.`;

        case CreativeFormat.BEFORE_AFTER:
        case CreativeFormat.OLD_ME_VS_NEW_ME:
            return `${baseGuide} SPLIT SCREEN LABELS.
            Label A (Left/Top): "Day 1" or "The Struggle" or "Me before".
            Label B (Right/Bottom): "Day 30" or "The Freedom" or "Me now".
            Tone: Clear time progression.`;
            
        case CreativeFormat.GRAPH_CHART:
        case CreativeFormat.TIMELINE_JOURNEY:
            return `${baseGuide} GRAPH ANNOTATIONS.
            Axis X: Time (Week 1 -> Week 4).
            Axis Y: Results/Relief.
            Annotation: A text bubble pointing to the spike saying "The Turning Point" or "Magic Moment".`;
            
        case CreativeFormat.MECHANISM_XRAY:
        case CreativeFormat.ANNOTATED_PRODUCT:
        case CreativeFormat.BENEFIT_POINTERS:
            return `${baseGuide} ANATOMY POINTERS.
            Format: 3-4 Labels with lines pointing to product parts.
            Label 1: Scientific Feature (e.g., "Nano-Weave").
            Label 2: Direct Benefit (e.g., "Zero Pressure").
            Label 3: The Result (e.g., "Instant Sleep").`;

        case CreativeFormat.TESTIMONIAL_HIGHLIGHT:
            return `${baseGuide} REVIEW HIGHLIGHT.
            Text: A paragraph of a 5-star review.
            Highlight: The specific sentence about the transformation MUST be highlighted in Neon Yellow/Green.
            e.g., "...I was skeptical but [THIS CHANGED EVERYTHING] for me..."`;
            
        case CreativeFormat.SOCIAL_COMMENT_STACK:
            return `${baseGuide} COMMENT SECTION SIMULATION.
            Username 1: "Omg I need this 😍"
            Username 2: "Link???"
            Username 3: "Ordered mine yesterday!"
            Tone: Hype, FOMO, social validation.`;

        // --- UGLY ADS & PATTERN INTERRUPT ---
        
        case CreativeFormat.UGLY_VISUAL:
        case CreativeFormat.STICKY_NOTE_REALISM:
        case CreativeFormat.MS_PAINT:
             return `${baseGuide} UGLY AD TEXT.
             Format: Handwritten or MSPaint Text.
             Content: A raw, honest statement like "Stop doing this." or "This looks stupid but it works."
             Tone: Anti-marketing, blunt.`;
             
        case CreativeFormat.BIG_FONT:
        case CreativeFormat.BILLBOARD:
            return `${baseGuide} MASSIVE HEADLINE.
            Format: 3-5 words MAX.
            Font: Impact/Bold Sans.
            Content: A contrarian truth (e.g., "Cardio is killing your gains").`;

        case CreativeFormat.MEME:
            return `${baseGuide} MEME CAPTIONS.
            Top Text: "Me trying to fix [Problem]..."
            Bottom Text: "Me after finding [Product]..."
            Font: Impact with black outline.`;
        
        case CreativeFormat.REDDIT_THREAD:
            return `${baseGuide} REDDIT THREAD TITLE.
            UI Elements: "r/confession • Posted by u/throwaway 2h ago".
            Title: "TIFU by ignoring my [symptom] for 5 years..."
            Tone: Confessional, anonymous, community-driven.`;

        // --- CAROUSELS ---
        
        case CreativeFormat.CAROUSEL_EDUCATIONAL:
        case CreativeFormat.CAROUSEL_PANORAMA:
            return `${baseGuide} SLIDE HEADLINE & SUBHEAD.
            Header: Big Benefit/Hook.
            Subhead: One sentence explaining the "Why".
            Example: "Stop Drinking Coffee." (Head) + "Here is what to use instead for energy." (Sub)`;
            
        case CreativeFormat.CAROUSEL_PHOTO_DUMP:
            return `${baseGuide} CAPTION STICKER.
            Text: A short date or emotion (e.g., "March 1st.", "Feeling this.", "Mood").
            Style: Instagram Stories font with background.`;

        case CreativeFormat.PRESS_FEATURE:
            return `${baseGuide} EDITORIAL HEADLINE.
            Format: Magazine Title.
            Text: "Why Silicon Valley is obsessed with this new sleep hack."
            Style: Serif font, prestigious.`;

        case CreativeFormat.CHECKLIST_TODO:
            return `${baseGuide} HANDWRITTEN CHECKLIST.
            Item 1: [Problem] (Crossed out with red scribbles).
            Item 2: [Problem] (Crossed out).
            Item 3: [Product Name] (Checkmarked with thick green ink).`;

        // --- DEFAULTS ---
        case CreativeFormat.AESTHETIC_MINIMAL:
            // OVERRIDDEN: No more editorial style.
            return `${baseGuide} NATIVE OVERLAY.
            Format: Minimalist sans-serif text placed in a 'white space' area of the photo.
            Style: Looks like a default phone photo editor font.`;

        default:
            return `${baseGuide} NATIVE OVERLAY. Short, punchy, looks like user-generated text.`;
    }
};

export const generateTextInstruction = (format: CreativeFormat, parsedAngle: ParsedAngle, project: ProjectContext): string => {
    return `
    CONTEXT: The image must feature text related to "${parsedAngle.cleanAngle}".
    PRODUCT: ${project.productName}.
    FORMAT: ${format}.
    ${getFormatTextGuide(format)}
    `;
};

export const generateVisualText = async (
    project: ProjectContext,
    format: CreativeFormat,
    parsedAngle: ParsedAngle
): Promise<string> => {
    const model = "gemini-3-flash-preview";
    const { cleanAngle } = parsedAngle;
    const isIndo = project.targetCountry?.toLowerCase().includes("indonesia");

    const langInstruction = isIndo
        ? "LANGUAGE: BAHASA INDONESIA (Gaul/Casual/Slang). Hindari diksi formal marketing."
        : `LANGUAGE: Native language of ${project.targetCountry || "English"}.`;

    const formatGuide = getFormatTextGuide(format);

    const prompt = `
        # ROLE: Expert Direct Response Copywriter (Native Ads Specialist)
        ${langInstruction}
        
        TASK: Transform the Marketing Hook into a visual text string for a NATIVE AD.
        
        # NATIVE AD FORMULA:
        1. KEYWORD: Use terms relevant to the audience's specific problem.
        2. EMOTION: Focus on the "vulnerable/venting" (curhat) tone.
        3. OUTCOME: Emphasize the transformation, not the features.
        
        # PRINCIPLE: 
        - "Thoughtful but Not Pretty".
        - Avoid formal marketing dictionary.
        - Use "I/Me/Aku" perspective (Authenticity Bias).
        
        ORIGINAL HOOK: "${cleanAngle}"
        
        ${formatGuide}
        
        CRITICAL: Output ONLY the final text string. Do not use quotation marks.
    `;

    try {
        const response = await generateWithRetry({ model, contents: prompt });
        return response.text?.trim()?.replace(/^"|"$/g, '') || cleanAngle;
    } catch (e) {
        return cleanAngle;
    }
};
