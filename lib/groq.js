const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const DIFFICULTY_PROMPTS = {
  eli5: `You are explaining to a 5-year-old child.
- Use ONLY words a young child would know (max 2-3 syllable words).
- Give a FUN, playful analogy using toys, animals, food, or cartoons.
- MAX 4 very short sentences.
- NO technical terms at all. Zero.
- Be excited and playful, like storytime.
- End with a silly question like "Isn't that cool?"`,
  beginner: `You are explaining to a complete beginner with ZERO background.
- Use simple everyday language, no jargon.
- Start with "Imagine..." or "Think of it like..." with a relatable real-world analogy.
- Keep it to 1 short paragraph (max 6 sentences).
- Define every single new word if you must use one.
- Be warm, encouraging, and patient in tone.`,
  intermediate: `You are explaining to someone who knows the basics and wants to go deeper.
- Use standard technical terms BUT explain each one briefly when introduced.
- Include the "how" and "why" behind the concept.
- Write 2-3 paragraphs with clear structure.
- Mention 1-2 common misconceptions or pitfalls.
- Balance depth with clarity — smart but not academic.`,
  advanced: `You are explaining to a senior university student or professional.
- Use precise technical language freely (no hand-holding).
- Cover edge cases, limitations, trade-offs, and nuances.
- Write 3-4 dense paragraphs.
- Include specific real-world applications and concrete examples.
- Reference related advanced concepts the user can explore next.
- Assume the user wants depth over simplicity.`,
  phd: `You are explaining to a fellow researcher or expert.
- Use rigorous formal language with precise definitions.
- Include mathematical or theoretical foundations where relevant.
- Discuss competing theories, open problems, and current research directions.
- Write 4-5 paragraphs of academic depth.
- Cite or reference relevant frameworks, papers, or formal models.
- Use discipline-specific terminology without any simplification.
- End with an open question or area of ongoing research.`,
};

const TOKEN_LIMITS = { eli5: 200, beginner: 400, intermediate: 700, advanced: 1000, phd: 1200 };

export const explainConcept = async (topic, difficulty = 'beginner', followUp = null) => {
  const difficultyInstruction = DIFFICULTY_PROMPTS[difficulty];

  const systemPrompt = `You are ExplainIt, an AI tutor. Your job is to explain concepts at exactly the requested difficulty level.
${difficultyInstruction}
IMPORTANT: Follow the style, depth, and structure rules for your assigned level EXACTLY. Do NOT default to a generic explanation style.`;

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
      max_tokens: TOKEN_LIMITS[difficulty],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

const QUIZ_DIFFICULTY = {
  eli5: 'Toddler-level. Questions about very basic concepts. Options should be silly and obvious. Correct answer is very clear.',
  beginner: 'Easy. General knowledge level. Simple wording, straightforward answers. No tricky options.',
  intermediate: 'Moderate. Requires actual understanding. Include one plausible wrong answer per question.',
  advanced: 'Hard. Detailed technical questions. Include edge cases. Wrong options should be believable.',
  phd: 'Expert. Niche, precise questions. Requires deep knowledge. Options should be very close and nuanced.',
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
          content: `Generate 3 multiple choice questions about "${topic}".
Difficulty: ${difficulty} — ${QUIZ_DIFFICULTY[difficulty]}
Return ONLY this JSON format:
[{"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}]`,
        },
      ],
      max_tokens: TOKEN_LIMITS[difficulty] * 2,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  const raw = data.choices[0].message.content;
  return JSON.parse(raw);
};