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
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Eye,
  Globe,
  FileText,
  Check,
  X
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Link from 'next/link';
import { ProductManagement, ChangeProductStatusPayload } from '@/lib/types/bibble';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [products, setProducts] = useState<ProductManagement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<ProductManagement | null>(null);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response: any = await ClientInstance.APP.getProducts();
        if (response?.success && response?.data) {
          setProducts(response.data);
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
  }, []);

  // Filter products based on search, type, and status
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      (product.title.en || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.title.sw || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.title.fr || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.title.rn || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description.en || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || product.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

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

  const handleStatusChange = async (product: ProductManagement, newStatus: 'active' | 'inactive' | 'draft') => {
    try {
      const payload: ChangeProductStatusPayload = { status: newStatus };
      const response: any = await ClientInstance.APP.changeProductStatus(product._id, payload);
      if (response?.success) {
        setProducts(products.map(p => 
          p._id === product._id ? { ...p, status: newStatus } : p
        ));
        showToast.success("Status Updated", `Product status changed to ${newStatus}`);
      } else {
        showToast.error("Error", response?.message || "Failed to update product status");
      }
    } catch (error) {
      showToast.error("Error", "Network error. Please check your connection and try again.");
    }
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
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
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

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 md:gap-4 mt-5">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            placeholder="Search products..."
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full sm:w-80 h-[40px] pl-10 pr-4 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="book">Book</SelectItem>
              <SelectItem value="song">Hymns</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No products found</div>
          <p className="text-gray-400 mt-2">
            {searchTerm || selectedType !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first product'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#EAECF0] rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#EAECF0]">
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Product</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Type</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Title (EN)</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Title (SW)</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Status</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Created</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product, index) => (
                <TableRow 
                  key={product._id} 
                  className={`border-b border-[#EAECF0] hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-[#F9FAFB]' : 'bg-white'
                  }`}
                >
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-theme-secondary text-theme-primary flex items-center justify-center font-semibold">
                        {getTypeIcon(product.type)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {product.title.en || 'Untitled'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.contentType} • {product.type}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-theme-secondary text-theme-primary border border-theme-primary">
                      {getTypeIcon(product.type)} {product.type}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="max-w-xs truncate" dangerouslySetInnerHTML={{ __html: product.title.en || '-' }} />
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="max-w-xs truncate" dangerouslySetInnerHTML={{ __html: product.title.sw || '-' }} />
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className={getStatusBadge(product.status || 'inactive')}>
                        {product.status || 'inactive'}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStatusChange(product, 'active')}
                          className={`p-1 rounded ${
                            product.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'text-gray-400 hover:text-green-600'
                          }`}
                          title="Set Active"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(product, 'inactive')}
                          className={`p-1 rounded ${
                            product.status === 'inactive' 
                              ? 'bg-red-100 text-red-700' 
                              : 'text-gray-400 hover:text-red-600'
                          }`}
                          title="Set Inactive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-gray-700 text-sm">
                    {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
                    <div className="flex justify-end gap-2">
                      <Link href={`/products/edit/${product._id}`}>
                        <Button variant="outline" size="sm" className="!min-w-[80px]">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="!min-w-[80px] bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        onClick={() => handleDeleteClick(product)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the product "{deletingProduct?.title.en || 'Untitled'}"? This action cannot be undone.
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
    </div>
  );
}