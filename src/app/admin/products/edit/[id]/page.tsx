'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MultilingualRichEditor } from '@/components/ui/multilingual-rich-editor';
import { Stepper } from '@/components/ui/stepper';
import { ProductType, MultilingualText, ProductFormData } from '@/lib/types/bibble';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const stepperSteps = [
  { id: 'book', title: 'Book Details' },
  { id: 'story', title: 'Story' },
  { id: 'chapter', title: 'Chapter' },
  { id: 'verse', title: 'Verse' }
];

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [productForm, setProductForm] = useState<ProductFormData>({
    type: 'book',
    title: { en: '', sw: '', fr: '', rn: '' },
    description: { en: '', sw: '', fr: '', rn: '' },
  });

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

  const handleUpdateProduct = () => {
    // Validate required fields
    if (!productForm.title.en.trim()) {
      alert('Please enter a title in English');
      return;
    }

    if (!productForm.description.en.trim()) {
      alert('Please enter a description in English');
      return;
    }

    const updatedProduct = {
      productId: productId,
      type: productForm.type,
      title: productForm.title,
      description: productForm.description,
    };

    console.log('=== UPDATE PRODUCT PAYLOAD ===');
    console.log('Product ID:', productId);
    console.log('Updated Product:', JSON.stringify(updatedProduct, null, 2));
    console.log('Product Form Data:', JSON.stringify(productForm, null, 2));
    console.log('==============================');

    // Here you would typically make an API call
    alert('Product updated successfully!');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/products" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Edit Book</h1>
              <p className="text-gray-600">Update book information and content</p>
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

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-8">
              {currentStep === 0 && (
                <div className="space-y-8">
                  <div className="border-b border-gray-200 pb-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Book Details</h2>
                    <p className="text-gray-600">Upload cover images and basic information for your bible book</p>
                  </div>

                  {/* Content Preview Section */}
                  {(productForm.title.en || productForm.title.sw || productForm.title.fr || productForm.title.rn ||
                    productForm.description.en || productForm.description.sw || productForm.description.fr || productForm.description.rn) && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold text-sm">✓</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Content Preview</h3>
                          <p className="text-sm text-gray-600">Preview of your multilingual content</p>
                        </div>
                      </div>
                      <div className="ml-11">
                        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                          {/* Title Preview */}
                          {(productForm.title.en || productForm.title.sw || productForm.title.fr || productForm.title.rn) && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Title</h4>
                              <div className="space-y-2">
                                {productForm.title.en && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-lg">🇺🇸</span>
                                    <span className="text-gray-700">English:</span>
                                    <div
                                      className="text-gray-900 prose prose-sm max-w-none"
                                      dangerouslySetInnerHTML={{ __html: productForm.title.en }}
                                    />
                                  </div>
                                )}
                                {productForm.title.sw && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-lg">🇹🇿</span>
                                    <span className="text-gray-700">Swahili:</span>
                                    <div
                                      className="text-gray-900 prose prose-sm max-w-none"
                                      dangerouslySetInnerHTML={{ __html: productForm.title.sw }}
                                    />
                                  </div>
                                )}
                                {productForm.title.fr && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-lg">🇫🇷</span>
                                    <span className="text-gray-700">French:</span>
                                    <div
                                      className="text-gray-900 prose prose-sm max-w-none"
                                      dangerouslySetInnerHTML={{ __html: productForm.title.fr }}
                                    />
                                  </div>
                                )}
                                {productForm.title.rn && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-lg">🇷🇼</span>
                                    <span className="text-gray-700">Kinyarwanda:</span>
                                    <div
                                      className="text-gray-900 prose prose-sm max-w-none"
                                      dangerouslySetInnerHTML={{ __html: productForm.title.rn }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Description Preview */}
                          {(productForm.description.en || productForm.description.sw || productForm.description.fr || productForm.description.rn) && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                              <div className="space-y-2">
                                {productForm.description.en && (
                                  <div className="flex items-start gap-2 text-sm">
                                    <span className="text-lg mt-0.5">🇺🇸</span>
                                    <span className="text-gray-700">English:</span>
                                    <div
                                      className="text-gray-900 prose prose-sm max-w-none flex-1"
                                      dangerouslySetInnerHTML={{ __html: productForm.description.en }}
                                    />
                                  </div>
                                )}
                                {productForm.description.sw && (
                                  <div className="flex items-start gap-2 text-sm">
                                    <span className="text-lg mt-0.5">🇹🇿</span>
                                    <span className="text-gray-700">Swahili:</span>
                                    <div
                                      className="text-gray-900 prose prose-sm max-w-none flex-1"
                                      dangerouslySetInnerHTML={{ __html: productForm.description.sw }}
                                    />
                                  </div>
                                )}
                                {productForm.description.fr && (
                                  <div className="flex items-start gap-2 text-sm">
                                    <span className="text-lg mt-0.5">🇫🇷</span>
                                    <span className="text-gray-700">French:</span>
                                    <div
                                      className="text-gray-900 prose prose-sm max-w-none flex-1"
                                      dangerouslySetInnerHTML={{ __html: productForm.description.fr }}
                                    />
                                  </div>
                                )}
                                {productForm.description.rn && (
                                  <div className="flex items-start gap-2 text-sm">
                                    <span className="text-lg mt-0.5">🇷🇼</span>
                                    <span className="text-gray-700">Kinyarwanda:</span>
                                    <div
                                      className="text-gray-900 prose prose-sm max-w-none flex-1"
                                      dangerouslySetInnerHTML={{ __html: productForm.description.rn }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <input type="hidden" name="type" value={productForm.type} />
                  {/* Hidden multilingual fields with HTML content */}
                  <input type="hidden" name="title_en" value={productForm.title.en} />
                  <input type="hidden" name="title_sw" value={productForm.title.sw} />
                  <input type="hidden" name="title_fr" value={productForm.title.fr} />
                  <input type="hidden" name="title_rn" value={productForm.title.rn} />
                  <input type="hidden" name="description_en" value={productForm.description.en} />
                  <input type="hidden" name="description_sw" value={productForm.description.sw} />
                  <input type="hidden" name="description_fr" value={productForm.description.fr} />
                  <input type="hidden" name="description_rn" value={productForm.description.rn} />

                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-8">
                  <div className="border-b border-gray-200 pb-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Story Information</h2>
                    <p className="text-gray-600">Add multilingual title and description for the bible story</p>
                  </div>

                  <div className="space-y-6">
                    <MultilingualRichEditor
                      label="Story Title"
                      value={productForm.title}
                      onChange={(value) => setProductForm({...productForm, title: value})}
                      placeholder="Enter story title"
                      required
                    />

                    <MultilingualRichEditor
                      label="Story Description"
                      value={productForm.description}
                      onChange={(value) => setProductForm({...productForm, description: value})}
                      placeholder="Enter story description"
                      required
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8">
                  <div className="border-b border-gray-200 pb-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Chapter Information</h2>
                    <p className="text-gray-600">Add multilingual title and content for the bible chapter</p>
                  </div>

                  <div className="space-y-6">
                    <MultilingualRichEditor
                      label="Chapter Title"
                      value={productForm.title}
                      onChange={(value) => setProductForm({...productForm, title: value})}
                      placeholder="Enter chapter title"
                      required
                    />

                    <MultilingualRichEditor
                      label="Chapter Content"
                      value={productForm.description}
                      onChange={(value) => setProductForm({...productForm, description: value})}
                      placeholder="Enter chapter content"
                      required
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="border-b border-gray-200 pb-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verse Information</h2>
                    <p className="text-gray-600">Add multilingual title and text for the bible verse</p>
                  </div>

                  <div className="space-y-6">
                    <MultilingualRichEditor
                      label="Verse Title"
                      value={productForm.title}
                      onChange={(value) => setProductForm({...productForm, title: value})}
                      placeholder="Enter verse title"
                      required
                    />

                    <MultilingualRichEditor
                      label="Verse Text"
                      value={productForm.description}
                      onChange={(value) => setProductForm({...productForm, description: value})}
                      placeholder="Enter verse text"
                      required
                    />
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
                className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                Previous
              </Button>

              <div className="flex gap-3">
                {currentStep === stepperSteps.length - 1 ? (
                  <Button
                    onClick={handleUpdateProduct}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Update Book
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextStep}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
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
