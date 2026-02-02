
import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Cache key prefix
const CACHE_PREFIX = 'bible_cache_';

/**
 * Gets cached verses from localStorage
 */
export function getCachedVerses(bookName: string, chapter: number, lang: string) {
  const key = `${CACHE_PREFIX}${lang}_${bookName}_${chapter}`;
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * Saves verses to localStorage cache
 */
function setCachedVerses(bookName: string, chapter: number, lang: string, data: any) {
  const key = `${CACHE_PREFIX}${lang}_${bookName}_${chapter}`;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
      keys.slice(0, Math.floor(keys.length / 2)).forEach(k => localStorage.removeItem(k));
    }
  }
}

/**
 * Robust retry wrapper with exponential backoff
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorString = error?.message || String(error);
    const isRateLimit = errorString.includes("429") || errorString.includes("quota");
    
    if (retries > 0 && (isRateLimit || errorString.includes("500") || errorString.includes("Empty response"))) {
      console.warn(`API error encountered. Retrying in ${delay}ms... (${retries} retries left)`, errorString);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    
    throw error;
  }
}

/**
 * Manual base64 decoder as required by guidelines
 */
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Manual PCM decoding to AudioBuffer as required by guidelines
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export async function generateSpeech(text: string, lang: 'en' | 'ta' = 'en'): Promise<AudioBuffer> {
  return callWithRetry(async () => {
    const voiceName = lang === 'ta' ? 'Puck' : 'Kore';
    const prompt = lang === 'ta' ? `வாசிக்கவும்: ${text}` : `Read clearly: ${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data returned from API");
    }

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const decodedBytes = decodeBase64(base64Audio);
    return await decodeAudioData(decodedBytes, audioCtx, 24000, 1);
  });
}

export async function getVerseCommentary(verseRef: string, text: string, lang: 'en' | 'ta' = 'en') {
  const prompt = `Provide a spiritual Christian commentary for ${verseRef}: "${text}". Focus on CSI (Church of South India) values of faith, grace, and service. ${lang === 'ta' ? 'Respond in Tamil.' : 'Respond in English.'} Max 100 words.`;

  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Grace and peace be with you. (Commentary currently unavailable)";
  }).catch(() => "Grace and peace be with you. (Commentary currently unavailable)");
}

export async function generateDailyDevotion(lang: 'en' | 'ta' = 'en') {
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short daily Christian devotional message. Format your output as a pure JSON object. Language: ${lang === 'ta' ? 'Tamil' : 'English'}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verseRef: { type: Type.STRING, description: "A scripture reference like John 3:16" },
            verseText: { type: Type.STRING, description: "The full text of the verse" },
            title: { type: Type.STRING, description: "A catchy spiritual title" },
            content: { type: Type.STRING, description: "A 2-3 sentence spiritual reflection" },
            prayer: { type: Type.STRING, description: "A short closing prayer" },
          },
          required: ["verseRef", "verseText", "title", "content", "prayer"]
        }
      }
    });
    
    const responseText = response.text;
    if (!responseText) throw new Error("Empty response from AI for devotional");
    return JSON.parse(responseText.trim());
  });
}

export async function getChapterVerses(bookName: string, chapter: number, lang: 'en' | 'ta' = 'en') {
  const cached = getCachedVerses(bookName, chapter, lang);
  if (cached) return cached;

  // Use Flash for high-reliability data extraction
  const prompt = `Provide the full scripture for ${bookName} chapter ${chapter}. Version: ${lang === 'ta' ? 'Tamil Bible (BSI)' : 'KJV English'}. Return only a JSON array of objects with "number" and "text" keys. Ensure no verses are skipped.`;

  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert Bible database. Provide the complete text for the requested chapter in JSON format. Do not skip verses. Do not truncate. Accuracy is paramount.",
        responseMimeType: "application/json",
        maxOutputTokens: 12000,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              number: { type: Type.INTEGER },
              text: { type: Type.STRING }
            },
            required: ["number", "text"]
          }
        }
      }
    });
    
    const responseText = response.text;
    if (!responseText || responseText.trim() === "") {
      throw new Error("No verses were generated. This might be due to server load. Please try again in a few moments.");
    }
    
    try {
      const result = JSON.parse(responseText.trim());
      if (result && Array.isArray(result) && result.length > 0) {
        setCachedVerses(bookName, chapter, lang, result);
        return result;
      }
      throw new Error("Scripture data format error.");
    } catch (e) {
      console.error("Bible JSON parse error:", e);
      throw new Error("The chapter could not be formatted properly. Please try again.");
    }
  });
}
