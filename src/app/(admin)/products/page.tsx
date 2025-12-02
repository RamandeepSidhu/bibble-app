'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Edit, 
  Search,
  X,
  Package
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Pagination from '@/components/Pagination';
import Link from 'next/link';
import { ProductManagement, ChangeProductStatusPayload } from '@/lib/types/bibble';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [products, setProducts] = useState<ProductManagement[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<ProductManagement | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusChangeProduct, setStatusChangeProduct] = useState<ProductManagement | null>(null);
  const [newStatus, setNewStatus] = useState<'active' | 'inactive' | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter state
  const [contentType, setContentType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  // Fetch languages from API
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const languagesResponse: any = await ClientInstance.APP.getLanguage();
        if (languagesResponse?.success && languagesResponse?.data) {
          setLanguages(languagesResponse.data.filter((lang: any) => lang.isActive === true));
        }
      } catch (error) {
        console.error("Error fetching languages:", error);
      }
    };
    fetchLanguages();
  }, []);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        
        // Build query parameters
        const params: any = {
          page: currentPage,
          limit: pageSize,
          sortBy: sortBy,
          sortOrder: sortOrder
        };

        // Add search parameter if not empty
        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }

        // Add type filter if not 'all'
        if (selectedType !== 'all') {
          params.type = selectedType;
        }

        // Add content type filter if not 'all'
        if (contentType !== 'all') {
          params.contentType = contentType;
        }

        // Add status filter if not 'all'
        if (selectedStatus !== 'all') {
          params.status = selectedStatus;
        }

        const response: any = await ClientInstance.APP.getProducts(params);
        if (response?.success && response?.data) {
          setProducts(response.data);
          
          // Handle pagination data from API response
          if (response.pagination) {
            setTotalItems(response.pagination.total || 0);
            setTotalPages(response.pagination.totalPages || 1);
            // Only update currentPage if it's different (to avoid unnecessary re-renders)
            if (response.pagination.page && response.pagination.page !== currentPage) {
              setCurrentPage(response.pagination.page);
            }
          } else {
            // Fallback if pagination data is not available
            setTotalItems(response.data.length);
            setTotalPages(1);
          }
        } else {
          showToast.error("Error", response?.message || "Failed to fetch products");
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        showToast.error("Error", "Network error. Please check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [currentPage, pageSize, searchTerm, selectedType, selectedStatus, contentType, sortBy, sortOrder]);

  // Products are now filtered server-side, so we use them directly
  const filteredProducts = products;

  // Helper function to strip HTML tags
  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  const handleDeleteClick = (product: ProductManagement) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      const response: any = await ClientInstance.APP.deleteProduct(deletingProduct._id);
      if (response?.success) {
        setProducts(products.filter(p => p._id !== deletingProduct._id));
        setIsDeleteDialogOpen(false);
        setDeletingProduct(null);
        showToast.success("Product Deleted", "Product has been deleted successfully!");
      } else {
        showToast.error("Error", response?.message || "Failed to delete product");
      }
    } catch (error) {
      showToast.error("Error", "Network error. Please check your connection and try again.");
    }
  };

  const handleStatusToggle = (product: ProductManagement) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    setStatusChangeProduct(product);
    setNewStatus(newStatus);
    setIsStatusDialogOpen(true);
  };

  const handleStatusChange = async () => {
    if (!statusChangeProduct || !newStatus) return;
    
    try {
      const payload: ChangeProductStatusPayload = { status: newStatus };
      const response: any = await ClientInstance.APP.changeProductStatus(statusChangeProduct._id, payload);
      if (response?.success) {
        setProducts(products.map(p => 
          p._id === statusChangeProduct._id ? { ...p, status: newStatus } : p
        ));
        showToast.success("Status Updated", `Product status changed to ${newStatus}`);
        setIsStatusDialogOpen(false);
        setStatusChangeProduct(null);
        setNewStatus(null);
      } else {
        showToast.error("Error", response?.message || "Failed to update product status");
      }
    } catch (error) {
      showToast.error("Error", "Network error. Please check your connection and try again.");
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedStatus('all');
    setContentType('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Check if any filters are applied
  const hasActiveFilters = () => {
    return (
      searchTerm.trim() !== '' ||
      selectedType !== 'all' ||
      selectedStatus !== 'all' ||
      contentType !== 'all' ||
      sortBy !== 'createdAt' ||
      sortOrder !== 'desc'
    );
  };

  // Count active filters
  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm.trim() !== '') count++;
    if (selectedType !== 'all') count++;
    if (selectedStatus !== 'all') count++;
    if (contentType !== 'all') count++;
    if (sortBy !== 'createdAt') count++;
    if (sortOrder !== 'desc') count++;
    return count;
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs rounded-full border";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800 border-green-200`;
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-200`;
      case 'draft':
        return `${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-200`;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'book':
        return '📖';
      case 'song':
        return '🎵';
      default:
        return '📄';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              {/* Header Shimmer */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div>
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-16 mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                </div>
              </div>

              {/* Content Shimmer */}
              <div className="mt-5 space-y-4">
                {/* Title Shimmer */}
                <div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>

                {/* Description Shimmer */}
                <div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
                  </div>
                </div>

                {/* Stats Shimmer */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-6"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-4"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-4"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 py-8 ${filteredProducts.length === 0 && !isLoading ? 'bg-transparent' : ''}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6 border-b border-gray-200 pb-4 lg:pb-6">
        <div className="w-full">
          <h2 className="font-inter font-semibold text-2xl sm:text-[30px] leading-[38px] tracking-[0em] text-gray-800">
            Products Management
          </h2>
          <p className="font-inter font-normal text-sm sm:text-[16px] leading-[24px] tracking-[0em] text-gray-600 mt-1">
            Manage your products and content
          </p>
        </div>
        <Link href="/products/add">
          <Button className="bg-theme-primary text-theme-secondary hover:bg-theme-primary-dark">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Search and Filter - Only show if there are products or if user has applied filters */}
      {(filteredProducts.length > 0 || hasActiveFilters()) && (
        <div className="space-y-4 mb-6 mt-5">
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            placeholder="Search products..."
            type="search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            className="block w-full h-[40px] pl-10 pr-4 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6  gap-4">
          {/* Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Type</label>
          <Select value={selectedType} onValueChange={(value) => {
            setSelectedType(value);
            setCurrentPage(1);
          }}>
              <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="book">Book</SelectItem>
                <SelectItem value="song">Song</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Content Type</label>
            <Select value={contentType} onValueChange={(value) => {
            setContentType(value);
            setCurrentPage(1);
          }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by content type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Content Types</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Select value={selectedStatus} onValueChange={(value) => {
            setSelectedStatus(value);
            setCurrentPage(1);
          }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="block">Block</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Language Filter - Only show if there are products or if user has applied filters */}
          {(filteredProducts.length > 0 || searchTerm || selectedType !== 'all' || selectedStatus !== 'all' || contentType !== 'all' || selectedLanguage !== 'en') && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Language</label>
              <Select value={selectedLanguage} onValueChange={(value) => {
                setSelectedLanguage(value);
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((language) => (
                    <SelectItem key={language._id} value={language.code}>
                      {language.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Sort By */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Sort By</label>
            <Select value={sortBy} onValueChange={(value) => {
            setSortBy(value);
            setCurrentPage(1);
          }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="updatedAt">Updated Date</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
           {/* Sort Order */}
          <div className="space-y-2 w-full">
            <label className="text-sm font-medium text-gray-700">Sort Order</label>
            <Select value={sortOrder} onValueChange={(value) => {
              setSortOrder(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

         {/* Clear Filters Button - Only show when filters are active */}
         {hasActiveFilters() && (
           <div className="flex justify-end">
             <Button
               variant="outline"
               onClick={clearFilters}
               className="flex items-center gap-2"
             >
               <X className="h-4 w-4" />
               Clear Filters ({getActiveFiltersCount()})
             </Button>
           </div>
         )}
        
        </div>
      )}

      {/* Products Cards */}
      {filteredProducts.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 text-lg mb-2">No products found</div>
            <p className="text-gray-400">
              {hasActiveFilters() 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first product'
              }
            </p>
          </div>
        </div>
      ) : (
         <div className="space-y-6">
           {filteredProducts.map((product) => (
             <div key={product._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all p-6">
               {/* Header */}
               <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 flex items-center justify-center bg-orange-100 text-blue-600 rounded-lg">
                     {getTypeIcon(product.type)}
                   </div>
                   <div>
                     <h3 className="text-lg font-semibold text-gray-800 capitalize">
                       {product.type || 'Product'}
                     </h3>
                     <p className="text-sm text-gray-500">{product.contentType || 'N/A'}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${
                     product.status === 'active'
                       ? 'bg-green-100 text-green-700'
                       : 'bg-red-100 text-red-700'
                   }`}>
                     {product.status || 'inactive'}
                   </span>
                   <Link href={`/products/edit/${product._id}`}>
                     <Button variant="outline" size="sm" className="border-gray-300">
                       <Edit className="h-4 w-4 mr-1" /> Edit
                     </Button>
                   </Link>
                 </div>
               </div>

               {/* Content */}
               <div className="mt-5 space-y-4">
                 {/* Title */}
                 <div>
                   <h4 className="text-sm font-semibold text-gray-600">
                     Title ({selectedLanguage.toUpperCase()})
                   </h4>
                   <p
                     className="mt-1 text-gray-900 text-base leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html:
                        product.title?.[selectedLanguage] ||
                        `<span class='italic text-gray-500'>No title available</span>`,
                    }}
                   />
                 </div>

                 {/* Description */}
                 <div>
                   <h4 className="text-sm font-semibold text-gray-600">
                     Description ({selectedLanguage.toUpperCase()})
                   </h4>
                   <div
                     className="mt-2 text-gray-800 text-sm leading-relaxed whitespace-pre-line"
                    dangerouslySetInnerHTML={{
                      __html:
                        product.description?.[selectedLanguage] ||
                        `<span class='italic text-gray-500'>No description available</span>`,
                    }}
                   />
                 </div>

                  {/* Enhanced Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600 mb-1">{product.freePages || 0}</div>
                      <div className="text-xs text-blue-600 font-semibold">Free Pages</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600 mb-1">{product.views || 0}</div>
                      <div className="text-xs text-green-600 font-semibold">Views</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <div className="text-2xl font-bold text-purple-600 mb-1">{product.shares || 0}</div>
                      <div className="text-xs text-purple-600 font-semibold">Shares</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200">
                      <div className="text-lg font-bold text-orange-600 mb-1">
                        {product.createdAt
                          ? new Date(product.createdAt).toLocaleDateString()
                          : '-'}
                      </div>
                      <div className="text-xs text-orange-600 font-semibold">Created Date</div>
                    </div>
                  </div>
               </div>
             </div>
           ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the product "{deletingProduct?.title?.[selectedLanguage] ? stripHtmlTags(deletingProduct.title?.[selectedLanguage]) : 'Untitled'}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Product Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the status of "{statusChangeProduct?.title?.en || 'Untitled'}" to <strong>{newStatus}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange} className="bg-theme-primary hover:bg-theme-primary-dark">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}