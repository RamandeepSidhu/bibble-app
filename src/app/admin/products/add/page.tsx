'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultilingualRichEditor } from '@/components/ui/multilingual-rich-editor';
import { Stepper } from '@/components/ui/stepper';
import { ProductType, MultilingualText, ProductFormData } from '@/lib/types/bibble';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import Link from 'next/link';

const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: 'book', label: 'Book' },
  { value: 'story', label: 'Story' },
  { value: 'chapter', label: 'Chapter' },
  { value: 'verse', label: 'Verse' }
];

const stepperSteps = [
  { id: 'product', title: 'Product Details' },
  { id: 'content', title: 'Chapter' },
  { id: 'media', title: 'Story' },
  { id: 'review', title: 'Verse' }
];

export default function AddProductPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [productForm, setProductForm] = useState<ProductFormData>({
    type: 'book',
    categoryId: '67101b8b4aa4b876a2b2c110',
    tags: [],
    title: { en: '', sw: '', fr: '', rn: '' },
    description: { en: '', sw: '', fr: '', rn: '' },
    profile_image: '',
    images: []
  });

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

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !productForm.tags.includes(tag.trim())) {
      setProductForm({
        ...productForm,
        tags: [...productForm.tags, tag.trim()]
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setProductForm({
      ...productForm,
      tags: productForm.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSaveProduct = () => {
    const newProduct = {
      productId: null,
      type: productForm.type,
      categoryId: productForm.categoryId,
      tags: productForm.tags,
      title: productForm.title,
      description: productForm.description,
      profile_image: productForm.profile_image,
      images: productForm.images
    };

    console.log('=== PRODUCT PAYLOAD ===');
    console.log('Product Payload:', JSON.stringify(newProduct, null, 2));
    console.log('Product Form Data:', JSON.stringify(productForm, null, 2));
    console.log('======================');

    // Here you would typically make an API call
    alert('Product saved successfully!');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products">
            <ArrowLeft className="h-8 w-6 mr-2" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600">Create a new product with multilingual content</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <Stepper steps={stepperSteps} currentStep={currentStep} />
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {currentStep === 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Product Details</h2>
            
            {/* Hidden fields for payload */}
            <input type="hidden" value={productForm.type} />
            <input type="hidden" value={productForm.categoryId} />

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Type
                </label>
                <Select
                  value={productForm.type}
                  onValueChange={(value: ProductType) => 
                    setProductForm({...productForm, type: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category ID
                </label>
                <Input
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({...productForm, categoryId: e.target.value})}
                  placeholder="Enter category ID"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Content</h2>
            
            <div className="space-y-6">
              <MultilingualRichEditor
                label="Product Title"
                value={productForm.title}
                onChange={(value) => setProductForm({...productForm, title: value})}
                placeholder="Enter product title"
                type="input"
                required
              />

              <MultilingualRichEditor
                label="Product Description"
                value={productForm.description}
                onChange={(value) => setProductForm({...productForm, description: value})}
                placeholder="Enter product description"
                type="textarea"
                rows={6}
                required
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Media & Tags</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image URL
                </label>
                <Input
                  value={productForm.profile_image}
                  onChange={(e) => setProductForm({...productForm, profile_image: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Enter tag"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTag(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Enter tag"]') as HTMLInputElement;
                      if (input) {
                        handleAddTag(input.value);
                        input.value = '';
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {productForm.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-theme-secondary text-theme-primary border border-theme-primary"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-theme-primary hover:text-theme-primary-dark"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Review & Save</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Product Summary</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Type:</strong> {productForm.type}</p>
                <p><strong>Category ID:</strong> {productForm.categoryId}</p>
                <p><strong>Tags:</strong> {productForm.tags.join(', ') || 'None'}</p>
                <p><strong>Profile Image:</strong> {productForm.profile_image || 'None'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Title Preview</h3>
              {Object.entries(productForm.title).map(([lang, text]) => (
                text && (
                  <div key={lang} className="p-2 bg-white border rounded">
                    <span className="text-xs text-gray-500 uppercase">{lang}:</span>
                    <div dangerouslySetInnerHTML={{ __html: text }} />
                  </div>
                )
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Description Preview</h3>
              {Object.entries(productForm.description).map(([lang, text]) => (
                text && (
                  <div key={lang} className="p-2 bg-white border rounded">
                    <span className="text-xs text-gray-500 uppercase">{lang}:</span>
                    <div dangerouslySetInnerHTML={{ __html: text }} />
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentStep === stepperSteps.length - 1 ? (
              <Button onClick={handleSaveProduct} className="bg-theme-primary text-theme-secondary hover:bg-theme-primary-dark">
                <Save className="h-4 w-4 mr-2" />
                Save Product
              </Button>
            ) : (
              <Button onClick={handleNextStep} className="bg-theme-primary text-theme-secondary hover:bg-theme-primary-dark">
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
