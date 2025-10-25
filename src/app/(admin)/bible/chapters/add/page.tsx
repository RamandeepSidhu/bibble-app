'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stepper } from '@/components/ui/stepper';
import { ArrowLeft, Save, FileText, BookOpen, File } from 'lucide-react';
import CKEditorComponent from '@/components/CKEditorComponent';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';
import { MultilingualText, Language } from '@/lib/types/bibble';

const steps = [
  { id: "story", title: "Story", icon: FileText },
  { id: "chapter", title: "Chapter", icon: BookOpen },
  { id: "verses", title: "Verses", icon: File }
];

interface ChapterFormData {
  storyId: string;
  title: MultilingualText;
  order: number;
}

export default function AddChapterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storyId = searchParams.get('storyId') || '';
  
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languageNames, setLanguageNames] = useState<{ [key: string]: string }>({});
  
  const [formData, setFormData] = useState<ChapterFormData>({
    storyId: storyId,
    title: {},
    order: 1,
  });

  // Get current step based on URL (0-based indexing)
  const getCurrentStep = () => {
    const path = window.location.pathname;
    if (path.includes('/verses/add')) return 2; // Step 3: Edit Verses
    if (path.includes('/chapters/add')) return 1; // Step 2: Create Chapter
    if (path.includes('/stories/edit')) return 0; // Step 1: Edit Story
    return 1; // Default to chapter step
  };

  const currentStep = getCurrentStep();

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      const response: any = await ClientInstance.APP.getLanguage();
      if (response?.success && response.data) {
        // Filter out Hindi language from available languages
        const filteredLangs = response.data.filter((lang: Language) => lang.code !== 'hi');
        setLanguages(filteredLangs);
        // Create language names mapping (excluding Hindi)
        const names: { [key: string]: string } = {};
        filteredLangs.forEach((lang: Language) => {
          names[lang.code] = lang.name;
        });
        setLanguageNames(names);
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const getLanguageName = (code: string) => {
    return languageNames[code] || code.toUpperCase();
  };

  const stripHtmlTags = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const cleanMultilingualData = (data: MultilingualText) => {
    const cleaned: MultilingualText = {};
    Object.entries(data).forEach(([k, v]) => {
      if (k !== 'hi' && v && v.trim() !== '') cleaned[k] = v;
    });
    return cleaned;
  };

  const isMultilingualFieldComplete = (field: MultilingualText) => {
    // Get all available languages from the languages state
    const availableLanguages = languages.map(lang => lang.code);
    
    // Check if all available languages have content
    return availableLanguages.every(lang => 
      field[lang] && field[lang].trim() !== ''
    );
  };

  const validateForm = (): boolean => {
    setValidationError("");
    if (!formData.storyId) { setValidationError("Story ID is required"); return false; }
    if (!isMultilingualFieldComplete(formData.title)) { setValidationError("Please fill in the chapter title in all languages"); return false; }
    return true;
  };

  const getNextChapterOrder = async (storyId: string) => {
    try {
      const res: any = await ClientInstance.APP.getChaptersByStory(storyId);
      if (res?.success && res?.data) {
        const maxOrder = Math.max(...res.data.map((c: any) => c.order || 0), 0);
        return maxOrder + 1;
      }
      return 1;
    } catch (error) {
      console.error('Error getting next chapter order:', error);
      return 1;
    }
  };

  const handleCreateChapter = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setValidationError("");

      const nextOrder = await getNextChapterOrder(formData.storyId);
      const chapterPayload = {
        storyId: formData.storyId,
        title: cleanMultilingualData(formData.title),
        order: nextOrder,
      };

      const response: any = await ClientInstance.APP.createChapter(chapterPayload);
      
      if (response?.success) {
        showToast.success(
          "Chapter Created",
          "Chapter has been created successfully!"
        );
        setSuccessMessage("Chapter created successfully! Redirecting to verses...");
        
        // Redirect to verses add page with the new chapter ID
        const chapterId = response.data._id || response.data.id;
        setTimeout(() => {
          router.push(`/bible/verses/add?chapterId=${chapterId}`);
        }, 1500);
      } else {
        showToast.error(
          "Error",
          response?.message || "Failed to create chapter"
        );
      }
    } catch (error) {
      console.error("Error creating chapter:", error);
      showToast.error(
        "Error",
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToBible = () => router.push('/bible');

  return (
    <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto px-5 py-6 flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToBible} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Chapter</h1>
            <p className="text-gray-600">Add a new chapter to the story</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="mx-auto px-2">
        <Stepper steps={steps} currentStep={currentStep} />

        <div className="mt-10 bg-white border border-gray-100 shadow-md rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-10 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Creating chapter...</span>
              </div>
            </div>
          ) : (
            <div className="p-8">
              <div className="space-y-6">
                {/* Chapter Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Chapter Title <span className="text-red-500">*</span>
                  </label>
                  <CKEditorComponent
                    value={formData.title}
                    onChange={(val) => {
                      setFormData(prev => ({ ...prev, title: val }));
                      setValidationError("");
                    }}
                    placeholder="Enter chapter title"
                  />
                </div>

                {/* Success Message */}
                {successMessage && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="text-green-600 text-sm font-medium">
                        ✅ {successMessage}
                      </div>
                    </div>
                  </div>
                )}

                {/* Validation Error Message */}
                {validationError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="text-red-600 text-sm font-medium">
                        ⚠️ {validationError}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => router.back()} className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-100">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateChapter} disabled={isLoading} className="px-8 py-3 bg-theme-primary hover:bg-theme-primary text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50">
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="h-5 w-5" />
                        Create Chapter
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
