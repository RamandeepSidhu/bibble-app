'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CKEditorComponent from '@/components/CKEditorComponent';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stepper } from '@/components/ui/stepper';
import { updateProduct, UpdateProductRequest, getProductById } from '@/api/productApi';
import { ProductType, MultilingualText, ProductFormData } from '@/lib/types/bibble';
import { ArrowLeft, Save, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const stepperSteps = [
  { id: 'details', title: 'Basic Info' },
  { id: 'content1', title: 'Content Level 1' },
  { id: 'content2', title: 'Content Level 2' },
  { id: 'content3', title: 'Content Level 3' }
];

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [productForm, setProductForm] = useState<ProductFormData>({
    type: 'book',
    title: { en: '', sw: '', fr: '', rn: '' },
    description: { en: '', sw: '', fr: '', rn: '' },
    contentType: 'free',
    freePages: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Helper function to check if rich text content is actually empty
  const isRichTextEmpty = (htmlContent: string): boolean => {
    if (!htmlContent) return true;
    const textContent = htmlContent
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&[a-zA-Z0-9#]+;/g, ' ') // Replace HTML entities
      .trim();
    return textContent.length === 0;
  };

  // Load product data (mock data for now)
  useEffect(() => {
    // In a real app, you would fetch the product data by ID
    const mockProduct = {
      type: 'book' as ProductType,
      title: {
        en: 'Genesis',
        sw: 'Mwanzo',
        fr: 'Genèse',
        rn: 'Itanguriro'
      },
      description: {
        en: 'The first book of the Bible, describing creation.',
        sw: 'Kitabu cha kwanza cha Biblia, kinaelezea uumbaji.',
        fr: 'Le premier livre de la Bible, décrivant la création.',
        rn: 'Igitabu ca mbere c\'uburimwo bw\'isi.'
      },
      contentType: 'free' as 'free' | 'paid',
      freePages: 10,
      profile_image: 'https://cdn.mysite.com/images/genesis_cover.png',
      images: [
        'https://cdn.mysite.com/images/genesis1.png',
        'https://cdn.mysite.com/images/genesis2.png'
      ]
    };

    setProductForm(mockProduct);
  }, [productId]);

  // File upload handlers
  const handleFileUpload = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await handleFileUpload(file);
      setProductForm(prev => ({ ...prev, profile_image: base64 }));
    }
  };



  const handleNextStep = () => {
    if (currentStep < stepperSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleUpdateProduct = async () => {
    // Helper function to check if rich text content is actually empty
    const isRichTextEmpty = (htmlContent: string): boolean => {
      if (!htmlContent) return true;
      const textContent = htmlContent
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
        .replace(/&[a-zA-Z0-9#]+;/g, ' ') // Replace HTML entities
        .trim();
      return textContent.length === 0;
    };

    // Validate required fields in all languages
    const hasTitleContent = Object.values(productForm.title).some(val => !isRichTextEmpty(val));
    const hasDescriptionContent = Object.values(productForm.description).some(val => !isRichTextEmpty(val));

    if (!productForm.type) {
      alert('Please select a product type');
      return;
    }

    if (!productForm.contentType) {
      alert('Please select a content type');
      return;
    }

    if (productForm.contentType === 'free' && productForm.freePages <= 0) {
      alert('Please enter a valid number of free pages');
      return;
    }

    if (!hasTitleContent) {
      alert('Please enter a title in at least one language');
      return;
    }

    if (!hasDescriptionContent) {
      alert('Please enter a description in at least one language');
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        productId: productId,
        type: productForm.type,
        title: productForm.title,
        description: productForm.description,
        contentType: productForm.contentType,
        freePages: productForm.freePages,
      };

      console.log('🚀 UPDATING PRODUCT', payload);

      const response = await updateProduct(payload);

      if (response.success) {
        alert('Product updated successfully!');
        // Optionally redirect or refresh data
        window.location.href = "/products";
      } else {
        alert(response.message || "Failed to update product. Please try again.");
      }
    } catch (error) {
      console.error("❌ Error updating product:", error);
      alert("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/products" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Edit Product</h1>
              <p className="text-gray-600">Edit multilingual content and product details</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500">Editing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper and Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Stepper steps={stepperSteps} currentStep={currentStep} />
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-8">
              {currentStep === 0 && (
                <div className="space-y-8">
                  <div className="border-b border-gray-200 pb-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Details</h2>
                    <p className="text-gray-600">Edit basic information and content for your product</p>
                  </div>

                  {/* Direct Editing Section */}
                  <div className="space-y-6">
                    {/* Product Type and Content Type Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Product Type Selection */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">
                          Product Type <span className="text-red-500">*</span>
                        </label>
                        <Select value={productForm.type} onValueChange={(value) => setProductForm({ ...productForm, type: value as ProductType })}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select product type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="book">📖 Book</SelectItem>
                            <SelectItem value="song">🎵 Hymns</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Content Type Selection */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">
                          Content Type <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={productForm.contentType}
                          onValueChange={(value) => setProductForm({ ...productForm, contentType: value as 'free' | 'paid' })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select content type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">🆓 Free</SelectItem>
                            <SelectItem value="paid">💰 Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Conditional Free Pages Row */}
                    {productForm.contentType === 'free' && (
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">
                          Free Pages <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={productForm.freePages}
                          onChange={(e) => setProductForm({ ...productForm, freePages: parseInt(e.target.value) || 0 })}
                          placeholder="Enter number of free pages"
                          className="w-full h-[40px] px-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-transparent transition-colors"
                          min="0"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Product Title <span className="text-red-500">*</span>
                      </label>
                      <CKEditorComponent
                        value={productForm.title}
                        onChange={(val: MultilingualText) => setProductForm({ ...productForm, title: val })}
                        placeholder="Enter product title"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Product Description <span className="text-red-500">*</span>
                      </label>
                      <CKEditorComponent
                        value={productForm.description}
                        onChange={(val: MultilingualText) => setProductForm({ ...productForm, description: val })}
                        placeholder="Enter product description"
                      />
                    </div>
                  </div>

                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-8">
                  <div className="border-b border-gray-200 pb-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Level 1</h2>
                    <p className="text-gray-600">Edit multilingual content for detailed product information</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Content Title <span className="text-red-500">*</span>
                      </label>
                      <CKEditorComponent
                        value={productForm.title}
                        onChange={(val) => setProductForm({ ...productForm, title: val })}
                        placeholder="Enter content title"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Content Description <span className="text-red-500">*</span>
                      </label>
                      <CKEditorComponent
                        value={productForm.description}
                        onChange={(val) => setProductForm({ ...productForm, description: val })}
                        placeholder="Enter content description"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8">
                  <div className="border-b border-gray-200 pb-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Level 2</h2>
                    <p className="text-gray-600">Edit multilingual content for chapter-level information</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Chapter Title <span className="text-red-500">*</span>
                      </label>
                      <CKEditorComponent
                        value={productForm.title}
                        onChange={(val: MultilingualText) => setProductForm({ ...productForm, title: val })}
                        placeholder="Enter chapter title"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Chapter Content <span className="text-red-500">*</span>
                      </label>
                      <CKEditorComponent
                        value={productForm.description}
                        onChange={(val: MultilingualText) => setProductForm({ ...productForm, description: val })}
                        placeholder="Enter chapter content"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="border-b border-gray-200 pb-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Level 3</h2>
                    <p className="text-gray-600">Edit multilingual content for verse-level information</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Verse Title <span className="text-red-500">*</span>
                      </label>
                      <CKEditorComponent
                        value={productForm.title}
                        onChange={(val: MultilingualText) => setProductForm({ ...productForm, title: val })}
                        placeholder="Enter verse title"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Verse Text <span className="text-red-500">*</span>
                      </label>
                      <CKEditorComponent
                        value={productForm.description}
                        onChange={(val: MultilingualText) => setProductForm({ ...productForm, description: val })}
                        placeholder="Enter verse text"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                className="px-6 py-3 ml-3 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                Previous
              </Button>

              <div className="flex gap-3 py-3 px-3">
                {currentStep === stepperSteps.length - 1 ? (
                  <Button
                    onClick={handleUpdateProduct}
                    disabled={isLoading}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Updating Product...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Update Product
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextStep}
                    className="px-8 py-3 bg-theme-primary hover:bg-theme-primary text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
