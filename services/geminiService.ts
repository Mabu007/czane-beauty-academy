import { GoogleGenAI } from "@google/genai";
import { QuizQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-3-flash-preview';

export const generateCourseDescription = async (title: string, topic: string): Promise<string> => {
  try {
    const prompt = `Write a compelling, professional course description for a beauty academy course titled "${title}" focusing on "${topic}". 
    The tone should be empowering and professional. Keep it under 100 words.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "No description generated.";
  } catch (error) {
    console.error("Error generating content:", error);
    return "Error generating description. Please try again.";
  }
};

const parseJson = (text: string) => {
    try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("JSON Parse error", e);
        return [];
    }
}

export const generateQuizQuestions = async (topic: string, difficulty: string): Promise<QuizQuestion[]> => {
  try {
    const prompt = `Design a multiple-choice quiz with 5 questions about "${topic}" for a "${difficulty}" level student.
    
    CRITICAL: Provide the output as a strictly valid JSON array.
    Each object must have:
    - "question": string
    - "options": array of 4 strings
    - "correctAnswer": integer (0, 1, 2, or 3) indicating the index of the correct option.
    
    Example:
    [
      {
        "question": "What is the first step?",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": 1
      }
    ]`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    const questions = parseJson(response.text || "[]");
    
    return questions.map((q: any, index: number) => ({
      ...q,
      id: `ai-q-${Date.now()}-${index}`
    }));

  } catch (error) {
    console.error("Error generating quiz:", error);
    return [];
  }
};

export const generateExamQuestions = async (topic: string, difficulty: string): Promise<QuizQuestion[]> => {
  try {
    const prompt = `Create a rigorous final exam with 10 challenging multiple-choice questions about "${topic}" suitable for a "${difficulty}" level certification.
    Focus on safety, advanced technique, and theory.
    
    CRITICAL: Provide the output as a strictly valid JSON array.
    Each object must have:
    - "question": string
    - "options": array of 4 strings
    - "correctAnswer": integer (0, 1, 2, or 3) indicating the index of the correct option.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    const questions = parseJson(response.text || "[]");
    
    return questions.map((q: any, index: number) => ({
      ...q,
      id: `ai-exam-${Date.now()}-${index}`
    }));

  } catch (error) {
    console.error("Error generating exam:", error);
    return [];
  }
};