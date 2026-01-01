
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize the client
const apiKey = process.env.API_KEY || "";
export const ai = new GoogleGenAI({ apiKey });

// Shared Utility for Robust JSON Extraction
export function extractJSON<T>(text: string): T {
  try {
    if (!text) return {} as T;

    // 1. Strip Markdown Code Blocks (```json ... ```)
    let cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    // 2. Find the outer-most JSON object or array
    const firstBrace = cleanText.indexOf('{');
    const firstBracket = cleanText.indexOf('[');
    
    let startIndex = -1;
    
    // Determine if it's likely an Object or an Array based on which comes first
    if (firstBrace !== -1 && firstBracket !== -1) {
        startIndex = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
        startIndex = firstBrace;
    } else if (firstBracket !== -1) {
        startIndex = firstBracket;
    }

    if (startIndex !== -1) {
        // Slice from the start character
        cleanText = cleanText.substring(startIndex);
        
        // Find the last closing character
        const lastBrace = cleanText.lastIndexOf('}');
        const lastBracket = cleanText.lastIndexOf(']');
        const endIndex = Math.max(lastBrace, lastBracket);
        
        if (endIndex !== -1) {
            cleanText = cleanText.substring(0, endIndex + 1);
        }
    }

    return JSON.parse(cleanText) as T;
  } catch (e) {
    console.warn("JSON Extraction Failed. Raw text:", text);
    console.error(e);
    // Return empty object/array based on expectation to prevent crash
    return {} as T;
  }
}

/**
 * Wraps ai.models.generateContent with exponential backoff retry logic.
 * Helps prevent "Unexpected end of JSON input" and 503 errors.
 */
export async function generateWithRetry(params: any, retries = 3, delay = 1000): Promise<GenerateContentResponse> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      // Create a fresh request each time to avoid "Response body object should not be disturbed" errors
      const response = await ai.models.generateContent(params);
      
      // Basic check if response has content
      if (!response.text && !response.candidates) {
          throw new Error("Empty response from Gemini");
      }
      
      return response;
    } catch (error: any) {
      lastError = error;
      const isNetworkError = error.message?.includes('fetch') || error.message?.includes('Response');
      const isRateLimit = error.status === 429 || error.code === 429;
      const isServerOverload = error.status === 503 || error.code === 503;

      if (i === retries - 1) break;

      if (isNetworkError || isRateLimit || isServerOverload) {
         console.warn(`API call failed (attempt ${i + 1}/${retries}). Retrying...`, error.message);
         await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
         continue;
      }
      
      throw error; // Throw immediately for other errors (like 400 Bad Request)
    }
  }
  throw lastError;
}
