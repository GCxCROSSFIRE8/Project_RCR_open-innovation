import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const getModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey.trim() === '""' || apiKey.trim() === "''" || apiKey === 'your_gemini_api_key') {
    console.log("[LangGraphUtils] No GEMINI_API_KEY — using mock mode internally");
    return null;
  }
  return new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    maxOutputTokens: 2048,
    temperature: 0.2,
    apiKey,
  });
};
