'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  X,
  Home,
  Package,
  Globe,
  Music,
  Book
} from 'lucide-react';
import Link from 'next/link';

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isMobile?: boolean;
}

export function AdminSidebar({ sidebarOpen, setSidebarOpen, isMobile = false }: AdminSidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Languages', href: '/languages', icon: Globe },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Hymns', href: '/hymns', icon: Music },
    { name: 'Bible', href: '/bible', icon: Book },
  ];

  const sidebarContent = (
    <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
      <div className="flex h-16 items-center px-4">
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto"
          >
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>
      
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-theme-secondary text-[#A23021]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={() => isMobile && setSidebarOpen(false)}
            >
              <Icon className={`mr-3 h-5 w-5 ${
                isActive ? 'text-[#A23021]' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {(session?.user as any)?.first_name?.charAt(0) || 'A'}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">
              {(session?.user as any)?.first_name} {(session?.user as any)?.last_name}
            </p>
            <p className="text-xs text-gray-500">{(session?.user as any)?.name || 'Admin'}</p>
            <p className="text-xs text-gray-500">{(session?.user as any)?.email || ''}</p>
          </div>
        </div>
        {/* <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="mt-3 w-full justify-start"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button> */}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          {sidebarContent}
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      {sidebarContent}
    </div>
  );
}