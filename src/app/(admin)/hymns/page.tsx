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

  const getProductName = (productId: string) => {
    const product = products.find(p => p._id === productId);
    return product?.title.en || 'Unknown Product';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading hymns...</p>
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
        <div className="bg-white border border-[#EAECF0] rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#EAECF0]">
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Hymn</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Number</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Product</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Text (EN)</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Text (SW)</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Created</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHymns.map((hymn, index) => (
                <TableRow 
                  key={hymn._id} 
                  className={`border-b border-[#EAECF0] hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-[#F9FAFB]' : 'bg-white'
                  }`}
                >
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-theme-secondary text-theme-primary flex items-center justify-center font-semibold">
                        <Music className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          Hymn #{hymn.number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getProductName(hymn.productId)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-theme-secondary text-theme-primary border border-theme-primary">
                      #{hymn.number}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="max-w-xs truncate">
                      {getProductName(hymn.productId)}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="max-w-xs truncate" dangerouslySetInnerHTML={{ __html: hymn.text.en || '-' }} />
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="max-w-xs truncate" dangerouslySetInnerHTML={{ __html: hymn.text.sw || '-' }} />
                  </TableCell>
                  <TableCell className="py-4 px-6 text-gray-700 text-sm">
                    {hymn.createdAt ? new Date(hymn.createdAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
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
                        className="!min-w-[80px] bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        onClick={() => handleDeleteClick(hymn)}
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
