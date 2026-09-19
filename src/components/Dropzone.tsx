import { useRef, useState, type DragEvent } from 'react';

/** Drag-and-drop (or click-to-browse) image upload target. No preview — pair it
 * with a separate thumbnail if the caller wants to show the current image. */
export function Dropzone({
  uploading,
  hint = 'JPG or PNG, up to 5MB.',
  onFile,
}: {
  uploading: boolean;
  hint?: string;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`relative flex min-h-28 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-center transition ${
        dragging ? 'border-brand-400 bg-brand-50' : 'border-ink-200 bg-ink-50 hover:border-ink-300'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <p className="px-3 text-xs font-medium text-ink-500">Drag an image here, or click to browse</p>
      <p className="px-3 text-[11px] text-ink-300">{hint}</p>
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80 text-xs font-medium text-ink-700">
          Uploading...
        </div>
      )}
    </div>
  );
}
