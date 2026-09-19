import { IconPlus, IconTrash } from './icons';

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-300">{hint}</p>
      ) : null}
    </div>
  );
}

export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-brand-500"
      />
      <span className="leading-tight">
        <span className="block text-sm font-medium text-ink-900">{label}</span>
        <span className="block text-xs text-ink-300">{hint}</span>
      </span>
    </label>
  );
}

/** Repeating single-line inputs (e.g. feature bullets). */
export function ListEditor({
  values,
  placeholder,
  addLabel = 'Add',
  onChange,
}: {
  values: string[];
  placeholder: string;
  addLabel?: string;
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      {values.map((value, i) => (
        <div key={i} className="flex gap-2">
          <input
            className="field"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(values.map((v, j) => (j === i ? e.target.value : v)))}
          />
          <button
            type="button"
            className="btn-ghost px-3"
            onClick={() => onChange(values.filter((_, j) => j !== i))}
            aria-label="Remove"
          >
            <IconTrash width={16} height={16} />
          </button>
        </div>
      ))}
      <button type="button" className="btn-ghost" onClick={() => onChange([...values, ''])}>
        <IconPlus width={15} height={15} />
        {addLabel}
      </button>
    </div>
  );
}
