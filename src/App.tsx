import React, { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, X } from 'lucide-react';
import { BottomNav, type AppTab } from './components/BottomNav';
import { CalendarView } from './components/CalendarView';
import { ExercisesView } from './components/ExercisesView';
import { SettingsView } from './components/SettingsView';
import { TodayView } from './components/TodayView';
import { WorkoutPlayer } from './components/WorkoutPlayer';
import { DEFAULT_EXERCISES } from './data/defaultProgram';
import type { AppSettings, Exercise, WorkoutLog, WorkoutStep } from './types';
import {
  APP_BUILD_LABEL,
  applyPwaUpdate,
  checkForPwaUpdate,
  consumeUpdateConfirmation,
  subscribePwaUpdate,
} from './utils/pwaUpdate';
import { soundCoach } from './utils/soundCoach';
import {
  createBackupPayload,
  loadExercises,
  loadLogs,
  loadSettings,
  parseBackupPayload,
  saveExercises,
  saveLogs,
  saveSettings,
} from './utils/storage';
import { buildWorkoutSteps } from './utils/workoutBuilder';

interface ToastState {
  message: string;
  variant: 'default' | 'success';
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [exercises, setExercises] = useState<Exercise[]>(() => loadExercises());
  const [logs, setLogs] = useState<WorkoutLog[]>(() => loadLogs());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [activeSteps, setActiveSteps] = useState<WorkoutStep[] | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  // PWA update state
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDismissed, setUpdateDismissed] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const showToast = (
    message: string,
    variant: 'default' | 'success' = 'default',
    durationMs = 2800
  ) => {
    setToast({ message, variant });
    window.setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, durationMs);
  };

  useEffect(() => {
    saveExercises(exercises);
  }, [exercises]);

  useEffect(() => {
    saveLogs(logs);
  }, [logs]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Listen for incoming PWA updates & show confirmation right after an update completes
  useEffect(() => {
    const unsubscribe = subscribePwaUpdate((hasUpdate) => {
      if (hasUpdate) {
        setUpdateAvailable(true);
        setUpdateDismissed(false);
      }
    });

    if (consumeUpdateConfirmation()) {
      const timer = window.setTimeout(() => {
        setToast({
          message: `Appen är uppdaterad! (${APP_BUILD_LABEL})`,
          variant: 'success',
        });
      }, 250);
      const hideTimer = window.setTimeout(() => {
        setToast((current) =>
          current?.variant === 'success' ? null : current
        );
      }, 5500);
      return () => {
        unsubscribe();
        window.clearTimeout(timer);
        window.clearTimeout(hideTimer);
      };
    }

    return unsubscribe;
  }, []);

  const handleCheckForUpdate = async () => {
    setCheckingUpdate(true);
    const result = await checkForPwaUpdate();
    setCheckingUpdate(false);

    if (result === 'update-found') {
      setUpdateAvailable(true);
      setUpdateDismissed(false);
    } else if (result === 'up-to-date') {
      showToast('Du har redan senaste versionen', 'success', 3200);
    } else {
      showToast('Uppdateringskoll fungerar i installerad/live-version');
    }
  };

  const handleUpdateSettings = (patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleToggleExercise = (id: string) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, enabled: !ex.enabled } : ex))
    );
  };

  const handleApplyQuickDuration = (seconds: number) => {
    setExercises((prev) =>
      prev.map((ex) => ({
        ...ex,
        durationSeconds: ex.timerMode === 'time' ? seconds : ex.durationSeconds,
        restSeconds: seconds,
      }))
    );
    showToast(`Tid & vila satt till ${seconds} sek`);
  };

  const handleSaveExercise = (updated: Exercise) => {
    setExercises((prev) => {
      const exists = prev.some((e) => e.id === updated.id);
      if (exists) {
        return prev.map((e) => (e.id === updated.id ? updated : e));
      }
      return [...prev, updated];
    });
    showToast('Övning sparad');
  };

  const handleDeleteExercise = (id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
    showToast('Övning borttagen');
  };

  const handleMoveExercise = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    setExercises((prev) => {
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  };

  const handleResetProgram = () => {
    setExercises(structuredClone(DEFAULT_EXERCISES));
    showToast('Jannis grundprogram återställt');
  };

  const handleStartWorkout = () => {
    soundCoach.unlock();
    const steps = buildWorkoutSteps(exercises, settings);
    if (steps.length === 0) {
      showToast('Aktivera minst en övning först');
      return;
    }
    setActiveSteps(steps);
  };

  const handleAddLog = (log: WorkoutLog) => {
    setLogs((prev) => [log, ...prev]);
    showToast('Pass sparat i kalendern');
  };

  const handleDeleteLog = (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    showToast('Loggat pass borttaget');
  };

  const handleExportBackup = () => {
    const payload = createBackupPayload(exercises, logs, settings);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fysio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Säkerhetskopia nedladdad');
  };

  const handleImportBackup = async (file: File) => {
    try {
      const text = await file.text();
      const restored = parseBackupPayload(text);
      setExercises(restored.exercises);
      setLogs(restored.logs);
      setSettings(restored.settings);
      showToast('Backup importerad!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Kunde inte läsa backup-filen');
    }
  };

  if (activeSteps) {
    return (
      <>
        <WorkoutPlayer
          steps={activeSteps}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onFinishSave={(log) => {
            handleAddLog(log);
            setActiveSteps(null);
            setActiveTab('calendar');
          }}
          onExit={() => setActiveSteps(null)}
        />
        {toast && (
          <div className={`toast ${toast.variant === 'success' ? 'toast-success' : ''}`}>
            {toast.variant === 'success' && <CheckCircle2 size={16} />}
            <span>{toast.message}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {updateAvailable && !updateDismissed && (
        <div className="update-banner-wrap" role="status" aria-live="polite">
          <div className="update-banner">
            <div className="update-banner-text">
              <span className="update-banner-title">Ny uppdatering redo</span>
              <span className="update-banner-sub">
                Tryck för att ladda senaste versionen av Fysio.
              </span>
            </div>
            <div className="update-banner-actions">
              <button
                id="btn-apply-update"
                type="button"
                className="update-banner-btn"
                onClick={applyPwaUpdate}
              >
                <RefreshCw size={13} />
                Uppdatera
              </button>
              <button
                type="button"
                className="update-banner-dismiss"
                aria-label="Stäng notis"
                onClick={() => setUpdateDismissed(true)}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'today' && (
        <TodayView
          exercises={exercises}
          logs={logs}
          settings={settings}
          onStartWorkout={handleStartWorkout}
          onToggleExercise={handleToggleExercise}
          onApplyQuickDuration={handleApplyQuickDuration}
          onUpdateSettings={handleUpdateSettings}
          onOpenExercisesTab={() => setActiveTab('exercises')}
        />
      )}

      {activeTab === 'exercises' && (
        <ExercisesView
          exercises={exercises}
          onSaveExercise={handleSaveExercise}
          onDeleteExercise={handleDeleteExercise}
          onMoveExercise={handleMoveExercise}
          onToggleExercise={handleToggleExercise}
          onResetDefaultProgram={handleResetProgram}
        />
      )}

      {activeTab === 'calendar' && (
        <CalendarView
          logs={logs}
          exercises={exercises}
          settings={settings}
          onAddLog={handleAddLog}
          onDeleteLog={handleDeleteLog}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsView
          settings={settings}
          appBuildLabel={APP_BUILD_LABEL}
          checkingUpdate={checkingUpdate}
          onCheckForUpdate={handleCheckForUpdate}
          onUpdateSettings={handleUpdateSettings}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onResetProgram={handleResetProgram}
        />
      )}

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />

      {toast && (
        <div className={`toast ${toast.variant === 'success' ? 'toast-success' : ''}`}>
          {toast.variant === 'success' && <CheckCircle2 size={16} />}
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
};

export default App;
