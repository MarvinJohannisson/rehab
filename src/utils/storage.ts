import { DEFAULT_EXERCISES, DEFAULT_SETTINGS } from '../data/defaultProgram';
import type { AppDataBackup, AppSettings, Exercise, WorkoutLog } from '../types';

const KEYS = {
  exercises: 'fysio_exercises_v1',
  logs: 'fysio_logs_v1',
  settings: 'fysio_settings_v1',
} as const;

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
    return structuredClone(DEFAULT_EXERCISES);
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
