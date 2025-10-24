'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  MoreHorizontal, 
  Mail
} from 'lucide-react';
import Pagination from '@/components/common/Pagination';

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock user data - expanded for pagination
  const allUsers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Service Provider',
      status: 'Active',
      plan: 'Premium',
      joinDate: '2024-01-15',
      lastActive: '2 hours ago',
      totalSites: 3,
      subscriptionExpired: '2024-12-15',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'Service Seeker',
      status: 'Active',
      plan: 'Free',
      joinDate: '2024-01-20',
      lastActive: '1 day ago',
      totalSites: 1,
      subscriptionExpired: '-',
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike@example.com',
      role: 'Service Provider',
      status: 'Inactive',
      plan: 'Premium',
      joinDate: '2024-01-10',
      lastActive: '1 week ago',
      totalSites: 2,
      subscriptionExpired: '2024-11-10',
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      email: 'sarah@example.com',
      role: 'Service Seeker',
      status: 'Active',
      plan: 'Royal',
      joinDate: '2024-01-25',
      lastActive: '30 minutes ago',
      totalSites: 5,
      subscriptionExpired: '2025-01-25',
    },
    {
      id: 5,
      name: 'Tom Brown',
      email: 'tom@example.com',
      role: 'Service Provider',
      status: 'Pending',
      plan: 'Free',
      joinDate: '2024-01-28',
      lastActive: 'Never',
      totalSites: 0,
      subscriptionExpired: '-',
    },
    {
      id: 6,
      name: 'Alice Cooper',
      email: 'alice@example.com',
      role: 'Service Seeker',
      status: 'Active',
      plan: 'Premium',
      joinDate: '2024-02-01',
      lastActive: '3 hours ago',
      totalSites: 2,
      subscriptionExpired: '2024-12-01',
    },
    {
      id: 7,
      name: 'Bob Wilson',
      email: 'bob@example.com',
      role: 'Service Provider',
      status: 'Suspended',
      plan: 'Free',
      joinDate: '2024-02-05',
      lastActive: '2 days ago',
      totalSites: 1,
      subscriptionExpired: '-',
    },
    {
      id: 8,
      name: 'Carol Davis',
      email: 'carol@example.com',
      role: 'Service Seeker',
      status: 'Active',
      plan: 'Royal',
      joinDate: '2024-02-10',
      lastActive: '1 hour ago',
      totalSites: 4,
      subscriptionExpired: '2025-02-10',
    },
    {
      id: 9,
      name: 'David Miller',
      email: 'david@example.com',
      role: 'Service Provider',
      status: 'Active',
      plan: 'Premium',
      joinDate: '2024-02-15',
      lastActive: '5 minutes ago',
      totalSites: 3,
      subscriptionExpired: '2024-12-15',
    },
    {
      id: 10,
      name: 'Emma Taylor',
      email: 'emma@example.com',
      role: 'Service Seeker',
      status: 'Pending',
      plan: 'Free',
      joinDate: '2024-02-20',
      lastActive: 'Never',
      totalSites: 0,
      subscriptionExpired: '-',
    },
    {
      id: 11,
      name: 'Frank Anderson',
      email: 'frank@example.com',
      role: 'Service Provider',
      status: 'Active',
      plan: 'Royal',
      joinDate: '2024-02-25',
      lastActive: '2 hours ago',
      totalSites: 6,
      subscriptionExpired: '2025-02-25',
    },
    {
      id: 12,
      name: 'Grace Lee',
      email: 'grace@example.com',
      role: 'Service Seeker',
      status: 'Inactive',
      plan: 'Premium',
      joinDate: '2024-03-01',
      lastActive: '1 week ago',
      totalSites: 2,
      subscriptionExpired: '2024-12-01',
    },
  ];

  // Filter users based on search and status
  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'Free':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Premium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Royal':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    if (dateString === '-') return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6 container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage and monitor all platform users</p>
        </div>
        <Button>
          Add New User
        </Button>
      </div>


      {/* Search and Filters */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 bg-white w-[50%]"
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200">
                <TableHead className="font-semibold text-gray-600 text-xs py-4 px-6">User Name</TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs py-4 px-6">Email</TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs py-4 px-6">Status</TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs py-4 px-6">Plan</TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs py-4 px-6">Subscription Expired</TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs py-4 px-6">Joined</TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs py-4 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentUsers.map((user) => (
                <TableRow key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-700 text-sm py-4 px-6 font-normal">
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-700 text-sm py-4 px-6 font-normal">
                    <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-700 text-sm py-4 px-6 font-normal">
                    <span className={`px-2 py-1 text-xs rounded-full border ${getPlanColor(user.plan)}`}>
                      {user.plan}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-700 text-sm py-4 px-6 font-normal">
                    {formatDate(user.subscriptionExpired)}
                  </TableCell>
                  <TableCell className="text-gray-700 text-sm py-4 px-6 font-normal">
                    {formatDate(user.joinDate)}
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
                    <div className="flex justify-end gap-2">
                      {user.status === 'Pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          >
                            Verify
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          >
                            Suspend
                          </Button>
                        </>
                      )}
                      {user.status === 'Suspended' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        >
                          Verify
                        </Button>
                      )}
                      {user.status === 'Active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        >
                          Suspend
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size: number) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              isLoading={false}
            />
          )}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No users found matching your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
