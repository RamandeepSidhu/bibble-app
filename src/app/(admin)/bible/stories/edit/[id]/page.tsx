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
import { MultilingualText, Story, Language } from '@/lib/types/bibble';

export default function EditStoryPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [validationError, setValidationError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  // Data states
  const [languages, setLanguages] = useState<Language[]>([]);
  const [story, setStory] = useState<Story | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    title: {} as MultilingualText,
    description: {} as MultilingualText,
    order: 1
  });

  // Fetch data on component mount
  useEffect(() => {
    if (storyId) {
      fetchStory();
      fetchLanguages();
    }
  }, [storyId]);

  const fetchStory = async () => {
    try {
      setIsLoadingData(true);
      const response: any = await ClientInstance.APP.getStoryById(storyId);
      if (response?.success && response?.data) {
        setStory(response.data);
        setFormData({
          title: response.data.title || {},
          description: response.data.description || {},
          order: response.data.order || 1
        });
      } else {
        showToast.error("Error", "Story not found");
        router.push("/bible/stories");
      }
    } catch (error) {
      console.error("Error fetching story:", error);
      showToast.error("Error", "Failed to fetch story");
      router.push("/bible/stories");
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
      setValidationError("Please fill in the story title in at least one language");
      return false;
    }
    if (!isMultilingualFieldComplete(formData.description)) {
      setValidationError("Please fill in the story description in at least one language");
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
        description: formData.description,
        order: formData.order
      };
      
      const response: any = await ClientInstance.APP.updateStory(storyId, payload);
      if (response?.success) {
        showToast.success("Story Updated", "Story has been updated successfully!");
        setSuccessMessage("Story updated successfully!");
        
        setTimeout(() => {
          router.push("/bible/stories");
        }, 2000);
      } else {
        showToast.error("Error", response?.message || "Failed to update story");
      }
    } catch (error) {
      console.error("Error updating story:", error);
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

  if (!story) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Story Not Found</h2>
          <p className="text-gray-600 mb-6">The story you're looking for doesn't exist.</p>
          <Link href="/bible/stories">
            <Button>Back to Stories</Button>
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
          <Link href="/bible/stories" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Edit Story</h1>
            <p className="text-gray-500">Update story information</p>
          </div>
        </div>
      </div>

      <div className="mx-auto px-2">
        <div className="p-10 space-y-8">
          {/* Story Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Story Title <span className="text-red-500">*</span>
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
              placeholder="Enter story title"
            />
          </div>

          {/* Story Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Story Description <span className="text-red-500">*</span>
            </label>
            <CKEditorComponent
              value={formData.description}
              onChange={(val) => {
                setFormData(prev => ({
                  ...prev,
                  description: val
                }));
                setValidationError("");
              }}
              placeholder="Enter story description"
            />
          </div>

          {/* Story Order */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Story Order <span className="text-red-500">*</span>
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
              placeholder="Enter story order"
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
                Update Story
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
