/** A figure with its label. */
export default function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="tile">
      <div className="tile-v">{value}</div>
      <div className="tile-l">{label}</div>
      {hint && <div className="tile-h">{hint}</div>}
    </div>
  );
}
