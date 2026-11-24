import React from 'react';
import { CalendarDays, Dumbbell, Play, SlidersHorizontal } from 'lucide-react';

export type AppTab = 'today' | 'exercises' | 'calendar' | 'settings';

interface Props {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}

const NAV_ITEMS: { id: AppTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'today', label: 'Idag', icon: Play },
  { id: 'exercises', label: 'Övningar', icon: Dumbbell },
  { id: 'calendar', label: 'Kalender', icon: CalendarDays },
  { id: 'settings', label: 'Inställningar', icon: SlidersHorizontal },
];

export const BottomNav: React.FC<Props> = ({ activeTab, onChange }) => {
  return (
    <div className="bottom-nav-wrap">
      <nav className="bottom-nav" aria-label="Huvudmeny">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              id={`nav-${id}`}
              type="button"
              className={`nav-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onChange(id)}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
