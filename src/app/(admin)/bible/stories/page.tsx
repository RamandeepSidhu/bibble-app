'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  FileText,
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
import { Story, ProductManagement } from '@/lib/types/bibble';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';
import Link from 'next/link';

export default function StoriesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [stories, setStories] = useState<Story[]>([]);
  const [products, setProducts] = useState<ProductManagement[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingStory, setDeletingStory] = useState<Story | null>(null);

  // Fetch languages
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

  // Fetch stories and products
  useEffect(() => {
    fetchStories();
    fetchProducts();
  }, []);

  const fetchStories = async () => {
    try {
      setIsLoading(true);
      // Fetch all products first, then get stories for each
      const response: any = await ClientInstance.APP.getProducts({ type: 'book' });
      if (response?.success && response?.data) {
        setProducts(response.data);
        // Fetch stories for each product
        const allStories: Story[] = [];
        for (const product of response.data) {
          try {
            const storiesResponse: any = await ClientInstance.APP.getStoriesByProduct(product._id);
            if (storiesResponse?.success && storiesResponse?.data) {
              allStories.push(...storiesResponse.data);
            }
          } catch (error) {
            console.error(`Error fetching stories for product ${product._id}:`, error);
          }
        }
        setStories(allStories);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
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

  // Filter stories based on search
  const filteredStories = stories.filter(story => {
    const matchesSearch = 
      Object.values(story.title).some(title => 
        title.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      Object.values(story.description).some(description => 
        description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesSearch;
  });

  const handleDeleteClick = (story: Story) => {
    setDeletingStory(story);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteStory = async () => {
    if (!deletingStory) return;
    
    try {
      const response: any = await ClientInstance.APP.deleteStory(deletingStory._id || '');
      if (response?.success) {
        setStories(stories.filter(s => s._id !== deletingStory._id));
        setIsDeleteDialogOpen(false);
        setDeletingStory(null);
        showToast.success("Story Deleted", "Story has been deleted successfully!");
      } else {
        showToast.error("Error", response?.message || "Failed to delete story");
      }
    } catch (error) {
      console.error("Error deleting story:", error);
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
              Stories Management
            </h2>
          </div>
          <p className="font-inter font-normal text-sm sm:text-[16px] leading-[24px] tracking-[0em] text-gray-600 mt-1 ml-8">
            Manage stories across all products
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 md:gap-4 mt-5">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            placeholder="Search stories..."
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full sm:w-80 h-[40px] pl-10 pr-4 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
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
      </div>

      {/* Stories Cards */}
      {filteredStories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No stories found</div>
          <p className="text-gray-400 mt-2">
            {searchTerm 
              ? 'Try adjusting your search criteria'
              : 'Get started by adding your first story'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <div key={story._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col min-h-[400px]">
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-theme-secondary text-theme-primary flex items-center justify-center font-semibold">
                    <FileText className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                    <div className="font-semibold text-lg text-gray-900">
                          Story #{story.order}
                        </div>
                    <div className="text-sm text-gray-500">
                      {story.productId.title.en}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Information with All Languages */}
              <div className="p-6 flex-grow">
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 border-b-2 border-theme-primary pb-2">
                    Product Information ({selectedLanguage.toUpperCase()})
                  </h4>
                  
                  <div className="space-y-1">
                    {/* Product Title - Selected Language */}
                    {story.productId && typeof story.productId === 'object' && (story.productId as any).title && (
                        <div className="space-y-1">
                        {(story.productId as any).title[selectedLanguage] ? (
                          <div className="text-sm p-3">
                            <span className="text-gray-900 font-medium" dangerouslySetInnerHTML={{ __html: (story.productId as any).title[selectedLanguage] }} />
                          </div>
                        ) : (
                          <div className="text-sm p-3 text-gray-500 italic">
                            No product information available in {selectedLanguage.toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Description - Selected Language */}
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 border-b-2 border-theme-primary pb-2">
                    Product Description ({selectedLanguage.toUpperCase()})
                  </h4>
                  <div className="space-y-2">
                    {story.productId && typeof story.productId === 'object' && (story.productId as any).description && (story.productId as any).description[selectedLanguage] ? (
                      <div className="text-sm p-3">
                        <div className="text-gray-900 font-medium line-clamp-3" dangerouslySetInnerHTML={{ __html: (story.productId as any).description[selectedLanguage] }} />
                      </div>
                    ) : (
                      <div className="text-sm p-3 text-gray-500 italic">
                        No product description available in {selectedLanguage.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Story Title - Selected Language */}
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 border-b-2 border-theme-primary pb-2">
                    Story Title ({selectedLanguage.toUpperCase()})
                  </h4>
                  <div className="space-y-2">
                    {story.title[selectedLanguage] ? (
                      <div className="text-sm p-3">
                        <div className="text-gray-900 font-medium line-clamp-2" dangerouslySetInnerHTML={{ __html: story.title[selectedLanguage] }} />
                      </div>
                    ) : (
                      <div className="text-sm p-3 text-gray-500 italic">
                        No title available in {selectedLanguage.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Story Description - Selected Language */}
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 border-b-2 border-theme-primary pb-2">
                    Story Description ({selectedLanguage.toUpperCase()})
                  </h4>
                  <div className="space-y-2">
                    {story.description[selectedLanguage] ? (
                      <div className="text-sm p-3">
                        <div className="text-gray-900 font-medium line-clamp-3" dangerouslySetInnerHTML={{ __html: story.description[selectedLanguage] }} />
                      </div>
                    ) : (
                      <div className="text-sm p-3 text-gray-500 italic">
                        No description available in {selectedLanguage.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Story Details */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Order: {story.order}</div>
                  <div>Created: {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : 'N/A'}</div>
                  <div>Updated: {story.updatedAt ? new Date(story.updatedAt).toLocaleDateString() : 'N/A'}</div>
                </div>
                    </div>

              {/* Card Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                    <div className="flex justify-end gap-2">
                  <Link href={`/bible/stories/edit/${story._id}`}>
                        <Button variant="outline" size="sm" className="!min-w-[80px]">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
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
            <DialogTitle>Delete Story</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this story? This action cannot be undone.
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
              onClick={handleDeleteStory}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
