'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stepper } from '@/components/ui/stepper';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Save,
  Eye,
  Book,
  FileText,
  BookOpen,
  Hash,
  ChevronDown,
  Package
} from 'lucide-react';
import Link from 'next/link';
import CKEditorComponent from '@/components/CKEditorComponent';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';
import { MultilingualText, ProductManagement, Story, Chapter, Verse, Language } from '@/lib/types/bibble';

const steps = [
  { id: "story", title: "Admin - Stories", icon: FileText },
  { id: "chapter", title: "Admin - Chapters", icon: Book },
  { id: "verse", title: "Admin - Verses", icon: Hash }
];

interface BibleFormData {
  // Story data (step 1)
  story: {
    productId: string;
    title: MultilingualText;
    description: MultilingualText;
    order: number;
  };
  // Chapter data (step 2)
  chapter: {
    storyId: string;
    title: MultilingualText;
    order: number;
  };
  // Verse data (step 3)
  verse: {
    chapterId: string;
    number: number;
    text: MultilingualText;
  };
}

export default function BiblePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Editing states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingContentType, setEditingContentType] = useState<string>("");
  const [editingContentId, setEditingContentId] = useState<string>("");
  
  // Delete confirmation states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductManagement | null>(null);
  
  // Data states
  const [products, setProducts] = useState<ProductManagement[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductManagement | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<BibleFormData>({
    story: {
      productId: '',
      title: {},
      description: {},
      order: 1
    },
    chapter: {
      storyId: '',
      title: {},
      order: 1
    },
    verse: {
      chapterId: '',
      number: 1,
      text: {}
    }
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

        setFormData(prev => ({
          story: {
            ...prev.story,
            title: initializeMultilingualData(),
            description: initializeMultilingualData()
          },
          chapter: {
            ...prev.chapter,
            title: initializeMultilingualData()
          },
          verse: {
            ...prev.verse,
            text: initializeMultilingualData()
          }
        }));
    }
  }, [languages]);

  // Fetch data on component mount
  useEffect(() => {
    fetchProducts();
    fetchLanguages();
    fetchAllBibleContent();
  }, []);

  // Handle URL parameters for editing
  useEffect(() => {
    const step = searchParams.get('step');
    const edit = searchParams.get('edit');
    const id = searchParams.get('id');
    
    if (step) {
      const stepIndex = steps.findIndex(s => s.id === step);
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
        setShowAddForm(true);
      }
    }
    
    if (edit && id) {
      setIsEditMode(true);
      setEditingContentType(edit);
      setEditingContentId(id);
      setShowAddForm(true);
      
      // Navigate to the appropriate step based on content type
      const stepIndex = steps.findIndex(s => s.id === edit);
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
      }
      
      // Load the content for editing
      loadContentForEditing(edit, id);
    }
  }, [searchParams]);

  const loadContentForEditing = async (contentType: string, id: string) => {
    try {
      setIsLoading(true);
      
      switch (contentType) {
        case 'story':
          const storyResponse: any = await ClientInstance.APP.getStoryById(id);
          if (storyResponse?.success && storyResponse?.data) {
            const story = storyResponse.data;
            setFormData(prev => ({
              ...prev,
              story: {
                productId: story.productId || '',
                title: cleanMultilingualData(story.title || {}),
                description: cleanMultilingualData(story.description || {}),
                order: story.order || 1
              }
            }));
          }
          break;
          
        case 'chapter':
          const chapterResponse: any = await ClientInstance.APP.getChapterById(id);
          if (chapterResponse?.success && chapterResponse?.data) {
            const chapter = chapterResponse.data;
            setFormData(prev => ({
              ...prev,
              chapter: {
                storyId: chapter.storyId || '',
                title: cleanMultilingualData(chapter.title || {}),
                order: chapter.order || 1
              }
            }));
          }
          break;
          
        case 'verse':
          const verseResponse: any = await ClientInstance.APP.getVerseById(id);
          if (verseResponse?.success && verseResponse?.data) {
            const verse = verseResponse.data;
            setFormData(prev => ({
              ...prev,
              verse: {
                chapterId: verse.chapterId || '',
                number: verse.number || 1,
                text: cleanMultilingualData(verse.text || {})
              }
            }));
          }
          break;
      }
    } catch (error) {
      console.error("Error loading content for editing:", error);
      showToast.error("Error", "Failed to load content for editing");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllBibleContent = async () => {
    try {
      setIsLoading(true);
      // Fetch all products first
      const productsResponse: any = await ClientInstance.APP.getProducts({ type: 'book' });
      if (productsResponse?.success && productsResponse?.data) {
        setProducts(productsResponse.data);
        
        // Fetch stories for each product
        const allStories: Story[] = [];
        const allChapters: Chapter[] = [];
        const allVerses: Verse[] = [];
        
        for (const product of productsResponse.data) {
          try {
            const storiesResponse: any = await ClientInstance.APP.getStoriesByProduct(product._id);
            if (storiesResponse?.success && storiesResponse?.data) {
              allStories.push(...storiesResponse.data);
              
              // Fetch chapters for each story
              for (const story of storiesResponse.data) {
                try {
                  const chaptersResponse: any = await ClientInstance.APP.getChaptersByStory(story._id);
                  if (chaptersResponse?.success && chaptersResponse?.data) {
                    allChapters.push(...chaptersResponse.data);
                    
                    // Fetch verses for each chapter
                    for (const chapter of chaptersResponse.data) {
                      try {
                        const versesResponse: any = await ClientInstance.APP.getVersesByChapter(chapter._id);
                        if (versesResponse?.success && versesResponse?.data) {
                          allVerses.push(...versesResponse.data);
                        }
                      } catch (error) {
                        console.error(`Error fetching verses for chapter ${chapter._id}:`, error);
                      }
                    }
                  }
                } catch (error) {
                  console.error(`Error fetching chapters for story ${story._id}:`, error);
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching stories for product ${product._id}:`, error);
          }
        }
        
        setStories(allStories);
        setChapters(allChapters);
        setVerses(allVerses);
      }
    } catch (error) {
      console.error("Error fetching Bible content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLanguages = async () => {
    try {
      // Fetch both language names and language codes
      const [languageResponse, languageCodeResponse] = await Promise.all([
        ClientInstance.APP.getLanguage(),
        ClientInstance.APP.getLanguageCode()
      ]);

      if ((languageResponse as any)?.success && (languageResponse as any)?.data) {
        let languagesData = (languageResponse as any).data;
        
        // If we also have language codes, merge them with language data
        if ((languageCodeResponse as any)?.success && (languageCodeResponse as any)?.data) {
          const languageCodes = (languageCodeResponse as any).data;
          
          // Merge language codes with language data
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
      setIsLoading(true);
      const response: any = await ClientInstance.APP.getProducts({ type: 'book' });
      if (response?.success && response?.data) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      showToast.error("Error", "Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStories = async (productId: string) => {
    try {
      const response: any = await ClientInstance.APP.getStoriesByProduct(productId);
      if (response?.success && response?.data) {
        setStories(response.data);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
    }
  };

  const fetchChapters = async (storyId: string) => {
    try {
      const response: any = await ClientInstance.APP.getChaptersByStory(storyId);
      if (response?.success && response?.data) {
        setChapters(response.data);
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
    }
  };

  const isMultilingualFieldComplete = (field: MultilingualText): boolean => {
    return Object.values(field).some(val => val && val.trim() !== '');
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

  const validateCurrentStep = (): boolean => {
    setValidationError("");

    switch (currentStep) {
      case 0: // Story step (Step 1 creates Story)
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
        break;
        
      case 1: // Chapter step (Step 2 creates Chapter)
        if (!formData.chapter.storyId) {
          setValidationError("Please select a story");
          return false;
        }
        if (!isMultilingualFieldComplete(formData.chapter.title)) {
          setValidationError("Please fill in the chapter title in at least one language");
          return false;
        }
        break;
        
      case 2: // Verse step (Step 3 creates Verse)
        if (!formData.verse.chapterId) {
          setValidationError("Please select a chapter");
          return false;
        }
        if (!formData.verse.number || formData.verse.number <= 0) {
          setValidationError("Please enter a valid verse number");
          return false;
        }
        if (!isMultilingualFieldComplete(formData.verse.text)) {
          setValidationError("Please fill in the verse text in at least one language");
          return false;
        }
        break;
    }
    
    return true;
  };

  const handleNextStep = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    try {
      setIsLoading(true);
      
      if (currentStep === 0) {
        // Create or Update Story (Step 1)
        const storyPayload = {
          productId: formData.story.productId,
          title: cleanMultilingualData(formData.story.title),
          description: cleanMultilingualData(formData.story.description),
          order: formData.story.order
        };
        
        let response: any;
        if (isEditMode && editingContentType === 'story') {
          response = await ClientInstance.APP.updateStory(editingContentId, storyPayload);
          if (response?.success) {
            showToast.success("Story Updated", "Story has been updated successfully!");
            setSuccessMessage("Story updated successfully!");
            return; // Don't move to next step when editing
          }
        } else {
          response = await ClientInstance.APP.createStory(storyPayload);
          if (response?.success) {
            showToast.success("Story Created", "Story has been created successfully!");
            setSuccessMessage("Story created successfully! Redirecting back to Bible page...");
            // Redirect back to Bible page after successful creation
            setTimeout(() => {
              router.push('/bible');
            }, 2000);
          }
        }
        
        if (!response?.success) {
          showToast.error("Error", response?.message || "Failed to create/update story");
          return;
        }
      } else if (currentStep === 1) {
        // Create or Update Chapter (Step 2)
        const chapterPayload = {
          storyId: formData.chapter.storyId,
          title: cleanMultilingualData(formData.chapter.title),
          order: formData.chapter.order
        };
        
        let response: any;
        if (isEditMode && editingContentType === 'chapter') {
          response = await ClientInstance.APP.updateChapter(editingContentId, chapterPayload);
          if (response?.success) {
            showToast.success("Chapter Updated", "Chapter has been updated successfully!");
            setSuccessMessage("Chapter updated successfully!");
            return; // Don't move to next step when editing
          }
        } else {
          response = await ClientInstance.APP.createChapter(chapterPayload);
          if (response?.success) {
            showToast.success("Chapter Created", "Chapter has been created successfully!");
            setSuccessMessage("Chapter created successfully! Redirecting back to Bible page...");
            // Redirect back to Bible page after successful creation
            setTimeout(() => {
              router.push('/bible');
            }, 2000);
          }
        }
        
        if (!response?.success) {
          showToast.error("Error", response?.message || "Failed to create/update chapter");
          return;
        }
      } else if (currentStep === 2) {
        // Create or Update Verse (Step 3)
        const versePayload = {
          chapterId: formData.verse.chapterId,
          number: formData.verse.number,
          text: cleanMultilingualData(formData.verse.text)
        };
        
        let response: any;
        if (isEditMode && editingContentType === 'verse') {
          response = await ClientInstance.APP.updateVerse(editingContentId, versePayload);
          if (response?.success) {
            showToast.success("Verse Updated", "Verse has been updated successfully!");
            setSuccessMessage("Verse updated successfully!");
            return; // Don't reset form when editing
          }
        } else {
          response = await ClientInstance.APP.createVerse(versePayload);
          if (response?.success) {
            showToast.success("Verse Created", "Verse has been created successfully!");
            setSuccessMessage("All content created successfully! Redirecting back to Bible page...");
            // Redirect back to Bible page after successful creation
            setTimeout(() => {
              router.push('/bible');
            }, 2000);
          } else {
            showToast.error("Error", response?.message || "Failed to create verse");
            return;
          }
        }
      }
    } catch (error) {
      console.error("Error in handleNextStep:", error);
      showToast.error("Error", "Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setValidationError("");
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p._id === productId);
    setSelectedProduct(product || null);
    setFormData(prev => ({
      ...prev,
      chapter: { ...prev.chapter, productId }
    }));
    setValidationError("");
  };

  const handleStorySelect = (storyId: string) => {
    const story = stories.find(s => s._id === storyId);
    setSelectedStory(story || null);
    setFormData(prev => ({
      ...prev,
      story: { ...prev.story, storyId }
    }));
    setValidationError("");
  };

  const handleChapterSelect = (chapterId: string) => {
    const chapter = chapters.find(c => c._id === chapterId);
    setSelectedChapter(chapter || null);
    setFormData(prev => ({
      ...prev,
      verse: { ...prev.verse, chapterId }
    }));
    setValidationError("");
  };

  const handleAddBible = () => {
    setShowAddForm(true);
    setCurrentStep(0);
    setValidationError("");
    setSuccessMessage("");
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setCurrentStep(0);
    setValidationError("");
    setSuccessMessage("");
    setIsEditMode(false);
    setEditingContentType("");
    setEditingContentId("");
    
    // Reset form data
    const resetMultilingualData = () => {
      const multilingualData: MultilingualText = {};
      languages.forEach((lang: Language) => {
        multilingualData[lang.code] = "";
      });
      return multilingualData;
    };
    
    setFormData({
      story: {
        productId: '',
        title: resetMultilingualData(),
        description: resetMultilingualData(),
        order: 1
      },
      chapter: {
        storyId: '',
        title: resetMultilingualData(),
        order: 1
      },
      verse: {
        chapterId: '',
        number: 1,
        text: resetMultilingualData()
      }
    });
    setSelectedProduct(null);
    setSelectedStory(null);
    setSelectedChapter(null);
    setStories([]);
    setChapters([]);
  };

  const handleEditContent = (contentType: string, id: string) => {
    // Navigate to the stepper with edit parameters
    const url = new URL(window.location.href);
    url.searchParams.set('edit', contentType);
    url.searchParams.set('id', id);
    window.history.pushState({}, '', url.toString());
    
    // Trigger the useEffect for URL parameters
    setIsEditMode(true);
    setEditingContentType(contentType);
    setEditingContentId(id);
    setShowAddForm(true);
    
    // Navigate to the appropriate step
    const stepIndex = steps.findIndex(s => s.id === contentType);
    if (stepIndex !== -1) {
      setCurrentStep(stepIndex);
    }
    
    // Load the content for editing
    loadContentForEditing(contentType, id);
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p._id === productId);
    return product ? (product.title.en || product.title.sw || 'Untitled') : 'Unknown Product';
  };

  const getStoryName = (storyId: string) => {
    const story = stories.find(s => s._id === storyId);
    return story ? (story.title.en || story.title.sw || 'Untitled') : 'Unknown Story';
  };


  const handleDeleteStory = async (storyId: string) => {
    try {
      const response: any = await ClientInstance.APP.deleteStory(storyId);
      if (response?.success) {
        showToast.success("Story Deleted", "Story has been deleted successfully!");
        // Refresh data
        fetchAllBibleContent();
      } else {
        showToast.error("Error", response?.message || "Failed to delete story");
      }
    } catch (error) {
      console.error("Error deleting story:", error);
      showToast.error("Error", "Network error. Please check your connection and try again.");
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    try {
      const response: any = await ClientInstance.APP.deleteChapter(chapterId);
      if (response?.success) {
        showToast.success("Chapter Deleted", "Chapter has been deleted successfully!");
        // Refresh data
        fetchAllBibleContent();
      } else {
        showToast.error("Error", response?.message || "Failed to delete chapter");
      }
    } catch (error) {
      console.error("Error deleting chapter:", error);
      showToast.error("Error", "Network error. Please check your connection and try again.");
    }
  };

  if (showAddForm) {
  return (
      <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
          <div className="mx-auto px-5 py-6 flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={handleCancelAdd}
              className="text-gray-600 hover:text-gray-900"
            >
            <ArrowLeft className="h-6 w-6" />
            </Button>
          <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditMode ? `Edit ${editingContentType.charAt(0).toUpperCase() + editingContentType.slice(1)}` : 'Add Bible Content'}
              </h1>
              <p className="text-gray-500">
                {isEditMode 
                  ? `Edit existing ${editingContentType} content` 
                  : 'Create hierarchical content: Story → Chapter → Verse'
                }
              </p>
          </div>
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500">Step {currentStep + 1} of 3</span>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="mx-auto px-2">
        <Stepper steps={steps} currentStep={currentStep} />

        <div className="mt-10 bg-white border border-gray-100 shadow-md rounded-2xl overflow-hidden">
          <div className="p-10 space-y-8">
            
            {/* STEP 1: STORY CREATION */}
            {currentStep === 0 && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="h-8 w-8 text-theme-primary" />
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Create Story</h2>
                    <p className="text-gray-600">Create a new story under an existing product</p>
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

            {/* STEP 2: CHAPTER CREATION */}
            {currentStep === 1 && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <Book className="h-8 w-8 text-theme-primary" />
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Create Chapter</h2>
                    <p className="text-gray-600">Create a new chapter under the story</p>
                  </div>
                </div>

                {/* Chapter Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                    Chapter Title <span className="text-red-500">*</span>
                    </label>
                    <CKEditorComponent
                    value={formData.chapter.title}
                      onChange={(val) => {
                      setFormData(prev => ({
                        ...prev,
                        chapter: { ...prev.chapter, title: val }
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
                    value={formData.chapter.order}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        chapter: { ...prev.chapter, order: parseInt(e.target.value) || 1 }
                      }));
                      setValidationError("");
                    }}
                    placeholder="Enter chapter order"
                    min="1"
                  />
                </div>
              </>
            )}

            {/* STEP 3: VERSE CREATION */}
            {currentStep === 2 && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <Hash className="h-8 w-8 text-theme-primary" />
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Create Verse</h2>
                    <p className="text-gray-600">Create a new verse under the selected chapter</p>
                  </div>
                </div>

                {/* Chapter Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">
                    Select Chapter <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.verse.chapterId}
                    onValueChange={handleChapterSelect}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a chapter to create verse under" />
                    </SelectTrigger>
                    <SelectContent>
                      {chapters.map((chapter) => (
                        <SelectItem key={chapter._id} value={chapter._id || ''}>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span>{chapter.title.en || chapter.title.sw || 'Untitled'}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Verse Number */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                    Verse Number <span className="text-red-500">*</span>
                    </label>
                  <Input
                      type="number"
                    value={formData.verse.number}
                      onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        verse: { ...prev.verse, number: parseInt(e.target.value) || 1 }
                      }));
                      setValidationError("");
                    }}
                    placeholder="Enter verse number"
                    min="1"
                    />
                  </div>

                {/* Verse Text */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                    Verse Text <span className="text-red-500">*</span>
                    </label>
                    <CKEditorComponent
                    value={formData.verse.text}
                      onChange={(val) => {
                      setFormData(prev => ({
                        ...prev,
                        verse: { ...prev.verse, text: val }
                      }));
                      setValidationError("");
                    }}
                    placeholder="Enter verse text"
                  />
                </div>
              </>
            )}
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

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center px-10 py-6 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStep === 0}
              className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Previous
            </Button>

                  <Button
                    onClick={handleNextStep}
              disabled={isLoading}
              className="px-8 py-3 bg-theme-primary hover:bg-theme-primary text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : currentStep === 2 ? (
                <div className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  Create Verse
                </div>
              ) : (
                'Next Step'
              )}
                  </Button>
          </div>
        </div>
      </div>
    </div>
                );
  }

  // Main list view
                return (
    <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto px-5 py-6 flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Bible Content Management</h1>
            <p className="text-gray-500">Manage your Bible content hierarchy</p>
          </div>
          <div className="flex gap-3">
                  <Button
              onClick={handleAddBible}
              className="bg-theme-primary text-theme-secondary hover:bg-theme-primary-dark flex items-center gap-2"
                  >
              <Plus className="h-4 w-4" />
              Add Bible Content
                  </Button>
            <Link href="/bible/chapters">
              <Button variant="outline" className="flex items-center gap-2">
                <Book className="h-4 w-4" />
                Manage Chapters
              </Button>
            </Link>
            <Link href="/bible/stories">
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Manage Stories
              </Button>
            </Link>
            <Link href="/bible/verses">
              <Button variant="outline" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Manage Verses
              </Button>
            </Link>
          </div>
        </div>
      </div>

        {/* Content Overview - 4 Focus Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Products Overview */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-theme-secondary text-theme-primary flex items-center justify-center">
                <Book className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Products</h3>
                <p className="text-2xl font-bold text-theme-primary">{products.length}</p>
                <p className="text-sm text-gray-500">Books available</p>
              </div>
            </div>
          </div>

          {/* Stories Overview */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-theme-secondary text-theme-primary flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Stories</h3>
                <p className="text-2xl font-bold text-theme-primary">{stories.length}</p>
                <p className="text-sm text-gray-500">Stories created</p>
              </div>
            </div>
          </div>

          {/* Chapters Overview */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-theme-secondary text-theme-primary flex items-center justify-center">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chapters</h3>
                <p className="text-2xl font-bold text-theme-primary">{chapters.length}</p>
                <p className="text-sm text-gray-500">Chapters created</p>
              </div>
            </div>
          </div>

          {/* Verses Overview */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-theme-secondary text-theme-primary flex items-center justify-center">
                <Hash className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Verses</h3>
                <p className="text-2xl font-bold text-theme-primary">{verses.length}</p>
                <p className="text-sm text-gray-500">Verses created</p>
              </div>
            </div>
          </div>
        </div>

      {/* Recent Activity - Unified List/Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        
        {/* Hierarchical Content Flow */}
        <div className="space-y-6">
          {/* Step 1: Choose Product */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-sm font-bold">1</div>
              <h3 className="text-xl font-bold text-gray-900">Choose Product</h3>
            </div>
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                      📖
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-gray-900">PRODUCT</div>
                      <div className="text-sm text-gray-700 space-y-1">
                        {Object.entries(product.title).map(([lang, text]) => (
                          text && (
                            <div key={lang} className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500 uppercase">{lang}:</span>
                              <span dangerouslySetInnerHTML={{ __html: text }} />
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/products/edit/${product._id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductToDelete(product);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {stories.filter(story => story.productId === product._id).length} stories available
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Choose Story */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-sm font-bold">2</div>
              <h3 className="text-xl font-bold text-gray-900">Choose Story</h3>
            </div>
            <div className="space-y-4">
              {stories.map((story) => {
                const product = products.find(p => p._id === story.productId);
                return (
                  <div key={story._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-8 rounded bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">
                        📄
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-gray-900">STORY #{story.order}</div>
                        <div className="text-sm text-gray-700 space-y-1">
                          {Object.entries(story.title).map(([lang, text]) => (
                            text && (
                              <div key={lang} className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-500 uppercase">{lang}:</span>
                                <span dangerouslySetInnerHTML={{ __html: text }} />
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (story._id) handleEditContent('story', story._id);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                  </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStories(prev => prev.filter(s => s._id !== story._id));
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      From: {product?.title.en || 'Unknown Product'} • {chapters.filter(chapter => chapter.storyId === story._id).length} chapters
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

          {/* Step 3: Choose Chapter */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-sm font-bold">3</div>
              <h3 className="text-xl font-bold text-gray-900">Choose Chapter</h3>
            </div>
            <div className="space-y-4">
              {chapters.map((chapter) => {
                const story = stories.find(s => s._id === chapter.storyId);
                const product = products.find(p => p._id === story?.productId);
                return (
                  <div key={chapter._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-8 rounded bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-bold">
                        📑
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-gray-900">CHAPTER #{chapter.order}</div>
                        <div className="text-sm text-gray-700 space-y-1">
                          {Object.entries(chapter.title).map(([lang, text]) => (
                            text && (
                              <div key={lang} className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-500 uppercase">{lang}:</span>
                                <span dangerouslySetInnerHTML={{ __html: text }} />
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                  <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (chapter._id) handleEditContent('chapter', chapter._id);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                  </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setChapters(prev => prev.filter(c => c._id !== chapter._id));
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      From: {story?.title.en || 'Unknown Story'} • {verses.filter(verse => verse.chapterId === chapter._id).length} verses
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

          {/* Step 4: Choose Verse */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-sm font-bold">4</div>
              <h3 className="text-xl font-bold text-gray-900">Choose Verse</h3>
            </div>
            <div className="space-y-4">
              {verses.map((verse) => {
                const chapter = chapters.find(c => c._id === verse.chapterId);
                const story = stories.find(s => s._id === chapter?.storyId);
                const product = products.find(p => p._id === story?.productId);
                return (
                  <div key={verse._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-8 rounded bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-bold">
                        🔢
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-gray-900">VERSE #{verse.number}</div>
                        <div className="text-sm text-gray-700 space-y-1">
                          {Object.entries(verse.text).map(([lang, text]) => (
                            text && (
                              <div key={lang} className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-500 uppercase">{lang}:</span>
                                <span dangerouslySetInnerHTML={{ __html: text }} />
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (verse._id) handleEditContent('verse', verse._id);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVerses(prev => prev.filter(v => v._id !== verse._id));
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      From: {chapter?.title.en || 'Unknown Chapter'} → {story?.title.en || 'Unknown Story'} → {product?.title.en || 'Unknown Product'}
                    </div>
                  </div>
                );
              })}
            </div>
      </div>
    </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No content found</div>
            <p className="text-gray-400 mt-2">
              Get started by adding your first Bible content
            </p>
            <Button 
              onClick={handleAddBible}
              className="bg-red-600 text-white hover:bg-red-700 mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Bible Content
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this product from the list? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setProductToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (productToDelete) {
                  setProducts(prev => prev.filter(p => p._id !== productToDelete._id));
                  showToast.success("Product Removed", "Product has been removed from the list");
                }
                setIsDeleteDialogOpen(false);
                setProductToDelete(null);
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}