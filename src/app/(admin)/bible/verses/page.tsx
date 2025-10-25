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
        // Create language names mapping
        const names: {[key: string]: string} = {};
        languagesResponse.data.forEach((lang: any) => {
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
      // First, get all products
      const productsResponse: any = await ClientInstance.APP.getProducts({ type: 'book' });
      if (!productsResponse?.success || !productsResponse?.data) {
        return;
      }

      const allVerses: Verse[] = [];

      // For each product, get stories
      for (const product of productsResponse.data) {
        try {
          const storiesResponse: any = await ClientInstance.APP.getStoriesByProduct(product._id);
          if (storiesResponse?.success && storiesResponse?.data) {
            
            // For each story, get chapters
            for (const story of storiesResponse.data) {
              try {
                const chaptersResponse: any = await ClientInstance.APP.getChaptersByStory(story._id);
                if (chaptersResponse?.success && chaptersResponse?.data) {
                  
                  // For each chapter, get verses
                  for (const chapter of chaptersResponse.data) {
                    try {
                      const versesResponse: any = await ClientInstance.APP.getVersesByChapter(chapter._id);
                      if (versesResponse?.success && versesResponse?.data) {
                        allVerses.push(...versesResponse.data);
                      }
                    } catch (error) {
                      console.error(`Error fetching verses for chapter ${chapter._id}:`, error);
                    }
                  }
                }
              } catch (error) {
                console.error(`Error fetching chapters for story ${story._id}:`, error);
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching stories for product ${product._id}:`, error);
        }
      }

      setVerses(allVerses);
    } catch (error) {
      console.error("Error fetching verses:", error);
      showToast.error('Failed to load verses', 'Error loading verses data');
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
            <div key={verse._id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col min-h-[400px]">
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
                    <div className="flex justify-end gap-2">
                  <Link href={`/bible/verses/edit/${verse._id}`}>
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
