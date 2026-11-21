'use client';

import { Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from '@/app/_components/ui/button';

interface SubmitButtonProps extends ButtonProps {
  pending?: boolean;
  pendingLabel?: string;
}

/**
 * Submit button that automatically renders a loading spinner during Server Action transitions.
 */
export function SubmitButton({
  pending = false,
  pendingLabel = 'Processing...',
  children,
  disabled,
  ...props
}: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={disabled || pending} {...props}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
