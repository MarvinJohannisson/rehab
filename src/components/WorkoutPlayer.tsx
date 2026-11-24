import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  Plus,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { CATEGORY_LABELS, FEELING_META } from '../data/defaultProgram';
import type {
  AppSettings,
  CompletedExerciseSummary,
  SessionFeeling,
  VisualPreference,
  WorkoutLog,
  WorkoutStep,
} from '../types';
import { formatClock, formatDurationMinutes, toLocalDateKey } from '../utils/dateUtils';
import {
  formatSideSwedish,
  requestScreenWakeLock,
  soundCoach,
} from '../utils/soundCoach';
import { ExerciseVisual } from './ExerciseVisual';

interface Props {
  steps: WorkoutStep[];
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onFinishSave: (log: WorkoutLog) => void;
  onExit: () => void;
}

const RING_RADIUS = 104;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const WorkoutPlayer: React.FC<Props> = ({
  steps,
  settings,
  onUpdateSettings,
  onFinishSave,
  onExit,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(() => steps[0]?.durationSeconds ?? 0);
  const [stepTotal, setStepTotal] = useState(() => steps[0]?.durationSeconds ?? 1);
  const [isRunning, setIsRunning] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [showVisual, setShowVisual] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Completed step tracking & final elapsed time (state so render stays pure)
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [finalDurationSec, setFinalDurationSec] = useState<number>(60);

  // Summary state when completed
  const [feeling, setFeeling] = useState<SessionFeeling>('good');
  const [notes, setNotes] = useState('');

  // Mutable timer tracking refs (never read during render)
  const startedAtRef = useRef<number>(0);
  const elapsedSecondsRef = useRef<number>(0);
  const announcedStepIdRef = useRef<string | null>(null);
  const halfwaySpokenStepRef = useRef<string | null>(null);
  const lastSecondCueRef = useRef<number | null>(null);
  const lastRepRef = useRef<number>(1);
  const settingsRef = useRef(settings);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const currentStep = steps[stepIndex];

  // Keep screen awake during active workout
  useEffect(() => {
    let sentinel: WakeLockSentinel | null = null;
    const acquire = async () => {
      sentinel = await requestScreenWakeLock();
    };
    if (!isComplete) {
      void acquire();
    }
    const handleVisChange = () => {
      if (document.visibilityState === 'visible' && !isComplete) {
        void acquire();
      }
    };
    document.addEventListener('visibilitychange', handleVisChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisChange);
      if (sentinel) {
        void sentinel.release();
      }
      soundCoach.stopSpeech();
    };
  }, [isComplete]);

  // Announce whenever entering a new step
  useEffect(() => {
    if (isComplete || !currentStep) return;
    if (announcedStepIdRef.current === currentStep.id) return;
    announcedStepIdRef.current = currentStep.id;
    lastSecondCueRef.current = null;
    lastRepRef.current = 1;

    const cfg = settingsRef.current;
    const sideText = formatSideSwedish(currentStep.side);

    if (currentStep.phase === 'prep') {
      const targetName = currentStep.exercise.shortName;
      soundCoach.speak(
        `Gör dig redo för ${targetName}${sideText ? `, ${sideText}` : ''}.`,
        cfg
      );
    } else if (currentStep.phase === 'work') {
      soundCoach.playStartWork(cfg);
      const repInfo =
        currentStep.exercise.timerMode === 'reps'
          ? `${currentStep.exercise.reps} repetitioner`
          : `${currentStep.durationSeconds} sekunder`;
      soundCoach.speak(
        `Kör! ${currentStep.exercise.shortName}${sideText ? `, ${sideText}` : ''}. ${repInfo}.`,
        cfg
      );
    } else if (currentStep.phase === 'swap') {
      soundCoach.playSideSwap(cfg);
      soundCoach.speak(
        `Byt sida! Gör dig redo för ${formatSideSwedish(currentStep.nextSide ?? 'right')}.`,
        cfg
      );
    } else if (currentStep.phase === 'rest') {
      soundCoach.playRest(cfg);
      const nextName = currentStep.nextExercise?.shortName;
      soundCoach.speak(
        `Bra jobbat! Vila i ${currentStep.durationSeconds} sekunder.${
          nextName ? ` Nästa övning är ${nextName}.` : ''
        }`,
        cfg
      );
    }
  }, [currentStep, isComplete]);

  // Accurate tick loop (updates every 200ms using Date.now() delta so background throttling stays accurate)
  useEffect(() => {
    if (!isRunning || isComplete || !currentStep) return;

    let lastTick = Date.now();
    const interval = window.setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastTick) / 1000;
      lastTick = now;

      elapsedSecondsRef.current += deltaSec;

      setTimeLeft((prev) => {
        const next = Math.max(0, prev - deltaSec);
        const cfg = settingsRef.current;
        const ceilNext = Math.ceil(next);

        // Countdown 3-2-1 cues
        if (ceilNext >= 1 && ceilNext <= 3 && lastSecondCueRef.current !== ceilNext) {
          lastSecondCueRef.current = ceilNext;
          soundCoach.playTick(cfg);
          if (cfg.audioMode === 'voice-and-sound') {
            soundCoach.speak(String(ceilNext), cfg);
          }
        }

        // Halfway cue on longer work sets (>= 30s)
        if (
          currentStep.phase === 'work' &&
          cfg.halfwayCue &&
          stepTotal >= 30 &&
          next <= stepTotal / 2 &&
          next > 5 &&
          halfwaySpokenStepRef.current !== currentStep.id
        ) {
          halfwaySpokenStepRef.current = currentStep.id;
          soundCoach.speak('Halvvägs!', cfg);
        }

        // Rep tempo pulse on rep-based work sets
        if (
          currentStep.phase === 'work' &&
          currentStep.exercise.timerMode === 'reps' &&
          next > 3.5
        ) {
          const elapsedInStep = stepTotal - next;
          const repNow = Math.min(
            currentStep.exercise.reps,
            Math.floor(elapsedInStep / currentStep.exercise.secondsPerRep) + 1
          );
          if (repNow > lastRepRef.current) {
            lastRepRef.current = repNow;
            soundCoach.playRepPulse(cfg);
          }
        }

        // Advance step when timer reaches 0
        if (next <= 0) {
          if (currentStep.phase === 'work') {
            setCompletedStepIds((ids) =>
              ids.includes(currentStep.id) ? ids : [...ids, currentStep.id]
            );
          }
          if (stepIndex + 1 < steps.length) {
            const upcoming = steps[stepIndex + 1];
            setStepIndex(stepIndex + 1);
            setStepTotal(upcoming.durationSeconds);
            return upcoming.durationSeconds;
          } else {
            const totalSec = Math.max(
              60,
              Math.round(
                elapsedSecondsRef.current ||
                  (Date.now() - startedAtRef.current) / 1000
              )
            );
            setFinalDurationSec(totalSec);
            setIsComplete(true);
            setIsRunning(false);
            soundCoach.playComplete(cfg);
            soundCoach.speak('Snyggt jobbat! Dagens fysiopass är klart.', cfg);
            return 0;
          }
        }

        return next;
      });
    }, 200);

    return () => window.clearInterval(interval);
  }, [isRunning, isComplete, currentStep, stepIndex, steps, stepTotal]);

  const finishEarlyAndLog = () => {
    const totalSec = Math.max(
      60,
      Math.round(
        elapsedSecondsRef.current || (Date.now() - startedAtRef.current) / 1000
      )
    );
    setFinalDurationSec(totalSec);
    setShowExitConfirm(false);
    setIsRunning(false);
    setIsComplete(true);
    soundCoach.stopSpeech();
  };

  const jumpToStep = (nextIndex: number) => {
    if (nextIndex < 0) return;
    if (nextIndex > stepIndex && currentStep?.phase === 'work') {
      setCompletedStepIds((ids) =>
        ids.includes(currentStep.id) ? ids : [...ids, currentStep.id]
      );
    }
    if (nextIndex >= steps.length) {
      const totalSec = Math.max(
        60,
        Math.round(
          elapsedSecondsRef.current || (Date.now() - startedAtRef.current) / 1000
        )
      );
      setFinalDurationSec(totalSec);
      setIsComplete(true);
      setIsRunning(false);
      soundCoach.playComplete(settings);
      soundCoach.speak('Snyggt jobbat! Dagens fysiopass är klart.', settings);
      return;
    }
    announcedStepIdRef.current = null;
    const target = steps[nextIndex];
    setStepIndex(nextIndex);
    setStepTotal(target.durationSeconds);
    setTimeLeft(target.durationSeconds);
  };

  const handleExtendRest = (extraSeconds: number) => {
    setTimeLeft((t) => t + extraSeconds);
    setStepTotal((total) => total + extraSeconds);
  };

  const toggleAudioQuick = () => {
    const next =
      settings.audioMode === 'voice-and-sound'
        ? 'sound-only'
        : settings.audioMode === 'sound-only'
          ? 'muted'
          : 'voice-and-sound';
    if (next === 'muted') soundCoach.stopSpeech();
    onUpdateSettings({ audioMode: next });
  };

  // Build completed exercises summary purely from completedStepIds
  const completedSummary = useMemo<CompletedExerciseSummary[]>(() => {
    const completedSet = new Set(completedStepIds);
    const map = new Map<string, CompletedExerciseSummary>();
    const countedSetKeys = new Set<string>();

    for (const step of steps) {
      if (step.phase !== 'work') continue;
      if (!completedSet.has(step.id)) continue;

      const setKey = `${step.exercise.id}-set-${step.setNumber}`;
      if (countedSetKeys.has(setKey)) continue;
      countedSetKeys.add(setKey);

      const existing = map.get(step.exercise.id);
      if (existing) {
        existing.setsCompleted += 1;
      } else {
        map.set(step.exercise.id, {
          exerciseId: step.exercise.id,
          name: step.exercise.name,
          category: step.exercise.category,
          setsCompleted: 1,
        });
      }
    }
    return Array.from(map.values());
  }, [steps, completedStepIds]);

  const handleSaveLog = () => {
    const log: WorkoutLog = {
      id: `log-${Date.now()}`,
      date: toLocalDateKey(new Date()),
      completedAt: new Date().toISOString(),
      durationSeconds: finalDurationSec,
      exercises: completedSummary,
      feeling,
      notes: notes.trim() || undefined,
    };
    onFinishSave(log);
  };

  // =========================================================
  // COMPLETE / POST-WORKOUT LOG VIEW
  // =========================================================
  if (isComplete) {
    return (
      <main className="player-screen player-bg-work">
        <div style={{ paddingTop: '12px', textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--accent-pine)',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              boxShadow: '0 10px 24px rgba(46, 111, 94, 0.28)',
            }}
          >
            <Check size={32} strokeWidth={2.8} />
          </div>
          <p className="page-eyebrow">Pass genomfört</p>
          <h1 className="page-title">Snyggt jobbat!</h1>
          <p className="page-subtitle">
            Tid: {formatDurationMinutes(finalDurationSec)} ·{' '}
            {completedSummary.reduce((sum, e) => sum + e.setsCompleted, 0)} set klara
          </p>
        </div>

        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 className="section-title">Hur kändes kroppen?</h2>
          <div className="feeling-grid">
            {(Object.keys(FEELING_META) as SessionFeeling[]).map((key) => {
              const meta = FEELING_META[key];
              return (
                <button
                  key={key}
                  type="button"
                  className={`feeling-option ${feeling === key ? 'selected' : ''}`}
                  onClick={() => setFeeling(key)}
                >
                  <span className="feeling-option-title">
                    <span className={`calendar-feeling-dot ${meta.colorClass}`} />
                    {meta.label}
                  </span>
                  <span className="feeling-option-desc">{meta.description}</span>
                </button>
              );
            })}
          </div>

          {feeling === 'discomfort' && (
            <div
              className="card-subtle"
              style={{
                background: 'var(--accent-clay-soft)',
                color: 'var(--accent-clay)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Kom ihåg Jannis råd: hör av dig till Fysiohuset om du får besvär av övningarna.
            </div>
          )}

          <div className="field">
            <label htmlFor="workout-notes" className="field-label">
              Anteckning (valfritt)
            </label>
            <textarea
              id="workout-notes"
              className="textarea"
              placeholder="T.ex. kändes stabilt på vänster ben, orkade 2 bålset..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </section>

        {completedSummary.length > 0 && (
          <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 className="section-title" style={{ fontSize: 15 }}>
              Genomförda övningar
            </h2>
            {completedSummary.map((item) => (
              <div
                key={item.exerciseId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 14,
                  padding: '4px 0',
                }}
              >
                <span>{item.name}</span>
                <span className="meta-pill">{item.setsCompleted} set</span>
              </div>
            ))}
          </section>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
          <button
            id="btn-save-workout"
            type="button"
            className="btn btn-primary"
            onClick={handleSaveLog}
          >
            Spara pass i kalendern
          </button>
          <button type="button" className="btn btn-ghost" onClick={onExit}>
            Stäng utan att spara
          </button>
        </div>
      </main>
    );
  }

  // =========================================================
  // ACTIVE TIMER VIEW
  // =========================================================
  const phase = currentStep.phase;
  const phaseAccent =
    phase === 'work'
      ? 'var(--accent-pine)'
      : phase === 'swap'
        ? 'var(--accent-amber)'
        : phase === 'rest'
          ? 'var(--accent-fjord)'
          : 'var(--accent-prep)';

  const progressRatio = stepTotal > 0 ? Math.min(1, Math.max(0, timeLeft / stepTotal)) : 0;
  const dashOffset = RING_CIRCUMFERENCE * (1 - progressRatio);
  const overallProgressPct = Math.round(((stepIndex + 1) / steps.length) * 100);

  const phaseLabel =
    phase === 'prep'
      ? 'Gör dig redo'
      : phase === 'swap'
        ? 'Byt sida'
        : phase === 'rest'
          ? 'Vila'
          : currentStep.side === 'left'
            ? 'Arbeta · Vänster sida'
            : currentStep.side === 'right'
              ? 'Arbeta · Höger sida'
              : 'Arbeta';

  const displayExercise =
    phase === 'rest' && currentStep.nextExercise
      ? currentStep.nextExercise
      : currentStep.exercise;

  // Live current rep calculation for rep-based exercises
  const currentRep =
    phase === 'work' && currentStep.exercise.timerMode === 'reps'
      ? Math.min(
          currentStep.exercise.reps,
          Math.max(
            1,
            Math.floor((stepTotal - timeLeft) / currentStep.exercise.secondsPerRep) + 1
          )
        )
      : null;

  return (
    <main className={`player-screen player-bg-${phase}`}>
      {/* Top Bar */}
      <div className="player-topbar">
        <button
          id="btn-exit-workout"
          type="button"
          className="icon-btn"
          aria-label="Avsluta pass"
          onClick={() => setShowExitConfirm(true)}
        >
          <X size={20} />
        </button>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--ink-secondary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span>
              Steg {stepIndex + 1} av {steps.length}
            </span>
            <span>{overallProgressPct}%</span>
          </div>
          <div className="player-progress-bar">
            <div
              className="player-progress-fill"
              style={{ width: `${overallProgressPct}%`, backgroundColor: phaseAccent }}
            />
          </div>
        </div>

        <button
          type="button"
          className="icon-btn"
          aria-label="Växla röst och ljud"
          onClick={toggleAudioQuick}
          title={
            settings.audioMode === 'voice-and-sound'
              ? 'Röst + ljud på'
              : settings.audioMode === 'sound-only'
                ? 'Bara ljud på'
                : 'Tyst'
          }
        >
          {settings.audioMode === 'muted' ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Phase & Exercise Title */}
      <div className="player-header-center">
        <span className={`player-phase-pill phase-${phase}`}>{phaseLabel}</span>
        <h1 className="player-exercise-title">
          {phase === 'rest'
            ? 'Återhämtning'
            : phase === 'swap'
              ? `Byt till ${formatSideSwedish(currentStep.nextSide ?? 'right')}`
              : currentStep.exercise.name}
        </h1>
        <p className="player-set-subtitle">
          {phase === 'rest' && currentStep.nextExercise
            ? `Nästa: ${currentStep.nextExercise.name} (Set ${currentStep.nextSetNumber}/${currentStep.nextExercise.sets})`
            : `Set ${currentStep.setNumber} av ${currentStep.totalSets} · ${
                CATEGORY_LABELS[currentStep.exercise.category]
              }`}
        </p>
      </div>

      {/* Circular Countdown Timer */}
      <div className="timer-ring-wrap" aria-live="polite">
        <svg className="timer-ring-svg" viewBox="0 0 240 240">
          <circle className="timer-ring-track" cx="120" cy="120" r={RING_RADIUS} />
          <circle
            className="timer-ring-progress"
            cx="120"
            cy="120"
            r={RING_RADIUS}
            stroke={phaseAccent}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="timer-ring-center">
          <span className="timer-digits">{formatClock(timeLeft)}</span>
          {currentRep !== null ? (
            <span className="rep-counter-pill">
              Rep {currentRep} / {currentStep.exercise.reps}
            </span>
          ) : (
            <span className="timer-sublabel">
              {phase === 'work'
                ? 'AMRAP · Kontrollerat'
                : phase === 'swap'
                  ? 'Ställ dig i position'
                  : phase === 'rest'
                    ? 'Andas ut & skaka loss'
                    : 'Startar snart...'}
            </span>
          )}
        </div>
      </div>

      {/* Primary Controls */}
      <div className="player-controls">
        <button
          type="button"
          className="player-btn-secondary"
          disabled={stepIndex === 0}
          aria-label="Föregående steg"
          onClick={() => jumpToStep(stepIndex - 1)}
        >
          <SkipBack size={20} />
        </button>

        <button
          id="btn-play-pause"
          type="button"
          className="player-btn-main"
          style={{ backgroundColor: phaseAccent }}
          aria-label={isRunning ? 'Pausa timer' : 'Fortsätt timer'}
          onClick={() => {
            soundCoach.unlock();
            setIsRunning((r) => !r);
          }}
        >
          {isRunning ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" />}
        </button>

        <button
          id="btn-skip-step"
          type="button"
          className="player-btn-secondary"
          aria-label="Nästa steg"
          onClick={() => jumpToStep(stepIndex + 1)}
        >
          <SkipForward size={20} />
        </button>
      </div>

      {/* Contextual Helper Buttons */}
      <div className="player-extra-actions">
        {phase === 'rest' && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleExtendRest(15)}
          >
            <Plus size={14} />
            15s extra vila
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setShowVisual((v) => !v)}
        >
          {showVisual ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {showVisual ? 'Dölj guide' : 'Visa bild & teknik'}
        </button>
      </div>

      {/* Exercise Visual & Form Cues (shows upcoming exercise during rest!) */}
      {showVisual && (
        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--ink-secondary)',
              }}
            >
              {phase === 'rest' ? `Förbered nästa: ${displayExercise.shortName}` : 'Utförande'}
            </span>
            <span className={`cat-badge cat-${displayExercise.category}`}>
              {CATEGORY_LABELS[displayExercise.category]}
            </span>
          </div>

          <ExerciseVisual
            exercise={displayExercise}
            preferredVisual={settings.preferredVisual}
            onChangePreference={(pref: VisualPreference) =>
              onUpdateSettings({ preferredVisual: pref })
            }
            compact
          />

          {displayExercise.cues.length > 0 ? (
            <ul className="cue-list">
              {displayExercise.cues.map((cue, idx) => (
                <li key={idx}>{cue}</li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: 13.5, color: 'var(--ink-secondary)' }}>
              {displayExercise.description}
            </p>
          )}
        </section>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-sheet" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="section-title">Avsluta passet?</h2>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowExitConfirm(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--ink-secondary)', fontSize: 14 }}>
                Vill du avsluta dagens fysiopass i förtid, eller logga det du hunnit göra hittills?
              </p>
            </div>
            <div className="modal-footer" style={{ flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowExitConfirm(false)}
              >
                Fortsätt träna
              </button>
              {completedStepIds.length > 0 && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={finishEarlyAndLog}
                >
                  Avsluta & logga
                </button>
              )}
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => {
                  soundCoach.stopSpeech();
                  onExit();
                }}
              >
                Avbryt pass
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
