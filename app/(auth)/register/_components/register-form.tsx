'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { registerAction } from '@/service/auth';
import { SubmitButton } from '@/app/_components/common/submit-button';
import { Alert } from '@/app/_components/ui/alert';
import { Card, CardContent } from '@/app/_components/ui/card';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import type { ActionState } from '@/types';

const INITIAL_STATE: ActionState = { success: false };

/**
 * Tenant registration form requiring 16-digit NIK, full name, phone, email, and password.
 */
export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, INITIAL_STATE);

  return (
    <Card>
      <CardContent className="p-6 sm:p-6">
        <form action={formAction} className="space-y-4">
          {state.message && !state.success ? (
            <Alert variant="rose">{state.message}</Alert>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="nationalId">National ID (NIK — 16 Digits)</Label>
            <Input
              id="nationalId"
              name="nationalId"
              type="text"
              inputMode="numeric"
              pattern="\d{16}"
              maxLength={16}
              required
              placeholder="3578012345678901"
              className="font-mono"
            />
            {state.fieldErrors?.nationalId ? (
              <p className="text-xs text-rose-600">{state.fieldErrors.nationalId[0]}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              required
              placeholder="Budi Santoso"
            />
            {state.fieldErrors?.fullName ? (
              <p className="text-xs text-rose-600">{state.fieldErrors.fullName[0]}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                placeholder="081234567890"
              />
              {state.fieldErrors?.phoneNumber ? (
                <p className="text-xs text-rose-600">{state.fieldErrors.phoneNumber[0]}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="budi@example.com"
              />
              {state.fieldErrors?.email ? (
                <p className="text-xs text-rose-600">{state.fieldErrors.email[0]}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Minimum 6 characters"
            />
            {state.fieldErrors?.password ? (
              <p className="text-xs text-rose-600">{state.fieldErrors.password[0]}</p>
            ) : null}
          </div>

          <SubmitButton
            pending={isPending}
            pendingLabel="Creating Account..."
            className="w-full"
          >
            Register as Tenant
          </SubmitButton>

          <p className="text-center text-sm text-stone-600">
            Already registered?{' '}
            <Link href="/login" className="font-semibold text-amber-700 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
