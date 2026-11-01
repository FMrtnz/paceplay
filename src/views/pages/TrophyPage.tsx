import { SCREEN_TITLE, TROPHIES } from '../../models/vocabulary';
import TrophyCard from '../components/TrophyCard';

/** All trophies: earned ones in gold, the others show how to win them. */
export default function TrophyPage({ earnedIds }: { earnedIds: string[] }) {
  return (
    <>
      <div className="eyebrow">{SCREEN_TITLE.trophies}</div>
      <div className="card">Collected: <b>{earnedIds.length}</b> / {Object.keys(TROPHIES).length}</div>
      {Object.entries(TROPHIES).map(([id, t]) => (
        <TrophyCard key={id} name={t.name} hint={t.hint} earned={earnedIds.includes(id)} />
      ))}
    </>
  );
}
