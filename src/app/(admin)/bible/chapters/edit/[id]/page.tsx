'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import CKEditorComponent from '@/components/CKEditorComponent';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';
import { MultilingualText, Chapter, Language } from '@/lib/types/bibble';

export default function EditChapterPage() {
  const params = useParams();
  const router = useRouter();
  const chapterId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [validationError, setValidationError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  // Data states
  const [languages, setLanguages] = useState<Language[]>([]);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    title: {} as MultilingualText,
    order: 1
  });

  // Fetch data on component mount
  useEffect(() => {
    if (chapterId) {
      console.log("Chapter ID from params:", chapterId);
      fetchChapter();
      fetchLanguages();
    }
  }, [chapterId]);

  const fetchChapter = async () => {
    try {
      setIsLoadingData(true);
      console.log("Fetching chapter with ID:", chapterId);
      
      // Try the API call
      const response: any = await ClientInstance.APP.getChapterById(chapterId);
      console.log("Chapter response:", response);
      
      if (response?.success && response?.data) {
        setChapter(response.data);
        setFormData({
          title: response.data.title || {},
          order: response.data.order || 1
        });
      } else {
        console.error("Failed to fetch chapter:", response);
        showToast.error("Error", `Chapter not found. Response: ${JSON.stringify(response)}`);
        router.push("/bible/chapters");
      }
    } catch (error) {
      console.error("Error fetching chapter:", error);
      showToast.error("Error", `Failed to fetch chapter: ${error.message || error}`);
      router.push("/bible/chapters");
    } finally {
      setIsLoadingData(false);
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

  const isMultilingualFieldComplete = (field: MultilingualText): boolean => {
    return Object.values(field).some(val => val && val.trim() !== '');
  };

  const validateForm = (): boolean => {
    setValidationError("");
    
    if (!isMultilingualFieldComplete(formData.title)) {
      setValidationError("Please fill in the chapter title in at least one language");
      return false;
    }
    if (!formData.order || formData.order <= 0) {
      setValidationError("Please enter a valid order number");
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      
      const payload = {
        title: formData.title,
        order: formData.order
      };
      
      const response: any = await ClientInstance.APP.updateChapter(chapterId, payload);
      if (response?.success) {
        showToast.success("Chapter Updated", "Chapter has been updated successfully!");
        setSuccessMessage("Chapter updated successfully!");
        
        setTimeout(() => {
          router.push("/bible/chapters");
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

  if (isLoadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Chapter Not Found</h2>
          <p className="text-gray-600 mb-6">The chapter you're looking for doesn't exist.</p>
          <Link href="/bible/chapters">
            <Button>Back to Chapters</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto px-5 py-6 flex items-center gap-4">
          <Link href="/bible/chapters" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Edit Chapter</h1>
            <p className="text-gray-500">Update chapter information</p>
          </div>
        </div>
      </div>

      <div className="mx-auto px-2">
        <div className="p-10 space-y-8">
          {/* Chapter Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Chapter Title <span className="text-red-500">*</span>
            </label>
            <CKEditorComponent
              value={formData.title}
              onChange={(val) => {
                setFormData(prev => ({
                  ...prev,
                  title: val
                }));
                setValidationError("");
              }}
              placeholder="Enter chapter title"
            />
          </div>

          {/* Chapter Order */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Chapter Order <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={formData.order}
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  order: parseInt(e.target.value) || 1
                }));
                setValidationError("");
              }}
              placeholder="Enter chapter order"
              min="1"
            />
          </div>
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

        {/* Save Button */}
        <div className="flex justify-end items-center px-10 py-6 border-t border-gray-200 bg-gray-50">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="px-8 py-3 bg-theme-primary hover:bg-theme-primary text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Updating...
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
  );
}
