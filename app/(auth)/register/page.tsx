import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { AuthSplitShell } from '../_components/auth-split-shell';
import { RegisterForm } from './_components/register-form';

/**
 * Tenant registration page collecting 16-digit NIK and contact credentials.
 */
export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) {
    redirect(user.role === 'ADMIN' ? '/admin' : '/tenant');
  }

  return (
    <AuthSplitShell
      title="Register as Tenant"
      subtitle="Submit your 16-digit KTP (NIK) details for administrator verification."
    >
      <RegisterForm />
    </AuthSplitShell>
  );
}
