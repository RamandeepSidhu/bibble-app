"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { AdminSidebar } from "@/components/ui/adminSideBar";
import { Menu, LogOut } from "lucide-react";
import React, { memo, useState } from "react";

const AdminMainLayoutComponent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  return (
    <React.Fragment>
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={true}
      />

      {/* Desktop sidebar */}
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={false}
      />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden sm:flex"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-3 lg:px-2">{children}</div>
        </main>
      </div>
    </React.Fragment>
  );
};

export const AdminMainLayout = memo(AdminMainLayoutComponent);
