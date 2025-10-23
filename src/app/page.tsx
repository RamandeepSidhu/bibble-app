import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  // Redirect admin users to admin dashboard
  if ((session.user as any).role_id === 1) {
    redirect('/admin/dashboard');
  }

  // For other users, show a default page or redirect to appropriate page
  redirect('/dashboard');
}
