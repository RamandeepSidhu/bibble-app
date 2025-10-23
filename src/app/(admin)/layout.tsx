import { AdminMainLayout } from "@/components/ui/adminMainLayout";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login");
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminMainLayout>{children}</AdminMainLayout>
    </div>
  );
}
