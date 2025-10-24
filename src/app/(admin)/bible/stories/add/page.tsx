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
import { MultilingualText, ProductManagement, Language } from '@/lib/types/bibble';

export default function AddStoryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  // Data states
  const [products, setProducts] = useState<ProductManagement[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductManagement | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    productId: '',
    title: {} as MultilingualText,
    description: {} as MultilingualText,
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
          title: multilingualData,
          description: multilingualData
        }));
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
    
    if (!formData.productId) {
      setValidationError("Please select a product");
      return false;
    }
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
        productId: formData.productId,
        title: formData.title,
        description: formData.description,
        order: formData.order
      };
      
      const response: any = await ClientInstance.APP.createStory(payload);
      if (response?.success) {
        showToast.success("Story Created", "Story has been created successfully!");
        setSuccessMessage("Story created successfully!");
        
        // Reset form
        const resetMultilingualData: MultilingualText = {};
        languages.forEach((lang: Language) => {
          resetMultilingualData[lang.code] = "";
        });
        
        setFormData({
          productId: '',
          title: resetMultilingualData,
          description: resetMultilingualData,
          order: 1
        });
        setSelectedProduct(null);
        
        setTimeout(() => {
          window.location.href = "/bible/stories";
        }, 2000);
      } else {
        showToast.error("Error", response?.message || "Failed to create story");
      }
    } catch (error) {
      console.error("Error creating story:", error);
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
      productId
    }));
    setValidationError("");
  };

  return (
    <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto px-5 py-6 flex items-center gap-4">
          <Link href="/bible/stories" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Add Story</h1>
            <p className="text-gray-500">Create a new story under a product</p>
          </div>
        </div>
      </div>

      <div className="mx-auto px-2">
        <div className="p-10 space-y-8">
          {/* Product Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Select Product (Book) <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.productId}
              onValueChange={handleProductSelect}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a product to create story under" />
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
                Creating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Create Story
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
