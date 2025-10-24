"use client";
import { useState, useEffect } from "react";
import { ProductFormData, PRODUCT_TYPES, MultilingualText, Language, ProductManagement, UpdateProductPayload } from "@/lib/types/bibble";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    return Object.values(field).some(val => !isRichTextEmpty(val));
};

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
    
    const [validationError, setValidationError] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingProduct, setIsLoadingProduct] = useState<boolean>(true);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [product, setProduct] = useState<ProductManagement | null>(null);

    const [bookData, setBookData] = useState<ProductFormData>({
        type: "",
        contentType: "free",
    freePages: 0,
        title: {},
        description: {},
    });

    // Fetch languages and product data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoadingProduct(true);
                
                // Fetch both language names and language codes
                const [languageResponse, languageCodeResponse, productResponse] = await Promise.all([
                    ClientInstance.APP.getLanguage(),
                    ClientInstance.APP.getLanguageCode(),
                    ClientInstance.APP.getProductById(productId)
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
                }

                // Handle product data
                if ((productResponse as any)?.success && (productResponse as any)?.data) {
                    const productData = (productResponse as any).data;
                    setProduct(productData);
                    
                    // Initialize form with product data
                    setBookData({
                        type: productData.type || "",
                        contentType: productData.contentType || "free",
                        freePages: productData.freePages || 0,
                        title: productData.title || {},
                        description: productData.description || {},
                    });
                } else {
                    showToast.error("Error", (productResponse as any)?.message || "Failed to fetch product");
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                showToast.error("Error", "Network error. Please check your connection and try again.");
            } finally {
                setIsLoadingProduct(false);
            }
        };

        if (productId) {
            fetchData();
        }
    }, [productId]);

    const handleSave = async () => {
        setValidationError("");

        if (
            !bookData.type ||
            !isMultilingualFieldComplete(bookData.title) ||
            !isMultilingualFieldComplete(bookData.description) ||
            !bookData.contentType ||
            (bookData.contentType === 'free' && bookData.freePages <= 0)
        ) {
            setValidationError(
                "Please fill in all required fields: Product Type, Content Type, Title & Description in all languages, and Free Pages if content type is free."
            );
      return;
    }

    setIsLoading(true);

    try {
            const payload: UpdateProductPayload = {
                type: bookData.type,
                title: bookData.title,
                description: bookData.description,
                contentType: bookData.contentType,
                freePages: bookData.freePages,
            };

            const response: any = await ClientInstance.APP.updateProduct(productId, payload);
            if (response.success) {
                setSuccessMessage("Product updated successfully!");
                showToast.success("Product Updated", "Product has been updated successfully!");
                
                setTimeout(() => {
        window.location.href = "/products";
                }, 2000);
      } else {
                setValidationError(response.message || "Failed to update product. Please try again.");
                showToast.error("Error", response.message || "Failed to update product");
      }
    } catch (error) {
            setValidationError("Network error. Please check your connection and try again.");
            showToast.error("Error", "Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

    if (isLoadingProduct) {
  return (
            <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading product...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-gray-600">Product not found</p>
                        <Link href="/products" className="text-theme-primary hover:underline">
                            Back to Products
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen rounded-lg shadow-sky-100 space-y-6 container mx-auto px-4 py-8">
            {/* Header */}
            <div className="border-b border-gray-100 bg-white">
                <div className="mx-auto px-5 py-6 flex items-center gap-4">
                    <Link href="/products" className="text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
                        <p className="text-gray-500">Update product information</p>
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
                        Updating Product...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Update Product
                      </>
                    )}
                  </Button>
        </div>
      </div>
    </div>
  );
}