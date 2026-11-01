/** Row of tabs. The selected tab lives in the page that uses it (purely visual state). */
export default function Tabs<T extends string>(props: { tabs: { id: T; label: string }[]; value: T; onChange: (id: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {props.tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={t.id === props.value} className={t.id === props.value ? 'on' : ''} onClick={() => props.onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
