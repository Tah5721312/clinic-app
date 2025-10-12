import Dashboard from '@/components/Dashboard';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchAbilityRulesFromDB } from '@/lib/ability.server';
import { createAbilityFromRules } from '@/lib/ability';
import { auth } from '@/auth';

export default async function DashboardPage() {
  
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get('userId')?.value;
  let userId = userIdCookie ? Number(userIdCookie) : undefined;
  if (!Number.isFinite(userId)) {
    const session = await auth();
    const sessionUserId = Number((session?.user as any)?.id ?? 0);
    if (Number.isFinite(sessionUserId) && sessionUserId > 0) {
      userId = sessionUserId;
    }
  }

  if (!Number.isFinite(userId)) {
    redirect('/');
  }

  const rules = await fetchAbilityRulesFromDB(userId as number);
  const ability = createAbilityFromRules(rules);
  const canAccess =
    ability.can('read', 'Dashboard') ||
    ability.can('manage', 'Dashboard') ||
    ability.can('manage', 'all');
  if (!canAccess) {
    redirect('/');
  }

  return <Dashboard userId={String(userId)} />;
}
