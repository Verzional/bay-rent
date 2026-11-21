'use client';

import { ImagePlus, X } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/app/_components/ui/button';

interface FileDropzoneProps {
  name?: string;
  label?: string;
  previewUrl: string | null;
  fileName: string | null;
  error: string | null;
  onFileChange: (file: File | null) => void;
  onClear: () => void;
  required?: boolean;
}

/**
 * Controlled image upload dropzone with instant client preview and clear button.
 */
export function FileDropzone({
  name = 'paymentProof',
  label = 'Upload payment proof (PNG, JPG, WEBP up to 5 MB)',
  previewUrl,
  fileName,
  error,
  onFileChange,
  onClear,
  required = true,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onClear();
  };

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/60 p-4 transition-colors hover:border-amber-500/70">
        <input
          ref={inputRef}
          id={name}
          name={name}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required={required}
          className="sr-only"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />

        {previewUrl ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Payment proof preview"
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="truncate text-sm font-medium text-stone-900">{fileName}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => inputRef.current?.click()}
              >
                Change
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleClear}
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <label
            htmlFor={name}
            className="flex cursor-pointer flex-col items-center justify-center py-4 text-center"
          >
            <div className="mb-2 rounded-lg border border-stone-200 bg-white p-2.5 text-amber-600">
              <ImagePlus className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-stone-800">{label}</span>
            <span className="mt-0.5 text-xs text-stone-500">
              Click to browse your device
            </span>
          </label>
        )}
      </div>
      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}
