'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Book,
  ArrowLeft
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Chapter, ProductManagement } from '@/lib/types/bibble';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';
import Link from 'next/link';

export default function ChaptersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [products, setProducts] = useState<ProductManagement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingChapter, setDeletingChapter] = useState<Chapter | null>(null);

  // Fetch chapters and products
  useEffect(() => {
    fetchChapters();
    fetchProducts();
  }, []);

  const fetchChapters = async () => {
    try {
      setIsLoading(true);
      // For now, we'll fetch all products and then get chapters for each
      // In a real implementation, you might have a direct chapters endpoint
      const response: any = await ClientInstance.APP.getProducts({ type: 'book' });
      if (response?.success && response?.data) {
        setProducts(response.data);
        // Fetch chapters for each product
        const allChapters: Chapter[] = [];
        for (const product of response.data) {
          try {
            const storiesResponse: any = await ClientInstance.APP.getStoriesByProduct(product._id);
            if (storiesResponse?.success && storiesResponse?.data) {
              for (const story of storiesResponse.data) {
                const chaptersResponse: any = await ClientInstance.APP.getChaptersByStory(story._id);
                if (chaptersResponse?.success && chaptersResponse?.data) {
                  allChapters.push(...chaptersResponse.data);
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching chapters for product ${product._id}:`, error);
          }
        }
        setChapters(allChapters);
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response: any = await ClientInstance.APP.getProducts({ type: 'book' });
      if (response?.success && response?.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Filter chapters based on search
  const filteredChapters = chapters.filter(chapter => {
    const matchesSearch = 
      Object.values(chapter.title).some(title => 
        title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesSearch;
  });

  const handleDeleteClick = (chapter: Chapter) => {
    setDeletingChapter(chapter);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteChapter = async () => {
    if (!deletingChapter) return;
    
    try {
      const response: any = await ClientInstance.APP.deleteChapter(deletingChapter._id || '');
      if (response?.success) {
        setChapters(chapters.filter(c => c._id !== deletingChapter._id));
        setIsDeleteDialogOpen(false);
        setDeletingChapter(null);
        showToast.success("Chapter Deleted", "Chapter has been deleted successfully!");
      } else {
        showToast.error("Error", response?.message || "Failed to delete chapter");
      }
    } catch (error) {
      console.error("Error deleting chapter:", error);
      showToast.error("Error", "Network error. Please check your connection and try again.");
    }
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6 border-b border-gray-200 pb-4 lg:pb-6">
        <div className="w-full">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/bible" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="font-inter font-semibold text-2xl sm:text-[30px] leading-[38px] tracking-[0em] text-gray-800">
              Chapters Management
            </h2>
          </div>
          <p className="font-inter font-normal text-sm sm:text-[16px] leading-[24px] tracking-[0em] text-gray-600 mt-1">
            Manage chapters across all stories and products
          </p>
        </div>
        <Link href="/bible/chapters/add">
          <Button className="bg-theme-primary text-theme-secondary hover:bg-theme-primary-dark">
            <Plus className="h-4 w-4 mr-2" />
            Add Chapter
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 md:gap-4 mt-5">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            placeholder="Search chapters..."
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full sm:w-80 h-[40px] pl-10 pr-4 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
      </div>

      {/* Chapters Table */}
      {filteredChapters.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No chapters found</div>
          <p className="text-gray-400 mt-2">
            {searchTerm 
              ? 'Try adjusting your search criteria'
              : 'Get started by adding your first chapter'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChapters.map((chapter) => (
            <div key={chapter._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col min-h-[300px]">
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-theme-secondary text-theme-primary flex items-center justify-center font-semibold">
                    <Book className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-gray-900">
                      Chapter #{chapter.order}
                    </div>
                    <div className="text-sm text-gray-500">
                      Order: {chapter.order}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chapter Information with All Languages */}
              <div className="p-6 flex-grow">
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 border-b-2 border-theme-primary pb-2">Chapter Title</h4>
                  
                  <div className="space-y-1">
                    {Object.entries(chapter.title).map(([lang, text]) => (
                      text && text.trim() && (
                        <div key={lang} className="text-sm p-3">
                          <span className="text-sm font-bold text-gray-900 mr-3">{lang.toUpperCase()}:</span>
                          <span className="text-gray-900 font-medium" dangerouslySetInnerHTML={{ __html: text }} />
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-end gap-2">
                  <Link href={`/bible?edit=chapter&id=${chapter._id}`}>
                    <Button variant="outline" size="sm" className="!min-w-[80px]">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="!min-w-[80px] text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteClick(chapter)}
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
            <DialogTitle>Delete Chapter</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chapter? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteChapter}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
