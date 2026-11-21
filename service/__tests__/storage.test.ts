import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readPaymentProof, savePaymentProof } from '@/lib/storage';

describe('lib/storage payment proof handling', () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop()!;
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  async function makeUploadDir(): Promise<string> {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bay-rent-uploads-'));
    tempDirs.push(dir);
    return dir;
  }

  it('saves and reads valid PNG payment proof images', async () => {
    const dir = await makeUploadDir();
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = new File([pngBytes], 'receipt.png', { type: 'image/png' });

    const url = await savePaymentProof(file, dir);
    expect(url).toMatch(/^\/api\/uploads\/[0-9a-f-]+\.png$/);

    const filename = url.split('/').pop()!;
    const loaded = await readPaymentProof(filename, dir);
    expect(loaded.contentType).toBe('image/png');
    expect(Buffer.compare(loaded.buffer, Buffer.from(pngBytes))).toBe(0);
  });

  it('rejects spoofed headers, unsupported types, oversized files, and path traversal', async () => {
    const dir = await makeUploadDir();

    const badSig = new File([new Uint8Array([0x00, 0x01, 0x02, 0x03])], 'fake.png', {
      type: 'image/png',
    });
    await expect(savePaymentProof(badSig, dir)).rejects.toThrow();

    const pdf = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
      'doc.pdf',
      { type: 'application/pdf' },
    );
    await expect(savePaymentProof(pdf, dir)).rejects.toThrow();

    await expect(readPaymentProof('../package.json', dir)).rejects.toThrow();
    await expect(
      readPaymentProof('11111111-1111-1111-1111-111111111111.png', dir),
    ).rejects.toThrow();
  });
});
