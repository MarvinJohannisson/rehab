import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { FEELING_META } from '../data/defaultProgram';
import type { AppSettings, Exercise, SessionFeeling, WorkoutLog } from '../types';
import {
  buildMonthGrid,
  calculateActiveWeekStreak,
  countWorkoutsInMonth,
  countWorkoutsThisWeek,
  formatDurationMinutes,
  formatSwedishDate,
  SWEDISH_MONTHS,
  SWEDISH_WEEKDAYS_SHORT,
  toLocalDateKey,
} from '../utils/dateUtils';

interface Props {
  logs: WorkoutLog[];
  exercises: Exercise[];
  settings: AppSettings;
  onAddLog: (log: WorkoutLog) => void;
  onDeleteLog: (id: string) => void;
}

export const CalendarView: React.FC<Props> = ({
  logs,
  exercises,
  settings,
  onAddLog,
  onDeleteLog,
}) => {
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(() => toLocalDateKey());
  const [showManualModal, setShowManualModal] = useState(false);

  // Manual log form state
  const [manualDate, setManualDate] = useState<string>(() => toLocalDateKey());
  const [manualMinutes, setManualMinutes] = useState<number>(15);
  const [manualFeeling, setManualFeeling] = useState<SessionFeeling>('good');
  const [manualNotes, setManualNotes] = useState<string>('');

  const logsByDate = useMemo(() => {
    const map = new Map<string, WorkoutLog[]>();
    for (const log of logs) {
      const existing = map.get(log.date) ?? [];
      existing.push(log);
      map.set(log.date, existing);
    }
    return map;
  }, [logs]);

  const cells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const sessionsThisMonth = useMemo(
    () => countWorkoutsInMonth(logs, viewYear, viewMonth),
    [logs, viewYear, viewMonth]
  );
  const sessionsThisWeek = useMemo(() => countWorkoutsThisWeek(logs), [logs]);
  const weekStreak = useMemo(() => calculateActiveWeekStreak(logs), [logs]);

  const selectedLogs = logsByDate.get(selectedDate) ?? [];

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activeSummary = exercises
      .filter((ex) => ex.enabled)
      .map((ex) => ({
        exerciseId: ex.id,
        name: ex.name,
        category: ex.category,
        setsCompleted: ex.sets,
      }));

    const newLog: WorkoutLog = {
      id: `log-manual-${Date.now()}`,
      date: manualDate,
      completedAt: new Date().toISOString(),
      durationSeconds: Math.max(60, Math.round(manualMinutes * 60)),
      exercises: activeSummary,
      feeling: manualFeeling,
      notes: manualNotes.trim() || undefined,
      manual: true,
    };

    onAddLog(newLog);
    setSelectedDate(manualDate);
    setManualNotes('');
    setShowManualModal(false);
  };

  const openManualForDate = (dateKey: string) => {
    setManualDate(dateKey);
    setShowManualModal(true);
  };

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Träningshistorik</p>
          <h1 className="page-title">Kalender</h1>
        </div>
        <button
          id="btn-manual-log"
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => openManualForDate(selectedDate)}
        >
          <Plus size={15} />
          Logga pass
        </button>
      </header>

      {/* Top Metrics */}
      <section className="stats-grid" aria-label="Sammanfattning">
        <div className="stat-tile">
          <span className="stat-value">
            {sessionsThisWeek}/{settings.weeklyGoal}
          </span>
          <span className="stat-label">Denna vecka</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{sessionsThisMonth}</span>
          <span className="stat-label">{SWEDISH_MONTHS[viewMonth]}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">
            {weekStreak} {weekStreak === 1 ? 'v' : 'v'}
          </span>
          <span className="stat-label">Veckor i rad</span>
        </div>
      </section>

      {/* Monthly Calendar Card */}
      <section className="card" aria-label="Månadskalender">
        <div className="calendar-header">
          <button
            type="button"
            className="icon-btn"
            aria-label="Föregående månad"
            onClick={goPrevMonth}
          >
            <ChevronLeft size={19} />
          </button>
          <h2 className="calendar-month-title">
            {SWEDISH_MONTHS[viewMonth]} {viewYear}
          </h2>
          <button
            type="button"
            className="icon-btn"
            aria-label="Nästa månad"
            onClick={goNextMonth}
          >
            <ChevronRight size={19} />
          </button>
        </div>

        <div className="calendar-weekdays" aria-hidden="true">
          {SWEDISH_WEEKDAYS_SHORT.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="calendar-grid">
          {cells.map((cell) => {
            const dayLogs = logsByDate.get(cell.dateKey) ?? [];
            const isCompleted = dayLogs.length > 0;
            const latestFeeling = dayLogs[dayLogs.length - 1]?.feeling;
            const isSelected = cell.dateKey === selectedDate;

            return (
              <button
                key={cell.dateKey}
                type="button"
                className={[
                  'calendar-cell',
                  !cell.inCurrentMonth ? 'outside' : '',
                  cell.isToday ? 'today' : '',
                  isCompleted ? 'completed' : '',
                  isSelected ? 'selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-label={`${cell.dateKey}${isCompleted ? ' — fysiopass genomfört' : ''}`}
                onClick={() => setSelectedDate(cell.dateKey)}
              >
                <span>{cell.dayNumber}</span>
                {latestFeeling && (
                  <span
                    className={`calendar-feeling-dot ${FEELING_META[latestFeeling].colorClass}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected Day Details */}
      <section className="card" aria-label="Vald dag">
        <div className="section-head">
          <h2 className="section-title" style={{ fontSize: 16 }}>
            {formatSwedishDate(selectedDate)}
          </h2>
          {selectedLogs.length === 0 && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => openManualForDate(selectedDate)}
            >
              + Logga denna dag
            </button>
          )}
        </div>

        {selectedLogs.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--ink-secondary)' }}>
            Inget fysiopass loggat denna dag.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {selectedLogs.map((log) => {
              const feelingMeta = FEELING_META[log.feeling];
              return (
                <div
                  key={log.id}
                  className="card-subtle"
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="feeling-badge">
                        <span
                          className={`calendar-feeling-dot ${feelingMeta.colorClass}`}
                        />
                        {feelingMeta.label}
                      </span>
                      <span className="meta-pill">
                        <Clock size={12} />
                        {formatDurationMinutes(log.durationSeconds)}
                      </span>
                      {log.manual && <span className="meta-pill">Manuell</span>}
                    </div>

                    <button
                      type="button"
                      className="icon-btn"
                      style={{ width: 32, height: 32, color: 'var(--accent-clay)' }}
                      aria-label="Ta bort loggat pass"
                      onClick={() => {
                        if (window.confirm('Ta bort det här loggade passet?')) {
                          onDeleteLog(log.id);
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {log.exercises.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {log.exercises.map((ex) => (
                        <span key={ex.exerciseId} className="meta-pill">
                          {ex.name} · {ex.setsCompleted} set
                        </span>
                      ))}
                    </div>
                  )}

                  {log.notes && (
                    <p
                      style={{
                        fontSize: 13.5,
                        color: 'var(--ink-primary)',
                        fontStyle: 'italic',
                      }}
                    >
                      “{log.notes}”
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Manual Log Modal */}
      {showManualModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal-sheet" onSubmit={handleManualSubmit}>
            <div className="modal-header">
              <h2 className="section-title">Logga pass manuellt</h2>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowManualModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid-2">
                <div className="field">
                  <label htmlFor="manual-date" className="field-label">
                    Datum
                  </label>
                  <input
                    id="manual-date"
                    type="date"
                    className="input"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="manual-mins" className="field-label">
                    Tid (minuter)
                  </label>
                  <input
                    id="manual-mins"
                    type="number"
                    min={1}
                    max={180}
                    className="input"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="field">
                <span className="field-label">Hur kändes passet?</span>
                <div className="feeling-grid">
                  {(Object.keys(FEELING_META) as SessionFeeling[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={`feeling-option ${manualFeeling === key ? 'selected' : ''}`}
                      onClick={() => setManualFeeling(key)}
                    >
                      <span className="feeling-option-title">
                        <span
                          className={`calendar-feeling-dot ${FEELING_META[key].colorClass}`}
                        />
                        {FEELING_META[key].label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label htmlFor="manual-notes" className="field-label">
                  Anteckning (valfritt)
                </label>
                <textarea
                  id="manual-notes"
                  className="textarea"
                  placeholder="T.ex. körde passet utan mobilen..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowManualModal(false)}
              >
                Avbryt
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Spara pass
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};
