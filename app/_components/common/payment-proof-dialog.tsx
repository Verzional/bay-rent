'use client';

import { FileImage } from 'lucide-react';
import { Button } from '@/app/_components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/_components/ui/dialog';

interface PaymentProofDialogProps {
  proofUrl: string;
  title?: string;
  triggerLabel?: string;
}

/**
 * Opens an authenticated payment proof image inside a modal lightbox dialog.
 */
export function PaymentProofDialog({
  proofUrl,
  title = 'Payment Proof Receipt',
  triggerLabel = 'View Proof',
}: PaymentProofDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <FileImage className="h-3.5 w-3.5" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Uploaded payment confirmation image stored in Bay-Rent records.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proofUrl}
            alt={title}
            className="max-h-[65vh] w-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
