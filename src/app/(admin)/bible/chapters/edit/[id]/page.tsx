'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
  { id: "story", title: "Story", icon: FileText },
  { id: "chapter", title: "Chapter", icon: Book },
  { id: "verses", title: "Verses", icon: ScrollText }
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
  
  // Determine current step based on URL path
  const getCurrentStep = () => {
    const path = window.location.pathname;
    if (path.includes('/verses/edit/')) return 2; // Edit Verse
    if (path.includes('/chapters/edit/')) return 1; // Edit Chapter  
    if (path.includes('/stories/edit/')) return 0; // Edit Story
    return 1; // Default to chapter
  };
  
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  // Data states
  const [stories, setStories] = useState<Story[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languageNames, setLanguageNames] = useState<{ [key: string]: string }>({});
  
  const [formData, setFormData] = useState<ChapterFormData | null>(null);

  // Fetch languages and stories
  useEffect(() => {
    fetchLanguages();
    fetchStories();
  }, []);

  // Load chapter data when everything is ready
  useEffect(() => {
    if (chapterId && languages.length > 0 && stories.length > 0) {
      loadChapterData();
    }
  }, [chapterId, languages, stories]);

  const fetchLanguages = async () => {
    try {
      const [langRes, codeRes]:any = await Promise.all([
        ClientInstance.APP.getLanguage(),
        ClientInstance.APP.getLanguageCode(),
      ]);

      if (langRes?.success && langRes?.data) {
        let langs = langRes.data;
        if (codeRes?.success && codeRes?.data) {
          const codes = codeRes.data;
          langs = langs.map((lang: any) => {
            const match = codes.find((c: any) => c.code === lang.code || c.name === lang.name);
            return { ...lang, code: match?.code || lang.code, flag: lang.flag || '🌐' };
          });
        }
        setLanguages(langs);
        
        // Create language names mapping for display
        const namesMapping: { [key: string]: string } = {};
        langs.forEach((lang: any) => {
          if (lang.code && lang.name) {
            namesMapping[lang.code] = lang.name;
          }
        });
        setLanguageNames(namesMapping);
      }
    } catch (err) {
      console.error(err);
      setLanguages([]);
      setLanguageNames({});
    }
  };

  // Helper function to get language name from API data
  const getLanguageName = (code: string) => {
    return languageNames[code] || code.toUpperCase();
  };

  // Helper function to strip HTML tags for clean display
  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  const fetchStories = async () => {
    try {
      const productsRes: any = await ClientInstance.APP.getProducts({ type: 'book' });
      if (productsRes?.success && productsRes?.data) {
        const allStories: Story[] = [];
        for (const product of productsRes.data) {
          const storiesRes: any = await ClientInstance.APP.getStoriesByProduct(product._id);
          if (storiesRes?.success && storiesRes?.data) {
            allStories.push(...storiesRes.data);
          }
        }
        setStories(allStories);
      }
    } catch (err) {
      console.error(err);
      showToast.error("Error", "Failed to fetch stories");
    }
  };

  const loadChapterData = async () => {
    try {
      setIsLoading(true);
      const res: any = await ClientInstance.APP.getChapterById(chapterId);
      if (res?.success && res?.data) {
        const chapter = res.data;
        const initMultilingual = (field: MultilingualText) => {
          const result: MultilingualText = {};
          languages.forEach(lang => {
            result[lang.code] = field?.[lang.code] || "";
          });
          return result;
        };

        setFormData({
          chapter: {
            storyId: typeof chapter.storyId === 'object' ? chapter.storyId._id : chapter.storyId || '',
            title: initMultilingual(chapter.title),
            order: chapter.order || 0,
          },
        });
      } else {
        showToast.error("Error", "Failed to load chapter data");
        router.push('/bible');
      }
    } catch (err) {
      console.error(err);
      showToast.error("Error", "Failed to load chapter data");
      router.push('/bible');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanMultilingualData = (data: MultilingualText): MultilingualText => {
    const cleaned: MultilingualText = {};
    Object.entries(data).forEach(([k, v]) => {
      // Exclude Hindi language (hi) from payload
      if (k !== 'hi' && v && v.trim() !== '') cleaned[k] = v;
    });
    return cleaned;
  };

  const validateForm = (): boolean => {
    if (!formData) return false;
    setValidationError("");
    if (!formData.chapter.storyId) {
      setValidationError("Please select a story");
      return false;
    }
    if (!Object.values(formData.chapter.title).some(val => val && val.trim() !== '')) {
      setValidationError("Please fill in the chapter title in at least one language");
      return false;
    }
    return true;
  };

  const handleUpdateChapter = async () => {
    if (!formData) return;
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      let chapterOrder = formData.chapter.order;

      // If order is missing or 0, calculate next order for story
      if (!chapterOrder || chapterOrder <= 0) {
        try {
          const res: any = await ClientInstance.APP.getChaptersByStory(formData.chapter.storyId);
          if (res?.success && res?.data) {
            const chapters = res.data;
            const maxOrder = Math.max(...chapters.map((ch: any) => ch.order || 0), 0);
            chapterOrder = maxOrder + 1;
          } else {
            chapterOrder = 1;
          }
        } catch (err) {
          console.error("Error fetching chapters to determine order:", err);
          chapterOrder = 1;
        }
      }

      const payload = {
        storyId: formData.chapter.storyId,
        title: cleanMultilingualData(formData.chapter.title),
        order: chapterOrder,
      };

      const response: any = await ClientInstance.APP.updateChapter(chapterId, payload);
      if (response?.success) {
        showToast.success("Chapter Updated", "Chapter updated successfully!");
        setSuccessMessage("Chapter updated successfully! Redirecting...");
        setTimeout(() => router.push('/bible'), 2000);
      } else {
        showToast.error("Error", response?.message || "Failed to update chapter");
      }
    } catch (err) {
      console.error("Error updating chapter:", err);
      showToast.error("Error", "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => router.push('/bible');

  if (!formData) {
    return (
      <div className="p-10 flex justify-center items-center h-screen">
        <div className="w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto px-5 py-6 flex items-center gap-4">
          <Button variant="outline" onClick={handleBack} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Edit Chapter</h1>
            <p className="text-gray-500">Update chapter information</p>
          </div>
        </div>
      </div>

      <div className="mx-auto px-2">
        <Stepper steps={steps} currentStep={getCurrentStep()} />
        <div className="mt-10 bg-white border border-gray-100 shadow-md rounded-2xl overflow-hidden p-10 space-y-8">

          {/* Story Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Select Story <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.chapter.storyId}
              onValueChange={(value) => setFormData(prev => prev && ({ ...prev, chapter: { ...prev.chapter, storyId: value } }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a story">
                  {formData.chapter.storyId && (() => {
                    const selectedStory = stories.find(s => s._id === formData.chapter.storyId);
                    if (selectedStory) {
                      const firstTitle = Object.values(selectedStory.title || {})[0] || '';
                      return stripHtmlTags(firstTitle);
                    }
                    return '';
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {stories.map(story => (
                  <SelectItem key={story._id} value={story._id || ''}>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">Story:</span>
                      </div>
                      {/* Story Title - All Languages */}
                      {Object.entries(story.title || {}).map(([lang, text]) => (
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

          {/* Chapter Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Chapter Title <span className="text-red-500">*</span>
            </label>
            <CKEditorComponent
              value={formData.chapter.title}
              onChange={(val) => setFormData(prev => prev && ({ ...prev, chapter: { ...prev.chapter, title: val } }))}
              placeholder="Enter chapter title in multiple languages"
            />
          </div>

          {/* Validation & Success Messages */}
          {validationError && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">{validationError}</div>}
          {successMessage && <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">{successMessage}</div>}

          {/* Actions */}
          <div className="flex justify-between items-center py-6 border-t border-gray-200">
            <Button variant="outline" onClick={handleBack} className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-100">
              Cancel
            </Button>
            <Button
              onClick={handleUpdateChapter}
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
                  Update Chapter
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
