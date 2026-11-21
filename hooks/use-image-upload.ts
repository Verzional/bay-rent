'use client';

import { useCallback, useEffect, useState } from 'react';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

export interface UseImageUploadResult {
  file: File | null;
  previewUrl: string | null;
  error: string | null;
  handleFileChange: (nextFile: File | null) => void;
  clearFile: () => void;
}

/**
 * Manages client-side validation (PNG/JPG/WEBP, <= 5 MB) and object URL preview
 * lifecycle for payment proof image uploads.
 */
export function useImageUpload(): UseImageUploadResult {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const clearFile = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
  }, []);

  const handleFileChange = useCallback((nextFile: File | null) => {
    if (!nextFile) {
      setFile(null);
      setPreviewUrl(null);
      setError(null);
      return;
    }

    if (!ALLOWED_MIME_TYPES.has(nextFile.type.toLowerCase())) {
      setFile(null);
      setPreviewUrl(null);
      setError('Only PNG, JPG, and WEBP image files are accepted.');
      return;
    }

    if (nextFile.size > MAX_SIZE_BYTES) {
      setFile(null);
      setPreviewUrl(null);
      setError('Image size must be 5 MB or less.');
      return;
    }

    setError(null);
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
  }, []);

  return {
    file,
    previewUrl,
    error,
    handleFileChange,
    clearFile,
  };
}
