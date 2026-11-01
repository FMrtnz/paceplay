import { useState } from 'react';
import type { Activity } from '../../models/constants';
import type { Records } from '../../models/recordsModel';
import type { DayCell, MonthGroup, WeekStat } from '../../models/statsModel';
import { ACTIVITY_LABEL, SCREEN_TITLE } from '../../models/vocabulary';
import ChoiceGroup from '../components/ChoiceGroup';
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
  stats: Record<Activity, { records: Records; weekly: WeekStat[]; calendar: DayCell[][] }>;
  streak: number;
  onOpenMatch: (date: number) => void;
  onDeleteMatch: (date: number) => void;
}

/** History of all matches, with records, weekly trends and a calendar. */
export default function ProgressPage(p: Props) {
  const [tab, setTab] = useState<Tab>('matches');
  const [activity, setActivity] = useState<Activity>('run'); // records, trends and calendar are per activity
  const s = p.stats[activity];
  return (
    <>
      <div className="eyebrow">{SCREEN_TITLE.progress}</div>
      <div className="card">Total XP: <b>{p.xp}</b></div>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === 'matches' && <MatchLog groups={p.monthGroups} onOpen={p.onOpenMatch} onDelete={p.onDeleteMatch} />}
      {tab !== 'matches' && (
        <ChoiceGroup value={activity} options={['run', 'bike'] as const} label={(a) => ACTIVITY_LABEL[a]} onChange={setActivity} />
      )}
      {tab === 'records' && <RecordsBoard records={s.records} activity={activity} />}
      {tab === 'trends' && <TrendsPanel weekly={s.weekly} activity={activity} />}
      {tab === 'calendar' && <CalendarPanel grid={s.calendar} streak={p.streak} />}
    </>
  );
}
