import type { Metadata } from "next";
import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
export const metadata: Metadata = {
  title: "Bible & Hymns",
  description: "Bible & Hymns Admin Dashboard",
};

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session: any = await getServerSession(authOptions);
  if (session?.user &&session?.user.role === "admin") {
    redirect('/');
  }
  return (
    <React.Fragment>
        {children}
    </React.Fragment>
  );
}
