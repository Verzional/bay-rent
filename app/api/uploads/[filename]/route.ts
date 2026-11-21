import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { readPaymentProof } from '@/lib/storage';

/**
 * Serves uploaded payment proof images for authenticated users.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { filename } = await context.params;
    const { buffer, contentType } = await readPaymentProof(filename);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    const status =
      error instanceof Error && 'status' in error && typeof error.status === 'number'
        ? error.status
        : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to read payment proof.' },
      { status },
    );
  }
}
