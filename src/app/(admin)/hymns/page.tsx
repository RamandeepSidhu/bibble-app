'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Music,
  Check,
  X
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Link from 'next/link';
import { HymnManagement, ProductManagement } from '@/lib/types/bibble';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';

export default function HymnsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [hymns, setHymns] = useState<HymnManagement[]>([]);
  const [products, setProducts] = useState<ProductManagement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingHymn, setDeletingHymn] = useState<HymnManagement | null>(null);

  // Fetch hymns and products from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch products first to get song products
        const productsResponse: any = await ClientInstance.APP.getProducts();
        if (productsResponse?.success && productsResponse?.data) {
          const allProducts = productsResponse.data;
          // Filter only song products
          const songProducts = allProducts.filter((product: ProductManagement) => product.type === 'song');
          setProducts(songProducts);
          
          // Fetch hymns for each song product
          const allHymns: HymnManagement[] = [];
          for (const product of songProducts) {
            try {
              const hymnsResponse: any = await ClientInstance.APP.getHymnsByProduct(product._id);
              if (hymnsResponse?.success && hymnsResponse?.data) {
                allHymns.push(...hymnsResponse.data);
              }
            } catch (error) {
              console.error(`Error fetching hymns for product ${product._id}:`, error);
            }
          }
          setHymns(allHymns);
        } else {
          showToast.error("Error", productsResponse?.message || "Failed to fetch products");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        showToast.error("Error", "Network error. Please check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter hymns based on search and product
  const filteredHymns = hymns.filter(hymn => {
    const matchesSearch = 
      (hymn.text.en || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (hymn.text.sw || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (hymn.text.fr || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (hymn.text.rn || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProduct = selectedProduct === 'all' || hymn.productId === selectedProduct;
    
    return matchesSearch && matchesProduct;
  });

  const handleDeleteClick = (hymn: HymnManagement) => {
    setDeletingHymn(hymn);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteHymn = async () => {
    if (!deletingHymn) return;
    try {
      const response: any = await ClientInstance.APP.deleteHymn(deletingHymn._id);
      if (response?.success) {
        setHymns(hymns.filter(h => h._id !== deletingHymn._id));
        setIsDeleteDialogOpen(false);
        setDeletingHymn(null);
        showToast.success("Hymn Deleted", "Hymn has been deleted successfully!");
      } else {
        showToast.error("Error", response?.message || "Failed to delete hymn");
      }
    } catch (error) {
      showToast.error("Error", "Network error. Please check your connection and try again.");
    }
  };

  const getProductName = (productId: any) => {
    // If productId is an object (from API response), use it directly
    if (typeof productId === 'object' && productId.title) {
      return productId.title.en || 'Unknown Product';
    }
    // If productId is a string, look it up in products array
    const product = products.find(p => p._id === productId);
    return product?.title.en || 'Unknown Product';
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

                {/* Hymn Text Shimmer */}
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

                {/* Created Date Shimmer */}
                <div className="h-3 bg-gray-200 rounded animate-pulse w-32 mb-4"></div>
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6 border-b border-gray-200 pb-4 lg:pb-6">
        <div className="w-full">
          <h2 className="font-inter font-semibold text-2xl sm:text-[30px] leading-[38px] tracking-[0em] text-gray-800">
            Hymns Management
          </h2>
          <p className="font-inter font-normal text-sm sm:text-[16px] leading-[24px] tracking-[0em] text-gray-600 mt-1">
            Manage hymns for song products
          </p>
        </div>
        <Link href="/hymns/add">
          <Button className="bg-theme-primary text-theme-secondary hover:bg-theme-primary-dark">
            <Plus className="h-4 w-4 mr-2" />
            Add Hymn
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
            placeholder="Search hymns..."
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full sm:w-80 h-[40px] pl-10 pr-4 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
        <div className="w-full sm:w-auto">
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {products.map((product) => (
                <SelectItem key={product._id} value={product._id}>
                  {product.title.en || 'Untitled'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Hymns Table */}
      {filteredHymns.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No hymns found</div>
          <p className="text-gray-400 mt-2">
            {searchTerm || selectedProduct !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first hymn'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHymns.map((hymn) => (
            <div key={hymn._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col min-h-[400px]">
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-theme-secondary text-theme-primary flex items-center justify-center font-semibold">
                    <Music className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-gray-900">
                      Hymn #{hymn.number}
                    </div>
                    <div className="text-sm text-gray-500">
                      {getProductName(hymn.productId)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Information with All Languages */}
              <div className="p-6 flex-grow">
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 border-b-2 border-theme-primary pb-2">Product Information</h4>
                  

                  <div className="space-y-1">
                    {/* Product Title - All Languages */}
                    {hymn.productId && typeof hymn.productId === 'object' && (hymn.productId as any).title && (
                      <div className="space-y-1">
                        {(hymn.productId as any).title.en && (
                          <div className="text-sm p-3">
                            <span className="text-sm font-bold text-gray-900 mr-3">EN:</span>
                            <span className="text-gray-900 font-medium" dangerouslySetInnerHTML={{ __html: (hymn.productId as any).title.en }} />
                          </div>
                        )}
                        {(hymn.productId as any).title.sw && (
                          <div className="text-sm p-3">
                            <span className="text-sm font-bold text-gray-900 mr-3">SW:</span>
                            <span className="text-gray-900 font-medium" dangerouslySetInnerHTML={{ __html: (hymn.productId as any).title.sw }} />
                          </div>
                        )}
                        {(hymn.productId as any).title.fr && (
                          <div className="text-sm p-3">
                            <span className="text-sm font-bold text-gray-900 mr-3">FR:</span>
                            <span className="text-gray-900 font-medium" dangerouslySetInnerHTML={{ __html: (hymn.productId as any).title.fr }} />
                          </div>
                        )}
                        {(hymn.productId as any).title.rn && (
                          <div className="text-sm p-3">
                            <span className="text-sm font-bold text-gray-900 mr-3">RN:</span>
                            <span className="text-gray-900 font-medium" dangerouslySetInnerHTML={{ __html: (hymn.productId as any).title.rn }} />
                          </div>
                        )}
                        {(hymn.productId as any).title.hi && (
                          <div className="text-sm p-3">
                            <span className="text-sm font-bold text-gray-900 mr-3">HI:</span>
                            <span className="text-gray-900 font-medium" dangerouslySetInnerHTML={{ __html: (hymn.productId as any).title.hi }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Hymn Text - All Languages */}
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 border-b-2 border-theme-primary pb-2">Hymn Text</h4>
                  <div className="space-y-2">
                    {/* English */}
                    {hymn.text.en && (
                      <div className="text-sm p-3">
                        <span className="text-sm font-bold text-gray-900 mr-3">EN:</span>
                        <div className="text-gray-900 font-medium line-clamp-4" dangerouslySetInnerHTML={{ __html: hymn.text.en }} />
                      </div>
                    )}
                    {/* Swahili */}
                    {hymn.text.sw && (
                      <div className="text-sm p-3">
                        <span className="text-sm font-bold text-gray-900 mr-3">SW:</span>
                        <div className="text-gray-900 font-medium line-clamp-3" dangerouslySetInnerHTML={{ __html: hymn.text.sw }} />
                      </div>
                    )}
                    {/* French */}
                    {hymn.text.fr && (
                      <div className="text-sm p-3">
                        <span className="text-sm font-bold text-gray-900 mr-3">FR:</span>
                        <div className="text-gray-900 font-medium line-clamp-3" dangerouslySetInnerHTML={{ __html: hymn.text.fr }} />
                      </div>
                    )}
                    {/* Kinyarwanda */}
                    {hymn.text.rn && (
                      <div className="text-sm p-3">
                        <span className="text-sm font-bold text-gray-900 mr-3">RN:</span>
                        <div className="text-gray-900 font-medium line-clamp-3" dangerouslySetInnerHTML={{ __html: hymn.text.rn }} />
                      </div>
                    )}
                    {/* Hindi */}
                    {hymn.text.hi && (
                      <div className="text-sm p-3">
                        <span className="text-sm font-bold text-gray-900 mr-3">HI:</span>
                        <div className="text-gray-900 font-medium line-clamp-3" dangerouslySetInnerHTML={{ __html: hymn.text.hi }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Created Date */}
                <div className="text-xs text-gray-500 mb-4">
                  Created: {hymn.createdAt ? new Date(hymn.createdAt).toLocaleDateString() : '-'}
                </div>
              </div>

              {/* Card Footer - Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-lg flex-shrink-0">
                <div className="flex justify-end gap-2">
                  <Link href={`/hymns/edit/${hymn._id}`}>
                    <Button variant="outline" size="sm" className="!min-w-[80px]">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="!min-w-[80px] text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteClick(hymn)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Hymn</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Hymn #{deletingHymn?.number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteHymn}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
