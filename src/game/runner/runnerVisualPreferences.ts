export type RunnerVisualMode = 'calm' | 'standard';
export const RUNNER_VISUAL_STORAGE_KEY = 'runner-action:visual:v1';

export function readRunnerVisualMode(): RunnerVisualMode {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(RUNNER_VISUAL_STORAGE_KEY) ?? 'null');
    if (value && typeof value === 'object' && 'version' in value && value.version === 1 &&
      'mode' in value && (value.mode === 'calm' || value.mode === 'standard')) return value.mode;
  } catch { /* Presentation preferences must never prevent a run. */ }
  return 'calm';
}

export function saveRunnerVisualMode(mode: RunnerVisualMode): void {
  try { localStorage.setItem(RUNNER_VISUAL_STORAGE_KEY, JSON.stringify({ version: 1, mode })); }
  catch { /* In-memory selection still applies if browser storage is unavailable. */ }
}

export function getEffectiveVisualMode(mode: RunnerVisualMode, reducedMotion: boolean): RunnerVisualMode {
  return reducedMotion ? 'calm' : mode;
}
