'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stepper } from '@/components/ui/stepper';
import { 
  ArrowLeft,
  Save,
  Hash,
  BookOpen,
  FileText,
  Book
} from 'lucide-react';
import CKEditorComponent from '@/components/CKEditorComponent';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';
import { MultilingualText, Chapter, Language } from '@/lib/types/bibble';

const steps = [
  { id: "story", title: "Edit Story", icon: FileText },
  { id: "chapter", title: "Edit Chapter", icon: Book },
  { id: "verse", title: "Edit Verse", icon: Hash }
];

interface VerseFormData {
  verse: {
    chapterId: string;
    number: number;
    text: MultilingualText;
  };
}

export default function EditVersePage() {
  const params = useParams();
  const router = useRouter();
  const verseId = params.id as string;
  
  // Determine current step based on URL path
  const getCurrentStep = () => {
    const path = window.location.pathname;
    if (path.includes('/verses/edit/')) return 2; // Edit Verse
    if (path.includes('/chapters/edit/')) return 1; // Edit Chapter  
    if (path.includes('/stories/edit/')) return 0; // Edit Story
    return 2; // Default to verse
  };
  
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  // Data states
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languageNames, setLanguageNames] = useState<{ [key: string]: string }>({});
  
  // Form data
  const [formData, setFormData] = useState<VerseFormData>({
    verse: {
      chapterId: '',
      number: 1,
      text: {}
    }
  });

  // Initialize form data with languages when languages are loaded
  useEffect(() => {
    if (languages.length > 0) {
      const initializeMultilingualData = () => {
        const multilingualData: MultilingualText = {};
        languages.forEach((lang: Language) => {
          multilingualData[lang.code] = "";
        });
        return multilingualData;
      };

      setFormData(prev => ({
        verse: {
          ...prev.verse,
          text: initializeMultilingualData()
        }
      }));
    }
  }, [languages]);

  // Fetch data on component mount
  useEffect(() => {
    fetchChapters();
    fetchLanguages();
    loadVerseData();
  }, [verseId]);

  const loadVerseData = async () => {
    try {
      setIsLoading(true);
      const verseResponse: any = await ClientInstance.APP.getVerseById(verseId);
      
      if (verseResponse?.success && verseResponse?.data) {
        const verse = verseResponse.data;
        
        setFormData({
          verse: {
            chapterId: typeof verse.chapterId === 'object' ? verse.chapterId._id : verse.chapterId || '',
            number: verse.number || 1,
            text: cleanMultilingualData(verse.text || {})
          }
        });
      } else {
        console.error("Failed to load verse:", verseResponse);
        showToast.error("Error", "Failed to load verse data");
        router.push('/bible');
      }
    } catch (error) {
      console.error("Error loading verse:", error);
      showToast.error("Error", "Failed to load verse data");
      router.push('/bible');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLanguages = async () => {
    try {
      const [languageResponse, languageCodeResponse] = await Promise.all([
        ClientInstance.APP.getLanguage(),
        ClientInstance.APP.getLanguageCode()
      ]);

      if ((languageResponse as any)?.success && (languageResponse as any)?.data) {
        let languagesData = (languageResponse as any).data;
        
        if ((languageCodeResponse as any)?.success && (languageCodeResponse as any)?.data) {
          const languageCodes = (languageCodeResponse as any).data;
          
          languagesData = languagesData.map((lang: any) => {
            const matchingCode = languageCodes.find((code: any) => 
              code.code === lang.code || code.name === lang.name
            );
            return {
              ...lang,
              code: matchingCode?.code || lang.code,
              name: lang.name,
              flag: lang.flag || '🌐'
            };
          });
        }
        
        setLanguages(languagesData);
        
        // Create language names mapping for display
        const namesMapping: { [key: string]: string } = {};
        languagesData.forEach((lang: any) => {
          if (lang.code && lang.name) {
            namesMapping[lang.code] = lang.name;
          }
        });
        setLanguageNames(namesMapping);
      }
    } catch (error) {
      console.error("Error fetching languages:", error);
      setLanguages([]);
      setLanguageNames({});
    }
  };

  // Helper function to get language name from API data
  const getLanguageName = (code: string) => {
    return languageNames[code] || code.toUpperCase();
  };

  // Helper function to strip HTML tags and entities for clean display
  const stripHtmlTags = (html: string) => {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with regular space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .trim(); // Remove leading/trailing whitespace
  };

  const fetchChapters = async () => {
    try {
      // Fetch all products first to get stories and chapters
      const productsResponse: any = await ClientInstance.APP.getProducts({ type: 'book' });
      if (productsResponse?.success && productsResponse?.data) {
        const allChapters: Chapter[] = [];
        
        for (const product of productsResponse.data) {
          try {
            const storiesResponse: any = await ClientInstance.APP.getStoriesByProduct(product._id);
            if (storiesResponse?.success && storiesResponse?.data) {
              for (const story of storiesResponse.data) {
                try {
                  const chaptersResponse: any = await ClientInstance.APP.getChaptersByStory(story._id);
                  if (chaptersResponse?.success && chaptersResponse?.data) {
                    allChapters.push(...chaptersResponse.data);
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
        
        setChapters(allChapters);
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
      showToast.error("Error", "Failed to fetch chapters");
    }
  };

  const cleanMultilingualData = (data: MultilingualText): MultilingualText => {
    const cleaned: MultilingualText = {};
    Object.entries(data).forEach(([key, value]) => {
      // Exclude Hindi language (hi) from payload
      if (key !== 'hi' && value && value.trim() !== '') {
        cleaned[key] = value;
      }
    });
    return cleaned;
  };

  const isMultilingualFieldComplete = (field: MultilingualText): boolean => {
    return Object.values(field).some(val => val && val.trim() !== '');
  };

  const validateForm = (): boolean => {
    setValidationError("");

    if (!formData.verse.chapterId) {
      setValidationError("Please select a chapter");
      return false;
    }
    if (!isMultilingualFieldComplete(formData.verse.text)) {
      setValidationError("Please fill in the verse text in at least one language");
      return false;
    }
    
    return true;
  };

  const handleUpdateVerse = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      
      const versePayload = {
        chapterId: formData.verse.chapterId,
        number: formData.verse.number,
        text: cleanMultilingualData(formData.verse.text)
      };
      
      const response: any = await ClientInstance.APP.updateVerse(verseId, versePayload);
      if (response?.success) {
        showToast.success("Verse Updated", "Verse has been updated successfully!");
        setSuccessMessage("Verse updated successfully! Redirecting back to Bible page...");
        setTimeout(() => {
          router.push('/bible');
        }, 2000);
      } else {
        showToast.error("Error", response?.message || "Failed to update verse");
      }
    } catch (error) {
      console.error("Error updating verse:", error);
      showToast.error("Error", "Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToBible = () => {
    router.push('/bible');
  };

  return (
    <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto px-5 py-6 flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleBackToBible}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Edit Verse</h1>
            <p className="text-gray-500">Update verse information</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="mx-auto px-2">
        <Stepper steps={steps} currentStep={getCurrentStep()} />

        <div className="mt-10 bg-white border border-gray-100 shadow-md rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-10 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Loading verse data...</span>
              </div>
            </div>
          ) : (
            <div className="p-10 space-y-8">
            
            {/* Verse Form */}
            <div className="flex items-center gap-3 mb-6">
              <Hash className="h-8 w-8 text-theme-primary" />
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Edit Verse</h2>
                <p className="text-gray-600">Update verse information</p>
              </div>
            </div>

            {/* Chapter Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Select Chapter <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.verse.chapterId}
                onValueChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    verse: { ...prev.verse, chapterId: value }
                  }));
                  setValidationError("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a chapter">
                    {formData.verse.chapterId && (() => {
                      const selectedChapter = chapters.find(c => c._id === formData.verse.chapterId);
                      if (selectedChapter) {
                        const firstTitle = Object.values(selectedChapter.title || {})[0] || '';
                        return stripHtmlTags(firstTitle);
                      }
                      return '';
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter._id} value={chapter._id || ''}>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span className="font-medium">Chapter:</span>
                        </div>
                        {/* Chapter Title - All Languages */}
                        {Object.entries(chapter.title || {}).map(([lang, text]) => (
                          <div key={lang} className="text-xs text-gray-600 flex gap-1 ml-4">
                            <span className="text-gray-500 font-medium">
                              {getLanguageName(lang)}:
                            </span>
                            <span 
                              className="truncate"
                              title={text} // Show full HTML content on hover
                            >
                              {stripHtmlTags(text)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            {/* Verse Text */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Verse Text <span className="text-red-500">*</span>
              </label>
              <CKEditorComponent
                value={formData.verse.text}
                onChange={(val) => {
                  setFormData(prev => ({
                    ...prev,
                    verse: { ...prev.verse, text: val }
                  }));
                  setValidationError("");
                }}
                placeholder="Enter verse text in multiple languages"
              />
            </div>

            {/* Validation Error Message */}
            {validationError && (
              <div className="mx-10 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <div className="text-red-600 text-sm font-medium">
                    ⚠️ {validationError}
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mx-10 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <div className="text-green-600 text-sm font-medium">
                    ✅ {successMessage}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center py-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleBackToBible}
                className="py-3 border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>

              <Button
                onClick={handleUpdateVerse}
                disabled={isLoading}
                className="px-5 py-3 bg-theme-primary hover:bg-theme-primary text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-5 w-5" />
                    Update Verse
                  </div>
                )}
              </Button>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
