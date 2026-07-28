const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const DIFFICULTY_PROMPTS = {
  eli5: 'Explain like I am 5 years old. Use very simple words, fun analogies, and short sentences.',
  beginner: 'Explain for a beginner with no prior knowledge. Use simple language and relatable examples.',
  intermediate: 'Explain for someone with basic knowledge. Include key concepts and some technical terms.',
  advanced: 'Explain in depth with technical accuracy. Include nuances, edge cases, and advanced concepts.',
  phd: 'Explain at a PhD/expert level. Use precise technical language, formal definitions, and academic depth.',
};

export const explainConcept = async (topic, difficulty = 'beginner', followUp = null) => {
  const difficultyInstruction = DIFFICULTY_PROMPTS[difficulty];

  const systemPrompt = `You are ExplainIt, an expert AI tutor. Your job is to explain any concept clearly and engagingly.
${difficultyInstruction}
Always structure your response with:
1. A simple one-line definition
2. The core explanation
3. A real-world example or analogy
4. One fun fact (optional)
Keep responses concise but complete.`;

  const userMessage = followUp
    ? followUp
    : `Explain this concept to me: "${topic}"`;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

export const generateQuiz = async (topic, difficulty = 'beginner') => {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are a quiz generator. Return ONLY a valid JSON array, no markdown, no explanation.',
        },
        {
          role: 'user',
          content: `Generate 3 multiple choice questions about "${topic}" at ${difficulty} level.
Return ONLY this JSON format:
[{"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}]`,
        },
      ],
      max_tokens: 600,
      temperature: 0.5,
    }),
  });

  const data = await response.json();
  const raw = data.choices[0].message.content;
  return JSON.parse(raw);
};