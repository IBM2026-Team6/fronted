import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedScript, PresentationConfig, FlowSummary, EvaluationResult, LiveSessionData } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateFlowSummary = async (text: string): Promise<FlowSummary> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following presentation content and structure it into a logical flow summary in Korean. 
      Return JSON with an array of steps, where each step has a title, a short description, and one key takeaway point.
      
      Content: ${text.substring(0, 50000)}`,
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
      Create a presentation script in Korean based on the provided materials.
      
      [Configuration]
      - Audience: ${config.audience}
      - Tone: ${config.style}
      - Model: ${config.aiTool} (Optimize token usage accordingly)
      - Non-verbal cues: ${config.useNonVerbal ? "Include gestures/tone instructions" : "None"}
      
      [Source Materials]
      1. Presentation Slides (Main Context): 
      ${config.slideContent.substring(0, 50000)}
      
      ${config.reportContent ? `2. Technical Report/Details (Use for depth): \n${config.reportContent.substring(0, 30000)}` : ''}
      
      ${config.docsContent ? `3. Contest Criteria/Guidelines (Ensure alignment): \n${config.docsContent.substring(0, 20000)}` : ''}

      [Output Requirements]
      Return a JSON object containing:
      1. 'sections': Array of script parts. Each part has 'title', 'content' (spoken text), 'duration' (seconds), 'cue' (if enabled), and 'qa' (array of {q, a} objects for potential questions).
      2. 'totalTime': Total estimated seconds.
      3. 'keywords': Array of 5 critical keywords.
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
                  cue: { type: Type.STRING },
                  qa: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        q: { type: Type.STRING },
                        a: { type: Type.STRING }
                      }
                    }
                  }
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

export const evaluatePresentation = async (
  scriptText: string,
  reportText: string,
  docsText: string
): Promise<EvaluationResult> => {
  try {
    const prompt = `
      Act as a strict contest judge.
      
      [TASK OVERVIEW]
      Your goal is to evaluate the provided [Candidate Script] against the SPECIFIC [Evaluation Criteria] found in the [Evaluation Criteria Source].
      
      [CRITICAL INSTRUCTION - DO NOT IGNORE]
      1. **SOURCE OF TRUTH**: The [Evaluation Criteria Source] text contains the ONLY valid criteria. Look for sections titled "심사 기준", "평가 항목", "배점", "Scoring Criteria", or tables with points.
      2. **VERBATIM EXTRACTION**: You must extract the EXACT NAME and MAX SCORE of the criteria found in the text. (e.g., if text says "창의성 (30점)", you must output name: "창의성", maxScore: 30).
      3. **NO HALLUCINATION**: Do NOT invent generic criteria like "Introduction" or "Body Language" unless they are explicitly listed in the source text with points.
      4. **FALLBACK**: If and ONLY IF you are absolutely sure there are no criteria in the text, you may use standard presentation criteria, but you MUST mention in the summary: "평가 기준을 파일에서 식별할 수 없어 일반 기준을 적용했습니다."
      5. **LANGUAGE**: Output everything in KOREAN.
      
      [Evaluation Criteria Source]
      ${docsText.substring(0, 50000)}
      
      [Candidate Script]
      ${scriptText.substring(0, 30000)}
      
      [Candidate Report]
      ${reportText.substring(0, 30000)}

      [Task]
      1. Identify the specific evaluation items and max points from the Criteria Source.
      2. Score the candidate on each item (0 to maxScore).
      3. Calculate total score and grade (S/A/B/C/D).
      4. Provide specific, constructive feedback for each item in Korean.
      5. List 3 concrete improvements in Korean.
      6. Provide a concise overall summary in Korean.
      
      Return JSON only.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalScore: { type: Type.NUMBER },
            grade: { type: Type.STRING, enum: ["S", "A", "B", "C", "D"] },
            summary: { type: Type.STRING },
            criteria: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  maxScore: { type: Type.NUMBER },
                  feedback: { type: Type.STRING }
                }
              }
            },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as EvaluationResult;
  } catch (error) {
    console.error("Error evaluating presentation:", error);
    throw new Error("Failed to evaluate presentation.");
  }
};

export const prepareLiveSession = async (scriptText: string): Promise<LiveSessionData> => {
  try {
    const prompt = `
      You are an AI Presentation Coach assisting in a live rehearsal.
      
      [INPUT SCRIPT]
      The user has provided a script formatted with Parts/Slides and Durations.
      ${scriptText.substring(0, 40000)}

      [TASK]
      1. Parse the input script into logical steps (one per slide/part).
      2. Extract the estimated duration for each step (look for "XXs" or "XX초"). If missing, estimate based on length (reading speed 4 chars/sec).
      3. **CRITICAL**: Extract exactly 7 KEYWORDS (nouns or key phrases) that the user MUST say for that slide.
         **IMPORTANT**: All keywords MUST be in KOREAN. If a keyword is originally in English (e.g., 'AI', 'Database', 'Cloud'), TRANSLATE it into Korean (e.g., '인공지능', '데이터베이스', '클라우드').
      4. Generate a 'wrapUpSentence' (a concise sentence to summarize/close the current point) to show when time is running out.
      5. Generate a 'transitionSentence' (a bridge sentence to the next topic) to help them move on.

      [OUTPUT REQUIREMENTS]
      Return JSON with 'totalDuration' (sum of all steps) and 'steps' array.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalDuration: { type: Type.NUMBER },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  slideId: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  originalContent: { type: Type.STRING },
                  duration: { type: Type.NUMBER },
                  keywords: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "Exactly 7 key phrases to detect in speech. MUST BE KOREAN."
                  },
                  wrapUpSentence: { type: Type.STRING },
                  transitionSentence: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as LiveSessionData;
  } catch (error) {
    console.error("Error preparing live session:", error);
    throw new Error("Failed to prepare live session.");
  }
};