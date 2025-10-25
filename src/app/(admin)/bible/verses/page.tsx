'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Hash,
  ArrowLeft
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Verse } from '@/lib/types/bibble';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';
import Link from 'next/link';

export default function VersesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [languageNames, setLanguageNames] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingVerse, setDeletingVerse] = useState<Verse | null>(null);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, message: '' });

  // Fetch verses and languages
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch languages first
      const languagesResponse: any = await ClientInstance.APP.getLanguage();
      if (languagesResponse?.success && languagesResponse?.data) {
        // Filter out Hindi language from available languages
        const filteredLangs = languagesResponse.data.filter((lang: any) => lang.code !== 'hi');
        // Create language names mapping (excluding Hindi)
        const names: {[key: string]: string} = {};
        filteredLangs.forEach((lang: any) => {
          names[lang.code] = lang.name;
        });
        setLanguageNames(names);
      }
      
      // Fetch all verses by getting all chapters first, then their verses
      await fetchAllVerses();
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast.error('Failed to load data', 'Error loading languages');
    } finally {
      setIsLoading(false);
    }
  };

  const getLanguageName = (code: string) => {
    return languageNames[code] || code.toUpperCase();
  };

  const fetchAllVerses = async () => {
    try {
      console.log("🔄 Starting to fetch verses...");
      setLoadingProgress({ current: 0, total: 0, message: 'Fetching products...' });
      
      // First, get all products
      const productsResponse: any = await ClientInstance.APP.getProducts({ type: 'book' });
      if (!productsResponse?.success || !productsResponse?.data) {
        console.log("❌ No products found");
        setVerses([]);
        return;
      }

      console.log(`📚 Found ${productsResponse.data.length} products`);
      setLoadingProgress({ 
        current: 0, 
        total: productsResponse.data.length, 
        message: `Processing ${productsResponse.data.length} products...` 
      });
      
      const allVerses: Verse[] = [];
      const productPromises = [];

      // Create promises for all products in parallel
      for (let i = 0; i < productsResponse.data.length; i++) {
        const product = productsResponse.data[i];
        const productPromise = fetchVersesForProduct(product._id, i + 1, productsResponse.data.length);
        productPromises.push(productPromise);
      }

      // Wait for all products to complete
      const productResults = await Promise.allSettled(productPromises);
      
      // Collect all verses from all products
      productResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          allVerses.push(...result.value);
          console.log(`✅ Product ${index + 1}: Found ${result.value.length} verses`);
        } else {
          console.error(`❌ Product ${index + 1}: Failed to fetch verses`, (result as PromiseRejectedResult).reason);
        }
      });

      console.log(`🎉 Total verses found: ${allVerses.length}`);
      setVerses(allVerses);
    } catch (error) {
      console.error("❌ Error fetching verses:", error);
      showToast.error('Failed to load verses', 'Error loading verses data');
    }
  };

  const fetchVersesForProduct = async (productId: string, currentIndex: number, totalProducts: number): Promise<Verse[]> => {
    try {
      const allVerses: Verse[] = [];
      
      // Update progress
      setLoadingProgress({ 
        current: currentIndex, 
        total: totalProducts, 
        message: `Processing product ${currentIndex} of ${totalProducts}...` 
      });
      
      // Get stories for this product
      const storiesResponse: any = await ClientInstance.APP.getStoriesByProduct(productId);
      if (!storiesResponse?.success || !storiesResponse?.data) {
        return allVerses;
      }

      // Create promises for all stories in parallel
      const storyPromises = storiesResponse.data.map(async (story: any) => {
        try {
          const chaptersResponse: any = await ClientInstance.APP.getChaptersByStory(story._id);
          if (!chaptersResponse?.success || !chaptersResponse?.data) {
            return [];
          }

          // Create promises for all chapters in parallel
          const chapterPromises = chaptersResponse.data.map(async (chapter: any) => {
            try {
              const versesResponse: any = await ClientInstance.APP.getVersesByChapter(chapter._id);
              if (versesResponse?.success && versesResponse?.data) {
                return versesResponse.data;
              }
              return [];
            } catch (error) {
              console.error(`Error fetching verses for chapter ${chapter._id}:`, error);
              return [];
            }
          });

          // Wait for all chapters to complete
          const chapterResults = await Promise.allSettled(chapterPromises);
          const verses = chapterResults
            .filter(result => result.status === 'fulfilled')
            .flatMap(result => (result as PromiseFulfilledResult<Verse[]>).value);
          
          return verses;
        } catch (error) {
          console.error(`Error fetching chapters for story ${story._id}:`, error);
          return [];
        }
      });

      // Wait for all stories to complete
      const storyResults = await Promise.allSettled(storyPromises);
      const verses = storyResults
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => (result as PromiseFulfilledResult<Verse[]>).value);
      
      return verses;
    } catch (error) {
      console.error(`Error fetching verses for product ${productId}:`, error);
      return [];
    }
  };

  // Filter verses based on search
  const filteredVerses = verses.filter(verse => {
    const matchesSearch = 
      verse.number.toString().includes(searchTerm) ||
      Object.values(verse.text).some(text => 
        text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesSearch;
  });

  const handleDeleteClick = (verse: Verse) => {
    setDeletingVerse(verse);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteVerse = async () => {
    if (!deletingVerse) return;
    
    try {
      const response: any = await ClientInstance.APP.deleteVerse(deletingVerse._id || '');
      if (response?.success) {
        setVerses(verses.filter(v => v._id !== deletingVerse._id));
        setIsDeleteDialogOpen(false);
        setDeletingVerse(null);
        showToast.success("Verse Deleted", "Verse has been deleted successfully!");
      } else {
        showToast.error("Error", response?.message || "Failed to delete verse");
      }
    } catch (error) {
      console.error("Error deleting verse:", error);
      showToast.error("Error", "Network error. Please check your connection and try again.");
    }
  };


  if (isLoading) {
    const progressPercentage = loadingProgress.total > 0 ? (loadingProgress.current / loadingProgress.total) * 100 : 0;
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-lg font-medium text-gray-700">Loading verses...</span>
          </div>
          <div className="text-center space-y-2">
            <p className="text-gray-600">{loadingProgress.message || 'Fetching all verses from products, stories, and chapters'}</p>
            {loadingProgress.total > 0 && (
              <p className="text-sm text-gray-500">
                Progress: {loadingProgress.current} / {loadingProgress.total} products
              </p>
            )}
          </div>
          <div className="w-full max-w-md bg-gray-200 rounded-full h-2">
            <div 
              className="bg-theme-primary h-2 rounded-full transition-all duration-300" 
              style={{width: `${progressPercentage}%`}}
            ></div>
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
              Verses Management
            </h2>
          </div>
          <p className="font-inter font-normal text-sm sm:text-[16px] leading-[24px] tracking-[0em] text-gray-600 mt-1">
            Manage verses across all chapters, stories, and products
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 md:gap-4 mt-5">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            placeholder="Search verses..."
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full sm:w-80 h-[40px] pl-10 pr-4 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
      </div>

      {/* Verses Table */}
      {filteredVerses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No verses found</div>
          <p className="text-gray-400 mt-2">
            {searchTerm 
              ? 'Try adjusting your search criteria'
              : 'Get started by adding your first verse'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVerses.map((verse) => (
            <Link key={verse._id} href={`/bible/verses/${verse._id}`} className="block">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col min-h-[400px]">
                {/* Card Header */}
                <div className="p-6 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-theme-secondary text-theme-primary flex items-center justify-center font-semibold">
                      <Hash className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                      <div className="font-semibold text-lg text-gray-900">
                            Verse #{verse.number}
                          </div>
                      <div className="text-sm text-gray-500">
                        {verse.chapterId && typeof verse.chapterId === 'object' && (verse.chapterId as any).title && (verse.chapterId as any).title.en ? (
                          <span dangerouslySetInnerHTML={{ __html: (verse.chapterId as any).title.en }} />
                        ) : (
                          'Unknown Chapter'
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chapter Information - All Languages */}
                <div className="p-6 flex-grow">
                  <div className="mb-4">
                    <h4 className="text-lg font-bold text-gray-900 mb-3 border-b-2 border-theme-primary pb-2">Chapter Information</h4>
                    <div className="space-y-2">
                      {/* Dynamic Language Display */}
                      {verse.chapterId && typeof verse.chapterId === 'object' && (verse.chapterId as any).title &&
                        Object.entries((verse.chapterId as any).title).map(([lang, text]) => (
                          text && typeof text === 'string' && text.trim() && (
                            <div key={lang} className="text-sm p-3">
                              <span className="text-sm font-bold text-gray-900 mr-3">{getLanguageName(lang)}:</span>
                              <div className="text-gray-900 font-medium line-clamp-2" dangerouslySetInnerHTML={{ __html: text }} />
                            </div>
                          )
                        ))
                      }
                    </div>
                  </div>

                  {/* Verse Text - All Languages */}
                  <div className="mb-4">
                    <h4 className="text-lg font-bold text-gray-900 mb-3 border-b-2 border-theme-primary pb-2">Verse Text</h4>
                    <div className="space-y-2">
                      {/* Dynamic Language Display */}
                      {Object.entries(verse.text).map(([lang, text]) => (
                        text && typeof text === 'string' && text.trim() && (
                          <div key={lang} className="text-sm p-3">
                            <span className="text-sm font-bold text-gray-900 mr-3">{getLanguageName(lang)}:</span>
                            <div className="text-gray-900 font-medium line-clamp-3" dangerouslySetInnerHTML={{ __html: text }} />
                          </div>
                        )
                      ))}
                    </div>
                  </div>

                  {/* Verse Details */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Number: {verse.number}</div>
                    <div>Created: {verse.createdAt ? new Date(verse.createdAt).toLocaleDateString() : 'N/A'}</div>
                    <div>Updated: {verse.updatedAt ? new Date(verse.updatedAt).toLocaleDateString() : 'N/A'}</div>
                      </div>
                      </div>

                {/* Card Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50">
                      <div className="flex justify-between items-center gap-2">
                    <Link href={`/bible/verses/edit/${verse._id}`}>
                          <Button variant="outline" size="sm" className="!min-w-[80px]">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                  </div>
                </div>
              </div>
            </Link>
              ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Verse</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete verse #{deletingVerse?.number}? This action cannot be undone.
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
              onClick={handleDeleteVerse}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
