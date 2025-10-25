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
  FileText,
  BookOpen,
  ScrollText
} from 'lucide-react';
import CKEditorComponent from '@/components/CKEditorComponent';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';
import { MultilingualText, ProductManagement, Language } from '@/lib/types/bibble';

const steps:any = [
  { id: "story", title: "Edit Story", icon: FileText },
  { id: "chapters", title: "Edit Chapters", icon: BookOpen },
  { id: "verses", title: "Edit Verses", icon: ScrollText }
];

interface Chapter {
  _id?: string;
  title: MultilingualText;
  description: MultilingualText;
  order: number;
}

interface Verse {
  _id?: string;
  chapterId?: string;
  text: MultilingualText;
  order: number;
}

interface StoryFormData {
  story: {
    productId: string;
    title: MultilingualText;
    description: MultilingualText;
    order: number;
  };
  chapters: Chapter[];
  verses: Verse[];
}

export default function EditStoryPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(0);
  
  // Data states
  const [products, setProducts] = useState<ProductManagement[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  
  // Form data
  const [formData, setFormData] = useState<StoryFormData>({
    story: {
      productId: '',
      title: {},
      description: {},
      order: 1
    },
    chapters: [],
    verses: []
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

      setFormData((prev) => ({
        story: {
          ...prev.story,
          title: initializeMultilingualData(),
          description: initializeMultilingualData()
        },
        chapters: prev.chapters,
        verses: prev.verses
      }));
    }
  }, [languages]);

  // Fetch data on component mount
  useEffect(() => {
    fetchProducts();
    fetchLanguages();
    loadChapters();
    loadVerses();
  }, []);


  const loadChapters = async () => {
    // TODO: Replace with actual API call
    setFormData(prev => ({
      ...prev,
      chapters: []
    }));
  };

  const loadVerses = async () => {
    // TODO: Replace with actual API call
    setFormData(prev => ({
      ...prev,
      verses: []
    }));
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

  const fetchProducts = async () => {
    try {
      const response: any = await ClientInstance.APP.getProducts({ type: 'book' });
      if (response?.success && response?.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      showToast.error("Error", "Failed to fetch products");
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

    if (!formData.story.productId) {
      setValidationError("Please select a product");
      return false;
    }
    if (!isMultilingualFieldComplete(formData.story.title)) {
      setValidationError("Please fill in the story title in at least one language");
      return false;
    }
    if (!isMultilingualFieldComplete(formData.story.description)) {
      setValidationError("Please fill in the story description in at least one language");
      return false;
    }
    
    return true;
  };

  const handleUpdateStory = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      
      const storyPayload = {
        productId: formData.story.productId,
        title: cleanMultilingualData(formData.story.title),
        description: cleanMultilingualData(formData.story.description),
        order: formData.story.order
      };
      
      const response: any = await ClientInstance.APP.updateStory(storyId, storyPayload);
      if (response?.success) {
        showToast.success("Story Updated", "Story has been updated successfully!");
        setSuccessMessage("Story updated successfully! Redirecting back to Bible page...");
        setTimeout(() => {
          router.push('/bible');
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

  const handleBackToBible = () => {
    router.push('/bible');
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Story</h1>
            <p className="text-gray-500">Update story information</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="mx-auto px-2">
        <Stepper steps={steps} currentStep={0} />

        <div className="mt-10 bg-white border border-gray-100 shadow-md rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-10 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Loading story data...</span>
              </div>
            </div>
          ) : (
            <div className="p-10 space-y-8">
            
            {currentStep === 0 && (
              <>
                {/* Story Form */}
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="h-8 w-8 text-theme-primary" />
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Edit Story</h2>
                    <p className="text-gray-600">Update story information</p>
                  </div>
                </div>

                {/* Product Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">
                    Select Product (Book) <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.story.productId}
                    onValueChange={(value) => {
                      setFormData(prev => ({
                        ...prev,
                        story: { ...prev.story, productId: value }
                      }));
                      setValidationError("");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product._id} value={product._id}>
                          <div className="flex items-center gap-2">
                            <span>📖</span>
                            <span>{product.title.en || product.title.sw || 'Untitled'}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Story Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Story Title <span className="text-red-500">*</span>
                  </label>
                  <CKEditorComponent
                    value={formData.story.title}
                    onChange={(val) => {
                      setFormData(prev => ({
                        ...prev,
                        story: { ...prev.story, title: val }
                      }));
                      setValidationError("");
                    }}
                    placeholder="Enter story title in multiple languages"
                  />
                </div>

                {/* Story Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Story Description <span className="text-red-500">*</span>
                  </label>
                  <CKEditorComponent
                    value={formData.story.description}
                    onChange={(val) => {
                      setFormData(prev => ({
                        ...prev,
                        story: { ...prev.story, description: val }
                      }));
                      setValidationError("");
                    }}
                    placeholder="Enter story description in multiple languages"
                  />
                </div>

                {/* Story Order */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">
                    Story Order <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={formData.story.order}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        story: { ...prev.story, order: parseInt(e.target.value) || 1 }
                      }));
                      setValidationError("");
                    }}
                    placeholder="Enter story order number"
                    min="1"
                  />
                </div>
              </>
            )}

            {currentStep === 1 && (
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="h-8 w-8 text-theme-primary" />
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Edit Chapters</h2>
                  <p className="text-gray-600">Update chapters for this story</p>
                </div>
              </div>
              // TODO: Add chapters editing UI
            )}

            {currentStep === 2 && (
              <div className="flex items-center gap-3 mb-6">
                <ScrollText className="h-8 w-8 text-theme-primary" />
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Edit Verses</h2>
                  <p className="text-gray-600">Update verses for this story</p>
                </div>
              </div>
              // TODO: Add verses editing UI
            )}

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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBackToBible}
                  className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={previousStep}
                    className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Previous
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {currentStep < steps.length - 1 && (
                  <Button
                    onClick={nextStep}
                    className="px-6 py-3 bg-theme-primary hover:bg-theme-primary text-white font-semibold rounded-lg shadow-md transition-colors"
                  >
                    Next
                  </Button>
                )}
                {currentStep === steps.length - 1 && (
                  <Button
                    onClick={handleUpdateStory}
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
                        Update Story
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
