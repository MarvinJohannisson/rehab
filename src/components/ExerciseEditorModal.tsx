import React, { useRef, useState } from 'react';
import { Trash2, Upload, X } from 'lucide-react';
import { CATEGORY_LABELS } from '../data/defaultProgram';
import type { Exercise, ExerciseCategory, TimerMode } from '../types';
import { compressImageFile } from '../utils/mediaUtils';

interface Props {
  initialExercise: Exercise | null;
  onSave: (exercise: Exercise) => void;
  onClose: () => void;
}

function makeBlankExercise(): Exercise {
  return {
    id: `ex-${Date.now()}`,
    name: '',
    shortName: '',
    category: 'ben',
    description: '',
    cues: [],
    enabled: true,
    timerMode: 'time',
    durationSeconds: 45,
    reps: 10,
    secondsPerRep: 4,
    sets: 2,
    unilateral: false,
    sideSwapSeconds: 8,
    restSeconds: 45,
  };
}

export const ExerciseEditorModal: React.FC<Props> = ({
  initialExercise,
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(initialExercise);
  const [form, setForm] = useState<Exercise>(() =>
    initialExercise ? structuredClone(initialExercise) : makeBlankExercise()
  );
  const [cuesText, setCuesText] = useState<string>(() =>
    (initialExercise?.cues ?? []).join('\n')
  );
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const compressed = await compressImageFile(file);
      setForm((prev) => ({ ...prev, customImageUrl: compressed }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte ladda upp bilden.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setError('Ange ett namn på övningen.');
      return;
    }

    const cues = cuesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const shortName =
      form.shortName.trim() ||
      (trimmedName.length > 22 ? `${trimmedName.slice(0, 20)}…` : trimmedName);

    onSave({
      ...form,
      name: trimmedName,
      shortName,
      description: form.description.trim(),
      cues,
      durationSeconds: Math.max(5, Math.round(form.durationSeconds || 30)),
      reps: Math.max(1, Math.round(form.reps || 10)),
      secondsPerRep: Math.max(1, Number(form.secondsPerRep) || 3),
      sets: Math.max(1, Math.round(form.sets || 1)),
      sideSwapSeconds: Math.max(3, Math.round(form.sideSwapSeconds || 8)),
      restSeconds: Math.max(0, Math.round(form.restSeconds || 0)),
      videoUrl: form.videoUrl?.trim() || undefined,
      customImageUrl: form.customImageUrl?.trim() || undefined,
    });
  };

  const computedRepTime = Math.round(
    Math.max(1, form.reps || 1) * Math.max(1, form.secondsPerRep || 1)
  );

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <form className="modal-sheet" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2 id="editor-title" className="section-title">
            {isEditing ? 'Redigera övning' : 'Ny övning'}
          </h2>
          <button type="button" className="icon-btn" aria-label="Stäng" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div
              className="card-subtle"
              style={{
                background: 'var(--accent-clay-soft)',
                color: 'var(--accent-clay)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <div className="field">
            <label htmlFor="ex-name" className="field-label">
              Namn på övning
            </label>
            <input
              id="ex-name"
              type="text"
              className="input"
              placeholder="T.ex. Benböj vid vägg (ett ben)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label htmlFor="ex-category" className="field-label">
                Kategori
              </label>
              <select
                id="ex-category"
                className="select"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as ExerciseCategory })
                }
              >
                {(Object.keys(CATEGORY_LABELS) as ExerciseCategory[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="ex-sets" className="field-label">
                Antal set {form.unilateral ? '(per sida)' : ''}
              </label>
              <input
                id="ex-sets"
                type="number"
                min={1}
                max={10}
                className="input"
                value={form.sets}
                onChange={(e) => setForm({ ...form, sets: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Timer Mode */}
          <div className="field">
            <span className="field-label">Timertyp</span>
            <div className="segmented">
              {(['time', 'reps'] as TimerMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`segmented-btn ${form.timerMode === mode ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, timerMode: mode })}
                >
                  {mode === 'time' ? 'Tid (AMRAP / håll)' : 'Reps + tempo'}
                </button>
              ))}
            </div>
          </div>

          {form.timerMode === 'time' ? (
            <div className="form-grid-2">
              <div className="field">
                <label htmlFor="ex-duration" className="field-label">
                  Arbetstid (sekunder)
                </label>
                <input
                  id="ex-duration"
                  type="number"
                  min={5}
                  max={600}
                  step={5}
                  className="input"
                  value={form.durationSeconds}
                  onChange={(e) =>
                    setForm({ ...form, durationSeconds: Number(e.target.value) })
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="ex-rest" className="field-label">
                  Vila efter set (sek)
                </label>
                <input
                  id="ex-rest"
                  type="number"
                  min={0}
                  max={300}
                  step={5}
                  className="input"
                  value={form.restSeconds}
                  onChange={(e) =>
                    setForm({ ...form, restSeconds: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          ) : (
            <>
              <div className="form-grid-2">
                <div className="field">
                  <label htmlFor="ex-reps" className="field-label">
                    Antal repetitioner
                  </label>
                  <input
                    id="ex-reps"
                    type="number"
                    min={1}
                    max={100}
                    className="input"
                    value={form.reps}
                    onChange={(e) => setForm({ ...form, reps: Number(e.target.value) })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="ex-sec-rep" className="field-label">
                    Sekunder per rep
                  </label>
                  <input
                    id="ex-sec-rep"
                    type="number"
                    min={1}
                    max={30}
                    step={0.5}
                    className="input"
                    value={form.secondsPerRep}
                    onChange={(e) =>
                      setForm({ ...form, secondsPerRep: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="card-subtle" style={{ fontSize: 13 }}>
                  <strong>Beräknad tid:</strong> {computedRepTime} sek /{' '}
                  {form.unilateral ? 'sida' : 'set'}
                </div>
                <div className="field">
                  <label htmlFor="ex-rest-reps" className="field-label">
                    Vila efter set (sek)
                  </label>
                  <input
                    id="ex-rest-reps"
                    type="number"
                    min={0}
                    max={300}
                    step={5}
                    className="input"
                    value={form.restSeconds}
                    onChange={(e) =>
                      setForm({ ...form, restSeconds: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            </>
          )}

          {/* Unilateral Side Swap Toggle */}
          <div className="card-subtle" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="switch-row">
              <div>
                <div className="field-label">Ensidig övning (byt sida)</div>
                <div className="field-hint">
                  Kör vänster sida → kort paus för sidbyte → höger sida
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.unilateral}
                className={`switch-track ${form.unilateral ? 'on' : ''}`}
                onClick={() => setForm({ ...form, unilateral: !form.unilateral })}
              >
                <span className="switch-thumb" />
              </button>
            </div>

            {form.unilateral && (
              <div className="field">
                <label htmlFor="ex-swap-sec" className="field-label">
                  Tid för sidbyte (sekunder)
                </label>
                <input
                  id="ex-swap-sec"
                  type="number"
                  min={3}
                  max={30}
                  className="input"
                  value={form.sideSwapSeconds}
                  onChange={(e) =>
                    setForm({ ...form, sideSwapSeconds: Number(e.target.value) })
                  }
                />
              </div>
            )}
          </div>

          {/* Description & Cues */}
          <div className="field">
            <label htmlFor="ex-desc" className="field-label">
              Beskrivning
            </label>
            <textarea
              id="ex-desc"
              className="textarea"
              placeholder="Beskriv hur övningen ska utföras..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="ex-cues" className="field-label">
              Teknikpunkter (en per rad)
            </label>
            <textarea
              id="ex-cues"
              className="textarea"
              placeholder={'Håll ihop magen\nKnäna nära golvet\nLångsamt och kontrollerat'}
              value={cuesText}
              onChange={(e) => setCuesText(e.target.value)}
            />
          </div>

          {/* Media: Photo Upload & Video / YouTube Link */}
          <div className="card-subtle" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span className="field-label">Egen bild eller video (valfritt)</span>

            <div className="field">
              <label htmlFor="ex-video" className="field-label" style={{ fontSize: 12.5 }}>
                YouTube- eller videolänk
              </label>
              <input
                id="ex-video"
                type="url"
                className="input"
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.videoUrl ?? ''}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} />
                {uploading ? 'Bearbetar bild...' : 'Ladda upp eget foto'}
              </button>
              {form.customImageUrl && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setForm({ ...form, customImageUrl: undefined })}
                >
                  <Trash2 size={14} />
                  Ta bort foto
                </button>
              )}
            </div>

            {form.customImageUrl && (
              <img
                src={form.customImageUrl}
                alt="Förhandsvisning"
                style={{
                  width: '100%',
                  maxHeight: 150,
                  objectFit: 'contain',
                  borderRadius: 10,
                  background: '#fff',
                }}
              />
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Avbryt
          </button>
          <button id="btn-save-exercise" type="submit" className="btn btn-primary btn-sm">
            {isEditing ? 'Spara ändringar' : 'Lägg till övning'}
          </button>
        </div>
      </form>
    </div>
  );
};
