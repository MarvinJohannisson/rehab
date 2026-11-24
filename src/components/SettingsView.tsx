import React, { useRef } from 'react';
import {
  Download,
  RefreshCw,
  RotateCcw,
  Upload,
  Volume2,
} from 'lucide-react';
import type { AppSettings, AudioMode } from '../types';
import { soundCoach } from '../utils/soundCoach';

interface Props {
  settings: AppSettings;
  appBuildLabel: string;
  checkingUpdate: boolean;
  onCheckForUpdate: () => void;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onResetProgram: () => void;
}

export const SettingsView: React.FC<Props> = ({
  settings,
  appBuildLabel,
  checkingUpdate,
  onCheckForUpdate,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onResetProgram,
}) => {
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const handleTestVoice = () => {
    soundCoach.playVoicePreview(settings);
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
            Testa 3-2-1
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
          <p className="field-hint">
            Korta, tydliga signaler: 3, 2, 1 · Start · Halvvägs · Byt sida · Stopp.
          </p>
        )}

        <div className="settings-divider" />

        <div className="switch-row">
          <div>
            <div className="field-label">Nedräkningstoner 3-2-1</div>
            <div className="field-hint">Mjuk ton de sista 3 sekunderna</div>
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
            <div className="field-hint">Rösten säger "Halvvägs" i mitten av setet</div>
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

      {/* Workout Preferences */}
      <section className="card settings-group" aria-label="Passinställningar">
        <h2 className="section-title">Pass & mål</h2>

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

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
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

      {/* App Version & Manual Update Check */}
      <section className="card settings-group" aria-label="Appversion och uppdateringar">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div>
            <div className="field-label">Appversion</div>
            <div className="field-hint">{appBuildLabel}</div>
          </div>
          <button
            id="btn-check-update"
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={checkingUpdate}
            onClick={onCheckForUpdate}
          >
            <RefreshCw size={14} />
            {checkingUpdate ? 'Söker...' : 'Sök uppdatering'}
          </button>
        </div>
      </section>
    </main>
  );
};
