import { useState } from 'react';
import type { Records } from '../../models/recordsModel';
import type { DayCell, MonthGroup, WeekStat } from '../../models/statsModel';
import { SCREEN_TITLE } from '../../models/vocabulary';
import CalendarPanel from '../components/CalendarPanel';
import MatchLog from '../components/MatchLog';
import RecordsBoard from '../components/RecordsBoard';
import Tabs from '../components/Tabs';
import TrendsPanel from '../components/TrendsPanel';

type Tab = 'matches' | 'records' | 'trends' | 'calendar';
const TABS: { id: Tab; label: string }[] = [
  { id: 'matches', label: 'Matches' }, { id: 'records', label: 'Records' },
  { id: 'trends', label: 'Trends' }, { id: 'calendar', label: 'Calendar' },
];

interface Props {
  xp: number;
  monthGroups: MonthGroup[];
  records: Records;
  weekly: WeekStat[];
  calendar: DayCell[][];
  streak: number;
  onOpenMatch: (date: number) => void;
  onDeleteMatch: (date: number) => void;
}

/** History of all matches, with records, weekly trends and a calendar. */
export default function ProgressPage(p: Props) {
  const [tab, setTab] = useState<Tab>('matches');
  return (
    <>
      <div className="eyebrow">{SCREEN_TITLE.progress}</div>
      <div className="card">Total XP: <b>{p.xp}</b></div>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === 'matches' && <MatchLog groups={p.monthGroups} onOpen={p.onOpenMatch} onDelete={p.onDeleteMatch} />}
      {tab === 'records' && <RecordsBoard records={p.records} />}
      {tab === 'trends' && <TrendsPanel weekly={p.weekly} />}
      {tab === 'calendar' && <CalendarPanel grid={p.calendar} streak={p.streak} />}
    </>
  );
}
