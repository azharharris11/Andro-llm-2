
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
            /**
             * STRATEGI: Largest & Least Competitive Audience[cite: 61, 62].
             * VISUAL: 100% CURIOSITY. Dilarang keras menampilkan produk[cite: 73, 79].
             * Gunakan "Curiosity Image" atau "Anomaly" yang memicu emosi (sedih, penasaran, jijik)[cite: 73, 74].
             * Contoh: Foto kucing sedih (untuk produk kesehatan kucing) atau tekstur aneh yang dilingkari merah[cite: 74, 240].
             */
            return "UNAWARE STAGE: NO PRODUCT. Fokus pada 'Curiosity Gap'. Visual harus memicu respon emosional instan tanpa terlihat seperti jualan[cite: 73, 85]. Gunakan 'Pattern Interrupt' yang terlihat seperti postingan organik teman[cite: 135].";

        case MarketAwareness.PROBLEM_AWARE:
            /**
             * STRATEGI: Symptom-Led[cite: 22].
             * VISUAL: Tunjukkan masalah secara "Ugly" dan visceral[cite: 31, 32].
             * Fokus pada 'Visceral Pain' seperti jerawat parah, barang berantakan, atau gejala fisik[cite: 32].
             * Menggunakan "Ugly Visual" untuk membuktikan klaim secara jujur[cite: 31].
             */
            return "PROBLEM AWARE: Fokus pada GEJALA/SYMPTOM[cite: 22]. Visual harus 'Ugly' dan nyata (misal: close-up masalah kulit atau kekacauan rumah)[cite: 32, 247]. Manfaatkan 'Authenticity Bias'[cite: 5].";

        case MarketAwareness.SOLUTION_AWARE:
            /**
             * STRATEGI: Unique Mechanism[cite: 107].
             * VISUAL: Tunjukkan "Mengapa" cara lama gagal dan cara baru ini bekerja[cite: 107].
             * Gunakan format perbandingan atau diagram sederhana (Whiteboard style)[cite: 39].
             */
            return "SOLUTION AWARE: Tampilkan 'Unique Mechanism'[cite: 107]. Gunakan visual yang menjelaskan proses solusi, seperti 'X-Ray' atau perbandingan 'Us vs Them' yang kontras[cite: 200].";

        case MarketAwareness.PRODUCT_AWARE:
        case MarketAwareness.MOST_AWARE:
            /**
             * STRATEGI: Direct Offer with Context[cite: 56, 131].
             * VISUAL: Produk tampil jelas namun tetap dalam setting 'Amateur/Native'[cite: 129, 135].
             * Berikan konteks pada penawaran (misal: "Early Halloween Sale") agar terlihat masuk akal[cite: 130].
             */
            return "MOST AWARE: NATIVE OFFER. Tampilkan produk dengan pencahayaan amatir (iPhone style)[cite: 135]. Gunakan overlay teks besar yang menonjolkan diskon atau urgensi dengan alasan logis[cite: 130, 155].";

        default:
            return "General Native Response Visual.";
    }
};
const getFormatVisualGuide = (format: CreativeFormat): string => {
    switch (format) {
        // --- CAROUSEL SPECIALS ---

        case CreativeFormat.CAROUSEL_EDUCATIONAL:
            return "Style: INSTAGRAM SLIDE DECK. Desain flat vector dengan latar belakang pastel[cite: 272]. Tipografi bersih (Hierarchy: Header Besar, Body Kecil)[cite: 272]. Berfokus pada edukasi 'Unique Mechanism' secara bertahap[cite: 107, 187].";
            
        case CreativeFormat.CAROUSEL_TESTIMONIAL:
            return "Style: SOCIAL PROOF PILE. Tumpukan screenshot ulasan asli atau komentar media sosial yang berjejer[cite: 35]. Visual harus terlihat 'berantakan' tapi nyata untuk membangun faktor kepercayaan (Trust Factor)[cite: 6, 38].";

        case CreativeFormat.CAROUSEL_PHOTO_DUMP:
            return "Style: GEN-Z AESTHETIC. Fotografi menggunakan flash, tidak dikurasi, getaran 'messy-chic'[cite: 272]. Gabungan antara tekstur, close-up, dan foto gaya hidup dengan overlay butiran film (film grain)[cite: 272].";

        // --- PATTERN INTERRUPT (Breaking Banner Blindness [cite: 3]) ---

        case CreativeFormat.BIG_FONT:
            return "Style: KINETIC TYPOGRAPHY. 80% gambar adalah teks[cite: 272]. Font sans-serif masif dan tebal[cite: 22, 150]. Kontras tinggi (Hitam di Kuning atau Putih di Merah) untuk menyebutkan gejala utama (Symptom) secara langsung[cite: 22].";

        case CreativeFormat.GMAIL_UX:
            return "Style: GMAIL INBOX UI. Antarmuka putih bersih dengan daftar email[cite: 24]. Subjek email harus memicu rasa ingin tahu (misal: 'We have to apologize')[cite: 24, 25]. Harus terlihat seperti screenshot browser atau aplikasi mobile asli[cite: 23].";

        case CreativeFormat.BILLBOARD:
            return "Style: OUTDOOR BILLBOARD REALISM. Foto realistis papan reklame di jalan raya atau Times Square[cite: 27, 230]. Memanfaatkan 'Probability Bias' di mana orang terbiasa melihat iklan di struktur billboard fisik[cite: 27].";

        case CreativeFormat.UGLY_VISUAL:
            return "Style: THE UGLY AD AESTHETIC. Desain yang sengaja buruk dengan warna bentrok dan panah gaya MS Paint yang kasar[cite: 31, 32]. Harus terlihat seperti 'scam' atau meme untuk memutus pola visual pengguna (Pattern Interrupt)[cite: 7, 34].";

        case CreativeFormat.MS_PAINT:
            return "Style: AMATEUR DRAWING. Stick figures kasar dan sapuan kuas pixelated[cite: 34]. Terlihat seperti dibuat oleh anak kecil atau 'shitposter' untuk memicu 'Nostalgia Effect' pada audiens milenial[cite: 34].";

        case CreativeFormat.REDDIT_THREAD:
            return "Style: REDDIT DARK MODE. Latar belakang hitam dengan UI kartu abu-abu[cite: 38]. Ikon upvote/downvote berwarna Oranye/Biru di sebelah kiri[cite: 38]. Memberikan kesan testimoni komunitas yang jujur[cite: 38, 166].";

        case CreativeFormat.MEME:
            return "Style: INTERNET LANGUAGE. Menggunakan format meme populer (Before vs After)[cite: 41]. Brand berbicara menggunakan bahasa internet yang ingin dikonsumsi orang, bukan bahasa jualan[cite: 42].";

        case CreativeFormat.LONG_TEXT:
            return "Style: VSSL TEXT-ONLY. Paragraf panjang yang terstruktur dengan 'Slippery Slope' copywriting[cite: 28, 29]. Menggunakan cerita leads untuk membawa audiens dari tahap Unaware ke Most Aware secara perlahan[cite: 92, 114].";

        case CreativeFormat.CARTOON:
            return "Style: NON-THREATENING GRAPHICS. Ilustrasi kartun sederhana untuk menjelaskan masalah sensitif (seperti kesehatan mental atau pencernaan anak)[cite: 35, 36]. Mempermudah audiens mencerna pesan melalui storytelling visual yang ringan[cite: 37].";

        case CreativeFormat.BEFORE_AFTER:
            return "Style: VISCERAL CONTRAST. Garis pemisah vertikal yang tajam[cite: 143]. Kiri: Pencahayaan gelap, berantakan, masalah terlihat jelas[cite: 143]. Kanan: Pencahayaan terang, bersih, solusi (produk) terlihat memberikan hasil nyata[cite: 143].";

        case CreativeFormat.WHITEBOARD:
            return "Style: HANDWRITTEN EXPLANATION. Seseorang sedang menulis di papan tulis, menjelaskan diagram masalah atau hasil (Outcome) secara manual[cite: 39]. Terlihat sangat edukatif dan personal[cite: 39].";

        case CreativeFormat.MECHANISM_XRAY:
            return "Style: SCIENTIFIC VISUALIZATION. Tampilan 3D X-Ray atau potongan melintang yang menunjukkan cara kerja produk di dalam tubuh atau objek[cite: 272]. Menggunakan elemen partikel bercahaya untuk membuktikan 'Unique Mechanism'[cite: 107].";

        // --- NATIVE / SOCIAL (Familiarity Bias [cite: 5, 35]) ---

        case CreativeFormat.IG_STORY_TEXT:
            return "Style: NATIVE IG STORY. Font 'Typewriter' sistem IG[cite: 272]. Sertakan Link Sticker di bagian bawah[cite: 272]. Foto latar belakang harus vertikal, grainy, hasil jepretan iPhone asli dengan flash[cite: 35].";

        case CreativeFormat.TWITTER_REPOST:
            return "Style: X/TWITTER UI. Screenshot postingan viral lengkap dengan PFP melingkar, handle (@name), dan engagement bar (Like, Retweet, Share)[cite: 38]. Harus terlihat tertanam dalam feed organik.";

        case CreativeFormat.PHONE_NOTES:
            return "Style: APPLE NOTES UI. Screenshot aplikasi Notes iPhone dengan tekstur kertas putih/kuning[cite: 19, 40]. Tambahkan garis bawah atau lingkaran merah buatan tangan untuk penekanan poin[cite: 40].";

        case CreativeFormat.DM_NOTIFICATION:
            return "Style: IPHONE LOCKSCREEN NOTIF. Latar belakang wallpaper personal yang redup[cite: 24]. Tumpukan bubble notifikasi pesan (Messages/WhatsApp) dengan teks hook yang memicu rasa penasaran[cite: 24, 25].";

        case CreativeFormat.UGC_MIRROR:
            return "Style: AUTHENTIC CONNECTION. Selfie cermin mentah dengan flash kamera[cite: 272]. Latar belakang kamar yang nyata/berantakan untuk menunjukkan hubungan manusia yang 100% otentik tanpa polesan studio[cite: 272].";

        case CreativeFormat.CHAT_CONVERSATION:
            return "Style: LEAKED CHAT SCREEN. Antarmuka WhatsApp/iMessage dengan bubble chat Biru/Hijau[cite: 35]. Harus terlihat seperti percakapan pribadi yang 'bocor' atau testimoni pelanggan yang sangat akrab[cite: 35].";

        // --- LOGIC / CONVERSION ---

        case CreativeFormat.US_VS_THEM:
            return "Style: COMPARISON TABLE. Sisi Kiri (Them): Desaturasi, ikon 'X' merah, vibe sedih[cite: 272]. Sisi Kanan (Us): Warna brand cerah, ikon checkmark hijau, vibe bahagia[cite: 272]. Fokus pada perbandingan biaya atau efektivitas[cite: 145, 200].";

        case CreativeFormat.VENN_DIAGRAM:
            return "Style: LOGICAL INTERSECTION. Dua atau tiga lingkaran transparan yang tumpang tindih[cite: 272]. Titik temu di tengah dibuat bercahaya untuk menunjukkan 'Sweet Spot' atau solusi unik produk Anda[cite: 272].";

        case CreativeFormat.TESTIMONIAL_HIGHLIGHT:
            return "Style: HIGHLIGHTED DOCUMENT. Foto close-up halaman cetak atau ulasan teks dengan garis stabilo Kuning Neon pada kalimat terpenting[cite: 272]. Memberikan efek kedalaman bidang (depth of field)[cite: 272].";

        case CreativeFormat.SEARCH_BAR:
            return "Style: GOOGLE SEARCH UI. Latar belakang putih bersih dengan logo Google warna-warni[cite: 272]. Bilah pencarian di tengah dengan kueri masalah audiens yang sedang diketik dan kursor berkedip[cite: 272].";

        case CreativeFormat.STICKY_NOTE_REALISM:
            return "Style: REAL STICKY NOTE. Foto makro kertas Post-it kuning yang ditempelkan di cermin atau laptop[cite: 40]. Teks ditulis tangan dengan spidol hitam marker kasar untuk kesan urgensi[cite: 40].";

        case CreativeFormat.ANNOTATED_PRODUCT:
            return "Style: PRODUCT ANATOMY. Foto produk mentah di tengah dengan garis penunjuk tipis yang mengarah ke bagian spesifik[cite: 272]. Berfungsi untuk menjelaskan fitur teknis secara visual (Anatomy of Benefit)[cite: 272].";

        default:
            return "Style: AMATEUR UGC. Utamakan keaslian (Authenticity) daripada estetika studio[cite: 5, 6]. Visual harus 'Thoughtful' dengan data atau insight di baliknya[cite: 15].";
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

    // LEVEL 3: PSYCHOLOGICAL MOOD (MASS DESIRE MAPPING)
    const massDesire = fullStoryContext?.massDesire;
    const desireType = massDesire?.type || "General";

    // MANDATORY NATIVE/UGLY STYLE OVERRIDE
    // We ignore previous conditional logic and force the Amateur aesthetic.
    let styleInstruction = "Style: AMATEUR UGC & UGLY AD AESTHETIC. No professional lighting. Low-res feel, non-matching fonts, 'Authenticity Bias'. Must look like a regular post, NOT a brand advertisement. Avoid smooth, generic AI lighting.";
    
    if (isOfferHeavy) {
        styleInstruction = "Style: HARD HITTING NATIVE. Focus on massive contrast and raw UI elements (Stickers, Red Arrows). Use 'Ugly' design principles to break banner blindness.";
    }

    const strategicContext = {
        campaign: {
            product: project.productName,
            brandVoice: project.brandVoice || "Adaptable",
            // Menambahkan mekanisme agar visual selaras dengan logika solusi
            mechanismUMS: fullStoryContext?.mechanism?.ums 
        },
        psychology: {
            coreDrive: desireType,
            deepestDesire: massDesire?.headline || "General Desire",
            
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
    ROLE: Senior AI Prompt Engineer & Creative Director (Specializing in Native/Ugly Ads).
    TASK: Create a single Image Generation Prompt that bypasses "Banner Blindness".

    --- NATIVE AD BLUEPRINT ---
    1. PATTERN INTERRUPT: The image must look "wrong" or "out of place" in a professional feed. Use clashing colors or MS Paint-style elements if necessary.
    2. UX FAMILIARITY BIAS: Emulate UI from ${format} (Twitter, Gmail, WhatsApp, or Notes) perfectly.
    3. THOUGHTFUL BUT NOT PRETTY: Prioritize the psychological message over aesthetic beauty. No stock photo look.
    4. NO BRANDING: Do not use rigid brand colors or corporate layouts. 
    5. AUTHENTICITY: Make it look like a "friend's post" or a "leaked screenshot".

    --- STRATEGIC CONTEXT ---
    ${JSON.stringify(strategicContext, null, 2)}

    --- DIRECTIVES ---
    1. CORE COMPOSITION: Execute the scene "${visualScene}" precisely. 
    2. VISUAL DNA: Strictly follow the style "${visualStyle}" and format rule: "${getFormatVisualGuide(format)}".
    3. MARKET AWARENESS RULE: ${awarenessLogic} (This is CRITICAL - Do not show product if UNAWARE).
    4. NO STOCK LOOK: ${styleInstruction}. Make it "Thoughtful but not pretty".
    5. TEXT RENDERING: The image MUST include the text "${embeddedText}" clearly visible in the scene (e.g., on the screen, sign, or overlay).
    6. CONGRUENCE: The visual must prove the text. "${congruenceRationale || 'Visual evidence of the claim'}".
    7. PSYCHOLOGICAL MOOD: The lighting and vibe must reflect the "${desireType}.
    
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
