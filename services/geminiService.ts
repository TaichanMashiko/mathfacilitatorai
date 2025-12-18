import { GoogleGenAI, Type, Schema } from "@google/genai";
import { LessonContent } from "../types";

// Schema for the lesson generation to ensure structured JSON output
const lessonSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Title of the lesson" },
    summary: { type: Type.STRING, description: "Brief summary of learning objectives" },
    prerequisites: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          explanation: { type: Type.STRING, description: "Brief review of this junior high or earlier concept" },
          checkQuestion: { type: Type.STRING, description: "A simple question to check understanding" }
        }
      }
    },
    mainContent: { type: Type.STRING, description: "The core mathematical explanation formatted in Markdown" },
    deepDive: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        content: { type: Type.STRING, description: "Explanation of proofs, derivations, or 'why this works' for advanced students" },
        discussionPrompt: { type: Type.STRING, description: "A question to discuss with other students" }
      }
    },
    practice: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          hint: { type: Type.STRING },
          answer: { type: Type.STRING }
        }
      }
    }
  },
  required: ["title", "summary", "prerequisites", "mainContent", "deepDive", "practice"]
};

// Helper to safely get API Key
const getApiKey = () => {
  // @ts-ignore
  if (typeof process !== "undefined" && process.env) {
    // @ts-ignore
    return process.env.API_KEY;
  }
  // @ts-ignore
  if (typeof window !== "undefined" && window.process && window.process.env) {
    // @ts-ignore
    return window.process.env.API_KEY;
  }
  return "";
};

export const generateLessonFromImage = async (base64Data: string, mimeType: string): Promise<LessonContent> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey: apiKey });
  const model = "gemini-3-flash-preview"; 

  const prompt = `
    あなたは高校数学の専門家であり、ファシリテーターです。
    提供された画像（教材PDFなど）の内容を分析し、生徒が自律的に学習できる構造化された授業データを作成してください。
    
    以下の点を重視してください：
    1. **つまずきの解消**: 中学校レベルの知識が必要な場合は、'prerequisites' にその復習内容を含めてください。
    2. **本質の理解**: 単に公式を覚えるだけでなく、'deepDive' セクションで「なぜそうなるのか」「公式の導出」など、上位層が満足できる内容を含めてください。
    3. **協働学習**: 'discussionPrompt' で、生徒同士が話し合いたくなるような問いかけを作成してください。
    
    出力はJSON形式厳守です。
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        role: "user",
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: lessonSchema,
        systemInstruction: "You are a helpful Japanese high school math teacher.",
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as LessonContent;
    }
    throw new Error("No content generated");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};