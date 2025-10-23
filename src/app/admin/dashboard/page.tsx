'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  Activity,
  Calendar,
  DollarSign,
  Package
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: session } = useSession();

  const firstName = (session?.user as any)?.first_name || 'Admin';

  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      description: 'All registered users',
      icon: Users,
      change: '+12%',
      changeType: 'positive' as const,
      color: 'bg-theme-secondary text-theme-primary',
      iconColor: 'text-theme-primary',
    },
    {
      title: 'Active Users',
      value: '890',
      description: 'Users active this month',
      icon: UserCheck,
      change: '+8%',
      changeType: 'positive' as const,
      color: 'bg-theme-secondary text-theme-primary',
      iconColor: 'text-theme-primary',
    },
    {
      title: 'Total Products',
      value: '45',
      description: 'Products in catalog',
      icon: Package,
      change: '+5%',
      changeType: 'positive' as const,
      color: 'bg-theme-secondary text-theme-primary',
      iconColor: 'text-theme-primary',
    },
    {
      title: 'Active Subscriptions',
      value: '456',
      description: 'Total active subscriptions',
      icon: DollarSign,
      change: '+15%',
      changeType: 'positive' as const,
      color: 'bg-theme-secondary text-theme-primary',
      iconColor: 'text-theme-primary',
    },
  ];

  const recentActivity = [
    { id: 1, action: 'New user registered', user: 'John Doe', time: '2 minutes ago', type: 'user' },
    { id: 2, action: 'Product added', user: 'Holy Bible', time: '5 minutes ago', type: 'product' },
    { id: 3, action: 'User verified', user: 'Mike Johnson', time: '10 minutes ago', type: 'user' },
    { id: 4, action: 'Story added', user: 'Creation Story', time: '15 minutes ago', type: 'content' },
    { id: 5, action: 'Verse added', user: 'John 3:16', time: '20 minutes ago', type: 'content' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {firstName}! Here's what's happening with your platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <p className="text-sm text-gray-600 mt-1">Latest user actions and system events</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'user' ? 'bg-blue-500' :
                    activity.type === 'product' ? 'bg-purple-500' :
                    'bg-green-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {activity.user}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            <p className="text-sm text-gray-600 mt-1">Common administrative tasks</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              <Link href="/admin/users">
                <Button variant="outline" className="w-full h-16 flex items-center justify-start">
                  <Users className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Manage Users</div>
                    <div className="text-sm text-gray-500">View and manage user accounts</div>
                  </div>
                </Button>
              </Link>
              <Link href="/admin/products">
                <Button variant="outline" className="w-full h-16 flex items-center justify-start">
                  <Package className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Manage Products</div>
                    <div className="text-sm text-gray-500">Add and manage products</div>
                  </div>
                </Button>
              </Link>
              <Button variant="outline" className="w-full h-16 flex items-center justify-start">
                <Activity className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">View Analytics</div>
                  <div className="text-sm text-gray-500">Platform usage statistics</div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
