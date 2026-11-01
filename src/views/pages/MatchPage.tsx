import { useState } from 'react';
import type { MatchView } from '../../models/matchModel';
import type { RunResult } from '../../models/progressModel';
import { LEVEL_LABEL, RESULT_TITLE, SCREEN_TITLE } from '../../models/vocabulary';
import { formatDate } from '../../utils/format';
import { Kilometres, Overview, SpeedUpsAndRecoveries } from '../components/MatchTabs';
import Tabs from '../components/Tabs';

type Tab = 'overview' | 'km' | 'phases';
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'km', label: 'Kilometres' },
  { id: 'phases', label: 'Speed-ups & Recoveries' },
];

/** One match, in three tabs. */
export default function MatchPage({ match, view, onShare, onBack }: { match: RunResult; view: MatchView; onShare: () => void; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');
  return (
    <>
      <div className="eyebrow">{SCREEN_TITLE.match}</div>
      <h2>{match.completed ? RESULT_TITLE.completed : RESULT_TITLE.interrupted}</h2>
      <div className="muted">{formatDate(match.date)} · {LEVEL_LABEL[match.level]}</div>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === 'overview' && <Overview match={match} view={view} />}
      {tab === 'km' && <Kilometres view={view} />}
      {tab === 'phases' && <SpeedUpsAndRecoveries view={view} />}
      <button className="big" onClick={onShare}>Share</button>
      <button onClick={onBack}>Back</button>
    </>
  );
}
