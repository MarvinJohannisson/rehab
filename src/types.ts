export type ExerciseCategory = 'ben' | 'bal' | 'rorlighet' | 'ovrigt';

export type TimerMode = 'time' | 'reps';

export type AnimationKey =
  | 'wall-squat'
  | 'bear-crawl'
  | 'bear-to-crab'
  | 'forward-reverse-lunge';

export type VisualPreference = 'illustration' | 'animation' | 'media';

export interface Exercise {
  id: string;
  name: string;
  shortName: string;
  category: ExerciseCategory;
  description: string;
  cues: string[];
  enabled: boolean;
  /** 'time' = countdown AMRAP/hold, 'reps' = rep tempo timer (reps * secondsPerRep) */
  timerMode: TimerMode;
  /** Used when timerMode === 'time' */
  durationSeconds: number;
  /** Used when timerMode === 'reps' */
  reps: number;
  /** Seconds per rep when timerMode === 'reps' */
  secondsPerRep: number;
  sets: number;
  /** If true, timer runs Vänster sida -> swap -> Höger sida per set */
  unilateral: boolean;
  sideSwapSeconds: number;
  restSeconds: number;
  /** Built-in illustration path (relative to public/) */
  illustrationUrl?: string;
  /** Built-in looping SVG animation key */
  animationKey?: AnimationKey;
  /** User-uploaded compressed photo (data URL) or external image URL */
  customImageUrl?: string;
  /** User-provided YouTube link or video URL */
  videoUrl?: string;
  /** Optional physio note shown below instructions */
  note?: string;
}

export type AudioMode = 'voice-and-sound' | 'sound-only' | 'muted';

export interface AppSettings {
  audioMode: AudioMode;
  voiceURI: string;
  voiceRate: number;
  countdownBeeps: boolean;
  halfwayCue: boolean;
  prepSeconds: number;
  interleaveLegCore: boolean;
  weeklyGoal: number;
  preferredVisual: VisualPreference;
}

export type SessionFeeling = 'great' | 'good' | 'mild-ache' | 'discomfort';

export interface CompletedExerciseSummary {
  exerciseId: string;
  name: string;
  category: ExerciseCategory;
  setsCompleted: number;
}

export interface WorkoutLog {
  id: string;
  /** Local ISO date string YYYY-MM-DD */
  date: string;
  /** Full ISO timestamp when finished */
  completedAt: string;
  durationSeconds: number;
  exercises: CompletedExerciseSummary[];
  feeling: SessionFeeling;
  notes?: string;
  manual?: boolean;
}

export type StepPhase = 'prep' | 'work' | 'swap' | 'rest';

export type BodySide = 'left' | 'right' | null;

export interface WorkoutStep {
  id: string;
  phase: StepPhase;
  exercise: Exercise;
  setNumber: number;
  totalSets: number;
  side: BodySide;
  durationSeconds: number;
  /** Next work step preview during prep/swap/rest */
  nextExercise?: Exercise;
  nextSetNumber?: number;
  nextSide?: BodySide;
}

export interface AppDataBackup {
  version: number;
  exportedAt: string;
  exercises: Exercise[];
  logs: WorkoutLog[];
  settings: AppSettings;
}
