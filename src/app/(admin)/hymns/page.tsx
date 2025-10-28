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
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [hymns, setHymns] = useState<HymnManagement[]>([]);
  const [products, setProducts] = useState<ProductManagement[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingHymn, setDeletingHymn] = useState<HymnManagement | null>(null);

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
        
        // Fetch products to get song products
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

  // Filter hymns based on search and language
  const filteredHymns = hymns.filter(hymn => {
    const matchesSearch = 
      (hymn.text.en || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (hymn.text.sw || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (hymn.text.fr || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (hymn.text.rn || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by language - only show hymns that have content in the selected language
    const hasContentInLanguage = hymn.text[selectedLanguage] && 
      hymn.text[selectedLanguage].trim() !== '';
    
    return matchesSearch && hasContentInLanguage;
  });

  // Group hymns by product
  const groupedHymns = filteredHymns.reduce((acc: any, hymn: any) => {
    const productId = hymn.productId?._id || hymn.productId;
    const productTitle = hymn.productId?.title?.[selectedLanguage] || hymn.productId?.title?.en || 'Unknown Product';
    
    if (!acc[productTitle]) {
      acc[productTitle] = {
        productTitle,
        productData: hymn.productId,
        hymns: []
      };
    }
    acc[productTitle].hymns.push(hymn);
    return acc;
  }, {});

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
      const title = productId.title.en || 'Unknown Product';
      return stripHtmlTags(title);
    }
    // If productId is a string, look it up in products array
    const product = products.find(p => p._id === productId);
    if (product?.title?.en) {
      return stripHtmlTags(product.title.en);
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
    <div className={`container mx-auto px-4 py-8 ${Object.keys(groupedHymns).length === 0 && !isLoading ? 'bg-transparent' : ''}`}>
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

      {/* Search and Filter - Only show if there are hymns or if user has applied filters */}
      {(Object.keys(groupedHymns).length > 0 || searchTerm || selectedLanguage !== 'en') && (
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
        {/* Only show language filter if there are hymns or if user has applied filters */}
        {(Object.keys(groupedHymns).length > 0 || searchTerm || selectedLanguage !== 'en') && (
          <div className="w-full sm:w-auto">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
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
        )}
        </div>
      )}

      {/* Hymns Cards */}
      {Object.keys(groupedHymns).length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 text-lg mb-2">No hymns found</div>
            <p className="text-gray-400">
              {searchTerm || selectedLanguage !== 'en'
                ? 'Try adjusting your search criteria'
                : 'Get started by adding your first hymn'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(groupedHymns).map((group: any, index: number) => (
            <div key={`${group?.productTitle}-${index}`} className="bg-white rounded-lg shadow-sm">
              {/* Product Header - Clean Theme Card */}
              <div className="bg-theme-secondary text-theme-primary p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Music className="h-5 w-5 text-theme-primary" />
                    </div>
                    <div>
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
                  <div className="text-right">
                    <div className="text-2xl font-bold text-theme-primary">
                    {group.hymns.length}
                    </div>
                    <div className="text-theme-primary text-sm">Hymns</div>
                  </div>
                </div>
              </div>

              {/* Hymns Grid - Clean White Cards */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.hymns.map((hymn: any) => (
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
                        {hymn.text[selectedLanguage] ? (
                          <div 
                            className="[&_ol]:list-decimal [&_ol]:list-inside [&_ol]:pl-0 [&_li]:mb-1 [&_strong]:font-bold"
                            dangerouslySetInnerHTML={{ __html: hymn.text[selectedLanguage] }} 
                          />
                        ) : (
                          <span className="italic">No text</span>
                        )}
                      </div>
                    </div>
                  ))}
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
