import type { AppSettings, Exercise, WorkoutStep } from '../types';

export function getWorkDurationSeconds(exercise: Exercise): number {
  if (exercise.timerMode === 'reps') {
    return Math.max(5, Math.round(exercise.reps * exercise.secondsPerRep));
  }
  return Math.max(5, Math.round(exercise.durationSeconds));
}

export function formatExerciseTarget(exercise: Exercise): string {
  if (exercise.timerMode === 'reps') {
    const totalSec = getWorkDurationSeconds(exercise);
    return `${exercise.reps} reps · ~${totalSec}s`;
  }
  return `${exercise.durationSeconds}s AMRAP`;
}

interface PlannedSet {
  exercise: Exercise;
  setNumber: number;
  totalSets: number;
}

/**
 * Generates ordered sets for today's workout.
 * When `interleaveLegCore` is enabled (Jannis's Fysiohuset recommendation),
 * leg sets and core sets alternate cleanly so legs recover while working core.
 */
export function buildPlannedSets(
  exercises: Exercise[],
  interleaveLegCore: boolean
): PlannedSet[] {
  const active = exercises.filter((e) => e.enabled && e.sets > 0);
  if (active.length === 0) return [];

  if (!interleaveLegCore) {
    const sequential: PlannedSet[] = [];
    for (const ex of active) {
      for (let s = 1; s <= ex.sets; s++) {
        sequential.push({ exercise: ex, setNumber: s, totalSets: ex.sets });
      }
    }
    return sequential;
  }

  const legQueue: PlannedSet[] = [];
  const coreQueue: PlannedSet[] = [];
  const otherQueue: PlannedSet[] = [];

  for (const ex of active) {
    const bucket =
      ex.category === 'ben'
        ? legQueue
        : ex.category === 'bal'
          ? coreQueue
          : otherQueue;
    for (let s = 1; s <= ex.sets; s++) {
      bucket.push({ exercise: ex, setNumber: s, totalSets: ex.sets });
    }
  }

  // If we don't have both leg and core sets, fall back cleanly to sequential
  if (legQueue.length === 0 || coreQueue.length === 0) {
    return [...legQueue, ...coreQueue, ...otherQueue];
  }

  const interleaved: PlannedSet[] = [];
  let legIdx = 0;
  let coreIdx = 0;

  while (legIdx < legQueue.length || coreIdx < coreQueue.length) {
    if (legIdx < legQueue.length) {
      interleaved.push(legQueue[legIdx++]);
    }
    if (coreIdx < coreQueue.length) {
      interleaved.push(coreQueue[coreIdx++]);
    }
  }

  return [...interleaved, ...otherQueue];
}

export function buildWorkoutSteps(
  exercises: Exercise[],
  settings: AppSettings
): WorkoutStep[] {
  const plannedSets = buildPlannedSets(exercises, settings.interleaveLegCore);
  if (plannedSets.length === 0) return [];

  const steps: WorkoutStep[] = [];
  let stepCounter = 0;
  const nextId = () => `step-${++stepCounter}`;

  const first = plannedSets[0];
  if (settings.prepSeconds > 0) {
    steps.push({
      id: nextId(),
      phase: 'prep',
      exercise: first.exercise,
      setNumber: first.setNumber,
      totalSets: first.totalSets,
      side: first.exercise.unilateral ? 'left' : null,
      durationSeconds: settings.prepSeconds,
      nextExercise: first.exercise,
      nextSetNumber: first.setNumber,
      nextSide: first.exercise.unilateral ? 'left' : null,
    });
  }

  plannedSets.forEach((item, index) => {
    const { exercise, setNumber, totalSets } = item;
    const workSeconds = getWorkDurationSeconds(exercise);
    const nextItem = plannedSets[index + 1];

    if (exercise.unilateral) {
      steps.push({
        id: nextId(),
        phase: 'work',
        exercise,
        setNumber,
        totalSets,
        side: 'left',
        durationSeconds: workSeconds,
      });

      steps.push({
        id: nextId(),
        phase: 'swap',
        exercise,
        setNumber,
        totalSets,
        side: 'right',
        durationSeconds: Math.max(3, exercise.sideSwapSeconds),
        nextExercise: exercise,
        nextSetNumber: setNumber,
        nextSide: 'right',
      });

      steps.push({
        id: nextId(),
        phase: 'work',
        exercise,
        setNumber,
        totalSets,
        side: 'right',
        durationSeconds: workSeconds,
      });
    } else {
      steps.push({
        id: nextId(),
        phase: 'work',
        exercise,
        setNumber,
        totalSets,
        side: null,
        durationSeconds: workSeconds,
      });
    }

    // Add rest between sets (not after the final set)
    if (nextItem && exercise.restSeconds > 0) {
      steps.push({
        id: nextId(),
        phase: 'rest',
        exercise,
        setNumber,
        totalSets,
        side: null,
        durationSeconds: exercise.restSeconds,
        nextExercise: nextItem.exercise,
        nextSetNumber: nextItem.setNumber,
        nextSide: nextItem.exercise.unilateral ? 'left' : null,
      });
    }
  });

  return steps;
}

export function estimateWorkoutDurationSeconds(
  exercises: Exercise[],
  settings: AppSettings
): number {
  const steps = buildWorkoutSteps(exercises, settings);
  return steps.reduce((sum, step) => sum + step.durationSeconds, 0);
}
