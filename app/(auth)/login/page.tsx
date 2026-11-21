import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { AuthSplitShell } from '../_components/auth-split-shell';
import { LoginForm } from './_components/login-form';

/**
 * Sign-in page for Tenants and Administrators.
 */
export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) {
    redirect(user.role === 'ADMIN' ? '/admin' : '/tenant');
  }

  return (
    <AuthSplitShell
      title="Sign in to Bay-Rent"
      subtitle="Access your tenant garage passes or administrator operations console."
    >
      <LoginForm />
    </AuthSplitShell>
  );
}
