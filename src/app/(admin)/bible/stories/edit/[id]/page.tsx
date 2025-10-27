"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import {
  ArrowLeft,
  Save,
  FileText,
  BookOpen,
  File,
  RefreshCw,
} from "lucide-react";
import CKEditorComponent from "@/components/CKEditorComponent";
import ClientInstance from "@/shared/client";
import { showToast } from "@/lib/toast";
import {
  MultilingualText,
  ProductManagement,
  Language,
} from "@/lib/types/bibble";

const steps = [
  { id: "story", title: "Story", icon: FileText },
  { id: "chapters", title: "Chapters", icon: BookOpen },
  { id: "verses", title: "Verses", icon: File },
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

  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [products, setProducts] = useState<ProductManagement[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languageNames, setLanguageNames] = useState<{ [key: string]: string }>(
    {}
  );

  const [formData, setFormData] = useState<StoryFormData>({
    story: { productId: "", title: {}, description: {}, order: 1 },
    chapters: [],
    verses: [],
  });

  // Handle step query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const step = urlParams.get('step');
    if (step === 'verses' && currentStep !== 2) {
      setCurrentStep(2);
    }
  }, []);

  // Reload data when step changes
  useEffect(() => {
    if (storyId && languages.length > 0 && dataLoaded) {
      if (currentStep === 1 && formData.chapters.length === 0) {
        loadChapters();
      } else if (currentStep === 2 && formData.chapters.length > 0) {
        loadVerses();
        // Auto-navigate to verse edit if verses exist
        if (formData.verses.length > 0) {
          router.push(`/bible/verses/edit/${formData.verses[0]._id}`);
        }
      }
    }
  }, [
    currentStep,
    storyId,
    languages.length,
    dataLoaded,
    formData.chapters.length,
    formData.verses.length,
    router,
  ]);

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
      const res: any = await ClientInstance.APP.getProducts({ type: "book" });
      if (res?.success && res?.data) setProducts(res.data);
    } catch (err) {
      console.error(err);
      showToast.error("Error", "Failed to fetch products");
    }
  };

  const fetchLanguages = async () => {
    try {
      const [langRes, codeRes]: any = await Promise.all([
        ClientInstance.APP.getLanguage(),
        ClientInstance.APP.getLanguageCode(),
      ]);

      if (langRes?.success && langRes?.data) {
        let langs = langRes.data;
        if (codeRes?.success && codeRes?.data) {
          const codes = codeRes.data;
          langs = langs.map((lang: any) => {
            const match = codes.find(
              (c: any) => c.code === lang.code || c.name === lang.name
            );
            return {
              ...lang,
              code: match?.code || lang.code,
              flag: lang.flag || "🌐",
            };
          });
        }

        // Filter out Hindi language from available languages and only show active languages
        const filteredLangs = langs.filter((lang: any) => lang.code !== "hi" && lang.isActive === true);
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
    return html.replace(/<[^>]*>/g, "");
  };

  const loadStory = async () => {
    if (!storyId) return;
    try {
      setIsLoading(true);
      const res: any = await ClientInstance.APP.getStoryById(storyId);
      if (res?.success && res?.data) {
        const story = res.data;
        setFormData((prev) => ({
          ...prev,
          story: {
            productId:
              typeof story.productId === "object"
                ? story.productId._id
                : story.productId,
            title: story.title || {},
            description: story.description || {},
            order: story.order || 1,
          },
        }));
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
      const response: any = await ClientInstance.APP.getChaptersByStory(
        storyId
      );
      if (response?.success && response?.data) {
        setFormData((prev) => ({ ...prev, chapters: response.data }));
      } else {
        setFormData((prev) => ({ ...prev, chapters: [] }));
      }
    } catch (error) {
      console.error("Error loading chapters:", error);
      setFormData((prev) => ({ ...prev, chapters: [] }));
    }
  };

  const loadVerses = async () => {
    try {
      // First ensure chapters are loaded
      if (formData.chapters.length === 0) {
        await loadChapters();
      }

      // Get verses for the first chapter if available
      const firstChapter = formData.chapters[0];
      if (firstChapter?._id) {
        const response: any = await ClientInstance.APP.getVersesByChapter(
          firstChapter._id
        );
        if (response?.success && response?.data) {
          setFormData((prev) => ({ ...prev, verses: response.data }));
        } else {
          setFormData((prev) => ({ ...prev, verses: [] }));
        }
      } else {
        setFormData((prev) => ({ ...prev, verses: [] }));
      }
    } catch (error) {
      console.error("Error loading verses:", error);
      setFormData((prev) => ({ ...prev, verses: [] }));
    }
  };

  // Function to refresh data for current step
  const refreshCurrentStepData = async () => {
    if (currentStep === 1) {
      await loadChapters();
    } else if (currentStep === 2) {
      await loadChapters();
      await loadVerses();
    }
  };

  const cleanMultilingualData = (data: MultilingualText) => {
    const cleaned: MultilingualText = {};
    Object.entries(data).forEach(([k, v]) => {
      // Exclude Hindi language (hi) from payload
      if (k !== "hi" && v && v.trim() !== "") cleaned[k] = v;
    });
    return cleaned;
  };

  const includeAllLanguages = (data: MultilingualText) => {
    const result: MultilingualText = {};
    // Get all available languages from the languages state
    const availableLanguages = languages.map((lang) => lang.code);

    // Include all available languages, even if empty
    availableLanguages.forEach((lang) => {
      result[lang] = data[lang] || "";
    });

    return result;
  };

  const isMultilingualFieldComplete = (field: MultilingualText) => {
    // Get all available languages from the languages state (Hindi already filtered out)
    const availableLanguages = languages.map((lang) => lang.code);

    // Check if all available languages have content
    return availableLanguages.every(
      (lang) => field[lang] && field[lang].trim() !== ""
    );
  };

  const validateForm = (): boolean => {
    setValidationError("");
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

      const payload = {
        productId: formData.story.productId,
        title: cleanMultilingualData(formData.story.title),
        description: cleanMultilingualData(formData.story.description),
        order: formData.story.order, // Always include the current order
      };

      const res: any = await ClientInstance.APP.updateStory(storyId, payload);
      if (res?.success) {
        showToast.success(
          "Story Updated",
          "Story has been updated successfully!"
        );
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

  const handleUpdateChapter = async () => {
    if (formData.chapters.length === 0) {
      setValidationError("No chapter to update");
      return;
    }

    // Check if ALL languages are filled - All languages required
    const chapterTitle = formData.chapters[0].title;

    // Get all available languages from the languages state
    const availableLanguages = languages.map((lang) => lang.code);

    // Check if all available languages have content
    const missingLanguages = availableLanguages.filter((lang) => {
      const content = chapterTitle[lang] || "";
      const hasContent =
        content.trim() !== "" &&
        content
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim() !== "";
      return !hasContent;
    });

    if (missingLanguages.length > 0) {
      const languageNames = missingLanguages
        .map((lang) => {
          const langObj = languages.find((l) => l.code === lang);
          return langObj ? `${langObj.name} (${lang})` : lang;
        })
        .join(", ");

      setValidationError(
        `Please fill in the chapter title in all languages: ${languageNames}`
      );
      return;
    }

    try {
      setIsLoading(true);
      setValidationError("");

      const payload = {
        storyId: storyId,
        title: includeAllLanguages(formData.chapters[0].title),
        order: formData.chapters[0].order,
      };

      const res: any = await ClientInstance.APP.updateChapter(
        formData.chapters[0]._id!,
        payload
      );
      if (res?.success) {
        setSuccessMessage(
          "Chapter updated successfully! Moving to next step..."
        );
        showToast.success(
          "Chapter Updated",
          "Chapter has been updated successfully!"
        );
        setTimeout(() => {
          setCurrentStep(2); // Go to next step (Verses)
          setSuccessMessage(""); // Clear success message
        }, 1500);
      } else {
        setValidationError(res?.message || "Failed to update chapter");
        showToast.error("Error", res?.message || "Failed to update chapter");
      }
    } catch (err) {
      console.error(err);
      setValidationError("Network error. Please try again.");
      showToast.error("Error", "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToBible = () => router.push("/bible");

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
      // Moving from chapters to verses step - validate chapter first
      if (formData.chapters.length > 0 && formData.chapters[0]._id) {
        // Check if at least one language has content (not all languages required)
        const chapterTitle = formData.chapters[0].title;
        const hasAnyContent = Object.values(chapterTitle).some(
          (value) => value && value.trim() !== ""
        );

        if (!hasAnyContent) {
          setValidationError(
            "Please fill in the chapter title in at least one language"
          );
          return;
        }

        try {
          setIsLoading(true);
          const payload = {
            storyId: storyId,
            title: cleanMultilingualData(formData.chapters[0].title),
            order: formData.chapters[0].order,
          };

          const res: any = await ClientInstance.APP.updateChapter(
            formData.chapters[0]._id,
            payload
          );
          if (res?.success) {
            showToast.success(
              "Chapter Updated",
              "Chapter has been updated successfully!"
            );
          } else {
            showToast.error(
              "Error",
              res?.message || "Failed to update chapter"
            );
            return;
          }
        } catch (err) {
          console.error(err);
          showToast.error("Error", "Network error. Please try again.");
          return;
        } finally {
          setIsLoading(false);
        }
      }

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

  const previousStep = async () => {
    // Fixed backflow logic - ensure proper step navigation
    if (currentStep === 2) {
      // From verses (step 2) -> go to chapters (step 1)
      await loadChapters();
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // From chapters (step 1) -> go to story (step 0)
      setCurrentStep(0);
    } else if (currentStep === 0) {
      // From story (step 0) -> stay on story (step 0)
      setCurrentStep(0);
    }

    // Clear any validation errors when navigating
    setValidationError("");
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
        <Stepper steps={steps} currentStep={currentStep} />

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
              {currentStep === 0 && (
                <form onSubmit={(e) => e.preventDefault()}>
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
                        <SelectValue placeholder="Choose a product">
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
                        {products.map((p) => (
                          <SelectItem key={p._id} value={p._id}>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span>📖</span>
                                <span className="font-medium">Product:</span>
                              </div>
                              {/* Product Title - All Languages */}
                              {Object.entries(p.title || {}).map(
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
                          setFormData((prev) => ({
                            ...prev,
                            story: { ...prev.story, title: val },
                          }));
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
                          setFormData((prev) => ({
                            ...prev,
                            story: { ...prev.story, description: val },
                          }));
                          setValidationError("");
                          setTimeout(() => setIsTyping(false), 1000);
                        }}
                        placeholder="Enter story description in multiple languages"
                      />
                    </div>
                  </div>
                </form>
              )}

              {/* Step 1: Chapters - Direct Edit */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  {/* If chapters exist, show the first chapter edit form */}
                  {formData.chapters.length > 0 ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <BookOpen className="h-8 w-8 text-theme-primary" />
                        <div>
                          <h2 className="text-2xl font-semibold text-gray-900">
                            Edit Chapter
                          </h2>
                          <p className="text-gray-600">
                            Edit chapter:{" "}
                            <span
                              dangerouslySetInnerHTML={{
                                __html:
                                  formData.chapters[0].title.en || "Chapter",
                              }}
                            />
                          </p>
                        </div>
                      </div>

                      {/* Chapter Edit Form */}
                      <form onSubmit={(e) => e.preventDefault()}>
                        {/* Chapter Title */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Chapter Title{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div onKeyDown={(e) => e.stopPropagation()}>
                            <CKEditorComponent
                              value={formData.chapters[0].title}
                              onChange={(val) => {
                                setIsTyping(true);
                                setFormData((prev) => ({
                                  ...prev,
                                  chapters: prev.chapters.map((ch, index) =>
                                    index === 0 ? { ...ch, title: val } : ch
                                  ),
                                }));
                                setValidationError("");
                                setTimeout(() => setIsTyping(false), 1000);
                              }}
                              placeholder="Enter chapter title in multiple languages"
                            />
                          </div>
                        </div>

                        {/* Add More Chapter Section */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              Add More Content
                            </h3>
                            <p className="text-sm text-gray-600">
                              Create additional chapters for this story
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() =>
                              router.push(
                                `/bible/chapters/add?storyId=${storyId}`
                              )
                            }
                            className="border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-white"
                          >
                            Add More Chapter
                          </Button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Chapters Found
                      </h3>
                      <p className="text-gray-600 mb-4">
                        This story doesn't have any chapters yet.
                      </p>
                      <Button
                        onClick={() =>
                          router.push(`/bible/chapters/add?storyId=${storyId}`)
                        }
                        className="bg-theme-primary hover:bg-theme-primary text-white"
                      >
                        Create First Chapter
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
                      <h2 className="text-2xl font-semibold text-gray-900">
                        Edit Verses
                      </h2>
                      <p className="text-gray-600">
                        Manage verses for this story
                      </p>
                    </div>
                  </div>

                  {/* Refresh Button */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={refreshCurrentStepData}
                      disabled={isLoading}
                      className="text-sm"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          Refreshing...
                        </div>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh Data
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Direct Navigation to Verse Edit */}
                  {formData.chapters.length && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Verses Found
                      </h3>
                      <p className="text-gray-600 mb-4">
                        This chapter doesn't have any verses yet.
                      </p>
                      {formData.chapters.length > 0 ? (
                        <Button
                          onClick={() =>
                            router.push(
                              `/bible/verses/add?chapterId=${formData.chapters[0]._id}`
                            )
                          }
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
                </div>
              )}

              {/* Validation Error */}
              {validationError && (
                <div className="mx-10 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-600 text-sm font-medium">
                    ⚠️ {validationError}
                  </div>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="mx-10 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-green-600 text-sm font-medium">
                    ✅ {successMessage}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center py-6 border-t border-gray-200">
                <div className="flex gap-2">
                  {currentStep === 0 ? (
                    <Button
                      variant="outline"
                      onClick={() => router.back()}
                      className="py-3 border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={previousStep}
                      className="py-3 border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {currentStep === 0 && (
                    <Button
                      onClick={handleUpdateStory}
                      disabled={isLoading}
                      className="py-3 bg-theme-primary hover:bg-theme-primary text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50"
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
                  )}
                  {currentStep === 1 && (
                    <Button
                      onClick={handleUpdateChapter}
                      disabled={isLoading}
                      className="py-3 bg-theme-primary hover:bg-theme-primary text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Updating...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="h-5 w-5" />
                          Update Chapter
                        </div>
                      )}
                    </Button>
                  )}
                  {currentStep > 1 && currentStep < steps.length - 1 && (
                    <Button
                      onClick={nextStep}
                      className="px-6 py-3 bg-theme-primary hover:bg-theme-primary text-white font-semibold rounded-lg shadow-md transition-colors"
                    >
                      Next
                    </Button>
                  )}
                  {currentStep === steps.length - 1 && (
                    <Button
                      onClick={handleBackToBible}
                      className="py-3 bg-theme-primary hover:bg-theme-primary text-white font-semibold rounded-lg shadow-md transition-colors"
                    >
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
