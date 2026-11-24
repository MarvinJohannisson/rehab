import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  RotateCcw,
  Upload,
  Volume2,
} from 'lucide-react';
import type { AppSettings, AudioMode, VisualPreference } from '../types';
import { soundCoach } from '../utils/soundCoach';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onResetProgram: () => void;
}

export const SettingsView: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onResetProgram,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const refresh = () => setVoices(soundCoach.getSwedishVoices());
    refresh();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = refresh;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const handleTestVoice = () => {
    soundCoach.unlock();
    soundCoach.playStartWork(settings);
    soundCoach.speak('Gör dig redo! 3, 2, 1, kör! Byt sida om 10 sekunder.', settings);
  };

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Anpassa appen</p>
          <h1 className="page-title">Inställningar</h1>
        </div>
      </header>

      {/* Voice & Sound Coach */}
      <section className="card settings-group" aria-label="Röstcoach och ljud">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="section-title">Röstcoach & ljud</h2>
          <button
            id="btn-test-voice"
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={settings.audioMode === 'muted'}
            onClick={handleTestVoice}
          >
            <Volume2 size={14} />
            Testa
          </button>
        </div>

        <div className="segmented segmented-3">
          {(
            [
              { id: 'voice-and-sound', label: 'Röst + ljud' },
              { id: 'sound-only', label: 'Bara ljud' },
              { id: 'muted', label: 'Tyst' },
            ] as { id: AudioMode; label: string }[]
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`segmented-btn ${settings.audioMode === opt.id ? 'active' : ''}`}
              onClick={() => onUpdateSettings({ audioMode: opt.id })}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {settings.audioMode === 'voice-and-sound' && (
          <>
            <div className="field">
              <label htmlFor="voice-select" className="field-label">
                Svensk röst
              </label>
              <select
                id="voice-select"
                className="select"
                value={settings.voiceURI}
                onChange={(e) => onUpdateSettings({ voiceURI: e.target.value })}
              >
                <option value="">Automatisk svensk röst (standard)</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="voice-rate" className="field-label">
                Talhastighet: {settings.voiceRate.toFixed(1)}×
              </label>
              <div className="range-row">
                <span className="field-hint">Lugn</span>
                <input
                  id="voice-rate"
                  type="range"
                  min={0.8}
                  max={1.3}
                  step={0.1}
                  value={settings.voiceRate}
                  onChange={(e) =>
                    onUpdateSettings({ voiceRate: Number(e.target.value) })
                  }
                />
                <span className="field-hint">Snabb</span>
              </div>
            </div>
          </>
        )}

        <div className="settings-divider" />

        <div className="switch-row">
          <div>
            <div className="field-label">Nedräkning 3-2-1</div>
            <div className="field-hint">Tydlig ton de sista 3 sekunderna</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.countdownBeeps}
            className={`switch-track ${settings.countdownBeeps ? 'on' : ''}`}
            onClick={() =>
              onUpdateSettings({ countdownBeeps: !settings.countdownBeeps })
            }
          >
            <span className="switch-thumb" />
          </button>
        </div>

        <div className="switch-row">
          <div>
            <div className="field-label">Halvvägs-signal</div>
            <div className="field-hint">Rösten säger "Halvvägs!" på set över 30 sek</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.halfwayCue}
            className={`switch-track ${settings.halfwayCue ? 'on' : ''}`}
            onClick={() => onUpdateSettings({ halfwayCue: !settings.halfwayCue })}
          >
            <span className="switch-thumb" />
          </button>
        </div>
      </section>

      {/* Workout & Visual Preferences */}
      <section className="card settings-group" aria-label="Pass och visning">
        <h2 className="section-title">Pass & visning</h2>

        <div className="field">
          <span className="field-label">Standardvisning av övningar</span>
          <div className="segmented">
            {(
              [
                { id: 'illustration', label: 'Illustration' },
                { id: 'animation', label: 'Animation' },
              ] as { id: VisualPreference; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`segmented-btn ${
                  settings.preferredVisual === opt.id ? 'active' : ''
                }`}
                onClick={() => onUpdateSettings({ preferredVisual: opt.id })}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="field-hint">
            Du kan alltid växla direkt på varje övning för att testa vilket som känns bäst.
          </span>
        </div>

        <div className="form-grid-2">
          <div className="field">
            <label htmlFor="prep-sec" className="field-label">
              Startnedräkning (sek)
            </label>
            <input
              id="prep-sec"
              type="number"
              min={0}
              max={20}
              className="input"
              value={settings.prepSeconds}
              onChange={(e) =>
                onUpdateSettings({
                  prepSeconds: Math.max(0, Math.min(20, Number(e.target.value))),
                })
              }
            />
          </div>

          <div className="field">
            <label htmlFor="weekly-goal" className="field-label">
              Veckomål (pass/v)
            </label>
            <input
              id="weekly-goal"
              type="number"
              min={1}
              max={7}
              className="input"
              value={settings.weeklyGoal}
              onChange={(e) =>
                onUpdateSettings({
                  weeklyGoal: Math.max(1, Math.min(7, Number(e.target.value))),
                })
              }
            />
          </div>
        </div>
      </section>

      {/* Local Data Backup & Program Reset */}
      <section className="card settings-group" aria-label="Säkerhetskopiering">
        <h2 className="section-title">Säkerhetskopia & data</h2>
        <p style={{ fontSize: 13.5, color: 'var(--ink-secondary)' }}>
          All din historik och dina övningar sparas lokalt på enheten och fungerar offline.
          Exportera en JSON-kopia om du vill spara backup eller byta telefon.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            id="btn-export-json"
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onExportBackup}
          >
            <Download size={15} />
            Exportera JSON
          </button>

          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportBackup(file);
              if (importInputRef.current) importInputRef.current.value = '';
            }}
          />
          <button
            id="btn-import-json"
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => importInputRef.current?.click()}
          >
            <Upload size={15} />
            Importera JSON
          </button>
        </div>

        <div className="settings-divider" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <div className="field-label">Återställ grundprogram</div>
            <div className="field-hint">
              Laddar tillbaka Jannis 4 övningar (din kalenderhistorik behålls)
            </div>
          </div>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => {
              if (
                window.confirm(
                  'Återställa övningslistan till Jannis grundprogram? Din kalenderhistorik raderas inte.'
                )
              ) {
                onResetProgram();
              }
            }}
          >
            <RotateCcw size={14} />
            Återställ
          </button>
        </div>
      </section>
    </main>
  );
};
