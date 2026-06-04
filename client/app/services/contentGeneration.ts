import { chatAPI } from './api';
import { aiPromptTemplates, fillPromptTemplate } from '../content/prompts';
import type { AIPromptTemplate } from '../content/types';

/**
 * Uses the existing backend chat API (which calls OpenAI) to generate
 * wellness content on demand. The backend already has the /chat/message
 * endpoint that forwards to OpenAI — we leverage it as a content engine.
 */
export async function generateContent(
  templateId: string,
  variables: Record<string, string>,
): Promise<string> {
  const template = aiPromptTemplates.find((t) => t.id === templateId);
  if (!template) throw new Error(`Template "${templateId}" not found`);

  const prompt = fillPromptTemplate(template, variables);
  const systemContext = [
    {
      role: 'assistant' as const,
      content:
        'You are a compassionate wellness content writer for a mental health app called Neshama. Your tone is warm, calm, evidence-based, and supportive. Never use clinical jargon.',
    },
  ];

  const response = await chatAPI.sendMessage(prompt, systemContext);
  if (response.success && response.data?.message) {
    return response.data.message;
  }
  throw new Error('Failed to generate content');
}

export async function generateMeditationScript(
  category: string,
  durationMinutes: number,
): Promise<string> {
  const templateMap: Record<string, string> = {
    stress: 'meditation-stress',
    sleep: 'meditation-sleep',
    anxiety: 'meditation-anxiety',
    focus: 'meditation-focus',
    gratitude: 'meditation-gratitude',
  };

  const templateId = templateMap[category] || 'meditation-stress';
  return generateContent(templateId, { duration: String(durationMinutes) });
}

export async function generateArticle(
  topic: string,
  wordCount: number = 800,
): Promise<string> {
  return generateContent('article-general', {
    topic,
    length: String(wordCount),
  });
}

export async function generateCustomBreathingExercise(
  goal: string,
): Promise<string> {
  return generateContent('breathing-custom', { goal });
}

export async function generateCustomYogaSession(
  goal: string,
  durationMinutes: number,
  difficulty: string = 'beginner',
): Promise<string> {
  return generateContent('yoga-custom', {
    goal,
    duration: String(durationMinutes),
    difficulty,
  });
}
