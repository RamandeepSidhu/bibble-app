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
import { Verse, Chapter, Story, ProductManagement } from '@/lib/types/bibble';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';
import Link from 'next/link';

export default function VersesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [products, setProducts] = useState<ProductManagement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingVerse, setDeletingVerse] = useState<Verse | null>(null);

  // Fetch verses and related data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all products first
      const productsResponse: any = await ClientInstance.APP.getProducts({ type: 'book' });
      if (productsResponse?.success && productsResponse?.data) {
        setProducts(productsResponse.data);
        
        // Fetch stories for each product
        const allStories: Story[] = [];
        const allChapters: Chapter[] = [];
        const allVerses: Verse[] = [];
        
        for (const product of productsResponse.data) {
          try {
            const storiesResponse: any = await ClientInstance.APP.getStoriesByProduct(product._id);
            if (storiesResponse?.success && storiesResponse?.data) {
              allStories.push(...storiesResponse.data);
              
              // Fetch chapters for each story
              for (const story of storiesResponse.data) {
                try {
                  const chaptersResponse: any = await ClientInstance.APP.getChaptersByStory(story._id);
                  if (chaptersResponse?.success && chaptersResponse?.data) {
                    allChapters.push(...chaptersResponse.data);
                    
                    // Fetch verses for each chapter
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
        
        setStories(allStories);
        setChapters(allChapters);
        setVerses(allVerses);
      }
    } catch (error) {
      console.error("Error fetching verses data:", error);
    } finally {
      setIsLoading(false);
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

  const getChapterName = (chapterId: string) => {
    const chapter = chapters.find(c => c._id === chapterId);
    return chapter ? (chapter.title.en || chapter.title.sw || 'Untitled') : 'Unknown Chapter';
  };

  const getStoryName = (storyId: string) => {
    const story = stories.find(s => s._id === storyId);
    return story ? (story.title.en || story.title.sw || 'Untitled') : 'Unknown Story';
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p._id === productId);
    return product ? (product.title.en || product.title.sw || 'Untitled') : 'Unknown Product';
  };

  const getFullPath = (verse: Verse) => {
    const chapter:any = chapters.find(c => c._id === verse.chapterId);
    if (!chapter) return 'Unknown Path';
    
    const story:any = stories.find(s => s._id === chapter.storyId);
    if (!story) return 'Unknown Path';
    
    const product = products.find(p => p._id === story.productId);
    if (!product) return 'Unknown Path';
    
    return `${getProductName(product._id)} → ${getStoryName(story._id)} → ${getChapterName(chapter._id)}`;
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
        <Link href="/bible/verses/add">
          <Button className="bg-theme-primary text-theme-secondary hover:bg-theme-primary-dark">
            <Plus className="h-4 w-4 mr-2" />
            Add Verse
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
        <div className="bg-white border border-[#EAECF0] rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#EAECF0]">
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Verse</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Number</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Path</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Languages</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVerses.map((verse, index) => (
                <TableRow 
                  key={verse._id} 
                  className={`border-b border-[#EAECF0] hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-[#F9FAFB]' : 'bg-white'
                  }`}
                >
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-theme-secondary text-theme-primary flex items-center justify-center font-semibold">
                        <Hash className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-2">
                          Verse #{verse.number}
                        </div>
                        <div className="space-y-1">
                          {Object.entries(verse.text).map(([lang, text]) => (
                            text && text.trim() && (
                              <div key={lang} className="flex items-start gap-2">
                                <span className="text-xs font-medium text-gray-500 uppercase min-w-[20px]">{lang}:</span>
                                <span className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: text }} />
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-theme-secondary text-theme-primary border border-theme-primary">
                      {verse.number}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="text-sm text-gray-700">
                      <div className="font-medium">{getFullPath(verse)}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex gap-1">
                      {Object.entries(verse.text).map(([lang, text]) => (
                        text && text.trim() ? (
                          <span key={lang} className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                            {lang.toUpperCase()}
                          </span>
                        ) : null
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
                    <div className="flex justify-end gap-2">
                      <Link href={`/bible?edit=verse&id=${verse._id}`}>
                        <Button variant="outline" size="sm" className="!min-w-[80px]">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="!min-w-[80px] bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        onClick={() => handleDeleteClick(verse)}
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
