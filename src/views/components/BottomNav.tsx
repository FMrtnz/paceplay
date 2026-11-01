import type { ReactNode } from 'react';

export type NavTab = 'home' | 'progress' | 'trophies';

const ICON: Record<NavTab, ReactNode> = {
  home: <svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 15v7" stroke="currentColor" strokeWidth="2" /></svg>,
  progress: <svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  trophies: <svg viewBox="0 0 24 24" width="22" height="22"><path d="M7 4h10v6a5 5 0 0 1-10 0zM12 15v4M8 20h8M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
};
const LABEL: Record<NavTab, string> = { home: 'Locker Room', progress: 'Progress', trophies: 'Trophies' };

/** Bottom navigation, shown outside the setup / run / result flow. */
export default function BottomNav({ current, onSelect }: { current: NavTab; onSelect: (tab: NavTab) => void }) {
  return (
    <nav className="bottom-nav">
      {(Object.keys(LABEL) as NavTab[]).map((tab) => (
        <button key={tab} className={tab === current ? 'on' : ''} aria-current={tab === current ? 'page' : undefined} onClick={() => onSelect(tab)}>
          {ICON[tab]}
          <span>{LABEL[tab]}</span>
        </button>
      ))}
    </nav>
  );
}
