/** Button group for choosing one value among several. */
export default function ChoiceGroup<T extends string | number>(props: {
  value: T;
  options: T[];
  label: (v: T) => string;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      {props.options.map((o) => (
        <button
          key={String(o)}
          className={o === props.value ? 'on' : ''}
          onClick={() => props.onChange(o)}
        >
          {props.label(o)}
        </button>
      ))}
    </div>
  );
}
