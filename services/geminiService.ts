import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedScript, PresentationConfig, FlowSummary } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateFlowSummary = async (text: string): Promise<FlowSummary> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following presentation content and structure it into a logical flow summary in Korean. 
      Return JSON with an array of steps, where each step has a title, a short description, and one key takeaway point.
      
      Content: ${text.substring(0, 10000)}`, // Limit text length
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  keyPoint: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as FlowSummary;
  } catch (error) {
    console.error("Error generating flow:", error);
    throw new Error("Failed to analyze presentation flow.");
  }
};

export const generateScript = async (config: PresentationConfig): Promise<GeneratedScript> => {
  try {
    const prompt = `
      Create a presentation script in Korean based on the following content.
      
      Configuration:
      - Audience: ${config.audience}
      - Tone: ${config.style}
      - Include Non-verbal cues (gestures, tone of voice): ${config.useNonVerbal ? "Yes" : "No"}
      
      Content: "${config.rawContent.substring(0, 15000)}"

      The output must be a JSON object containing:
      1. 'sections': Array of script parts. Each part has 'title' (in Korean), 'content' (the spoken text in Korean), 'duration' (estimated seconds), and optional 'cue' (non-verbal instruction in Korean if enabled).
      2. 'totalTime': Total estimated seconds.
      3. 'keywords': Array of 5 critical keywords/phrases to remember (in Korean).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  duration: { type: Type.NUMBER },
                  cue: { type: Type.STRING }
                }
              }
            },
            totalTime: { type: Type.NUMBER },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as GeneratedScript;
  } catch (error) {
    console.error("Error generating script:", error);
    throw new Error("Failed to generate script.");
  }
};
