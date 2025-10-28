'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Calendar,
  Package,
  Music,
  ArrowRight,
  User,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';
import DashboardShimmer from '@/components/ui/dashboard-shimmer';
import { redirect } from 'next/navigation';

interface DashboardData {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  statistics: {
    totalUsers: number;
    paidUsers: number;
    totalProducts: number;
    totalHymns: number;
    recentUsers: Array<{
      _id: string;
      name: string;
      email: string;
      createdAt: string;
      profileImage?: string;
    }>;
  };
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const firstName = (session?.user as any)?.first_name || 'Admin';
  useEffect(() => {
    if (session?.user.role !== "admin") {
      redirect('/auth/login');
    }
  }, [session]);
  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response: any = await ClientInstance.APP.getAdminDashboard();
      
      if (response.success) {
        setDashboardData(response.data);
      } else {
        showToast.error("Error", response.message || "Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showToast.error("Error", "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Dynamic stats based on API data
  const stats = dashboardData?.statistics ? [
    {
      title: 'Total Users',
      value: (dashboardData.statistics.totalUsers || 0).toLocaleString(),
      description: 'All registered users',
      icon: Users,
      change: '+12%',
      changeType: 'positive' as const,
      color: 'bg-theme-secondary text-theme-primary',
      iconColor: 'text-theme-primary',
    },
    {
      title: 'Paid Users',
      value: (dashboardData.statistics.paidUsers || 0).toLocaleString(),
      description: 'Users with active subscriptions',
      icon: UserCheck,
      change: '+8%',
      changeType: 'positive' as const,
      color: 'bg-theme-secondary text-theme-primary',
      iconColor: 'text-theme-primary',
    },
    // {
    //   title: 'Total Products',
    //   value: (dashboardData.statistics.totalProducts || 0).toLocaleString(),
    //   description: 'Products in catalog',
    //   icon: Package,
    //   change: '+5%',
    //   changeType: 'positive' as const,
    //   color: 'bg-theme-secondary text-theme-primary',
    //   iconColor: 'text-theme-primary',
    // },
    {
      title: 'Total Hymns',
      value: (dashboardData.statistics.totalHymns || 0).toLocaleString(),
      description: 'Hymns in catalog',
      icon: Music,
      change: '+3%',
      changeType: 'positive' as const,
      color: 'bg-theme-secondary text-theme-primary',
      iconColor: 'text-theme-primary',
    },
    {
      title: 'Free Users',
      value: ((dashboardData.statistics.totalUsers || 0) - (dashboardData.statistics.paidUsers || 0)).toLocaleString(),
      description: 'Users on free plan',
      icon: UserX,
      change: '+15%',
      changeType: 'positive' as const,
      color: 'bg-theme-secondary text-theme-primary',
      iconColor: 'text-theme-primary',
    },
  ] : [];

  // Recent activity from API data
  const recentActivity = dashboardData?.statistics?.recentUsers?.map((user, index) => ({
    id: user._id,
    action: user.email,
    user: user.name,
    time: user.createdAt, // Keep original timestamp
    type: 'user' as const,
  })) || [];

  if (loading) {
    return <DashboardShimmer />;
  }

  return (
    <div className="space-y-6 container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {firstName}! Here's what's happening with your platform.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        {/* Recent Registrations */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Registrations</h2>
                <p className="text-sm text-gray-600 mt-1">Latest users who joined the platform</p>
              </div>
              <Link href="/users">
                <Button variant="outline" size="sm" className="border-theme-primary text-theme-primary hover:bg-theme-secondary">
                  View All Users
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id} className={`flex items-center space-x-4 py-3 ${
                    index < recentActivity.length - 1 ? 'border-b border-gray-100' : ''
                  }`}>
                    {/* User Icon */}
                    <div className="w-8 h-8 bg-theme-secondary rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-theme-primary" />
                    </div>
                    
                    {/* User Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {activity.user}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {activity.action}
                      </p>
                    </div>
                    
                    {/* Registration Time */}
                    <div className="text-xs text-gray-500 flex items-center flex-shrink-0">
                      <Calendar className="h-3 w-3 mr-1" />
                      {activity.time ? new Date(activity.time).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      }) : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500 text-lg mb-2">No recent registrations</div>
                <p className="text-gray-400">Recent user registrations will appear here</p>
              </div>
            )}
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
              <Link href="/users">
                <Button variant="outline" className="w-full h-16 flex items-center justify-start">
                  <Users className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Manage Users</div>
                    <div className="text-sm text-gray-500">View and manage user accounts</div>
                  </div>
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" className="w-full h-16 flex items-center justify-start">
                  <Package className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Manage Products</div>
                    <div className="text-sm text-gray-500">Add and manage products</div>
                  </div>
                </Button>
              </Link>
              <Link href="/hymns">
              <Button variant="outline" className="w-full h-16 flex items-center justify-start">
                <Music className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">View Hymns</div>
                  <div className="text-sm text-gray-500">Add and manage Hymns</div>
                </div>
              </Button>
              </Link>
              <Link href="/bible">
              <Button variant="outline" className="w-full h-16 flex items-center justify-start">
                <BookOpen className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">View Bible</div>
                  <div className="text-sm text-gray-500">Add and manage Bible content</div>
                </div>
              </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
