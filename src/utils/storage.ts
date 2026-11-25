import { DEFAULT_EXERCISES, DEFAULT_SETTINGS } from '../data/defaultProgram';
import type { AppDataBackup, AppSettings, Exercise, WorkoutLog } from '../types';

const KEYS = {
  exercises: 'fysio_exercises_v1',
  logs: 'fysio_logs_v1',
  settings: 'fysio_settings_v1',
  programVersion: 'fysio_program_version_v1',
} as const;

const CURRENT_PROGRAM_VERSION = 2;

/** Built-in exercises introduced in each program revision for one-time migration into existing localStorage */
const PROGRAM_MIGRATIONS: Record<number, string[]> = {
  2: ['dynamic-hamstring-stretch'],
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadExercises(): Exercise[] {
  const saved = safeParse<Exercise[] | null>(localStorage.getItem(KEYS.exercises), null);
  if (!Array.isArray(saved) || saved.length === 0) {
    localStorage.setItem(KEYS.programVersion, String(CURRENT_PROGRAM_VERSION));
    return structuredClone(DEFAULT_EXERCISES);
  }

  const storedVersion = Number(localStorage.getItem(KEYS.programVersion) ?? '1') || 1;
  if (storedVersion < CURRENT_PROGRAM_VERSION) {
    const merged = [...saved];
    for (let v = storedVersion + 1; v <= CURRENT_PROGRAM_VERSION; v++) {
      const idsToAdd = PROGRAM_MIGRATIONS[v] ?? [];
      for (const id of idsToAdd) {
        if (!merged.some((e) => e.id === id)) {
          const defaultExercise = DEFAULT_EXERCISES.find((e) => e.id === id);
          if (defaultExercise) {
            merged.push(structuredClone(defaultExercise));
          }
        }
      }
    }
    localStorage.setItem(KEYS.exercises, JSON.stringify(merged));
    localStorage.setItem(KEYS.programVersion, String(CURRENT_PROGRAM_VERSION));
    return merged;
  }

  return saved;
}

export function saveExercises(exercises: Exercise[]): void {
  localStorage.setItem(KEYS.exercises, JSON.stringify(exercises));
}

export function loadLogs(): WorkoutLog[] {
  const saved = safeParse<WorkoutLog[]>(localStorage.getItem(KEYS.logs), []);
  return Array.isArray(saved) ? saved : [];
}

export function saveLogs(logs: WorkoutLog[]): void {
  localStorage.setItem(KEYS.logs, JSON.stringify(logs));
}

export function loadSettings(): AppSettings {
  const saved = safeParse<Partial<AppSettings>>(localStorage.getItem(KEYS.settings), {});
  return { ...DEFAULT_SETTINGS, ...saved };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

export function createBackupPayload(
  exercises: Exercise[],
  logs: WorkoutLog[],
  settings: AppSettings
): AppDataBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises,
    logs,
    settings,
  };
}

export function parseBackupPayload(jsonString: string): AppDataBackup {
  const parsed = JSON.parse(jsonString) as Partial<AppDataBackup>;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Filen innehåller inte giltig JSON-data.');
  }
  if (!Array.isArray(parsed.exercises) || !Array.isArray(parsed.logs)) {
    throw new Error('Backup-filen saknar övningar eller träningshistorik.');
  }
  return {
    version: parsed.version ?? 1,
    exportedAt: parsed.exportedAt ?? new Date().toISOString(),
    exercises: parsed.exercises,
    logs: parsed.logs,
    settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
  };
}
