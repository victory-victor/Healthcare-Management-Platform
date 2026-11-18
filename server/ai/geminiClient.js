/**
 * Google Gemini API Client for MedAI Nexus
 * Model: Gemini 2.5 Flash
 */

const getGeminiConfig = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '';
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const isConfigured = Boolean(apiKey && apiKey.trim() !== '' && process.env.AI_DEV_MODE !== 'true');
  return { apiKey, model, isConfigured };
};

const cleanJsonText = (raw) => {
  if (!raw) return '';
  let str = raw.trim();
  // Strip markdown code fences if present (```json ... ``` or ``` ...)
  if (str.startsWith('```')) {
    str = str.replace(/^```(?:json)?\s*/i, '');
    str = str.replace(/\s*```$/i, '');
  }
  return str.trim();
};

const callGemini = async ({
  systemInstruction = '',
  prompt = '',
  fileData = null,
  isJson = false,
  history = [],
  temperature = 0.2
}) => {
  const { apiKey, model, isConfigured } = getGeminiConfig();

  if (!isConfigured) {
    return { success: false, reason: 'GEMINI_API_KEY not configured or AI_DEV_MODE enabled.' };
  }

  const rawModel = model || 'gemini-2.5-flash';
  const cleanModel = rawModel.replace(/^models\//, '');
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;

  const contents = [];

  // Append history
  for (const h of history) {
    contents.push({
      role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.content }]
    });
  }

  // Build latest prompt parts (supporting multimodal base64 image/PDF)
  const userParts = [];
  if (fileData && fileData.base64 && fileData.mimeType) {
    userParts.push({
      inlineData: {
        mimeType: fileData.mimeType,
        data: fileData.base64
      }
    });
  }
  if (prompt) {
    userParts.push({ text: prompt });
  }

  contents.push({
    role: 'user',
    parts: userParts.length > 0 ? userParts : [{ text: 'Please analyze the document.' }]
  });

  const requestBody = {
    contents,
    generationConfig: {
      temperature,
      ...(isJson ? { responseMimeType: 'application/json' } : {})
    }
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Gemini API Warning] HTTP ${response.status} from model ${model}:`, errText);
      return { success: false, error: `HTTP ${response.status}: ${errText}` };
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text || '';

    if (isJson) {
      try {
        const cleaned = cleanJsonText(textPart);
        const parsed = JSON.parse(cleaned);
        return { success: true, text: textPart, data: parsed };
      } catch (parseErr) {
        console.warn('[Gemini API Warning] Failed to parse JSON response:', parseErr.message, textPart);
        return { success: false, error: 'JSON parse failure', rawText: textPart };
      }
    }

    return { success: true, text: textPart };
  } catch (netErr) {
    console.warn('[Gemini API Warning] Network error contacting Gemini:', netErr.message);
    return { success: false, error: netErr.message };
  }
};

module.exports = {
  callGemini,
  getGeminiConfig,
  cleanJsonText
};
