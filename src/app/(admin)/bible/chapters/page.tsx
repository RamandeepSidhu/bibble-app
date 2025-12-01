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
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [products, setProducts] = useState<ProductManagement[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingChapter, setDeletingChapter] = useState<Chapter | null>(null);

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
      Object.values(chapter.title || {}).some(title => {
        const titleText = Array.isArray(title) 
          ? title.map((item: any) => item?.data || item || '').join(' ')
          : String(title || '');
        return titleText.toLowerCase().includes(searchTerm.toLowerCase());
      });
    return matchesSearch;
  });

  // Helper function to strip HTML tags
  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  // Group chapters by story
  const groupedChapters = filteredChapters.reduce((groups, chapter) => {
    const storyId = chapter.storyId && typeof chapter.storyId === 'object' ? chapter.storyId._id : 'unknown';
    const storyTitle = chapter.storyId && typeof chapter.storyId === 'object' && chapter.storyId.title ? 
      (chapter.storyId.title[selectedLanguage] || chapter.storyId.title?.en || 'Unknown Story') : 'Unknown Story';
    
    if (!groups[storyId]) {
      groups[storyId] = {
        storyTitle,
        storyData: chapter.storyId,
        chapters: []
      };
    }
    groups[storyId].chapters.push(chapter);
    return groups;
  }, {} as any);

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
    <div className={`container mx-auto px-4 py-8 ${Object.keys(groupedChapters).length === 0 && !isLoading ? 'bg-transparent' : ''}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/bible" className="text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Chapters Management
          </h1>
        </div>
        <p className="text-gray-600 text-lg ml-8">
          Manage and organize Bible chapters across all stories and products
        </p>
      </div>

      {/* Search and Filter - Only show if there are chapters or if user has applied filters */}
      {(Object.keys(groupedChapters).length > 0 || searchTerm || selectedLanguage !== 'en') && (
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="relative flex-1">
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
        {/* Only show language filter if there are chapters or if user has applied filters */}
        {(Object.keys(groupedChapters).length > 0 || searchTerm || selectedLanguage !== 'en') && (
          <div className="lg:w-64">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-full h-[40px] border-gray-200 bg-white">
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

      {/* Chapters by Story */}
      {Object.keys(groupedChapters).length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 text-lg mb-2">No chapters found</div>
            <p className="text-gray-400">
              {searchTerm || selectedLanguage !== 'en'
                ? 'Try adjusting your search criteria or language filter'
                : 'Get started by adding your first chapter to organize your Bible content'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(groupedChapters).map((group: any, index: number) => (
            <div key={`${group?.storyTitle}-${index}`} className="bg-white rounded-lg shadow-sm">
              {/* Story Header - Clean Red Card */}
              <div className="bg-theme-secondary text-theme-primary p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Book className="h-5 w-5 ttext-theme-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">
                        {stripHtmlTags(group?.storyTitle)}
                      </h3>
                      <div className="text-gray-700 text-sm">
                        {group.storyData && group.storyData.description && group.storyData.description[selectedLanguage] ? (
                          <span dangerouslySetInnerHTML={{ __html: group.storyData.description[selectedLanguage] }} />
                        ) : (
                          'Story description'
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{group.chapters.length}</div>
                    <div className="text-theme-primary text-sm">Chapters</div>
                  </div>
                </div>
              </div>

              {/* Chapters Grid - Clean White Cards */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.chapters.map((chapter: any) => (
                    <div key={chapter._id} className="bg-white rounded-lg p-3 border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        {/* Chapter Number - Red Circle */}
                        <div className="h-8 w-8 bg-theme-secondary rounded-full flex items-center justify-center text-theme-primary font-bold text-sm flex-shrink-0">
                          {chapter.order}
                        </div>
                        
                        {/* Chapter Content */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm">
                            Chapter {chapter.order}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {chapter.title?.[selectedLanguage] ? (
                              <span>{stripHtmlTags(chapter.title[selectedLanguage])}</span>
                            ) : (
                              <span className="italic">No title</span>
                            )}
                          </div>
                        </div>

                        {/* Edit Button - Square with Pencil */}
                        <div className="flex-shrink-0">
                          <Link href={`/bible/chapters/edit/${chapter._id}`}>
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
