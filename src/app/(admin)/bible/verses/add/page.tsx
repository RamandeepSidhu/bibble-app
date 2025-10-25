'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stepper } from '@/components/ui/stepper';
import { ArrowLeft, Save, FileText, BookOpen, File } from 'lucide-react';
import CKEditorComponent from '@/components/CKEditorComponent';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';
import { MultilingualText, Language } from '@/lib/types/bibble';

const steps = [
  { id: "story", title: "Edit Story", icon: FileText },
  { id: "chapter", title: "Edit Chapter", icon: BookOpen },
  { id: "verse", title: "Create Verse", icon: File }
];

interface VerseFormData {
  chapterId: string;
  number: number;
  text: MultilingualText;
}

export default function AddVersePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chapterId = searchParams.get('chapterId') || '';
  
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languageNames, setLanguageNames] = useState<{ [key: string]: string }>({});
  
  const [formData, setFormData] = useState<VerseFormData>({
    chapterId: chapterId,
    number: 1,
    text: {},
  });

  // Get current step based on URL
  const getCurrentStep = () => {
    const path = window.location.pathname;
    if (path.includes('/verses/add')) return 2;
    if (path.includes('/chapters/edit')) return 1;
    if (path.includes('/stories/edit')) return 0;
    return 2; // Default to verse step
  };

  const currentStep = getCurrentStep();

  useEffect(() => {
    fetchLanguages();
    if (chapterId) {
      getNextVerseNumber();
    }
  }, [chapterId]);

  const fetchLanguages = async () => {
    try {
      const response: any = await ClientInstance.APP.getLanguage();
      if (response?.success && response.data) {
        setLanguages(response.data);
        // Create language names mapping
        const names: { [key: string]: string } = {};
        response.data.forEach((lang: Language) => {
          names[lang.code] = lang.name;
        });
        setLanguageNames(names);
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const getLanguageName = (code: string) => {
    return languageNames[code] || code.toUpperCase();
  };

  const stripHtmlTags = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const cleanMultilingualData = (data: MultilingualText) => {
    const cleaned: MultilingualText = {};
    Object.entries(data).forEach(([k, v]) => {
      if (k !== 'hi' && v && v.trim() !== '') cleaned[k] = v;
    });
    return cleaned;
  };

  const isMultilingualFieldComplete = (field: MultilingualText) => {
    // Get all available languages from the languages state
    const availableLanguages = languages.map(lang => lang.code);
    
    // Check if all available languages have content
    return availableLanguages.every(lang => 
      field[lang] && field[lang].trim() !== ''
    );
  };

  const validateForm = (): boolean => {
    setValidationError("");
    if (!formData.chapterId) { setValidationError("Chapter ID is required"); return false; }
    if (!isMultilingualFieldComplete(formData.text)) { setValidationError("Please fill in the verse text in all languages"); return false; }
    return true;
  };

  const getNextVerseNumber = async () => {
    try {
      const res: any = await ClientInstance.APP.getVersesByChapter(chapterId);
      if (res?.success && res?.data) {
        const maxNumber = Math.max(...res.data.map((v: any) => v.number || 0), 0);
        setFormData(prev => ({ ...prev, number: maxNumber + 1 }));
      }
    } catch (error) {
      console.error('Error getting next verse number:', error);
    }
  };

  const handleCreateVerse = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setValidationError("");

      const versePayload = {
        chapterId: formData.chapterId,
        number: formData.number,
        text: cleanMultilingualData(formData.text),
      };

      const response: any = await ClientInstance.APP.createVerse(versePayload);
      
      if (response?.success) {
        showToast.success(
          "Verse Created",
          "Verse has been created successfully!"
        );
        setSuccessMessage("Verse created successfully! Redirecting to Bible page...");
        
        // Redirect back to Bible page
        setTimeout(() => {
          router.push('/bible');
        }, 2000);
      } else {
        showToast.error(
          "Error",
          response?.message || "Failed to create verse"
        );
      }
    } catch (error) {
      console.error("Error creating verse:", error);
      showToast.error(
        "Error",
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToBible = () => router.push('/bible');

  return (
    <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto px-5 py-6 flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToBible} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Verse</h1>
            <p className="text-gray-600">Add a new verse to the chapter</p>
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
                <span className="text-gray-600">Creating verse...</span>
              </div>
            </div>
          ) : (
            <div className="p-8">
              <div className="space-y-6">
                {/* Verse Text */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Verse Text <span className="text-red-500">*</span>
                  </label>
                  <CKEditorComponent
                    value={formData.text}
                    onChange={(val) => {
                      setFormData(prev => ({ ...prev, text: val }));
                      setValidationError("");
                    }}
                    placeholder="Enter verse text"
                  />
                </div>

                {/* Success Message */}
                {successMessage && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="text-green-600 text-sm font-medium">
                        ✅ {successMessage}
                      </div>
                    </div>
                  </div>
                )}

                {/* Validation Error Message */}
                {validationError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="text-red-600 text-sm font-medium">
                        ⚠️ {validationError}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleBackToBible} className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-100">
                    Cancel
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateVerse} disabled={isLoading} className="px-8 py-3 bg-theme-primary hover:bg-theme-primary text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50">
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="h-5 w-5" />
                        Create Verse
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
