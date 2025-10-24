'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import CKEditorComponent from '@/components/CKEditorComponent';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';
import { MultilingualText, ProductManagement, Story, Language } from '@/lib/types/bibble';

export default function AddChapterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  // Data states
  const [products, setProducts] = useState<ProductManagement[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductManagement | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    productId: '',
    storyId: '',
    title: {} as MultilingualText,
    order: 1
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchProducts();
    fetchLanguages();
  }, []);

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
        
        // Initialize form data with languages
        const multilingualData: MultilingualText = {};
        languagesData.forEach((lang: Language) => {
          multilingualData[lang.code] = "";
        });
        setFormData(prev => ({
          ...prev,
          title: multilingualData
        }));
      }
    } catch (error) {
      console.error("Error fetching languages:", error);
      setLanguages([]);
    }
  };

  const fetchStories = async (productId: string) => {
    try {
      console.log("Fetching stories for product ID:", productId);
      const response: any = await ClientInstance.APP.getStoriesByProduct(productId);
      console.log("Stories response:", response);
      if (response?.success && response?.data) {
        setStories(response.data);
        console.log("Stories set:", response.data);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
    }
  };

  const isMultilingualFieldComplete = (field: MultilingualText): boolean => {
    return Object.values(field).some(val => val && val.trim() !== '');
  };

  const validateForm = (): boolean => {
    setValidationError("");
    
    if (!formData.productId) {
      setValidationError("Please select a product");
      return false;
    }
    if (!formData.storyId) {
      setValidationError("Please select a story");
      return false;
    }
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
        storyId: formData.storyId,
        title: formData.title,
        order: formData.order
      };
      
      console.log("Chapter creation payload:", payload);
      console.log("Form data:", formData);
      
      const response: any = await ClientInstance.APP.createChapter(payload);
      if (response?.success) {
        showToast.success("Chapter Created", "Chapter has been created successfully!");
        setSuccessMessage("Chapter created successfully!");
        
        // Reset form
        const resetMultilingualData: MultilingualText = {};
        languages.forEach((lang: Language) => {
          resetMultilingualData[lang.code] = "";
        });
        
        setFormData({
          productId: '',
          storyId: '',
          title: resetMultilingualData,
          order: 1
        });
        setSelectedProduct(null);
        setSelectedStory(null);
        setStories([]);
        
        setTimeout(() => {
          window.location.href = "/bible/chapters";
        }, 2000);
      } else {
        showToast.error("Error", response?.message || "Failed to create chapter");
      }
    } catch (error) {
      console.error("Error creating chapter:", error);
      showToast.error("Error", "Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p._id === productId);
    setSelectedProduct(product || null);
    setFormData(prev => ({
      ...prev,
      productId,
      storyId: '' // Reset story selection
    }));
    setSelectedStory(null);
    setStories([]);
    setValidationError("");
    
    // Fetch stories for the selected product
    if (productId) {
      fetchStories(productId);
    }
  };

  const handleStorySelect = (storyId: string) => {
    console.log("Selected story ID:", storyId);
    console.log("Available stories:", stories);
    const story = stories.find(s => s._id === storyId);
    console.log("Found story:", story);
    setSelectedStory(story || null);
    setFormData(prev => ({
      ...prev,
      storyId
    }));
    setValidationError("");
  };

  return (
    <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto px-5 py-6 flex items-center gap-4">
          <Link href="/bible/chapters" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Add Chapter</h1>
            <p className="text-gray-500">Create a new chapter under a story</p>
          </div>
        </div>
      </div>

      <div className="mx-auto px-2">
        <div className="p-5 space-y-8">
          {/* Product Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Select StoryId (Book) <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.productId}
              onValueChange={handleProductSelect}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a product to create chapter under" />
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

          {/* Story Selection */}
          {formData.productId && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Select Story <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.storyId}
                onValueChange={handleStorySelect}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a story to create chapter under" />
                </SelectTrigger>
                <SelectContent>
                  {stories.map((story) => (
                    <SelectItem key={story._id} value={story._id || ''}>
                      <div className="flex items-center gap-2">
                        <span>📄</span>
                        <span>{story.title.en || story.title.sw || 'Untitled'}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
        <div className="flex justify-end items-center px-5 py-6 border-t border-gray-200">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="px-8 py-3 bg-theme-primary hover:bg-theme-primary text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50"
          >
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
  );
}
