export type RunnerTutorialStorage = Pick<Storage, 'getItem' | 'setItem'>;

export const RUNNER_TUTORIAL_STORAGE_KEY = 'runner-action:tutorial:v1:seen';
const RUNNER_TUTORIAL_SEEN_VALUE = '1';

let fallbackSeen = false;

function getStorage(storage?: RunnerTutorialStorage): RunnerTutorialStorage | undefined {
  if (storage) return storage;
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function shouldShowRunnerTutorial(storage?: RunnerTutorialStorage): boolean {
  const resolvedStorage = getStorage(storage);
  if (!resolvedStorage) return !fallbackSeen;
  try {
    if (resolvedStorage.getItem(RUNNER_TUTORIAL_STORAGE_KEY) === RUNNER_TUTORIAL_SEEN_VALUE) return false;
    return !fallbackSeen;
  } catch {
    return !fallbackSeen;
  }
}

export function markRunnerTutorialSeen(storage?: RunnerTutorialStorage): void {
  const resolvedStorage = getStorage(storage);
  if (!resolvedStorage) {
    fallbackSeen = true;
    return;
  }
  try {
    resolvedStorage.setItem(RUNNER_TUTORIAL_STORAGE_KEY, RUNNER_TUTORIAL_SEEN_VALUE);
    if (resolvedStorage.getItem(RUNNER_TUTORIAL_STORAGE_KEY) !== RUNNER_TUTORIAL_SEEN_VALUE) {
      fallbackSeen = true;
    }
  } catch {
    fallbackSeen = true;
  }
}
