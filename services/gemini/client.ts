
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize the client
const apiKey = process.env.API_KEY || "";
export const ai = new GoogleGenAI({ apiKey });

// Shared Utility
export function extractJSON<T>(text: string): T {
  try {
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText) as T;
  } catch (e) {
    console.error("JSON Parse Error", e, text);
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
