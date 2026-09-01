import { IconWrench } from './icons';

/** Placeholder body for every tab outside the phase-1 catalogue scope. */
export function UnderDevelopment({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">
        🚧 Development under progress
      </div>
      <div className="card px-8 py-12">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <IconWrench width={26} height={26} />
        </div>
        <h2 className="text-xl font-bold text-ink-900">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">{blurb}</p>
        <p className="mt-6 text-xs text-ink-300">
          Planned for a later phase. The Product Catalog tab is live today.
        </p>
      </div>
    </div>
  );
}
