import { useState } from 'react';

import { IconExpand } from './icons';
import { Modal } from './Modal';

/** A preview box with an expand button that opens the image full-size in a modal. */
export function ImageThumbnail({
  src,
  className = 'aspect-square w-full',
  emptyLabel = 'No image yet',
}: {
  src: string | null;
  className?: string;
  emptyLabel?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-lg border border-ink-100 bg-ink-50 ${className}`}
      >
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-ink-300">
            {emptyLabel}
          </div>
        )}
        {src && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="absolute right-1.5 bottom-1.5 rounded-md bg-ink-900/60 p-1.5 text-white transition hover:bg-ink-900/80"
            aria-label="Expand image"
          >
            <IconExpand width={14} height={14} />
          </button>
        )}
      </div>

      {expanded && src && (
        <Modal onClose={() => setExpanded(false)}>
          <img src={src} alt="" className="max-h-[85vh] w-full rounded-lg object-contain" />
        </Modal>
      )}
    </>
  );
}
