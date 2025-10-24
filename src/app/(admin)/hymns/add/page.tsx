"use client";
import { useState, useEffect } from "react";
import { CreateHymnPayload, MultilingualText, Language, ProductManagement } from "@/lib/types/bibble";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import Link from "next/link";
import ClientInstance from "@/shared/client";
import CKEditorComponent from "@/components/CKEditorComponent";
import { showToast } from "@/lib/toast";

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
    return Object.values(field).some(val => !isRichTextEmpty(val));
};

export default function AddHymnPage() {
    const [validationError, setValidationError] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [products, setProducts] = useState<ProductManagement[]>([]);

    const [hymnData, setHymnData] = useState<CreateHymnPayload>({
        productId: "",
        number: 1,
        text: {},
    });

    // Fetch languages and products from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoadingData(true);
                
                // Fetch both language names and language codes
                const [languageResponse, languageCodeResponse, productsResponse] = await Promise.all([
                    ClientInstance.APP.getLanguage(),
                    ClientInstance.APP.getLanguageCode(),
                    ClientInstance.APP.getProducts()
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
                    
                    setLanguages(languagesData);
                    // Initialize multilingual fields with fetched languages
                    const initialMultilingualData: MultilingualText = {};
                    languagesData.forEach((lang: Language) => {
                        initialMultilingualData[lang.code] = "";
                    });
                    setHymnData(prev => ({
                        ...prev,
                        text: initialMultilingualData
                    }));
                }

                // Handle products
                if ((productsResponse as any)?.success && (productsResponse as any)?.data) {
                    const allProducts = (productsResponse as any).data;
                    // Filter only song products
                    const songProducts = allProducts.filter((product: ProductManagement) => product.type === 'song');
                    setProducts(songProducts);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                showToast.error("Error", "Network error. Please check your connection and try again.");
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
    }, []);

    const handleSave = async () => {
        setValidationError("");

        if (
            !hymnData.productId ||
            !hymnData.number ||
            !isMultilingualFieldComplete(hymnData.text)
        ) {
            setValidationError(
                "Please fill in all required fields: Product, Hymn Number, and Text in all languages."
            );
            return;
        }

        setIsLoading(true);

        try {
            const payload: CreateHymnPayload = {
                productId: hymnData.productId,
                number: hymnData.number,
                text: hymnData.text,
            };

            const response: any = await ClientInstance.APP.createHymn(payload);
            if (response.success) {
                setSuccessMessage("Hymn created successfully!");
                showToast.success("Hymn Created", "Hymn has been created successfully!");
                
                // Reset form
                const resetMultilingualData: MultilingualText = {};
                languages.forEach((lang: Language) => {
                    resetMultilingualData[lang.code] = "";
                });
                setHymnData({
                    productId: "",
                    number: 1,
                    text: resetMultilingualData,
                });

                setTimeout(() => {
                    window.location.href = "/hymns";
                }, 2000);
            } else {
                setValidationError(response.message || "Failed to create hymn. Please try again.");
                showToast.error("Error", response.message || "Failed to create hymn");
            }
        } catch (error) {
            setValidationError("Network error. Please check your connection and try again.");
            showToast.error("Error", "Network error. Please check your connection and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingData) {
        return (
            <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8">
            {/* Header */}
            <div className="border-b border-gray-100 bg-white">
                <div className="max-w-6xl mx-auto px-5 py-6 flex items-center gap-4">
                    <Link href="/hymns" className="text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900">Add Hymn</h1>
                        <p className="text-gray-500">Create a new hymn for a song product</p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-2">
                <div className="p-10 space-y-8">
                    {/* Product Selection and Hymn Number */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700">
                                Select Product <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={hymnData.productId}
                                onValueChange={(value) => {
                                    setHymnData({ ...hymnData, productId: value });
                                    setValidationError("");
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((product) => (
                                        <SelectItem key={product._id} value={product._id}>
                                            <span className="flex items-center gap-2">
                                                <span>🎵</span>
                                                {product.title.en || 'Untitled'}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Hymn Number */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700">
                                Hymn Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={hymnData.number}
                                onChange={(e) => {
                                    setHymnData({ ...hymnData, number: parseInt(e.target.value) || 1 });
                                    setValidationError("");
                                }}
                                placeholder="Enter hymn number"
                                className="w-full h-[40px] px-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none"
                                min="1"
                            />
                        </div>
                    </div>

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
                        />
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
                                Creating Hymn...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5 mr-2" />
                                Save Hymn
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
