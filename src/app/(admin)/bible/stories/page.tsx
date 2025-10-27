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
          setLanguages(languagesResponse.data.filter((lang: any) => lang.isActive === true));
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

  // Group stories by product
  const groupedStories = filteredStories.reduce((acc: any, story: any) => {
    const productId = story.productId?._id || story.productId;
    const productTitle = story.productId?.title?.[selectedLanguage] || story.productId?.title?.en || 'Unknown Product';
    
    if (!acc[productTitle]) {
      acc[productTitle] = {
        productTitle,
        productData: story.productId,
        stories: []
      };
    }
    acc[productTitle].stories.push(story);
    return acc;
  }, {});

  // Helper function to strip HTML tags
  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

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
    <div className={`container mx-auto px-4 py-8 ${Object.keys(groupedStories).length === 0 && !isLoading ? 'bg-transparent' : ''}`}>
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

      {/* Search and Filter - Only show if there are stories or if user has applied filters */}
      {(Object.keys(groupedStories).length > 0 || searchTerm || selectedLanguage !== 'en') && (
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
        {/* Only show language filter if there are stories or if user has applied filters */}
        {(Object.keys(groupedStories).length > 0 || searchTerm || selectedLanguage !== 'en') && (
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

      {/* Stories Cards */}
      {Object.keys(groupedStories).length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 text-lg mb-2">No stories found</div>
            <p className="text-gray-400">
              {searchTerm || selectedLanguage !== 'en'
                ? 'Try adjusting your search criteria'
                : 'Get started by adding your first story'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(groupedStories).map((group: any, index: number) => (
            <div key={`${group?.productTitle}-${index}`} className="bg-white rounded-lg shadow-sm">
              {/* Product Header - Clean Theme Card */}
              <div className="bg-theme-secondary text-theme-primary p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-theme-primary" />
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
                    <div className="text-2xl font-bold">{group.stories.length}</div>
                    <div className="text-theme-primary text-sm">Stories</div>
                  </div>
                </div>
              </div>

              {/* Stories Grid - Clean White Cards */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.stories.map((story: any) => (
                    <div key={story._id} className="bg-white rounded-lg p-3 border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        {/* Story Number - Theme Circle */}
                        <div className="h-8 w-8 bg-theme-secondary rounded-full flex items-center justify-center text-theme-primary font-bold text-sm flex-shrink-0">
                          {story.order}
                        </div>
                        
                        {/* Story Content */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm">
                            Story {story.order}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {story.title[selectedLanguage] ? (
                              <span>{stripHtmlTags(story.title[selectedLanguage])}</span>
                            ) : (
                              <span className="italic">No title</span>
                            )}
                          </div>
                        </div>

                        {/* Edit Button - Square with Pencil */}
                        <div className="flex-shrink-0">
                          <Link href={`/bible/stories/edit/${story._id}`}>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-300 text-gray-500 hover:bg-gray-100">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
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
