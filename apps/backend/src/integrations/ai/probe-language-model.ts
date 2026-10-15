import { generateText } from 'ai';
import { type LanguageModelSettings, createLanguageModel } from './create-language-model';

const PROBE_TIMEOUT_MS = 30_000;

export async function probeLanguageModel(settings: LanguageModelSettings): Promise<void> {
  await generateText({
    model: createLanguageModel(settings),
    prompt: 'Reply with "ok".',
    maxOutputTokens: 16,
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(PROBE_TIMEOUT_MS)
  });
}
