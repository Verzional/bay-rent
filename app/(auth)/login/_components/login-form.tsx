'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { loginAction } from '@/service/auth';
import { SubmitButton } from '@/app/_components/common/submit-button';
import { Alert } from '@/app/_components/ui/alert';
import { Card, CardContent } from '@/app/_components/ui/card';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import type { ActionState } from '@/types';

const INITIAL_STATE: ActionState = { success: false };

/**
 * Credential login form for both Tenants and Administrators.
 */
export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, INITIAL_STATE);

  return (
    <Card>
      <CardContent className="p-6 sm:p-6">
        <form action={formAction} className="space-y-4">
          {state.message && !state.success ? (
            <Alert variant="rose">{state.message}</Alert>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@example.com"
            />
            {state.fieldErrors?.email ? (
              <p className="text-xs text-rose-600">{state.fieldErrors.email[0]}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter your password"
            />
            {state.fieldErrors?.password ? (
              <p className="text-xs text-rose-600">{state.fieldErrors.password[0]}</p>
            ) : null}
          </div>

          <SubmitButton
            pending={isPending}
            pendingLabel="Signing in..."
            className="w-full"
          >
            Sign In
          </SubmitButton>

          <p className="text-center text-sm text-stone-600">
            New tenant?{' '}
            <Link
              href="/register"
              className="font-semibold text-amber-700 hover:underline"
            >
              Register an account
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
