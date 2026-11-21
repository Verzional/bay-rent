'use client';

import { CheckCircle2 } from 'lucide-react';
import { useTransition } from 'react';
import { completeRentalAction } from '@/service/rental';
import { Button } from '@/app/_components/ui/button';

/**
 * Manual Admin action button to mark an active rental completed and release its bay.
 */
export function CompleteRentalButton({
  rentalId,
  garageCode,
}: {
  rentalId: number;
  garageCode: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleComplete = () => {
    startTransition(async () => {
      await completeRentalAction(rentalId);
    });
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={handleComplete}
      title={`Mark bay ${garageCode} rental as completed`}
    >
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
      {isPending ? 'Closing...' : 'Complete'}
    </Button>
  );
}
