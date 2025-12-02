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
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Pagination from '@/components/Pagination';
import Link from 'next/link';
import { HymnManagement, ProductManagement } from '@/lib/types/bibble';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';

export default function HymnsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [hymns, setHymns] = useState<HymnManagement[]>([]);
  const [products, setProducts] = useState<ProductManagement[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingHymn, setDeletingHymn] = useState<HymnManagement | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Accordion state - track which products are expanded
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  
  // Store hymns for each product (key: productId, value: hymns array)
  const [productHymns, setProductHymns] = useState<Record<string, HymnManagement[]>>({});
  
  // Track loading state for each product
  const [loadingProducts, setLoadingProducts] = useState<Set<string>>(new Set());

  // Fetch hymns, products, and languages from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch languages first
        const languagesResponse: any = await ClientInstance.APP.getLanguage();
        if (languagesResponse?.success && languagesResponse?.data) {
          setLanguages(languagesResponse.data.filter((lang: any) => lang.isActive === true));
        }
        
        // Fetch song products using getAllHymns endpoint with pagination
        // This API returns products (songs), not hymns directly
        const params: any = {
          type: 'song',
          status: 'active', // Only fetch active songs
          page: currentPage,
          limit: pageSize
        };
        
        if (searchTerm.trim()) {
          params.search = searchTerm;
        }
        
        const productsResponse: any = await ClientInstance.APP.getAllHymns(params);
        if (productsResponse?.success && productsResponse?.data) {
          const songProducts = productsResponse.data;
          setProducts(songProducts);
          
          // Update pagination state from API response
          if (productsResponse.pagination) {
            setTotalItems(productsResponse.pagination.total || 0);
            setTotalPages(productsResponse.pagination.totalPages || 1);
            // Only update currentPage if API returned a different page (to avoid infinite loops)
            if (productsResponse.pagination.page && productsResponse.pagination.page !== currentPage) {
              setCurrentPage(productsResponse.pagination.page);
            }
          }
          
          // Don't fetch hymns automatically - only fetch when product is expanded
          setHymns([]);
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
  }, [currentPage, pageSize, searchTerm]);

  // Toggle accordion for a product
  const toggleProduct = async (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    
    if (newExpanded.has(productId)) {
      // Collapse
      newExpanded.delete(productId);
    } else {
      // Expand - fetch hymns if not already loaded
      newExpanded.add(productId);
      
      // Only fetch if we don't have hymns for this product yet
      if (!productHymns[productId]) {
        setLoadingProducts(prev => new Set(prev).add(productId));
        
        try {
          const hymnsResponse: any = await ClientInstance.APP.getHymnsByProduct(productId);
          if (hymnsResponse?.success && hymnsResponse?.data) {
            setProductHymns(prev => ({
              ...prev,
              [productId]: hymnsResponse.data
            }));
          } else {
            setProductHymns(prev => ({
              ...prev,
              [productId]: []
            }));
          }
        } catch (error: any) {
          // Handle 401 Unauthorized errors gracefully
          if (error?.response?.status === 401) {
            console.warn(`Unauthorized access for product ${productId}. Token may have expired.`);
          } else if (error?.response?.status !== 404) {
            // 404 is expected if product has no hymns
            console.error(`Error fetching hymns for product ${productId}:`, error);
          }
          setProductHymns(prev => ({
            ...prev,
            [productId]: []
          }));
        } finally {
          setLoadingProducts(prev => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
          });
        }
      }
    }
    
    setExpandedProducts(newExpanded);
  };

  // Helper function to extract text from hymn.text[lang] which can be a string or array of objects
  const getHymnText = (textData: any): string => {
    if (!textData) return '';
    if (typeof textData === 'string') return textData;
    if (Array.isArray(textData)) {
      return textData.map((item: any) => item?.data || item || '').join(' ');
    }
    return String(textData);
  };

  // Helper function to check if hymn has content in selected language
  const hasContentInLanguage = (hymn: HymnManagement, language: string): boolean => {
    const textData: any = hymn.text?.[language];
    if (!textData) return false;
    if (typeof textData === 'string') return textData.trim().length > 0;
    if (Array.isArray(textData) && textData.length > 0) {
      return textData.some((item: any) => {
        const text = item?.data || item || '';
        return String(text).trim().length > 0;
      });
    }
    return String(textData).trim().length > 0;
  };

  // Filter hymns for a product based on language
  const getFilteredHymnsForProduct = (productId: string): HymnManagement[] => {
    const hymns = productHymns[productId] || [];
    return hymns.filter(hymn => hasContentInLanguage(hymn, selectedLanguage));
  };

  // Group products with their hymn counts
  const groupedProducts = products.map((product: ProductManagement) => {
    const productId = product._id;
    const productTitle = product.title?.[selectedLanguage] || product.title?.en || 'Unknown Product';
    const hymns = productHymns[productId] || [];
    const filteredHymns = getFilteredHymnsForProduct(productId);
    
    return {
      productId,
      productTitle,
      productData: product,
      hymns: filteredHymns,
      totalHymns: hymns.length
    };
  }).sort((a: any, b: any) => {
    return a.productTitle.localeCompare(b.productTitle);
  });

  // Helper function to strip HTML tags
  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

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
      const title = productId.title?.en || 'Unknown Product';
      return stripHtmlTags(title);
    }
    // If productId is a string, look it up in products array
    const product = products.find(p => p._id === productId);
    if (product?.title?.en) {
      return stripHtmlTags(product.title?.en);
    }
    return 'Unknown Product';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 py-8 ${groupedProducts.length === 0 && !isLoading ? 'bg-transparent' : ''}`}>
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
      {products.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 md:gap-4 mt-5">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            placeholder="Search hymns..."
            type="search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            className="block w-full sm:w-80 h-[40px] pl-10 pr-4 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
        {/* Language filter */}
        <div className="w-full sm:w-auto">
            <Select value={selectedLanguage} onValueChange={(value) => {
              setSelectedLanguage(value);
              setCurrentPage(1); // Reset to first page when changing language
            }}>
              <SelectTrigger className="w-full sm:w-[200px]">
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
        </div>
      )}

      {/* Products Accordion */}
      {groupedProducts.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 text-lg mb-2">No products found</div>
            <p className="text-gray-400">
              Get started by adding your first product
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedProducts.map((group: any) => {
            const isExpanded = expandedProducts.has(group.productId);
            const isLoading = loadingProducts.has(group.productId);
            const hymns = group.hymns;
            
            return (
            <div key={group.productId} className="bg-white rounded-lg shadow-sm">
              {/* Product Header - Clickable Accordion */}
              <div 
                className="bg-theme-secondary text-theme-primary p-4 rounded-t-lg cursor-pointer hover:bg-opacity-90 transition-colors"
                onClick={() => toggleProduct(group.productId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-theme-primary" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-theme-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">
                        {stripHtmlTags(group?.productTitle)}
                      </h3>
                      <div className="text-gray-700 text-sm">
                        {group.productData && group.productData.description && group.productData.description[selectedLanguage] ? (
                          <span dangerouslySetInnerHTML={{ __html: group.productData.description[selectedLanguage] }} />
                        ) : (
                          'Product description'
                        )}
                      </div>
                    </div>
                  </div>
                  {/* <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-theme-primary">
                      {group.totalHymns > 0 ? group.totalHymns : '-'}
                    </div>
                    <div className="text-theme-primary text-sm">Hymns</div>
                  </div> */}
                </div>
              </div>

              {/* Hymns Grid - Only show when expanded */}
              {isExpanded && (
                <div className="p-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
                      <span className="ml-3 text-gray-600">Loading hymns...</span>
                    </div>
                  ) : hymns.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {hymns.map((hymn: any) => (
                    <div key={hymn._id} className="bg-white rounded-lg p-4 border border-gray-100 hover:shadow-md transition-shadow">
                      {/* Top Row with Action Buttons */}
                      <div className="flex items-start justify-end gap-2">
                        {/* Edit Button */}
                        <Link href={`/hymns/edit/${hymn._id}`}>
                          <Button variant="outline" size="sm" className="h-6 w-6 p-0 border-gray-300 text-gray-500 hover:bg-gray-100 flex-shrink-0">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </Link>
                        
                        {/* Delete Button */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-6 w-6 p-0 bg-red-50 text-red-700 border-red-200 hover:bg-red-100 flex-shrink-0"
                          onClick={() => handleDeleteClick(hymn)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Hymn Number */}
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-theme-secondary text-theme-primary border border-theme-primary">
                          Hymn #{hymn.number}
                        </span>
                      </div>

                      {/* Hymn Content - Direct HTML Rendering */}
                      <div className="text-sm text-gray-600">
                        {(() => {
                          const textData = hymn.text?.[selectedLanguage];
                          if (!textData) {
                            return <span className="italic">No text</span>;
                          }
                          
                          // If it's a string, render as HTML
                          if (typeof textData === 'string') {
                            return (
                              <div 
                                className="[&_ol]:list-decimal [&_ol]:list-inside [&_ol]:pl-0 [&_li]:mb-1 [&_strong]:font-bold"
                                dangerouslySetInnerHTML={{ __html: textData }} 
                              />
                            );
                          }
                          
                          // If it's an array, convert to HTML with line breaks
                          if (Array.isArray(textData)) {
                            // Check if array is empty
                            if (textData.length === 0) {
                              return <span className="italic text-gray-400">No text available</span>;
                            }
                            
                            const htmlContent = textData
                              .map((item: any) => {
                                const text = item?.data || item || '';
                                return text ? `<p>${text}</p>` : '';
                              })
                              .filter(Boolean)
                              .join('');
                            
                            if (!htmlContent) {
                              return <span className="italic text-gray-400">No text available</span>;
                            }
                            
                            return (
                              <div 
                                className="[&_ol]:list-decimal [&_ol]:list-inside [&_ol]:pl-0 [&_li]:mb-1 [&_strong]:font-bold [&_p]:mb-2"
                                dangerouslySetInnerHTML={{ __html: htmlContent }} 
                              />
                            );
                          }
                          
                          return <span className="italic text-gray-400">No text available</span>;
                        })()}
                      </div>
                    </div>
                  ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No hymns found in {selectedLanguage.toUpperCase()} for this product</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="mt-6">
          <Pagination className='!border-none !bg-transparent'
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Hymn</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Hymn #{deletingHymn?.number} from "{getProductName(deletingHymn?.productId)}"? 
              <br />
              <span className="text-red-600 font-medium">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteHymn}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Hymn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
