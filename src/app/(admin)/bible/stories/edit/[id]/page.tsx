'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stepper } from '@/components/ui/stepper';
import { ArrowLeft, Save, FileText, BookOpen, File } from 'lucide-react';
import CKEditorComponent from '@/components/CKEditorComponent';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';
import { MultilingualText, ProductManagement, Language } from '@/lib/types/bibble';

const steps: any = [
  { id: "story", title: "Story", icon: FileText },
  { id: "chapters", title: "Chapters", icon: BookOpen },
  { id: "verses", title: "Verses", icon: File }
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
  number: number;
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
  
  // Determine current step based on URL path
  const getCurrentStep = () => {
    const path = window.location.pathname;
    if (path.includes('/verses/edit/')) return 2; // Edit Verse
    if (path.includes('/chapters/edit/')) return 1; // Edit Chapter  
    if (path.includes('/stories/edit/')) return 0; // Edit Story
    return 0; // Default to story
  };

  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [originalOrder, setOriginalOrder] = useState<number>(1);
  const [showOrderInput, setShowOrderInput] = useState(false);

  const [products, setProducts] = useState<ProductManagement[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languageNames, setLanguageNames] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState<StoryFormData>({
    story: { productId: '', title: {}, description: {}, order: 1 },
    chapters: [],
    verses: []
  });

  // Initialize multilingual data when languages are loaded
  useEffect(() => {
    if (languages.length > 0 && Object.keys(formData.story.title).length === 0) {
      const initMultilingualData = () => {
        const data: MultilingualText = {};
        languages.forEach(lang => data[lang.code] = "");
        return data;
      };
      setFormData(prev => ({
        ...prev,
        story: { ...prev.story, title: initMultilingualData(), description: initMultilingualData() }
      }));
    }
  }, [languages]);

  // Fetch products, languages, story, chapters, verses
  useEffect(() => {
    fetchProducts();
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (storyId && languages.length > 0) {
      loadStory();
      loadChapters();
      loadVerses();
    }
  }, [storyId, languages]);

  const fetchProducts = async () => {
    try {
      const res: any = await ClientInstance.APP.getProducts({ type: 'book' });
      if (res?.success && res?.data) setProducts(res.data);
    } catch (err) {
      console.error(err);
      showToast.error("Error", "Failed to fetch products");
    }
  };

  const fetchLanguages = async () => {
    try {
      const [langRes, codeRes]:any = await Promise.all([
        ClientInstance.APP.getLanguage(),
        ClientInstance.APP.getLanguageCode()
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

  const loadStory = async () => {
    if (!storyId) return;
    try {
      setIsLoading(true);
      const res: any = await ClientInstance.APP.getStoryById(storyId);
      if (res?.success && res?.data) {
        const story = res.data;
        setFormData(prev => ({
          ...prev,
          story: {
            productId: typeof story.productId === 'object' ? story.productId._id : story.productId,
            title: story.title || {},
            description: story.description || {},
            order: story.order || 1
          }
        }));
        setOriginalOrder(story.order || 1); // Store original order
        setDataLoaded(true);
      } else {
        showToast.error("Error", res?.message || "Failed to load story");
      }
    } catch (err) {
      console.error(err);
      showToast.error("Error", "Failed to load story data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadChapters = async () => {
    try {
      const response: any = await ClientInstance.APP.getChaptersByStory(storyId);
      if (response?.success && response?.data) {
        setFormData(prev => ({ ...prev, chapters: response.data }));
      } else {
        setFormData(prev => ({ ...prev, chapters: [] }));
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
      setFormData(prev => ({ ...prev, chapters: [] }));
    }
  };

  const loadVerses = async () => {
    try {
      // Get verses for the first chapter if available
      const firstChapter = formData.chapters[0];
      if (firstChapter?._id) {
        const response: any = await ClientInstance.APP.getVersesByChapter(firstChapter._id);
        if (response?.success && response?.data) {
          setFormData(prev => ({ ...prev, verses: response.data }));
        } else {
          setFormData(prev => ({ ...prev, verses: [] }));
        }
      } else {
        setFormData(prev => ({ ...prev, verses: [] }));
      }
    } catch (error) {
      console.error('Error loading verses:', error);
      setFormData(prev => ({ ...prev, verses: [] }));
    }
  };

  const cleanMultilingualData = (data: MultilingualText) => {
    const cleaned: MultilingualText = {};
    Object.entries(data).forEach(([k, v]) => {
      // Exclude Hindi language (hi) from payload
      if (k !== 'hi' && v && v.trim() !== '') cleaned[k] = v;
    });
    return cleaned;
  };

  const isMultilingualFieldComplete = (field: MultilingualText) => {
    return Object.values(field).some(val => val && val.trim() !== '');
  };

  const validateForm = (): boolean => {
    setValidationError("");
    if (!formData.story.productId) { setValidationError("Please select a product"); return false; }
    if (!isMultilingualFieldComplete(formData.story.title)) { setValidationError("Please fill in the story title in at least one language"); return false; }
    if (!isMultilingualFieldComplete(formData.story.description)) { setValidationError("Please fill in the story description in at least one language"); return false; }
    return true;
  };

  const getNextStoryOrder = async (productId: string) => {
    try {
      const res: any = await ClientInstance.APP.getStoriesByProduct(productId);
      if (res?.success && res?.data) {
        const maxOrder = Math.max(...res.data.map((s: any) => s.order || 0), 0);
        return maxOrder + 1;
      }
      return 1;
    } catch (err) {
      console.error(err);
      return 1;
    }
  };

  const handleUpdateStory = async () => {
    if (!validateForm()) return;
    try {
      setIsLoading(true);
      
      // Check if order has changed
      const orderChanged = formData.story.order !== originalOrder;
      
      const payload = {
        productId: formData.story.productId,
        title: cleanMultilingualData(formData.story.title),
        description: cleanMultilingualData(formData.story.description),
        ...(orderChanged && { order: formData.story.order }) // Only include order if it changed
      };
      
      const res: any = await ClientInstance.APP.updateStory(storyId, payload);
      if (res?.success) {
        showToast.success("Story Updated", "Story has been updated successfully!");
        setSuccessMessage("Story updated successfully! Moving to next step...");
        setTimeout(() => {
          setCurrentStep(1); // Go to next step (Chapters)
          setSuccessMessage(""); // Clear success message
        }, 1500);
      } else {
        showToast.error("Error", res?.message || "Failed to update story");
      }
    } catch (err) {
      console.error(err);
      showToast.error("Error", "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToBible = () => router.push('/bible');

  const nextStep = async () => {
    const newStep = Math.min(currentStep + 1, steps.length - 1);
    
    if (newStep === 1) {
      // Moving to chapters step
      await loadChapters();
      // Check if chapters exist
      if (formData.chapters.length === 0) {
        // No chapters exist, redirect to create chapter page
        router.push(`/bible/chapters/add?storyId=${storyId}`);
        return;
      }
    } else if (newStep === 2) {
      // Moving to verses step
      await loadVerses();
      // Check if verses exist
      if (formData.verses.length === 0) {
        // No verses exist, redirect to create verse page
        router.push(`/bible/verses/add?chapterId=${formData.chapters[0]?._id}`);
        return;
      }
    }
    
    setCurrentStep(newStep);
  };
  
  const previousStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  return (
    <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto px-5 py-6 flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToBible} className="text-gray-600 hover:text-gray-900">
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
        <Stepper steps={steps} currentStep={getCurrentStep()} />

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
              {/* Step 0: Story */}
              {currentStep === 0 && dataLoaded && (
                <form onSubmit={(e) => e.preventDefault()}>
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
                        setFormData(prev => ({ ...prev, story: { ...prev.story, productId: value } }));
                        setValidationError("");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a product">
                          {formData.story.productId && (() => {
                            const selectedProduct = products.find(p => p._id === formData.story.productId);
                            if (selectedProduct) {
                              const firstTitle = Object.values(selectedProduct.title || {})[0] || '';
                              return stripHtmlTags(firstTitle);
                            }
                            return '';
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p._id} value={p._id}>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span>📖</span>
                                <span className="font-medium">Product:</span>
                              </div>
                              {/* Product Title - All Languages */}
                              {Object.entries(p.title || {}).map(([lang, text]) => (
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

                  {/* Story Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Story Title <span className="text-red-500">*</span>
                    </label>
                    <div onKeyDown={(e) => e.stopPropagation()}>
                      <CKEditorComponent
                        value={formData.story.title}
                        onChange={(val) => {
                          setIsTyping(true);
                          setFormData(prev => ({ ...prev, story: { ...prev.story, title: val } }));
                          setValidationError("");
                          setTimeout(() => setIsTyping(false), 1000);
                        }}
                        placeholder="Enter story title in multiple languages"
                      />
                    </div>
                  </div>

                  {/* Story Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Story Description <span className="text-red-500">*</span>
                    </label>
                    <div onKeyDown={(e) => e.stopPropagation()}>
                      <CKEditorComponent
                        value={formData.story.description}
                        onChange={(val) => {
                          setIsTyping(true);
                          setFormData(prev => ({ ...prev, story: { ...prev.story, description: val } }));
                          setValidationError("");
                          setTimeout(() => setIsTyping(false), 1000);
                        }}
                        placeholder="Enter story description in multiple languages"
                      />
                    </div>
                  </div>

                  {/* Story Order - Optional */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Story Order (Optional)
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowOrderInput(!showOrderInput)}
                        className="text-xs"
                      >
                        {showOrderInput ? 'Hide' : 'Change Order'}
                      </Button>
                    </div>
                    {showOrderInput && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={formData.story.order}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              story: { ...prev.story, order: parseInt(e.target.value) || 1 }
                            }));
                          }}
                          placeholder="Enter story order"
                          min="1"
                          className="w-32"
                        />
                        <span className="text-sm text-gray-500">
                          Current: {originalOrder}
                        </span>
                      </div>
                    )}
                    {!showOrderInput && (
                      <div className="text-sm text-gray-500">
                        Current order: {originalOrder} (click "Change Order" to modify)
                      </div>
                    )}
                  </div>
                </form>
              )}

              {/* Step 1: Chapters */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <BookOpen className="h-8 w-8 text-theme-primary" />
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">Edit Chapters</h2>
                      <p className="text-gray-600">Manage chapters for this story</p>
                    </div>
                  </div>

                  {/* Chapters List */}
                  {formData.chapters.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Existing Chapters</h3>
                      {formData.chapters.map((chapter, index) => (
                        <div key={chapter._id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-gray-500">Chapter {chapter.order}</span>
                                <span className="text-sm text-gray-400">•</span>
                                <span className="text-sm text-gray-500">ID: {chapter._id}</span>
                              </div>
                              {/* Chapter Title - All Languages */}
                              {Object.entries(chapter.title || {}).map(([lang, text]) => (
                                <div key={lang} className="text-sm text-gray-700 mb-1">
                                  <span className="text-gray-500 font-medium">
                                    {getLanguageName(lang)}:
                                  </span>
                                  <span 
                                    className="ml-2"
                                    title={text}
                                  >
                                    {stripHtmlTags(text)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/bible/chapters/edit/${chapter._id}`)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Chapters Found</h3>
                      <p className="text-gray-600 mb-4">This story doesn't have any chapters yet.</p>
                      <Button
                        onClick={() => router.push(`/bible/chapters/add?storyId=${storyId}`)}
                        className="bg-theme-primary hover:bg-theme-primary text-white"
                      >
                        Create First Chapter
                      </Button>
                    </div>
                  )}

                  {/* Add New Chapter Button */}
                  {formData.chapters.length > 0 && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/bible/chapters/add?storyId=${storyId}`)}
                        className="border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-white"
                      >
                        Add New Chapter
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Verses */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <File className="h-8 w-8 text-theme-primary" />
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">Edit Verses</h2>
                      <p className="text-gray-600">Manage verses for this story</p>
                    </div>
                  </div>

                  {/* Verses List */}
                  {formData.verses.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Existing Verses</h3>
                      {formData.verses.map((verse, index) => (
                        <div key={verse._id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-gray-500">Verse {verse.number}</span>
                                <span className="text-sm text-gray-400">•</span>
                                <span className="text-sm text-gray-500">ID: {verse._id}</span>
                              </div>
                              {/* Verse Text - All Languages */}
                              {Object.entries(verse.text || {}).map(([lang, text]) => (
                                <div key={lang} className="text-sm text-gray-700 mb-1">
                                  <span className="text-gray-500 font-medium">
                                    {getLanguageName(lang)}:
                                  </span>
                                  <span 
                                    className="ml-2"
                                    title={text}
                                  >
                                    {stripHtmlTags(text)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/bible/verses/edit/${verse._id}`)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Verses Found</h3>
                      <p className="text-gray-600 mb-4">This story doesn't have any verses yet.</p>
                      {formData.chapters.length > 0 ? (
                        <Button
                          onClick={() => router.push(`/bible/verses/add?chapterId=${formData.chapters[0]._id}`)}
                          className="bg-theme-primary hover:bg-theme-primary text-white"
                        >
                          Create First Verse
                        </Button>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Please create chapters first before adding verses.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add New Verse Button */}
                  {formData.verses.length > 0 && formData.chapters.length > 0 && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/bible/verses/add?chapterId=${formData.chapters[0]._id}`)}
                        className="border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-white"
                      >
                        Add New Verse
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Validation Error */}
              {validationError && (
                <div className="mx-10 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-600 text-sm font-medium">⚠️ {validationError}</div>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="mx-10 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-green-600 text-sm font-medium">✅ {successMessage}</div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center py-6 border-t border-gray-200">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleBackToBible} className="py-3 border-gray-300 text-gray-700 hover:bg-gray-100">
                    Cancel
                  </Button>
                  {currentStep > 0 && (
                    <Button variant="outline" onClick={previousStep} className="py-3 border-gray-300 text-gray-700 hover:bg-gray-100">
                      Previous
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {currentStep === 0 && (
                    <Button onClick={handleUpdateStory} disabled={isLoading} className="py-3 bg-theme-primary hover:bg-theme-primary text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50">
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
                  )}
                  {currentStep > 0 && currentStep < steps.length - 1 && (
                    <Button onClick={nextStep} className="px-6 py-3 bg-theme-primary hover:bg-theme-primary text-white font-semibold rounded-lg shadow-md transition-colors">
                      Next
                    </Button>
                  )}
                  {currentStep === steps.length - 1 && (
                    <Button onClick={handleBackToBible} className="py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-colors">
                      <div className="flex items-center gap-2">
                        <Save className="h-5 w-5" />
                        Finish
                      </div>
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
