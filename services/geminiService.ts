import { GoogleGenAI, Type, Schema } from "@google/genai";
import { LessonContent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

export const generateLessonFromImage = async (base64Data: string, mimeType: string): Promise<LessonContent> => {
  const model = "gemini-2.5-flash-latest"; // Using Flash for speed and multimodal capability

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

export const generateReflectionFeedback = async (
  lessonTitle: string,
  reflectionText: string,
  understandingLevel: number
): Promise<string> => {
  const model = "gemini-2.5-flash-latest";

  const prompt = `
    生徒が「${lessonTitle}」という授業の振り返りを行いました。
    生徒の自己評価レベル: ${understandingLevel} / 5
    生徒の振り返り内容: "${reflectionText}"

    あなたはファシリテーター（先生）として、この生徒にフィードバックを返してください。
    
    指針:
    1. 答えを教えるのではなく、次の学びに繋がるアドバイスをすること。
    2. 評価が低い場合は、具体的にどこに戻ればよいか（前提知識など）を優しく提案すること。
    3. 評価が高い場合は、さらに深く考えるための問いかけや、他の生徒へ教えることを推奨すること。
    4. 150文字以内で、親しみやすく励ますトーンで。
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "フィードバックの生成に失敗しました。";
  } catch (error) {
    console.error("Gemini Reflection Error:", error);
    return "現在AIサービスに接続できません。";
  }
};
