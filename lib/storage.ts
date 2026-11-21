import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILENAME_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$/i;
const DEFAULT_UPLOADS_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), 'uploads');

type SupportedExtension = 'png' | 'jpg' | 'webp';

const MIME_TO_EXT: Record<string, SupportedExtension> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
};

const EXT_TO_MIME: Record<SupportedExtension, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
};

function matchesMagicBytes(bytes: Uint8Array, ext: SupportedExtension): boolean {
  if (ext === 'png') {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }
  if (ext === 'jpg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (ext === 'webp') {
    return (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  return false;
}

/**
 * Validates and persists a PNG/JPG/WEBP payment proof image (<= 5 MB) to disk.
 */
export async function savePaymentProof(
  file: File,
  uploadsDir: string = DEFAULT_UPLOADS_DIR,
): Promise<string> {
  if (!file || file.size <= 0) {
    throw new Error('Please upload a payment proof image (PNG, JPG, or WEBP).');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Payment proof image cannot exceed 5 MB.');
  }

  const ext = MIME_TO_EXT[file.type.toLowerCase()];
  if (!ext) {
    throw new Error('Only PNG, JPG, and WEBP images are supported.');
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new Error('Payment proof image must be between 1 byte and 5 MB.');
  }

  if (!matchesMagicBytes(bytes, ext)) {
    throw new Error('File content does not match a valid PNG, JPG, or WEBP image.');
  }

  const resolvedDir = path.resolve(/*turbopackIgnore: true*/ uploadsDir);
  await fs.mkdir(resolvedDir, { recursive: true });
  const filename = `${crypto.randomUUID()}.${ext}`;
  const destination = path.join(/*turbopackIgnore: true*/ resolvedDir, filename);

  await fs.writeFile(destination, bytes);
  return `/api/uploads/${filename}`;
}

/**
 * Reads a stored payment proof image after validating its UUID filename.
 */
export async function readPaymentProof(
  filename: string,
  uploadsDir: string = DEFAULT_UPLOADS_DIR,
): Promise<{ buffer: Buffer; contentType: string; status?: number }> {
  const match = ALLOWED_FILENAME_REGEX.exec(filename);
  if (!match) {
    const err = new Error('Invalid payment proof filename.');
    (err as Error & { status: number }).status = 400;
    throw err;
  }

  const ext = match[1]!.toLowerCase() as SupportedExtension;
  const resolvedDir = path.resolve(/*turbopackIgnore: true*/ uploadsDir);
  const resolvedPath = path.resolve(/*turbopackIgnore: true*/ resolvedDir, filename);

  if (!resolvedPath.startsWith(`${resolvedDir}${path.sep}`)) {
    const err = new Error('Invalid payment proof path.');
    (err as Error & { status: number }).status = 400;
    throw err;
  }

  try {
    const buffer = await fs.readFile(resolvedPath);
    return { buffer, contentType: EXT_TO_MIME[ext] };
  } catch {
    const err = new Error('Payment proof image was not found.');
    (err as Error & { status: number }).status = 404;
    throw err;
  }
}
