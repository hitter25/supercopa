import { GoogleGenAI } from "@google/genai";
import { ImageSize } from '../types';

export const generateFanImage = async (
  fanImageBase64: string,
  idolName: string,
  teamName: string,
  size: ImageSize
): Promise<string> => {

  // 1. Handle API Key Selection (Required for Pro Image models)
  // Access aistudio from window. Casting to any to avoid TypeScript interface conflicts
  // if 'aistudio' is already defined in global types with a different signature.
  const aistudio = (window as any).aistudio;

  if (aistudio) {
    const hasKey = await aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await aistudio.openSelectKey();
      // Assuming prompt success as per instruction not to delay
    }
  }

  // 2. Initialize Gemini Client (Fresh instance)
  // API key is injected at build time via Vite's define config
  const apiKey = process.env.API_KEY || import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error('❌ GEMINI API KEY not configured!');
    console.error('   process.env.API_KEY:', process.env.API_KEY ? 'SET' : 'NOT SET');
    console.error('   import.meta.env.VITE_GEMINI_API_KEY:', import.meta.env.VITE_GEMINI_API_KEY ? 'SET' : 'NOT SET');
    throw new Error('API key must be set when using the Gemini API. Check build configuration.');
  }

  const ai = new GoogleGenAI({ apiKey });

  // 3. Prepare Prompt & Media
  // Removing data URL prefix for the API if present
  const base64Data = fanImageBase64.replace(/^data:image\/\w+;base64,/, "");

  const prompt = `Create a hyper-realistic photo of this exact fan meeting the football legend ${idolName}, who is wearing a ${teamName} kit.

CRITICAL - FACE PRESERVATION:
- The fan's face MUST be preserved EXACTLY as shown in the reference image
- Maintain ALL facial features precisely: exact eye shape, nose structure, lip shape, facial bone structure, skin tone, skin texture, facial hair (if any), glasses (if any)
- Keep the fan's exact hairstyle, hair color, and hair texture
- Preserve any unique characteristics: moles, freckles, wrinkles, scars, dimples
- The fan's facial proportions and geometry must remain 100% identical to the original
- Do NOT alter, beautify, or modify the fan's appearance in any way

COMPOSITION:
- The fan and ${idolName} are standing side-by-side in a friendly pose
- They may have an arm around the shoulder or a shared thumbs-up
- Both should have joyful, natural expressions celebrating together
- The fan's body position can be adjusted but the face must remain untouched

TECHNICAL REQUIREMENTS:
- Background: professional football stadium with atmospheric floodlights, slightly blurred (bokeh effect)
- Image quality: 8K resolution, cinematic lighting, sharp focus on faces
- Photography style: high-end sports photography aesthetics
- Lighting: natural stadium lighting that flatters both subjects equally`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming camera returns jpeg
              data: base64Data
            }
          }
        ],
      },
      config: {
        imageConfig: {
          imageSize: size, // 1K, 2K, or 4K
          aspectRatio: "9:16", // Vertical for mobile/totem
        },
        // Google Search can be used to get accurate details about the Idol's look if needed
        tools: [{ googleSearch: {} }]
      },
    });

    // 4. Extract Image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image generated in response");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
