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
  Book,
  FileText,
  ScrollText
} from 'lucide-react';
import CKEditorComponent from '@/components/CKEditorComponent';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';
import { MultilingualText, Story, Language } from '@/lib/types/bibble';

const steps = [
  { id: "story", title: "Edit Story", icon: FileText },
  { id: "chapter", title: "Edit Chapter", icon: Book },
  { id: "verses", title: "Edit Verses", icon: ScrollText }
];

interface ChapterFormData {
  chapter: {
    storyId: string;
    title: MultilingualText;
    order: number;
  };
}

export default function EditChapterPage() {
  const params = useParams();
  const router = useRouter();
  const chapterId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  // Data states
  const [stories, setStories] = useState<Story[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  
  // Form data
  const [formData, setFormData] = useState<ChapterFormData>({
    chapter: {
      storyId: '',
      title: {},
      order: 1
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
        chapter: {
          ...prev.chapter,
          title: initializeMultilingualData()
        }
      }));
    }
  }, [languages]);

  // Fetch data on component mount
  useEffect(() => {
    fetchStories();
    fetchLanguages();
    loadChapterData();
  }, []);

  const loadChapterData = async () => {
    try {
      setIsLoading(true);
      console.log("Loading chapter with ID:", chapterId);
      const chapterResponse: any = await ClientInstance.APP.getChapterById(chapterId);
      console.log("Chapter response:", chapterResponse);
      
      if (chapterResponse?.success && chapterResponse?.data) {
        const chapter = chapterResponse.data;
        console.log("Chapter data:", chapter);
        
        setFormData({
          chapter: {
            storyId: chapter.storyId || '',
            title: cleanMultilingualData(chapter.title || {}),
            order: chapter.order || 1
          }
        });
      } else {
        console.error("Failed to load chapter:", chapterResponse);
        showToast.error("Error", "Failed to load chapter data");
        router.push('/bible');
      }
    } catch (error) {
      console.error("Error loading chapter:", error);
      showToast.error("Error", "Failed to load chapter data");
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
      }
    } catch (error) {
      console.error("Error fetching languages:", error);
      setLanguages([]);
    }
  };

  const fetchStories = async () => {
    try {
      // Fetch all products first to get stories
      const productsResponse: any = await ClientInstance.APP.getProducts({ type: 'book' });
      if (productsResponse?.success && productsResponse?.data) {
        const allStories: Story[] = [];
        
        for (const product of productsResponse.data) {
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
      showToast.error("Error", "Failed to fetch stories");
    }
  };

  const cleanMultilingualData = (data: MultilingualText): MultilingualText => {
    const cleaned: MultilingualText = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
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

    if (!formData.chapter.storyId) {
      setValidationError("Please select a story");
      return false;
    }
    if (!isMultilingualFieldComplete(formData.chapter.title)) {
      setValidationError("Please fill in the chapter title in at least one language");
      return false;
    }
    
    return true;
  };

  const handleUpdateChapter = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      
      const chapterPayload = {
        storyId: formData.chapter.storyId,
        title: cleanMultilingualData(formData.chapter.title),
        order: formData.chapter.order
      };
      
      const response: any = await ClientInstance.APP.updateChapter(chapterId, chapterPayload);
      if (response?.success) {
        showToast.success("Chapter Updated", "Chapter has been updated successfully!");
        setSuccessMessage("Chapter updated successfully! Redirecting back to Bible page...");
        setTimeout(() => {
          router.push('/bible');
        }, 2000);
      } else {
        showToast.error("Error", response?.message || "Failed to update chapter");
      }
    } catch (error) {
      console.error("Error updating chapter:", error);
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Chapter</h1>
            <p className="text-gray-500">Update chapter information</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="mx-auto px-2">
        <Stepper steps={steps} currentStep={1} />

        <div className="mt-10 bg-white border border-gray-100 shadow-md rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-10 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Loading chapter data...</span>
              </div>
            </div>
          ) : (
            <div className="p-10 space-y-8">
            
            {/* Chapter Form */}
            <div className="flex items-center gap-3 mb-6">
              <Book className="h-8 w-8 text-theme-primary" />
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Edit Chapter</h2>
                <p className="text-gray-600">Update chapter information</p>
              </div>
            </div>

            {/* Story Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Select Story <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.chapter.storyId}
                onValueChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    chapter: { ...prev.chapter, storyId: value }
                  }));
                  setValidationError("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a story" />
                </SelectTrigger>
                <SelectContent>
                  {stories.map((story) => (
                    <SelectItem key={story._id} value={story._id || ''}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{story.title.en || story.title.sw || 'Untitled'}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Chapter Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Chapter Title <span className="text-red-500">*</span>
              </label>
              <CKEditorComponent
                value={formData.chapter.title}
                onChange={(val) => {
                  setFormData(prev => ({
                    ...prev,
                    chapter: { ...prev.chapter, title: val }
                  }));
                  setValidationError("");
                }}
                placeholder="Enter chapter title in multiple languages"
              />
            </div>

            {/* Chapter Order */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Chapter Order <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.chapter.order}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    chapter: { ...prev.chapter, order: parseInt(e.target.value) || 1 }
                  }));
                  setValidationError("");
                }}
                placeholder="Enter chapter order"
                min="1"
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
            <div className="flex justify-between items-center px-10 py-6 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                onClick={handleBackToBible}
                className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>

              <Button
                onClick={handleUpdateChapter}
                disabled={isLoading}
                className="px-8 py-3 bg-theme-primary hover:bg-theme-primary text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-5 w-5" />
                    Update Chapter
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
