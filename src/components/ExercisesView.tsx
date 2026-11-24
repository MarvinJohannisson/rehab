import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { CATEGORY_LABELS } from '../data/defaultProgram';
import type { Exercise } from '../types';
import { formatExerciseTarget } from '../utils/workoutBuilder';
import { ExerciseEditorModal } from './ExerciseEditorModal';

interface Props {
  exercises: Exercise[];
  onSaveExercise: (exercise: Exercise) => void;
  onDeleteExercise: (id: string) => void;
  onMoveExercise: (index: number, direction: -1 | 1) => void;
  onToggleExercise: (id: string) => void;
  onResetDefaultProgram: () => void;
}

export const ExercisesView: React.FC<Props> = ({
  exercises,
  onSaveExercise,
  onDeleteExercise,
  onMoveExercise,
  onToggleExercise,
  onResetDefaultProgram,
}) => {
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSave = (ex: Exercise) => {
    onSaveExercise(ex);
    setEditingExercise(null);
    setIsCreating(false);
  };

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Mitt program</p>
          <h1 className="page-title">Övningar</h1>
          <p className="page-subtitle">
            Justera tider, reps, sidbyte eller lägg till nya övningar.
          </p>
        </div>
        <button
          id="btn-add-exercise"
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setIsCreating(true)}
        >
          <Plus size={16} />
          Ny övning
        </button>
      </header>

      {exercises.length === 0 ? (
        <div className="card empty-state">
          <p>Du har inga övningar i programmet ännu.</p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onResetDefaultProgram}
          >
            <RotateCcw size={15} />
            Ladda Jannis grundprogram
          </button>
        </div>
      ) : (
        <div className="exercise-list">
          {exercises.map((ex, index) => {
            const thumbSrc = ex.customImageUrl || ex.illustrationUrl;
            return (
              <article
                key={ex.id}
                className={`exercise-card ${ex.enabled ? '' : 'disabled'}`}
              >
                <div className="exercise-card-main">
                  {thumbSrc && (
                    <div className="exercise-thumb">
                      <img src={thumbSrc} alt={ex.name} loading="lazy" />
                    </div>
                  )}

                  <div className="exercise-info">
                    <div className="exercise-title-row">
                      <span className="exercise-name">{ex.name}</span>
                      <span className={`cat-badge cat-${ex.category}`}>
                        {CATEGORY_LABELS[ex.category]}
                      </span>
                    </div>

                    <div className="exercise-meta-row">
                      <span className="meta-pill">
                        {ex.sets} set{ex.unilateral ? '/sida' : ''}
                      </span>
                      <span className="meta-pill">{formatExerciseTarget(ex)}</span>
                      <span className="meta-pill">Vila {ex.restSeconds}s</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--border-subtle)',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    background: '#fbfaf7',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      className="icon-btn"
                      style={{ width: 34, height: 34 }}
                      disabled={index === 0}
                      aria-label="Flytta upp"
                      onClick={() => onMoveExercise(index, -1)}
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      style={{ width: 34, height: 34 }}
                      disabled={index === exercises.length - 1}
                      aria-label="Flytta ner"
                      onClick={() => onMoveExercise(index, 1)}
                    >
                      <ArrowDown size={15} />
                    </button>

                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => onToggleExercise(ex.id)}
                    >
                      {ex.enabled ? 'Aktiv i pass' : 'Pausad'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEditingExercise(ex)}
                    >
                      <Edit3 size={14} />
                      Ändra
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      style={{
                        width: 34,
                        height: 34,
                        color: 'var(--accent-clay)',
                        background: 'var(--accent-clay-soft)',
                      }}
                      aria-label={`Ta bort ${ex.name}`}
                      onClick={() => {
                        if (window.confirm(`Ta bort "${ex.name}" från ditt program?`)) {
                          onDeleteExercise(ex.id);
                        }
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {(isCreating || editingExercise) && (
        <ExerciseEditorModal
          initialExercise={editingExercise}
          onSave={handleSave}
          onClose={() => {
            setIsCreating(false);
            setEditingExercise(null);
          }}
        />
      )}
    </main>
  );
};
