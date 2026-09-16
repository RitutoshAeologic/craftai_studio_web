import { expandPrompt, compileChatDelta } from "./backend-client";

export async function refineRemixPrompt({
  originalPrompt,
  userModifier,
}: {
  originalPrompt: string;
  userModifier: string;
}): Promise<string> {
  try {
    const res = await compileChatDelta({
      base_prompt: originalPrompt,
      user_instruction: userModifier,
      turn_count: 1,
      ai_model: "groq",
    });
    if (res?.compiled_prompt) return res.compiled_prompt;
  } catch {}

  const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (geminiApiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
      const systemInstruction = `You are an expert AI Prompt Engineer for diffusion image models.
A user wants to remix an existing AI-generated image using a new creative idea.

Original Prompt: "${originalPrompt}"
User Modification Request: "${userModifier}"

Your task: Combine both into a single cohesive, high-detail diffusion prompt that preserves the original style/subject while incorporating the requested changes.

Rules:
- Output ONLY the final expanded prompt string. No explanations, no labels, no commentary.
- Use descriptive visual keywords (lighting, style, camera angle, art style, quality tags).
- End with quality boosters: 8k resolution, detailed, masterpiece, cinematic.`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemInstruction }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const refined: string =
          data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (refined) return refined;
      }
    } catch (error) {
      console.error("[refineRemixPrompt] Gemini API error:", error);
    }
  }

  // Fallback — simple concatenation with quality boosters
  return `${originalPrompt}, ${userModifier}, 8k resolution, highly detailed, cinematic lighting, masterpiece`;
}

/**
 * Quick prompt enhancement for User 1 (Prompt Master)
 * Expands a short idea into high-fidelity diffusion keywords
 */
export async function enhancePrompt(shortPrompt: string): Promise<string> {
  try {
    const res = await expandPrompt({
      raw_prompt: shortPrompt,
      ai_model: "gemini",
    });
    if (res?.master_prompt) return res.master_prompt;
  } catch {}

  const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (geminiApiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
      const instruction = `You are an AI Prompt Engineer specializing in diffusion image models (Stable Diffusion, FLUX).
Expand this short image idea into a high-fidelity, detailed prompt:

Input: "${shortPrompt}"

Output ONLY the expanded prompt. Include: subject details, art style, lighting description, camera angle, color palette, mood, and quality tags (4k, 8k, masterpiece, detailed). No commentary.`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: instruction }] }],
          generationConfig: { maxOutputTokens: 250, temperature: 0.8 },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const enhanced: string =
          data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (enhanced) return enhanced;
      }
    } catch (error) {
      console.error("[enhancePrompt] Gemini API error:", error);
    }
  }

  return `${shortPrompt}, ultra detailed, 8k resolution, cinematic lighting, professional photography, masterpiece quality`;
}
