
import { GoogleGenAI } from "@google/genai";

// Always initialize with the environment variable directly as a named parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getGalacticMessage(type: 'intro' | 'outro', score?: number): Promise<string> {
  const prompt = type === 'intro' 
    ? "Generate a short, cool 1-sentence message for a snake game pilot entering the 'Neon Grid'. Keep it under 12 words and use snake-like or grid-based terminology."
    : `Generate a short, snarky 1-sentence commentary for a player who just crashed their snake with a score of ${score}. Be witty and mention their length or the grid. Under 18 words.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.9,
      }
    });
    // Access the .text property directly instead of calling it as a function.
    return response.text?.trim() || (type === 'intro' ? "Navigate the grid. Consume the data." : `Score: ${score}. You tangled yourself up.`);
  } catch (error) {
    console.error("Gemini Error:", error);
    return type === 'intro' ? "Navigate the grid. Consume the data." : `Final Score: ${score}. Try again.`;
  }
}
