'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Eye,
  Globe,
  FileText,
  X,
  Package
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
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
          setLanguages(languagesResponse.data);
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
          
          // Handle pagination data if available
          if (response.pagination) {
            setTotalItems(response.pagination.total || response.data.length);
            setTotalPages(response.pagination.totalPages || 1);
            setCurrentPage(response.pagination.page || 1);
          } else {
            setTotalItems(response.data.length);
            setTotalPages(1);
            setCurrentPage(1);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col min-h-[400px]">
              {/* Card Header Shimmer */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </div>
                </div>
              </div>

              {/* Content Shimmer */}
              <div className="p-6 flex-grow">
                {/* Product Information Shimmer */}
                <div className="mb-4">
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-3 w-48"></div>
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-16 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description Shimmer */}
                <div className="mb-4">
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-3 w-32"></div>
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="p-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-12 mb-2"></div>
                        <div className="space-y-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Stats Shimmer */}
                <div className="mb-4">
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-3 w-32"></div>
                  <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-8"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status and Date Shimmer */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                </div>
              </div>

              {/* Card Footer Shimmer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-lg flex-shrink-0">
                <div className="flex justify-end gap-2">
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col min-h-[400px]">
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-theme-secondary text-theme-primary flex items-center justify-center font-semibold">
                    <Package className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-gray-900">
                      {getTypeIcon(product.type)} {product.type?.charAt(0).toUpperCase() + product.type?.slice(1) || 'Product'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {product.contentType}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Information with All Languages */}
              <div className="p-6 flex-grow">
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 border-b-2 border-theme-primary pb-2">
                    Product Title ({selectedLanguage.toUpperCase()})
                  </h4>
                  
                  <div className="space-y-1">
                    {/* Product Title - Selected Language */}
                    <div className="space-y-1">
                      {product.title[selectedLanguage] ? (
                        <div className="text-sm p-3">
                          <span className="text-sm font-bold text-gray-900 mr-3">{selectedLanguage.toUpperCase()}:</span>
                          <span className="text-gray-900 font-medium" dangerouslySetInnerHTML={{ __html: product.title[selectedLanguage] }} />
                        </div>
                      ) : (
                        <div className="text-sm p-3 text-gray-500 italic">
                          No title available in {selectedLanguage.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Description - Selected Language */}
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 border-b-2 border-theme-primary pb-2">
                    Description ({selectedLanguage.toUpperCase()})
                  </h4>
                  <div className="space-y-2">
                    {product.description[selectedLanguage] ? (
                      <div className="text-sm p-3">
                        <span className="text-sm font-bold text-gray-900 mr-3">{selectedLanguage.toUpperCase()}:</span>
                        <div className="text-gray-900 font-medium line-clamp-4" dangerouslySetInnerHTML={{ __html: product.description[selectedLanguage] }} />
                      </div>
                    ) : (
                      <div className="text-sm p-3 text-gray-500 italic">
                        No description available in {selectedLanguage.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Stats */}
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 border-b-2 border-theme-primary pb-2">Product Stats</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">Free Pages:</span>
                        <span className="text-gray-900 font-medium">{product.freePages || 0}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">Views:</span>
                        <span className="text-gray-900 font-medium">{product.views || 0}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">Shares:</span>
                        <span className="text-gray-900 font-medium">{product.shares || 0}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">Content Type:</span>
                        <span className="text-gray-900 font-medium capitalize">{product.contentType || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status and Created Date */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <ToggleSwitch
                      checked={product.status === 'active'}
                      onChange={() => handleStatusToggle(product)}
                      size="md"
                    />
                    <span className={`text-sm font-medium ${
                      product.status === 'active' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {product.status || 'inactive'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '-'}
                  </div>
                </div>
              </div>

              {/* Card Footer - Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-lg flex-shrink-0">
                    <div className="flex justify-end gap-2">
                  <Link href={`/products/edit/${product._id}`}>
                        <Button variant="outline" size="sm" className="!min-w-[80px]">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      {/* <Button 
                        variant="outline" 
                        size="sm" 
                    className="!min-w-[80px] text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteClick(product)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button> */}
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
              Are you sure you want to delete the product "{deletingProduct?.title[selectedLanguage] ? stripHtmlTags(deletingProduct.title[selectedLanguage]) : 'Untitled'}"? This action cannot be undone.
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
              Are you sure you want to change the status of "{statusChangeProduct?.title.en || 'Untitled'}" to <strong>{newStatus}</strong>?
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