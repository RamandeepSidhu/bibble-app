"use client";
import { useState, useEffect } from "react";
import { UpdateHymnPayload, MultilingualText, Language, HymnManagement, ProductManagement } from "@/lib/types/bibble";
import { Button } from "@/components/ui/button";
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import Link from "next/link";
import ClientInstance from "@/shared/client";
import CKEditorComponent from "@/components/CKEditorComponent";
import { showToast } from "@/lib/toast";
import { useParams } from "next/navigation";

const isRichTextEmpty = (htmlContent: string): boolean => {
    if (!htmlContent) return true;

    const cleaned = htmlContent
        .replace(/<(p|div|br|span)[^>]*>/gi, "") // remove empty tags
        .replace(/<\/(p|div|span)>/gi, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/&[a-zA-Z0-9#]+;/g, " ")
        .replace(/\s+/g, "")
        .trim();

    return cleaned.length === 0;
};

const isMultilingualFieldComplete = (field: MultilingualText): boolean => {
    // Check if all required languages (excluding Hindi) have content
    const requiredLanguages = ['en', 'sw', 'fr', 'rn'];
    return requiredLanguages.every(lang => 
        field[lang] && !isRichTextEmpty(field[lang])
    );
};

// Function to get specific empty field names
const getEmptyFieldNames = (field: MultilingualText, fieldName: string): string[] => {
    const requiredLanguages = ['en', 'sw', 'fr', 'rn'];
    const languageNames = { en: 'English', sw: 'Swahili', fr: 'French', rn: 'Kinyarwanda' };
    
    return requiredLanguages
        .filter(lang => !field[lang] || isRichTextEmpty(field[lang]))
        .map(lang => `${fieldName} (${languageNames[lang as keyof typeof languageNames]})`);
};

// Function to clean multilingual data by removing invalid language codes
const cleanMultilingualData = (data: MultilingualText): MultilingualText => {
    const cleaned: MultilingualText = {};
    const validLanguageCodes = ['en', 'sw', 'fr', 'rn']; // Only allow these 4 languages
    
    Object.keys(data).forEach(key => {
        if (validLanguageCodes.includes(key) && data[key] && !isRichTextEmpty(data[key])) {
            cleaned[key] = data[key];
        }
    });
    return cleaned;
};

export default function EditHymnPage() {
    const params = useParams();
    const hymnId = params.id as string;
    
    const [validationError, setValidationError] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [hymn, setHymn] = useState<HymnManagement | null>(null);
    const [product, setProduct] = useState<ProductManagement | null>(null);

    const [hymnData, setHymnData] = useState<UpdateHymnPayload>({
        number: 1,
        text: {},
    });

    // Fetch languages and hymn data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoadingData(true);
                
                // Fetch both language names and language codes
                const [languageResponse, languageCodeResponse, hymnResponse] = await Promise.all([
                    ClientInstance.APP.getLanguage(),
                    ClientInstance.APP.getLanguageCode(),
                    ClientInstance.APP.getHymnById(hymnId)
                ]);

                // Handle languages
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
                    
                    setLanguages(languagesData.filter((lang: any) => lang.isActive === true && lang.code !== 'hi'));
                }

                // Handle hymn data
                if ((hymnResponse as any)?.success && (hymnResponse as any)?.data) {
                    const hymnData = (hymnResponse as any).data;
                    setHymn(hymnData);
                    
                    // Helper function to convert array format to HTML string
                    const convertTextToHtml = (textData: any): string => {
                        if (!textData) return '';
                        if (typeof textData === 'string') return textData;
                        if (Array.isArray(textData)) {
                            return textData
                                .map((item: any) => {
                                    const text = item?.data || item || '';
                                    return `<p>${text}</p>`;
                                })
                                .join('');
                        }
                        return String(textData);
                    };
                    
                    // Convert text object from array format to string format
                    const convertedText: MultilingualText = {};
                    if (hymnData.text) {
                        Object.keys(hymnData.text).forEach((lang: string) => {
                            convertedText[lang] = convertTextToHtml(hymnData.text[lang]);
                        });
                    }
                    
                    // Initialize form with hymn data
                    setHymnData({
                        number: hymnData.number || 1,
                        text: convertedText,
                    });

                    // Fetch product data
                    try {
                        // Extract product ID - handle both object and string formats
                        const productId = typeof hymnData.productId === 'object' 
                            ? hymnData.productId?._id || hymnData.productId?.id
                            : hymnData.productId;
                        
                        if (productId) {
                            const productResponse: any = await ClientInstance.APP.getProductById(productId);
                            if (productResponse?.success && productResponse?.data) {
                                setProduct(productResponse.data);
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching product:", error);
                    }
                } else {
                    showToast.error("Error", (hymnResponse as any)?.message || "Failed to fetch hymn");
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                showToast.error("Error", "Network error. Please check your connection and try again.");
            } finally {
                setIsLoadingData(false);
            }
        };

        if (hymnId) {
            fetchData();
        }
    }, [hymnId]);

    const handleSave = async () => {
        setValidationError("");

        // Collect all empty fields
        const emptyFields: string[] = [];
        
        if (!hymnData.number) {
            emptyFields.push("Hymn Number");
        }
        
        // Check multilingual fields
        if (!isMultilingualFieldComplete(hymnData.text)) {
            emptyFields.push(...getEmptyFieldNames(hymnData.text, "Text"));
        }

        if (emptyFields.length > 0) {
            setValidationError(`Please fill in: ${emptyFields.join(", ")}`);
            return;
        }

        setIsLoading(true);

        try {
            const payload: UpdateHymnPayload = {
                number: hymnData.number,
                text: cleanMultilingualData(hymnData.text),
            };

            const response: any = await ClientInstance.APP.updateHymn(hymnId, payload);
            if (response.success) {
                setSuccessMessage("Hymn updated successfully!");
                showToast.success("Hymn Updated", "Hymn has been updated successfully!");
                
                setTimeout(() => {
                    window.location.href = "/hymns";
                }, 2000);
            } else {
                // Show specific API error message
                const errorMessage = response.message || "Failed to update hymn. Please try again.";
                setValidationError(errorMessage);
                showToast.error("Error", errorMessage);
            }
        } catch (error: any) {
            // Show specific error message from API response
            const errorMessage = error?.response?.data?.message || 
                               error?.message || 
                               "Network error. Please check your connection and try again.";
            setValidationError(errorMessage);
            showToast.error("Error", errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingData) {
        return (
            <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-4">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading hymn...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!hymn) {
        return (
            <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-4">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-gray-600">Hymn not found</p>
                        <Link href="/hymns" className="text-theme-primary hover:underline">
                            Back to Hymns
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-4">
            {/* Header */}
            <div className=" mx-auto px-12 py-6  border-b border-gray-100 bg-white">
                <div className="flex items-center gap-4">
                    <Link href="/hymns" className="text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900">Edit Hymn</h1>
                        <p className="text-gray-500">
                           Hymn #{hymn.number}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mx-auto px-12 ">
                <div className="space-y-8">

                    {/* Hymn Text */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Hymn Text <span className="text-red-500">*</span>
                        </label>
                        <CKEditorComponent
                            value={hymnData.text}
                            onChange={(val: MultilingualText) => {
                                setHymnData({ ...hymnData, text: val });
                                setValidationError("");
                            }}
                            placeholder="Enter multilingual hymn text"
                            excludeHindi={true}
                        />
                    </div>
                </div>

                {/* Validation / Success Messages */}
                {validationError && (
                    <div className="mx-2 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-red-600 text-sm font-medium">⚠️ {validationError}</div>
                    </div>
                )}

                {successMessage && (
                    <div className="mx-2 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-green-600 text-sm font-medium">✅ {successMessage}</div>
                    </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end items-center py-6 border-t border-gray-200">
                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-8 py-3 bg-theme-primary hover:bg-theme-primary text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Updating Hymn...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5 mr-2" />
                                Update Hymn
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
