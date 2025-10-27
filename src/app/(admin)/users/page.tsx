'use client';

import { useState, useEffect } from 'react';
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
  Mail,
  User,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter
} from 'lucide-react';
import Pagination from '@/components/common/Pagination';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';
import UsersTableShimmer from '@/components/ui/users-table-shimmer';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  profile_image?: any;
  subscription?: any;
  createdAt?: string;
  updatedAt?: string;
  paidReader:boolean;
}

interface UsersResponse {
  success: boolean;
  message: string;
  data: User[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(planFilter !== 'all' && { plan: planFilter })
      });

      const response: any = await ClientInstance.APP.getUserList(params.toString());
      
      if (response.success) {
        setUsers(response.data);
        setPagination(response.pagination);
      } else {
        showToast.error("Error", response.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast.error("Error", "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize, searchTerm, statusFilter, planFilter]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle filter changes
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePlanFilter = (value: string) => {
    setPlanFilter(value);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPlanFilter('all');
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || planFilter !== 'all';

  // Get status icon and color
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'suspended':
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
      case 'active':
        return 'text-green-700 bg-green-100';
      case 'pending':
        return 'text-yellow-700 bg-yellow-100';
      case 'suspended':
      case 'inactive':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };


  return (
    <div className={`container mx-auto px-4 py-8 p-6 min-h-screen ${users.length === 0 && !loading ? 'bg-transparent' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor user accounts, roles, and permissions
          </p>
        </div>
      </div>

      {/* Filters - Only show if there are users or if user has applied filters */}
      {(users.length > 0 || hasActiveFilters) && (
        <div className="p-1 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                  placeholder="Search by name or email..."
                value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-[50%] bg-white h-[40px]"
                />
                
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-48">
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Plan Filter */}
            {/* <div className="w-full lg:w-48">
              <Select value={planFilter} onValueChange={handlePlanFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div> */}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
            </div>
          </div>
      )}

        {/* Users Table */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <UsersTableShimmer />
        </div>
      ) : users.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 text-lg mb-2">No users found</div>
            <p className="text-gray-400">
              {hasActiveFilters 
                ? 'Try adjusting your search criteria'
                : 'No users have been registered yet'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-700 py-4 px-6">User</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 px-6">Role</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 px-6">Plan</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 px-6">Joined</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 px-6 text-right">Status</TableHead>
                  {/* <TableHead className="font-semibold text-gray-700 py-4 px-6 text-right">Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user, index) => (
                  <TableRow 
                    key={user._id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-theme-secondary text-theme-primary flex items-center justify-center font-semibold">
                          {user.profile_image ? (
                            <img 
                              src={user.profile_image} 
                              alt={user.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {user.role}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4 px-6">
                      <span className="text-sm text-gray-900 capitalize">
                        {user.paidReader ? "Paid Reader" : "Free Reader" }
                    </span>
                  </TableCell>
                    <TableCell className="py-4 px-6 text-righ">
                      <span className="text-sm text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
                      <div className="flex items-center gap-2 justify-end">
                        {getStatusIcon(user.status)}
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                    </div>
                  </TableCell>
                  {/* <TableCell className="text-right py-4 px-6">
                      <Button variant="outline" size="sm" className="!min-w-[30px]">
                        <MoreHorizontal className="h-4 w-4 mr-1" />
                      </Button>
                  </TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="border-t border-gray-200 px-6 py-4">
                <Pagination
                  currentPage={pagination.page}
                  totalItems={pagination.total}
                  pageSize={pagination.limit}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </>
        </div>
      )}
    </div>
  );
}