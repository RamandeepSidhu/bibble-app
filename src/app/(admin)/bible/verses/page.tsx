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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [languageNames, setLanguageNames] = useState<{[key: string]: string}>({});
  const [languages, setLanguages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingVerse, setDeletingVerse] = useState<Verse | null>(null);

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
        setLanguages(filteredLangs);
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
      
      // First, get all products
      const productsResponse: any = await ClientInstance.APP.getProducts({ type: 'book' });
      if (!productsResponse?.success || !productsResponse?.data) {
        console.log("❌ No products found");
        setVerses([]);
        return;
      }

      console.log(`📚 Found ${productsResponse.data.length} products`);
      
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

  // Filter verses based on search and language
  const filteredVerses = verses.filter(verse => {
    const matchesSearch = 
      verse.number.toString().includes(searchTerm) ||
      Object.values(verse.text).some(text => 
        text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    // Filter by language - only show verses that have content in the selected language
    const hasContentInLanguage = verse.text[selectedLanguage] && 
      verse.text[selectedLanguage].trim() !== '';
    
    return matchesSearch && hasContentInLanguage;
  });

  // Group verses by chapter
  const groupedVerses = filteredVerses.reduce((acc: any, verse: any) => {
    const chapterId = verse.chapterId?._id || verse.chapterId;
    const chapterTitle = verse.chapterId?.title?.[selectedLanguage] || verse.chapterId?.title?.en || 'Unknown Chapter';
    
    if (!acc[chapterTitle]) {
      acc[chapterTitle] = {
        chapterTitle,
        chapterData: verse.chapterId,
        verses: []
      };
    }
    acc[chapterTitle].verses.push(verse);
    return acc;
  }, {});

  // Helper function to strip HTML tags
  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

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
    <div className={`container mx-auto px-4 py-8 ${Object.keys(groupedVerses).length === 0 && !isLoading ? 'bg-transparent' : ''}`}>
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

      {/* Search and Filter - Only show if there are verses or if user has applied filters */}
      {(Object.keys(groupedVerses).length > 0 || searchTerm || selectedLanguage !== 'en') && (
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
        {/* Only show language filter if there are verses or if user has applied filters */}
        {(Object.keys(groupedVerses).length > 0 || searchTerm || selectedLanguage !== 'en') && (
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

      {/* Verses Cards */}
      {Object.keys(groupedVerses).length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 text-lg mb-2">No verses found</div>
            <p className="text-gray-400">
              {searchTerm || selectedLanguage !== 'en'
                ? 'Try adjusting your search criteria'
                : 'Get started by adding your first verse'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.values(groupedVerses).map((group: any, index: number) => (
            <div key={`${group?.chapterTitle}-${index}`} className="bg-white rounded-lg shadow-sm">
              {/* Chapter Header - Clean Theme Card */}
              <div className="bg-theme-secondary text-theme-primary p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Hash className="h-5 w-5 text-theme-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">
                        {stripHtmlTags(group?.chapterTitle)}
                      </h3>
                      <div className="text-gray-700 text-sm">
                        {group.chapterData && group.chapterData.description && group.chapterData.description[selectedLanguage] ? (
                          <span dangerouslySetInnerHTML={{ __html: group.chapterData.description[selectedLanguage] }} />
                        ) : (
                          'Chapter description'
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{group.verses.length}</div>
                    <div className="text-theme-primary text-sm">Verses</div>
                  </div>
                </div>
              </div>

              {/* Verses Grid - Clean White Cards */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.verses.map((verse: any) => (
                    <div key={verse._id} className="bg-white rounded-lg p-3 border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        {/* Verse Number - Theme Circle */}
                        <div className="h-8 w-8 bg-theme-secondary rounded-full flex items-center justify-center text-theme-primary font-bold text-sm flex-shrink-0">
                          {verse.number}
                        </div>
                        
                        {/* Verse Content */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm">
                            Verse {verse.number}
                          </div>
                          <div className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                            {verse.text[selectedLanguage] ? (
                              <span dangerouslySetInnerHTML={{ __html: verse.text[selectedLanguage] }} />
                            ) : (
                              <span className="italic">No text</span>
                            )}
                          </div>
                        </div>

                        {/* Edit Button - Square with Pencil */}
                        <div className="flex-shrink-0">
                          <Link href={`/bible/verses/edit/${verse._id}`}>
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
