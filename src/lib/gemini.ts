export interface AIAnalysisResult {
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  advice: string;
  summary: string;
}

const FALLBACK_RESPONSE: AIAnalysisResult = {
  risk: 'MEDIUM',
  advice: 'Unable to analyze the specific situation at the moment. Please exercise standard caution.',
  summary: 'AI analysis is currently unavailable for this request.',
};

/**
 * Service function to analyze a crisis request using Gemini API via REST.
 * 
 * @param text The text description of the crisis/request
 * @returns AIAnalysisResult containing risk level, advice, and summary
 */
export async function analyzeCrisisRequest(text: string): Promise<AIAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('Environment variable GEMINI_API_KEY is not defined.');
    return FALLBACK_RESPONSE;
  }

  // Using gemini-1.5-flash which is fast and cost-effective for JSON parsing
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `Classify the following situation and return ONLY a valid JSON object. Do not include markdown code block syntax like \`\`\`json.
Situation: "${text}"

JSON schema required:
{
  "risk": "LOW" | "MEDIUM" | "HIGH",
  "advice": "Actionable advice in 1-2 sentences",
  "summary": "Short 1 sentence summary of the situation"
}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.2, // Low temperature for consistent classification
        }
      })
    });

    if (!response.ok) {
      console.error(`Gemini API Error: ${response.status} - ${response.statusText}`);
      return FALLBACK_RESPONSE;
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      console.error('Gemini API returned an unexpected response structure.');
      return FALLBACK_RESPONSE;
    }

    try {
      const parsedResult = JSON.parse(resultText) as AIAnalysisResult;
      
      // Basic validation of the parsed JSON
      const validRisks = ['LOW', 'MEDIUM', 'HIGH'];
      const risk = validRisks.includes(parsedResult.risk?.toUpperCase()) 
        ? parsedResult.risk.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH'
        : 'MEDIUM';

      return {
        risk,
        advice: parsedResult.advice || FALLBACK_RESPONSE.advice,
        summary: parsedResult.summary || FALLBACK_RESPONSE.summary,
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', resultText);
      return FALLBACK_RESPONSE;
    }

  } catch (error) {
    console.error('Network or execution error while calling Gemini API:', error);
    return FALLBACK_RESPONSE;
  }
}
