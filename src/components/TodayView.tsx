import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  Layers,
  Play,
  Repeat,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CATEGORY_LABELS, JANNIS_PROGRAM_TIPS } from '../data/defaultProgram';
import type { AppSettings, Exercise, WorkoutLog } from '../types';
import {
  countWorkoutsThisWeek,
  formatDurationMinutes,
  toLocalDateKey,
} from '../utils/dateUtils';
import {
  buildPlannedSets,
  estimateWorkoutDurationSeconds,
  formatExerciseTarget,
} from '../utils/workoutBuilder';
import { ExerciseVisual } from './ExerciseVisual';

interface Props {
  exercises: Exercise[];
  logs: WorkoutLog[];
  settings: AppSettings;
  onStartWorkout: () => void;
  onToggleExercise: (id: string) => void;
  onApplyQuickDuration: (seconds: number) => void;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onOpenExercisesTab: () => void;
}

export const TodayView: React.FC<Props> = ({
  exercises,
  logs,
  settings,
  onStartWorkout,
  onToggleExercise,
  onApplyQuickDuration,
  onUpdateSettings,
  onOpenExercisesTab,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(exercises[0]?.id ?? null);

  const activeExercises = useMemo(
    () => exercises.filter((e) => e.enabled && e.sets > 0),
    [exercises]
  );

  const plannedSets = useMemo(
    () => buildPlannedSets(exercises, settings.interleaveLegCore),
    [exercises, settings.interleaveLegCore]
  );

  const estimatedSeconds = useMemo(
    () => estimateWorkoutDurationSeconds(exercises, settings),
    [exercises, settings]
  );

  const [todayKey] = useState(() => toLocalDateKey());
  const sessionsThisWeek = useMemo(() => countWorkoutsThisWeek(logs), [logs]);
  const doneToday = useMemo(
    () => logs.some((l) => l.date === todayKey),
    [logs, todayKey]
  );

  // Determine if all timed active exercises share one of the 30/45/60 presets
  const timedActive = activeExercises.filter((e) => e.timerMode === 'time');
  const uniformPreset =
    timedActive.length > 0 &&
    timedActive.every((e) => e.durationSeconds === timedActive[0].durationSeconds)
      ? timedActive[0].durationSeconds
      : null;

  const cycleQuickAudio = () => {
    const next =
      settings.audioMode === 'voice-and-sound'
        ? 'sound-only'
        : settings.audioMode === 'sound-only'
          ? 'muted'
          : 'voice-and-sound';
    onUpdateSettings({ audioMode: next });
  };

  const audioLabel =
    settings.audioMode === 'voice-and-sound'
      ? 'Röst + ljud'
      : settings.audioMode === 'sound-only'
        ? 'Bara ljud'
        : 'Tyst';

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">{JANNIS_PROGRAM_TIPS.clinic}</p>
          <h1 className="page-title">Dagens fysio</h1>
        </div>
        <button
          type="button"
          id="btn-quick-audio"
          className="btn btn-secondary btn-sm"
          onClick={cycleQuickAudio}
          aria-label="Växla ljud och röstcoach"
        >
          {settings.audioMode === 'muted' ? <VolumeX size={15} /> : <Volume2 size={15} />}
          {audioLabel}
        </button>
      </header>

      {/* Hero Start Session Card */}
      <section className="hero-session-card" aria-label="Starta dagens pass">
        <div className="hero-top">
          <div>
            <p className="hero-kicker">
              {doneToday ? 'Pass genomfört idag' : 'Redo att köra'}
            </p>
            <h2 className="hero-title">
              {doneToday ? 'Bra jobbat idag!' : 'Ben & Bål — Grundpass'}
            </h2>
          </div>

          <div
            className="weekly-dots"
            aria-label={`${sessionsThisWeek} av ${settings.weeklyGoal} pass denna vecka`}
          >
            <span className="weekly-dots-label">
              Vecka: {sessionsThisWeek}/{settings.weeklyGoal}
            </span>
            <div className="weekly-dots-row">
              {Array.from({ length: Math.max(1, settings.weeklyGoal) }).map((_, i) => (
                <span
                  key={i}
                  className={`weekly-dot ${i < sessionsThisWeek ? 'filled' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="hero-metrics">
          <span className="hero-metric-chip">
            <Clock size={14} />
            Ca {formatDurationMinutes(estimatedSeconds)}
          </span>
          <span className="hero-metric-chip">
            <Layers size={14} />
            {plannedSets.length} set ({activeExercises.length} övningar)
          </span>
          {settings.interleaveLegCore && (
            <span className="hero-metric-chip">
              <Repeat size={14} />
              Växlar ben & bål
            </span>
          )}
        </div>

        <button
          id="btn-start-workout"
          type="button"
          className="btn btn-hero"
          disabled={plannedSets.length === 0}
          onClick={onStartWorkout}
        >
          <Play size={18} fill="currentColor" />
          {doneToday ? 'Kör ett pass till' : 'Starta dagens pass'}
        </button>
      </section>

      {/* Quick Session Intensity & Order Controls */}
      <section className="preset-bar" aria-label="Snabbinställningar för passet">
        <div className="preset-group">
          <span className="preset-label">Arbetstid / vila:</span>
          {[30, 45, 60].map((sec) => (
            <button
              key={sec}
              type="button"
              className={`preset-chip ${uniformPreset === sec ? 'active' : ''}`}
              onClick={() => onApplyQuickDuration(sec)}
            >
              {sec}s
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`preset-chip ${settings.interleaveLegCore ? 'active' : ''}`}
          onClick={() =>
            onUpdateSettings({ interleaveLegCore: !settings.interleaveLegCore })
          }
          title="Växla mellan ben- och bålset enligt Jannis rekommendation"
        >
          {settings.interleaveLegCore ? 'Växla ben/bål: På' : 'Växla ben/bål: Av'}
        </button>
      </section>

      {/* Set Sequence Preview */}
      {plannedSets.length > 0 && (
        <section aria-label="Passordning">
          <div className="section-head">
            <h2 className="section-title">Ordning i passet</h2>
            <span className="field-hint">{plannedSets.length} set totalt</span>
          </div>
          <div className="sequence-strip">
            {plannedSets.map((item, idx) => (
              <span key={`${item.exercise.id}-${item.setNumber}-${idx}`} className="sequence-chip">
                <span className={`sequence-dot ${item.exercise.category}`} />
                {item.exercise.shortName} {item.setNumber}/{item.totalSets}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Today's Exercises with Expandable Illustrations & Form Cues */}
      <section aria-label="Valda övningar">
        <div className="section-head">
          <h2 className="section-title">Dagens övningar</h2>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onOpenExercisesTab}
          >
            Redigera program
          </button>
        </div>

        <div className="exercise-list">
          {exercises.map((exercise) => {
            const isExpanded = expandedId === exercise.id;
            const thumbSrc = exercise.customImageUrl || exercise.illustrationUrl;

            return (
              <article
                key={exercise.id}
                className={`exercise-card ${exercise.enabled ? '' : 'disabled'}`}
              >
                <div className="exercise-card-main">
                  <button
                    type="button"
                    aria-label={
                      exercise.enabled
                        ? `Ta bort ${exercise.name} från dagens pass`
                        : `Lägg till ${exercise.name} i dagens pass`
                    }
                    onClick={() => onToggleExercise(exercise.id)}
                    style={{
                      color: exercise.enabled
                        ? 'var(--accent-pine)'
                        : 'var(--ink-tertiary)',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle2
                      size={23}
                      fill={exercise.enabled ? 'var(--accent-pine-soft)' : 'none'}
                    />
                  </button>

                  {thumbSrc && (
                    <div
                      className="exercise-thumb"
                      onClick={() => setExpandedId(isExpanded ? null : exercise.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img src={thumbSrc} alt={exercise.name} loading="lazy" />
                    </div>
                  )}

                  <div
                    className="exercise-info"
                    onClick={() => setExpandedId(isExpanded ? null : exercise.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="exercise-title-row">
                      <span className="exercise-name">{exercise.name}</span>
                      <span className={`cat-badge cat-${exercise.category}`}>
                        {CATEGORY_LABELS[exercise.category]}
                      </span>
                    </div>

                    <div className="exercise-meta-row">
                      <span className="meta-pill">
                        {exercise.sets} set
                        {exercise.unilateral ? ' / ben' : ''}
                      </span>
                      <span className="meta-pill">
                        {formatExerciseTarget(exercise)}
                      </span>
                      {exercise.unilateral && (
                        <span className="meta-pill">Byter sida</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="icon-btn"
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? 'Dölj detaljer' : 'Visa bild och instruktion'}
                    onClick={() => setExpandedId(isExpanded ? null : exercise.id)}
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="exercise-expand-panel">
                    <ExerciseVisual exercise={exercise} />

                    <div>
                      <p style={{ fontSize: '14px', color: 'var(--ink-primary)' }}>
                        {exercise.description}
                      </p>
                    </div>

                    {exercise.cues.length > 0 && (
                      <div>
                        <p
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'var(--ink-secondary)',
                            marginBottom: '6px',
                          }}
                        >
                          Tänk på
                        </p>
                        <ul className="cue-list">
                          {exercise.cues.map((cue, idx) => (
                            <li key={idx}>{cue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="exercise-meta-row">
                      <span className="meta-pill">Vila: {exercise.restSeconds}s</span>
                      {exercise.unilateral && (
                        <span className="meta-pill">
                          Sidbyte: {exercise.sideSwapSeconds}s
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Physio Guidance Card from Jannis */}
      <aside className="physio-note-card" aria-label="Upplägg från fysioterapeut">
        <div className="physio-note-title">
          <Info size={15} color="var(--accent-pine)" />
          <span>
            Upplägg från {JANNIS_PROGRAM_TIPS.physio} ({JANNIS_PROGRAM_TIPS.frequency})
          </span>
        </div>
        <p>{JANNIS_PROGRAM_TIPS.summary}</p>
        <p style={{ fontWeight: 500, color: 'var(--ink-primary)' }}>
          {JANNIS_PROGRAM_TIPS.caution}
        </p>
      </aside>
    </main>
  );
};
