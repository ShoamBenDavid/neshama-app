import { AIPromptTemplate } from './types';

export const aiPromptTemplates: AIPromptTemplate[] = [
  {
    id: 'meditation-stress',
    type: 'meditation',
    name: 'Stress Relief Meditation',
    prompt: 'Generate a {duration}-minute guided meditation script for stress relief. The tone should be calm, warm, and supportive. Include: an opening to settle in, body relaxation, a visualization for releasing stress, and a gentle closing. Use second person ("you"). Write it as a continuous script that could be read aloud by a TTS engine. No stage directions or brackets.',
  },
  {
    id: 'meditation-sleep',
    type: 'meditation',
    name: 'Sleep Meditation',
    prompt: 'Generate a {duration}-minute guided meditation for falling asleep. The tone should be extremely gentle, slow, and soothing. Include: settling into bed, progressive body relaxation from toes to head, a peaceful sleep visualization (such as floating on calm water or lying in a field of soft grass), and let it trail off so the listener drifts to sleep. No "open your eyes" ending.',
  },
  {
    id: 'meditation-anxiety',
    type: 'meditation',
    name: 'Anxiety Calming Meditation',
    prompt: 'Generate a {duration}-minute guided meditation for calming anxiety. Include: grounding techniques (5-4-3-2-1 senses), controlled breathing instructions, gentle reassurance that the listener is safe, and visualization of anxiety as a wave that rises and falls. Tone: compassionate, grounded, non-judgmental.',
  },
  {
    id: 'meditation-focus',
    type: 'meditation',
    name: 'Focus Meditation',
    prompt: 'Generate a {duration}-minute guided meditation for improving focus and concentration. Include: breath awareness as an anchor, instruction for returning attention when the mind wanders, a metaphor for mental clarity (such as a clear lake), and an energizing close. Tone: clear, calm, purposeful.',
  },
  {
    id: 'meditation-gratitude',
    type: 'meditation',
    name: 'Gratitude Meditation',
    prompt: 'Generate a {duration}-minute guided gratitude meditation. Guide the listener to appreciate: a person in their life, their own body, a recent challenge that taught them something, and the simple gifts of everyday life. Include a warmth visualization in the heart area. Tone: warm, loving, uplifting.',
  },
  {
    id: 'article-anxiety',
    type: 'article',
    name: 'Anxiety Article',
    prompt: 'Write a {length}-word wellness article about {topic}. The article should be evidence-based but accessible. Include: clear explanations, practical tips the reader can use today, and an encouraging conclusion. Use markdown headings. Tone: knowledgeable, compassionate, empowering. Do not use clinical jargon. Write as if speaking to a friend who needs help.',
  },
  {
    id: 'article-general',
    type: 'article',
    name: 'General Wellness Article',
    prompt: 'Write a {length}-word article about {topic} for a mental health app. Include scientific research references where relevant (mention studies without full citations). Provide 3-5 actionable takeaways. Use a warm, supportive tone. Format with markdown headings and short paragraphs for mobile reading.',
  },
  {
    id: 'breathing-custom',
    type: 'breathing',
    name: 'Custom Breathing Exercise',
    prompt: 'Design a breathing exercise for {goal}. Provide: name, description (2 sentences), difficulty level, benefits (4 items), and the exact breathing pattern with phase durations in seconds. Format as JSON with fields: name, description, difficulty, benefits[], phases[{type, duration, instruction}]. Phases should use types: inhale, hold, exhale, rest.',
  },
  {
    id: 'yoga-custom',
    type: 'yoga',
    name: 'Custom Yoga Session',
    prompt: 'Create a {duration}-minute yoga session for {goal}. Difficulty: {difficulty}. Provide 5-7 poses with: pose name, duration in seconds, detailed instruction for a beginner (2-3 sentences), and one key benefit. Format as a JSON array of poses. The sequence should flow naturally from one pose to the next.',
  },
];

export function fillPromptTemplate(
  template: AIPromptTemplate,
  variables: Record<string, string>,
): string {
  let prompt = template.prompt;
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return prompt;
}

export default aiPromptTemplates;
