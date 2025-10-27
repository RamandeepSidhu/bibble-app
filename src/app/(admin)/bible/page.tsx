"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Save,
  Book,
  FileText,
  BookOpen,
  Hash,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import CKEditorComponent from "@/components/CKEditorComponent";
import ClientInstance from "@/shared/client";
import { showToast } from "@/lib/toast";
import {
  MultilingualText,
  ProductManagement,
  Story,
  Chapter,
  Verse,
  Language,
} from "@/lib/types/bibble";
import {
  getNextStoryOrder,
  getNextChapterOrder,
  getNextVerseNumber,
} from "@/lib/utils/order-utils";

const steps = [
  { id: "story", title: "Stories", icon: FileText },
  { id: "chapter", title: "Chapters", icon: Book },
  { id: "verse", title: "Verses", icon: Hash },
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [validationError, setValidationError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Delete confirmation states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] =
    useState<ProductManagement | null>(null);

  // Data states
  const [products, setProducts] = useState<ProductManagement[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languageNames, setLanguageNames] = useState<{ [key: string]: string }>(
    {}
  );
  const [selectedProduct, setSelectedProduct] =
    useState<ProductManagement | null>(null);

  // Accordion state management
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
    new Set()
  );
  const [expandedStories, setExpandedStories] = useState<Set<string>>(
    new Set()
  );
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set()
  );

  // Language filter state
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");

  // Track created content IDs for edit mode
  const [createdStoryId, setCreatedStoryId] = useState<string | null>(null);
  const [createdChapterId, setCreatedChapterId] = useState<string | null>(null);
  const [createdVerseId, setCreatedVerseId] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState<BibleFormData>({
    story: {
      productId: "",
      title: {},
      description: {},
      order: 1,
    },
    chapter: {
      storyId: "",
      title: {},
      order: 1,
    },
    verse: {
      chapterId: "",
      number: 1,
      text: {},
    },
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
          description: initializeMultilingualData(),
        },
        chapter: {
          ...prev.chapter,
          title: initializeMultilingualData(),
        },
        verse: {
          ...prev.verse,
          text: initializeMultilingualData(),
        },
      }));
    }
  }, [languages]);

  // Fetch data on component mount
  useEffect(() => {
    fetchProducts();
    fetchLanguages();
    fetchAllBibleContent();
  }, []);

  // Handle URL parameters for stepper navigation
  useEffect(() => {
    const step = searchParams.get("step");

    if (step) {
      const stepIndex = steps.findIndex((s) => s.id === step);
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
        setShowAddForm(true);
      }
    }
  }, [searchParams]);

  const fetchAllBibleContent = async () => {
    try {
      setIsLoading(true);
      // Fetch all products first
      const productsResponse: any = await ClientInstance.APP.getProducts({
        type: "book",
      });
      if (productsResponse?.success && productsResponse?.data) {
        setProducts(productsResponse.data);

        // Fetch stories for each product
        const allStories: Story[] = [];
        const allChapters: Chapter[] = [];
        const allVerses: Verse[] = [];

        for (const product of productsResponse.data) {
          try {
            const storiesResponse: any =
              await ClientInstance.APP.getStoriesByProduct(product._id);
            if (storiesResponse?.success && storiesResponse?.data) {
              allStories.push(...storiesResponse.data);

              // Fetch chapters for each story
              for (const story of storiesResponse.data) {
                try {
                  const chaptersResponse: any =
                    await ClientInstance.APP.getChaptersByStory(story._id);
                  if (chaptersResponse?.success && chaptersResponse?.data) {
                    allChapters.push(...chaptersResponse.data);

                    // Fetch verses for each chapter
                    for (const chapter of chaptersResponse.data) {
                      try {
                        const versesResponse: any =
                          await ClientInstance.APP.getVersesByChapter(
                            chapter._id
                          );
                        if (versesResponse?.success && versesResponse?.data) {
                          allVerses.push(...versesResponse.data);
                        }
                      } catch (error) {
                        console.error(
                          `Error fetching verses for chapter ${chapter._id}:`,
                          error
                        );
                      }
                    }
                  }
                } catch (error) {
                  console.error(
                    `Error fetching chapters for story ${story._id}:`,
                    error
                  );
                }
              }
            }
          } catch (error) {
            console.error(
              `Error fetching stories for product ${product._id}:`,
              error
            );
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
      setIsInitialLoading(false);
    }
  };

  const fetchLanguages = async () => {
    try {
      // Fetch both language names and language codes
      const [languageResponse, languageCodeResponse] = await Promise.all([
        ClientInstance.APP.getLanguage(),
        ClientInstance.APP.getLanguageCode(),
      ]);

      if (
        (languageResponse as any)?.success &&
        (languageResponse as any)?.data
      ) {
        let languagesData = (languageResponse as any).data;

        // If we also have language codes, merge them with language data
        if (
          (languageCodeResponse as any)?.success &&
          (languageCodeResponse as any)?.data
        ) {
          const languageCodes = (languageCodeResponse as any).data;

          // Merge language codes with language data
          languagesData = languagesData.map((lang: any) => {
            const matchingCode = languageCodes.find(
              (code: any) => code.code === lang.code || code.name === lang.name
            );
            return {
              ...lang,
              code: matchingCode?.code || lang.code,
              name: lang.name,
              flag: lang.flag || "🌐",
            };
          });
        }

        // Filter out Hindi language from available languages and only show active languages
        const filteredLangs = languagesData.filter(
          (lang: any) => lang.code !== "hi" && lang.isActive === true
        );
        setLanguages(filteredLangs);

        // Create language names mapping for display (excluding Hindi)
        const namesMapping: { [key: string]: string } = {};
        filteredLangs.forEach((lang: any) => {
          if (lang.code && lang.name) {
            namesMapping[lang.code] = lang.name;
          }
        });
        setLanguageNames(namesMapping);
      }
    } catch (error) {
      console.error("Error fetching languages:", error);
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
    return html.replace(/<[^>]*>/g, "");
  };

  // Accordion toggle functions
  const toggleProduct = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const toggleStory = (storyId: string) => {
    const newExpanded = new Set(expandedStories);
    if (newExpanded.has(storyId)) {
      newExpanded.delete(storyId);
    } else {
      newExpanded.add(storyId);
    }
    setExpandedStories(newExpanded);
  };

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response: any = await ClientInstance.APP.getProducts({
        type: "book",
      });
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
      const response: any = await ClientInstance.APP.getStoriesByProduct(
        productId
      );
      if (response?.success && response?.data) {
        setStories(response.data);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
    }
  };

  const fetchChapters = async (storyId: string) => {
    try {
      const response: any = await ClientInstance.APP.getChaptersByStory(
        storyId
      );
      if (response?.success && response?.data) {
        setChapters(response.data);
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
    }
  };

  const isMultilingualFieldComplete = (field: MultilingualText): boolean => {
    // Get all available languages from the languages state
    const availableLanguages = languages.map((lang) => lang.code);

    // Check if all available languages have content
    return availableLanguages.every(
      (lang) => field[lang] && field[lang].trim() !== ""
    );
  };

  const cleanMultilingualData = (data: MultilingualText): MultilingualText => {
    const cleaned: MultilingualText = {};
    Object.entries(data).forEach(([key, value]) => {
      // Exclude Hindi language (hi) from payload
      if (key !== "hi" && value && value.trim() !== "") {
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
          setValidationError("Please fill in the story title in all languages");
          return false;
        }
        if (!isMultilingualFieldComplete(formData.story.description)) {
          setValidationError(
            "Please fill in the story description in all languages"
          );
          return false;
        }
        break;

      case 1: // Chapter step (Step 2 creates Chapter)
        if (!formData.chapter.storyId) {
          setValidationError("Please select a story");
          return false;
        }
        if (!isMultilingualFieldComplete(formData.chapter.title)) {
          setValidationError(
            "Please fill in the chapter title in all languages"
          );
          return false;
        }
        break;

      case 2: // Verse step (Step 3 creates Verse)
        if (!formData.verse.chapterId) {
          setValidationError("Please select a chapter");
          return false;
        }
        // Verse number is auto-calculated, no validation needed
        if (!isMultilingualFieldComplete(formData.verse.text)) {
          setValidationError("Please fill in the verse text in all languages");
          return false;
        }
        break;
    }

    return true;
  };

  // Smart ordering - finds gaps in sequence
  const getNextStoryOrderSmart = async (productId: string) => {
    return await getNextStoryOrder(productId, ClientInstance);
  };

  // Smart ordering for chapters
  const getNextChapterOrderSmart = async (storyId: string) => {
    return await getNextChapterOrder(storyId, ClientInstance);
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
        };

        let response: any;
        if (createdStoryId) {
          // Update existing story
          response = await ClientInstance.APP.updateStory(
            createdStoryId,
            storyPayload
          );
        } else {
          // Create new story
          const nextOrder = await getNextStoryOrderSmart(
            formData.story.productId
          );
          response = await ClientInstance.APP.createStory({
            ...storyPayload,
            order: nextOrder,
          });
        }
        if (response?.success) {
          const storyId = response.data._id || response.data.id;

          if (createdStoryId) {
            showToast.success(
              "Story Updated",
              "Story has been updated successfully!"
            );
            setSuccessMessage(
              "Story updated successfully! Moving to next step..."
            );
          } else {
            showToast.success(
              "Story Created",
              "Story has been created successfully!"
            );
            setSuccessMessage(
              "Story created successfully! Moving to next step..."
            );
            setCreatedStoryId(storyId);
          }

          // Update form data with the story ID and move to next step
          setFormData((prev) => ({
            ...prev,
            chapter: {
              ...prev.chapter,
              storyId: storyId,
            },
          }));
          // Move to next step after a short delay to ensure state is updated
          setTimeout(() => {
            setCurrentStep(1);
            setSuccessMessage("");
          }, 1000);
        }

        if (!response?.success) {
          showToast.error(
            "Error",
            response?.message || "Failed to create/update story"
          );
          return;
        }
      } else if (currentStep === 1) {
        // Create or Update Chapter (Step 2)
        const chapterPayload = {
          storyId: formData.chapter.storyId,
          title: cleanMultilingualData(formData.chapter.title),
        };

        let response: any;
        if (createdChapterId) {
          // Update existing chapter
          response = await ClientInstance.APP.updateChapter(
            createdChapterId,
            chapterPayload
          );
        } else {
          // Create new chapter
          const nextOrder = await getNextChapterOrderSmart(
            formData.chapter.storyId
          );
          response = await ClientInstance.APP.createChapter({
            ...chapterPayload,
            order: nextOrder,
          });
        }
        if (response?.success) {
          const chapterId = response.data._id || response.data.id;

          if (createdChapterId) {
            showToast.success(
              "Chapter Updated",
              "Chapter has been updated successfully!"
            );
            setSuccessMessage(
              "Chapter updated successfully! Moving to next step..."
            );
          } else {
            showToast.success(
              "Chapter Created",
              "Chapter has been created successfully!"
            );
            setSuccessMessage(
              "Chapter created successfully! Moving to next step..."
            );
            setCreatedChapterId(chapterId);
          }

          // Update form data with the chapter ID and move to next step
          setFormData((prev) => ({
            ...prev,
            verse: {
              ...prev.verse,
              chapterId: chapterId,
            },
          }));
          // Move to next step after a short delay to ensure state is updated
          setTimeout(() => {
            setCurrentStep(2);
            setSuccessMessage("");
          }, 1500);
        }

        if (!response?.success) {
          showToast.error(
            "Error",
            response?.message || "Failed to create/update chapter"
          );
          return;
        }
      } else if (currentStep === 2) {
        // Create or Update Verse (Step 3)
        const versePayload = {
          chapterId: formData.verse.chapterId,
          text: cleanMultilingualData(formData.verse.text),
        };

        let response: any;
        if (createdVerseId) {
          // Update existing verse
          response = await ClientInstance.APP.updateVerse(
            createdVerseId,
            versePayload
          );
        } else {
          // Create new verse
          const nextNumber = await getNextVerseNumber(
            formData.verse.chapterId,
            ClientInstance
          );
          response = await ClientInstance.APP.createVerse({
            ...versePayload,
            number: nextNumber,
          });
        }
        if (response?.success) {
          const verseId = response.data._id || response.data.id;

          if (createdVerseId) {
            showToast.success(
              "Verse Updated",
              "Verse has been updated successfully!"
            );
            setSuccessMessage(
              "All content updated successfully! Redirecting back to Bible page..."
            );
          } else {
            showToast.success(
              "Verse Created",
              "Verse has been created successfully!"
            );
            setSuccessMessage(
              "All content created successfully! Redirecting back to Bible page..."
            );
            setCreatedVerseId(verseId);
          }

          // Redirect back to Bible page after successful creation/update
          setTimeout(() => {
            router.push("/bible");
          }, 2000);
        } else {
          showToast.error(
            "Error",
            response?.message || "Failed to create verse"
          );
          return;
        }
      }
    } catch (error) {
      console.error("Error in handleNextStep:", error);
      showToast.error(
        "Error",
        "Network error. Please check your connection and try again."
      );
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

  // Reset created IDs when starting new Bible creation
  const resetCreatedIds = () => {
    setCreatedStoryId(null);
    setCreatedChapterId(null);
    setCreatedVerseId(null);
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    setSelectedProduct(product || null);
    setFormData((prev) => ({
      ...prev,
      story: {
        ...prev.story,
        productId: productId,
      },
    }));
    setValidationError("");
    // Reset created IDs when selecting a new product
    resetCreatedIds();
  };

  const handleStorySelect = (storyId: string) => {
    setFormData((prev) => ({
      ...prev,
      story: { ...prev.story, storyId },
    }));
    setValidationError("");
  };

  const handleChapterSelect = (chapterId: string) => {
    setFormData((prev) => ({
      ...prev,
      verse: { ...prev.verse, chapterId },
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

    // Clear URL parameters
    const url = new URL(window.location.href);
    url.searchParams.delete("edit");
    url.searchParams.delete("id");
    window.history.pushState({}, "", url.toString());

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
        productId: "",
        title: resetMultilingualData(),
        description: resetMultilingualData(),
        order: 1,
      },
      chapter: {
        storyId: "",
        title: resetMultilingualData(),
        order: 1,
      },
      verse: {
        chapterId: "",
        number: 1,
        text: resetMultilingualData(),
      },
    });
    setSelectedProduct(null);
    setStories([]);
    setChapters([]);
  };

  const handleBackToBible = () => {
    // Clear URL parameters and reset edit mode
    const url = new URL(window.location.href);
    url.searchParams.delete("edit");
    url.searchParams.delete("id");
    window.history.pushState({}, "", url.toString());
    setShowAddForm(false);
    setCurrentStep(0);
    setValidationError("");
    setSuccessMessage("");

    // Refresh all data
    setIsLoading(true);
    fetchAllBibleContent();
  };

  const handleEditContent = (contentType: string, id: string) => {
    // Navigate to the dedicated edit pages
    switch (contentType) {
      case "story":
        router.push(`/bible/stories/edit/${id}`);
        break;
      case "chapter":
        router.push(`/bible/chapters/edit/${id}`);
        break;
      case "verse":
        router.push(`/bible/verses/edit/${id}`);
        break;
      default:
        console.error("Unknown content type:", contentType);
    }
  };

  const getStoryName = (storyId: string) => {
    const story = stories.find((s) => s._id === storyId);
    return story
      ? story.title.en || story.title.sw || "Untitled"
      : "Unknown Story";
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      const response: any = await ClientInstance.APP.deleteStory(storyId);
      if (response?.success) {
        showToast.success(
          "Story Deleted",
          "Story has been deleted successfully!"
        );
        // Refresh data
        fetchAllBibleContent();
      } else {
        showToast.error("Error", response?.message || "Failed to delete story");
      }
    } catch (error) {
      console.error("Error deleting story:", error);
      showToast.error(
        "Error",
        "Network error. Please check your connection and try again."
      );
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    try {
      const response: any = await ClientInstance.APP.deleteChapter(chapterId);
      if (response?.success) {
        showToast.success(
          "Chapter Deleted",
          "Chapter has been deleted successfully!"
        );
        // Refresh data
        fetchAllBibleContent();
      } else {
        showToast.error(
          "Error",
          response?.message || "Failed to delete chapter"
        );
      }
    } catch (error) {
      console.error("Error deleting chapter:", error);
      showToast.error(
        "Error",
        "Network error. Please check your connection and try again."
      );
    }
  };

  if (showAddForm) {
    return (
      <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="border-b border-gray-100 bg-white">
          <div className="mx-auto px-5 py-6 flex items-center gap-4">
            <button
              onClick={handleBackToBible}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                Add Bible Content
              </h1>
              <p className="text-gray-500">
                Create hierarchical content: Story → Chapter → Verse
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500">
                Step {currentStep + 1} of 3
              </span>
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
                      <h2 className="text-2xl font-semibold text-gray-900">
                        Create Story
                      </h2>
                      <p className="text-gray-600">
                        Create a new story under an existing product
                      </p>
                    </div>
                  </div>

                  {/* Product Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Select Product (Book){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.story.productId}
                      onValueChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          story: { ...prev.story, productId: value },
                        }));
                        setValidationError("");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a product to create story under">
                          {formData.story.productId &&
                            (() => {
                              const selectedProduct = products.find(
                                (p) => p._id === formData.story.productId
                              );
                              if (selectedProduct) {
                                const firstTitle =
                                  Object.values(
                                    selectedProduct.title || {}
                                  )[0] || "";
                                return stripHtmlTags(firstTitle);
                              }
                              return "";
                            })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product._id} value={product._id}>
                            <div className="flex items-center gap-2">
                              <span>📖</span>
                              <span>
                                {stripHtmlTags(
                                  product.title.en ||
                                    product.title.sw ||
                                    "Untitled"
                                )}
                              </span>
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
                        setFormData((prev) => ({
                          ...prev,
                          story: { ...prev.story, title: val },
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
                        setFormData((prev) => ({
                          ...prev,
                          story: { ...prev.story, description: val },
                        }));
                        setValidationError("");
                      }}
                      placeholder="Enter story description in multiple languages"
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
                      <h2 className="text-2xl font-semibold text-gray-900">
                        Create Chapter
                      </h2>
                      <p className="text-gray-600">
                        Create a new chapter under the story
                      </p>
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
                        setFormData((prev) => ({
                          ...prev,
                          chapter: { ...prev.chapter, title: val },
                        }));
                        setValidationError("");
                      }}
                      placeholder="Enter chapter title"
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
                      <h2 className="text-2xl font-semibold text-gray-900">
                        Create Verse
                      </h2>
                      <p className="text-gray-600">
                        Create a new verse under the selected chapter
                      </p>
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
                        <SelectValue placeholder="Choose a chapter to create verse under">
                          {formData.verse.chapterId &&
                            (() => {
                              const selectedChapter = chapters.find(
                                (c) => c._id === formData.verse.chapterId
                              );
                              if (selectedChapter) {
                                const firstTitle =
                                  Object.values(
                                    selectedChapter.title || {}
                                  )[0] || "";
                                return stripHtmlTags(firstTitle);
                              }
                              return "";
                            })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {chapters.map((chapter) => (
                          <SelectItem
                            key={chapter._id}
                            value={chapter._id || ""}
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                <span className="font-medium">Chapter:</span>
                              </div>
                              {/* Chapter Title - All Languages */}
                              {Object.entries(chapter.title || {}).map(
                                ([lang, text]) => (
                                  <div
                                    key={lang}
                                    className="text-xs text-gray-600 flex gap-1 ml-4"
                                  >
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
                                )
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Verse Text */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Verse Text <span className="text-red-500">*</span>
                    </label>
                    <CKEditorComponent
                      value={formData.verse.text}
                      onChange={(val) => {
                        setFormData((prev) => ({
                          ...prev,
                          verse: { ...prev.verse, text: val },
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
            <div className="flex justify-between items-center py-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                className=" py-3 border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Previous
              </Button>

              <Button
                onClick={handleNextStep}
                disabled={isLoading}
                className="py-3 bg-theme-primary hover:bg-theme-primary text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : currentStep === 2 ? (
                  <div className="flex items-center gap-2">
                    <Save className="h-5 w-5" />
                    {createdVerseId ? "Update Verse" : "Create Verse"}
                  </div>
                ) : currentStep === 1 ? (
                  createdChapterId ? (
                    "Update Chapter"
                  ) : (
                    "Next Step"
                  )
                ) : currentStep === 0 ? (
                  createdStoryId ? (
                    "Update Story"
                  ) : (
                    "Next Step"
                  )
                ) : (
                  "Next Step"
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
    <div
      className={`min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8 ${
        products.length === 0 && !isLoading ? "bg-transparent" : "bg-white"
      }`}
    >
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="mx-auto px-5 py-6 flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              Bible Content Management
            </h1>
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

            <Link href="/bible/stories">
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                View Stories
              </Button>
            </Link>
            <Link href="/bible/chapters">
              <Button variant="outline" className="flex items-center gap-2">
                <Book className="h-4 w-4" />
                View Chapters
              </Button>
            </Link>
            <Link href="/bible/verses">
              <Button variant="outline" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                View Verses
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content Overview - Only show if there are products and not loading */}
      {!isInitialLoading && products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Products Overview */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-theme-secondary text-theme-primary flex items-center justify-center">
                <Book className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Products
                </h3>
                <p className="text-2xl font-bold text-theme-primary">
                  {products.length}
                </p>
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
                <p className="text-2xl font-bold text-theme-primary">
                  {stories.length}
                </p>
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
                <h3 className="text-lg font-semibold text-gray-900">
                  Chapters
                </h3>
                <p className="text-2xl font-bold text-theme-primary">
                  {chapters.length}
                </p>
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
                <p className="text-2xl font-bold text-theme-primary">
                  {verses.length}
                </p>
                <p className="text-sm text-gray-500">Verses created</p>
              </div>
            </div>
          </div>
        </div>
      ) : !isInitialLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 text-lg mb-2">
              No Bible books found
            </div>
            <p className="text-gray-400">No Bible books available yet.</p>
          </div>
        </div>
      ) : null}

      {/* Loading State */}
      {isInitialLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto mb-4"></div>
            <div className="text-gray-500 text-lg mb-2">
              Loading Bible content...
            </div>
            <p className="text-gray-400">
              Please wait while we fetch your Bible books.
            </p>
          </div>
        </div>
      )}

      {/* Accordion Bible Content */}
      {!isInitialLoading && products.length > 0 ? (
        <div className="w-full">
          {/* Bible Header */}
          <div className="text-start mb-8">
            <div className="">
              <div className="flex items-start justify-start gap-4 mb-4">
                <div className="text-xl">📖</div>
                <div>
                  <h1 className="text-4xl font-bold tracking-wide text-theme-primary">
                    Bible
                  </h1>
                  <p className="text-gray-700 text-sm font-medium">
                    Read products, stories, chapters and verses
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Language Filter */}
          <div className="mb-6">
            <div className="flex items-center justify-end gap-4">
              <label className="text-sm font-medium text-gray-700">
                Filter by Language:
              </label>
              <Select
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Accordion Container */}
          <div className="space-y-4 w-full">
            {(() => {
              const productsWithContent = products.filter((product) => {
                const productStories = stories.filter(
                  (s) =>
                    (typeof s.productId === "object"
                      ? s.productId._id
                      : s.productId) === product._id
                );
                return productStories.length > 0;
              });

              if (productsWithContent.length === 0) {
                return (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                      <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <div className="text-gray-500 text-lg mb-2">
                        Bible book not found
                      </div>
                      <p className="text-gray-400">
                        No products have stories, chapters, or verses created
                        yet.
                      </p>
                    </div>
                  </div>
                );
              }

              return productsWithContent.map((product) => {
                const productStories = stories.filter(
                  (s) =>
                    (typeof s.productId === "object"
                      ? s.productId._id
                      : s.productId) === product._id
                );
                const isProductExpanded = expandedProducts.has(product._id);

                return (
                  <div
                    key={product._id}
                    className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden"
                  >
                    {/* Product Accordion Header */}
                    <div
                      className="bg-gradient-to-r from-gray-50 to-gray-100 text-theme-primary p-4 cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-colors w-full border-l-4 border-theme-primary"
                      onClick={() => toggleProduct(product._id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-theme-primary/10 p-2 rounded-lg">
                            <Book className="h-5 w-5 text-theme-primary" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-theme-primary">
                              {product.title?.[selectedLanguage] ? (
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: product.title[selectedLanguage],
                                  }}
                                />
                              ) : (
                                "Bible Book"
                              )}
                            </h2>
                            <p className="text-gray-600 text-sm">
                              {productStories.length} Stories • Click to expand
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-theme-primary/10 text-theme-primary px-3 py-1 rounded-full text-sm">
                            {productStories.length} Stories
                          </span>
                          {isProductExpanded ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Product Content - Collapsible */}
                    {isProductExpanded && (
                      <div className="p-6 bg-gray-50">
                        {product.description?.[selectedLanguage] && (
                          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                              Description
                            </h3>
                            <p className="text-gray-700 italic">
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: product.description[selectedLanguage],
                                }}
                              />
                            </p>
                          </div>
                        )}

                        {/* Stories Accordion */}
                        <div className="space-y-3">
                          {productStories.length > 0 ? (
                            productStories.map((story) => {
                              const storyChapters = chapters.filter(
                                (c) =>
                                  (typeof c.storyId === "object"
                                    ? c.storyId._id
                                    : c.storyId) === story._id
                              );
                              const isStoryExpanded = expandedStories.has(
                                story._id
                              );

                              return (
                                <div
                                  key={story._id}
                                  className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                                >
                                  {/* Story Accordion Header */}
                                  <div
                                    className="bg-gradient-to-r from-gray-50 to-gray-100 text-theme-primary p-4 cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-colors w-full border-l-4 border-theme-primary"
                                    onClick={() => toggleStory(story._id)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="bg-theme-primary/10 p-2 rounded-lg">
                                          <FileText className="h-5 w-5 text-theme-primary" />
                                        </div>
                                        <div>
                                          <h3 className="text-lg font-bold text-theme-primary">
                                            <Link 
                                              href={`/bible/stories/edit/${story._id}`}
                                              onClick={(e) => e.stopPropagation()}
                                              className="transition-colors"
                                            >
                                              {story.title?.[selectedLanguage] ? (
                                                <span
                                                  dangerouslySetInnerHTML={{
                                                    __html:
                                                      story.title[
                                                        selectedLanguage
                                                      ],
                                                  }}
                                                />
                                              ) : (
                                                `Story ${story.order}`
                                              )}
                                            </Link>
                                          </h3>
                                          <p className="text-gray-600 text-sm">
                                            {storyChapters.length} Chapters •
                                            Click to expand
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditContent("story", story._id);
                                          }}
                                          className="h-8 px-3 text-xs border-gray-300 text-gray-600 hover:bg-gray-100"
                                        >
                                          <Edit className="h-3 w-3 mr-1" />
                                        </Button>
                                        <span className="bg-theme-primary/10 text-theme-primary px-3 py-1 rounded-full text-sm">
                                          {storyChapters.length} Chapters
                                        </span>
                                        {isStoryExpanded ? (
                                          <ChevronDown className="h-5 w-5" />
                                        ) : (
                                          <ChevronRight className="h-5 w-5" />
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Story Content - Collapsible */}
                                  {isStoryExpanded && (
                                    <div className="p-4 bg-gray-50">

                                      {/* Chapters Accordion */}
                                      <div className="space-y-2">
                                        {storyChapters.length > 0 ? (
                                          storyChapters.map((chapter) => {
                                            const chapterVerses = verses.filter(
                                              (v) =>
                                                (typeof v.chapterId === "object"
                                                  ? v.chapterId._id
                                                  : v.chapterId) === chapter._id
                                            );
                                            const isChapterExpanded =
                                              expandedChapters.has(chapter._id);

                                            return (
                                              <div
                                                key={chapter._id}
                                                className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                                              >
                                                {/* Chapter Accordion Header */}
                                                <div
                                                  className="bg-gradient-to-r from-gray-50 to-gray-100 text-theme-primary p-3 cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-colors w-full border-l-4 border-theme-primary"
                                                  onClick={() =>
                                                    toggleChapter(chapter._id)
                                                  }
                                                >
                                                  <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                      <div className="bg-theme-primary/10 p-1.5 rounded-lg">
                                                        <BookOpen className="h-4 w-4 text-theme-primary" />
                                                      </div>
                                                      <div>
                                                        <h4 className="text-md font-bold text-theme-primary">
                                                          <Link 
                                                            href={`/bible/chapters/edit/${chapter._id}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className=" transition-colors"
                                                          >
                                                            Chapter{" "}
                                                            {chapter.order}
                                                            {chapter.title?.[
                                                              selectedLanguage
                                                            ] && (
                                                              <span className="text-sm font-normal ml-2">
                                                                -{" "}
                                                                <span
                                                                  dangerouslySetInnerHTML={{
                                                                    __html:
                                                                      chapter
                                                                        .title[
                                                                        selectedLanguage
                                                                      ],
                                                                  }}
                                                                />
                                                              </span>
                                                            )}
                                                          </Link>
                                                        </h4>
                                                        <p className="text-gray-600 text-xs">
                                                          {chapterVerses.length}{" "}
                                                          Verses • Click to
                                                          expand
                                                        </p>
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleEditContent("chapter", chapter._id);
                                                        }}
                                                        className="h-7 px-2 text-xs border-gray-300 text-gray-600 hover:bg-gray-100"
                                                      >
                                                        <Edit className="h-3 w-3 mr-1" />
                                                      </Button>
                                                      <span className="bg-theme-primary/10 text-theme-primary px-2 py-1 rounded-full text-xs">
                                                        {chapterVerses.length}{" "}
                                                        Verses
                                                      </span>
                                                      {isChapterExpanded ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                      ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Chapter Content - Collapsible */}
                                                {isChapterExpanded && (
                                                  <div className="p-4 bg-gray-50">
                                                    {/* Verses Display */}
                                                    <div className="space-y-3">
                                                      {chapterVerses.length >
                                                      0 ? (
                                                        chapterVerses.map(
                                                          (verse) => (
                                                            <div
                                                              key={verse._id}
                                                              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                                                            >
                                                              <div className="flex justify-between items-start mb-3">
                                                                <div className="flex items-center gap-2">
                                                                  <span className="bg-theme-primary text-theme-secondary text-sm font-bold px-2 py-1 rounded-full">
                                                                    {
                                                                      verse.number
                                                                    }
                                                                  </span>
                                                                  <span className="text-sm font-semibold text-theme-primary">
                                                                    Verse{" "}
                                                                    {
                                                                      verse.number
                                                                    }
                                                                  </span>
                                                                </div>
                                                                <Button
                                                                  variant="outline"
                                                                  size="sm"
                                                                  onClick={() =>
                                                                    handleEditContent(
                                                                      "verse",
                                                                      verse._id
                                                                    )
                                                                  }
                                                                  className="h-8 px-3 text-xs border-gray-300 text-gray-600 hover:bg-gray-100"
                                                                >
                                                                  <Edit className="h-4 w-4 mr-1" />{" "}
                                                                </Button>
                                                              </div>

                                                              {/* Verse Text */}
                                                              <div className="text-gray-800 leading-relaxed">
                                                                {verse.text?.[
                                                                  selectedLanguage
                                                                ] ? (
                                                                  <span
                                                                    dangerouslySetInnerHTML={{
                                                                      __html:
                                                                        verse
                                                                          .text[
                                                                          selectedLanguage
                                                                        ],
                                                                    }}
                                                                  />
                                                                ) : (
                                                                  <span className="italic text-gray-500">
                                                                    No verse
                                                                    text
                                                                    available in{" "}
                                                                    {getLanguageName(
                                                                      selectedLanguage
                                                                    )}
                                                                  </span>
                                                                )}
                                                              </div>
                                                            </div>
                                                          )
                                                        )
                                                      ) : (
                                                        <div className="text-center py-4 text-gray-500 italic">
                                                          No verses found for
                                                          this chapter
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })
                                        ) : (
                                          <div className="text-center py-4 text-gray-500 text-sm">
                                            <p>
                                              No chapters created yet for this
                                              story.
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <p>No stories created yet for this product.</p>
                              <p className="text-sm">
                                Click "Add Bible Content" to create stories,
                                chapters, and verses.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ) : null}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this product from the list? This
              action cannot be undone.
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
                  setProducts((prev) =>
                    prev.filter((p) => p._id !== productToDelete._id)
                  );
                  showToast.success(
                    "Product Removed",
                    "Product has been removed from the list"
                  );
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