"use client";
import { useState, useEffect } from "react";
import { ProductFormData, PRODUCT_TYPES, MultilingualText, Language } from "@/lib/types/bibble";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import Link from "next/link";
import ClientInstance from "@/shared/client";
import CKEditorComponent from "@/components/CKEditorComponent";

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

export default function AddBookPage() {
    const [validationError, setValidationError] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [languages, setLanguages] = useState<Language[]>([]);

    const [bookData, setBookData] = useState<ProductFormData>({
        type: "",
        contentType: "free",
        freePages: 0,
        title: {},
        description: {},
    });

    // Fetch languages and language codes from API on component mount
    useEffect(() => {
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
                    
                    setLanguages(languagesData.filter((lang: any) => lang.isActive === true && lang.code !== 'hi'));
                    // Initialize multilingual fields with fetched languages (excluding Hindi for Bible content)
                    const initialMultilingualData: MultilingualText = {};
                    languagesData.filter((lang: any) => lang.isActive === true && lang.code !== 'hi').forEach((lang: Language) => {
                        initialMultilingualData[lang.code] = "";
                    });
                    setBookData(prev => ({
                        ...prev,
                        title: initialMultilingualData,
                        description: initialMultilingualData
                    }));
                }
            } catch (error) {
                console.error("Error fetching languages:", error);
                // No fallback - rely only on API data
                setLanguages([]);
            }
        };

        fetchLanguages();
    }, []);

    const handleSave = async () => {
        setValidationError("");

        // Collect all empty fields
        const emptyFields: string[] = [];
        
        if (!bookData.type) {
            emptyFields.push("Product Type");
        }
        
        if (!bookData.contentType) {
            emptyFields.push("Content Type");
        }
        
        if (bookData.contentType === 'free' && bookData.freePages <= 0) {
            emptyFields.push("Free Pages");
        }
        
        // Check multilingual fields
        if (!isMultilingualFieldComplete(bookData.title)) {
            emptyFields.push(...getEmptyFieldNames(bookData.title, "Title"));
        }
        
        if (!isMultilingualFieldComplete(bookData.description)) {
            emptyFields.push(...getEmptyFieldNames(bookData.description, "Description"));
        }

        if (emptyFields.length > 0) {
            setValidationError(`Please fill in: ${emptyFields.join(", ")}`);
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                type: bookData.type,
                title: cleanMultilingualData(bookData.title),
                description: cleanMultilingualData(bookData.description),
                contentType: bookData.contentType,
                freePages: bookData.freePages,
            };

            const response: any = await ClientInstance.APP.createProduct(payload);
            if (response.success) {
                setSuccessMessage("Product created successfully!");
                // Reset form with current languages (excluding Hindi for Bible content)
                const resetMultilingualData: MultilingualText = {};
                languages.filter((lang: Language) => lang.code !== 'hi').forEach((lang: Language) => {
                    resetMultilingualData[lang.code] = "";
                });
                setBookData({
                    type: "",
                    contentType: "free",
                    freePages: 0,
                    title: resetMultilingualData,
                    description: resetMultilingualData,
                });

                setTimeout(() => {
                    window.location.href = "/products";
                }, 2000);
            } else {
                setValidationError(response.message || "Failed to create product. Please try again.");
            }
        } catch (error: any) {
            // Show specific error message from API response
            const errorMessage = error?.response?.data?.message || 
                               error?.message || 
                               "Network error. Please check your connection and try again.";
            setValidationError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8">
            {/* Header */}
            <div className="border-b border-gray-100 bg-white">
                <div className="mx-auto px-5 py-6 flex items-center gap-4">
                <Link href="/products" className="text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900">Add Product</h1>
                        <p className="text-gray-500">Create a new multilingual product</p>
                    </div>
                </div>
            </div>

            <div className="mx-auto px-2">
                <div className="p-10 space-y-8">
                    {/* Product Type and Content Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Type */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700">
                                Product Type <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={bookData.type}
                                onValueChange={(value) => {
                                    setBookData({ ...bookData, type: value });
                                    setValidationError("");
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select product type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRODUCT_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            <span className="flex items-center gap-2">
                                                <span>{type.icon}</span>
                                                {type.label}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Content Type */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700">
                                Content Type <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={bookData.contentType}
                                onValueChange={(value) => {
                                    setBookData({ ...bookData, contentType: value as "free" | "paid" });
                                    setValidationError("");
                                }}
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

                    {/* Free Pages (if Free) */}
                    {bookData.contentType === "free" && (
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700">
                                Free Pages <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={bookData.freePages}
                                onChange={(e) => {
                                    setBookData({ ...bookData, freePages: parseInt(e.target.value) || 0 });
                                    setValidationError("");
                                }}
                                placeholder="Enter number of free pages"
                                className="w-full h-[40px] px-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none"
                                min="0"
                            />
                        </div>
                    )}

                    {/* Title & Description */}
                    <div className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <CKEditorComponent
                                value={bookData.title}
                                onChange={(val: MultilingualText) => {
                                    setBookData({ ...bookData, title: val });
                                    setValidationError("");
                                }}
                                placeholder="Enter multilingual title"
                                excludeHindi={true}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <CKEditorComponent
                                value={bookData.description}
                                onChange={(val: MultilingualText) => {
                                    setBookData({ ...bookData, description: val });
                                    setValidationError("");
                                }}
                                placeholder="Enter multilingual description"
                                excludeHindi={true}
                            />
                        </div>
                    </div>
                </div>

                {/* Validation / Success Messages */}
                {validationError && (
                    <div className="mx-10 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-red-600 text-sm font-medium">⚠️ {validationError}</div>
                    </div>
                )}

                {successMessage && (
                    <div className="mx-10 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-green-600 text-sm font-medium">{successMessage}</div>
                    </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end items-center px-10 py-6 border-t border-gray-200">
                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-8 py-3 bg-theme-primary hover:bg-theme-primary text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Creating Product...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5 mr-2" />
                                Save Product
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
