"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import ClientInstance from "@/shared/client";
import { showToast } from "@/lib/toast";
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  Info,
  Plus,
  X,
  FileCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface ProductOption {
  _id: string;
  title: { [lang: string]: string };
  type: string;
}

export default function UploadCsvPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [validationState, setValidationState] = useState<{
    isValid: boolean;
    errors: string[];
  } | null>(null);
  const [preview, setPreview] = useState<{
    headers: string[];
    rows: string[][];
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const res: any = await ClientInstance.APP.getProducts({ type: "book" });
        if (res?.success && Array.isArray(res?.data)) {
          setProducts(res.data as ProductOption[]);
        } else if (Array.isArray(res)) {
          setProducts(res as ProductOption[]);
        }
      } catch (e) {
        showToast.error("Error", "Failed to load products");
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);
  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, "");
  };
  const handleUpload = async (skipPreview: boolean = false) => {
    // debug: verify state before calling APIs
    // eslint-disable-next-line no-console
    console.log("[UploadCsv] handleUpload clicked", {
      selectedProductId,
      hasFile: !!file,
    });
    if (!selectedProductId) {
      showToast.error("Missing product", "Please select a product first");
      return;
    }
    if (!file) {
      showToast.error("Missing file", "Please choose a CSV file to upload");
      return;
    }
    // If preview not shown yet, optionally skip showing it
    if (!showPreview && !skipPreview) {
      await buildPreviewFromFile(file as File);
      setShowPreview(true);
      return;
    }

    try {
      setIsUploading(true);
      // Step 1: validate CSV (file only)
      const uploadFile = await buildFileFromPreview(file as File);
      const validation: any = await ClientInstance.APP.validateCsv(uploadFile);
      // eslint-disable-next-line no-console
      console.log("[UploadCsv] validation response", validation);
      const isValid =
        validation?.success && validation?.data?.isValid !== false;
      setValidationState({
        isValid: !!isValid,
        errors: validation?.data?.errors || [],
      });
      if (!isValid) {
        const errors: string[] = validation?.data?.errors || [];
        const msg = errors.length
          ? errors.slice(0, 5).join(" | ")
          : validation?.message || "CSV format is invalid";
        showToast.error("Validation failed", msg);
        return;
      }

      // Step 2: upload CSV with productId
      const res: any = await ClientInstance.APP.uploadCsv(
        selectedProductId,
        uploadFile
      );
      // eslint-disable-next-line no-console
      console.log("[UploadCsv] upload response", res);
      if (res?.success) {
        showToast.success(
          "Upload complete",
          res?.message || "CSV processed successfully"
        );
        setFile(null);
        setValidationState(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setPreview(null);
        setShowPreview(false);
        router.push("/bible");
      } else {
        showToast.error(
          "Upload failed",
          res?.message || "Could not process CSV"
        );
      }
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("[UploadCsv] upload error", e);
      showToast.error("Upload failed", e?.message || "Network error");
    } finally {
      setIsUploading(false);
    }
  };

  // Build preview structure from selected CSV file
  const buildPreviewFromFile = async (f: File) => {
    const text = await f.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setPreview({ headers: [], rows: [] });
      return;
    }
    const parseLine = (line: string) => line.split(",");
    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(parseLine);
    setPreview({ headers, rows });
  };

  // Build a File object from edited preview
  const buildFileFromPreview = async (original: File): Promise<File> => {
    if (!preview) return original;
    const csvLines: string[] = [];
    const escape = (val: string) => {
      if (val == null) return "";
      if (/[",\n]/.test(val)) {
        return '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    };
    csvLines.push(preview.headers.map(escape).join(","));
    for (const row of preview.rows) {
      csvLines.push(row.map(escape).join(","));
    }
    const text = csvLines.join("\n");
    const blob = new Blob([text], { type: "text/csv" });
    const newFile = new File([blob], original.name, { type: "text/csv" });
    return newFile;
  };

  // Handle drop-upload for the CSV dropzone
  const onDropFile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.name.toLowerCase().endsWith(".csv")) {
      setFile(dropped);
    } else if (dropped) {
      showToast.error("Invalid file", "Only .csv files are supported");
    }
  };

  // Handle file picker selection - enforce CSV only
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] || null;
    if (!picked) {
      setFile(null);
      return;
    }
    const name = picked.name.toLowerCase();
    const isCsv =
      name.endsWith(".csv") ||
      picked.type === "text/csv" ||
      picked.type === "application/vnd.ms-excel";
    if (!isCsv) {
      showToast.error("Invalid file", "Only .csv files are supported");
      // reset input value so same file can be reselected later
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFile(null);
      return;
    }
    setValidationState(null);
    setFile(picked);
  };

  // Explicitly start preview flow from button
  const startReview = async () => {
    if (!selectedProductId) {
      showToast.error("Missing product", "Please select a product first");
      return;
    }
    if (!file) {
      showToast.error("Missing file", "Please choose a CSV file to upload");
      return;
    }
    setValidationState(null);
    await buildPreviewFromFile(file as File);
    setShowPreview(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-theme-primary to-theme-primary-dark text-theme-secondary flex items-center justify-center shadow-lg">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Upload Book by CSV
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Import your book content effortlessly
                </p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Link href="/products/add">
              <Button className="bg-theme-primary text-theme-secondary hover:bg-theme-primary-dark shadow-md hover:shadow-lg transition-shadow">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-theme-primary/5 to-theme-secondary/5 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-theme-primary" />
              <h2 className="text-xl font-semibold text-gray-800">
                Upload Configuration
              </h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              First choose a product (Book), then upload a CSV to import data.
            </p>
          </div>

          <div className="p-8">
            {/* Product Select */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-theme-primary" />
                  Choose Product
                </label>
                {selectedProductId && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                  </span>
                )}
              </div>
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
              >
                <SelectTrigger className="w-full h-12 border-2 border-gray-200 hover:border-theme-primary transition-colors focus:ring-2 focus:ring-theme-primary/20">
                  <SelectValue
                    placeholder={
                      isLoading
                        ? "Loading products..."
                        : "Select a product to upload CSV"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product._id} value={product._id}>
                      <div className="flex items-center gap-2 py-1">
                        <span className="text-lg">📖</span>
                        <span className="font-medium">
                          {stripHtmlTags(
                            product.title?.en || product.title?.sw || "Untitled"
                          )}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CSV Upload */}
            <div className="mb-8">
              <label className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Upload className="h-4 w-4 text-theme-primary" />
                CSV File Upload
              </label>

              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDropFile}
                className={`relative border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-all duration-200 min-h-[200px] ${
                  isDragging
                    ? "border-theme-primary bg-theme-secondary/10"
                    : selectedProductId
                    ? "border-gray-300 bg-gray-50 hover:border-theme-primary/50"
                    : "border-gray-200 bg-gray-50 opacity-60"
                }`}
                onClick={(e) => {
                  // Only trigger file dialog if clicking directly on the dropzone (not on child elements)
                  if (e.target === e.currentTarget && selectedProductId && fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
              >
                <Upload
                  className={`h-12 w-12 mb-4 ${
                    isDragging ? "text-theme-primary" : "text-gray-400"
                  }`}
                />

                <div className="mb-6">
                  <p
                    className={`text-base font-medium mb-1 ${
                      isDragging ? "text-theme-primary" : "text-gray-700"
                    }`}
                  >
                    Drag & drop your CSV file here
                  </p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                </div>

                {/* File Input with custom styling */}
                <div
                  className="w-full max-w-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={onSelectFile}
                    ref={fileInputRef}
                    disabled={!selectedProductId}
                    className="absolute w-0 h-0 opacity-0 pointer-events-none"
                  />
                  <div
                    className={`flex items-center border rounded-md overflow-hidden ${
                      !selectedProductId ? "opacity-60 pointer-events-none" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (fileInputRef.current && selectedProductId) {
                          fileInputRef.current.click();
                        }
                      }}
                      className="bg-theme-primary text-theme-secondary px-4 py-2 text-sm font-medium hover:bg-theme-primary-dark transition-colors cursor-pointer"
                    >
                      {file ? "Change file" : "Choose file"}
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-600 bg-white flex-1">
                      {file ? file.name : "No file chosen"}
                    </span>
                  </div>
                </div>

                {file && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="mt-4 text-sm text-red-600 hover:text-red-700 hover:underline"
                  >
                    Remove file
                  </button>
                )}

                <div className="mt-6 flex items-center gap-1 text-xs text-gray-500">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Only .csv files are supported</span>
                </div>
              </div>

              {!showPreview && (
                <div className="flex items-center gap-3 mt-6 justify-end">
                  <Button
                    variant="outline"
                    onClick={startReview}
                    disabled={!selectedProductId || !file || isUploading}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    Review CSV
                  </Button>
                  <Button
                    onClick={() => setConfirmOpen(true)}
                    disabled={!selectedProductId || !file || isUploading}
                    className="bg-theme-primary text-theme-secondary hover:bg-theme-primary-dark"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload CSV
                  </Button>
                </div>
              )}
            </div>

            {showPreview && preview && (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <FileCheck className="h-5 w-5 text-theme-primary" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Review and Update CSV File
                    </h2>
                  </div>
                  <p className="text-sm text-gray-600">
                    Edit the data below before uploading to ensure accuracy.
                  </p>
                </div>

                <div className="mx-auto w-full overflow-auto rounded-xl border-2 border-gray-200 shadow-inner bg-white max-h-[600px]">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0 z-10">
                      <tr>
                        {preview.headers.map((h, i) => (
                          <th
                            key={i}
                            className="px-4 py-3 text-left font-semibold text-gray-800 border-b border-gray-200 bg-gray-100"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={`transition-colors ${
                            rIdx % 2 === 0
                              ? "bg-white hover:bg-gray-50"
                              : "bg-gray-50/50 hover:bg-gray-100"
                          }`}
                        >
                          {preview.headers.map((_, cIdx) => (
                            <td
                              key={cIdx}
                              className="px-4 py-3 border-b border-gray-100"
                            >
                              <input
                                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme-primary/20 focus:border-theme-primary transition-all"
                                value={row[cIdx] ?? ""}
                                onChange={(e) => {
                                  setPreview((prev) => {
                                    if (!prev) return prev;
                                    const next = {
                                      headers: [...prev.headers],
                                      rows: prev.rows.map((r) => [...r]),
                                    };
                                    next.rows[rIdx][cIdx] = e.target.value;
                                    return next;
                                  });
                                }}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                    className="border-2"
                  >
                    Close Review
                  </Button>
                  <Button
                    onClick={() => setConfirmOpen(true)}
                    disabled={!selectedProductId || !file || isUploading}
                    className="bg-theme-primary text-theme-secondary hover:bg-theme-primary-dark shadow-md hover:shadow-lg transition-shadow"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload CSV
                  </Button>
                </div>

                {validationState && validationState.isValid === false && (
                  <div className="mt-6">
                    <div className="rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-red-100 p-5 shadow-md">
                      <div className="flex items-center gap-2 mb-3">
                        <Info className="h-5 w-5 text-red-600" />
                        <p className="font-semibold text-red-800">
                          Validation Errors
                        </p>
                      </div>
                      <ul className="list-disc pl-6 text-sm text-red-700 space-y-1">
                        {validationState.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Global confirmation dialog for both modes */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-theme-primary/10 flex items-center justify-center">
                      <Upload className="h-5 w-5 text-theme-primary" />
                    </div>
                    <DialogTitle className="text-xl">
                      Confirm CSV Upload
                    </DialogTitle>
                  </div>
                  <DialogDescription className="text-base pt-2">
                    Are you sure you want to upload{" "}
                    <span className="font-semibold text-gray-900">
                      {file ? '"' + file.name + '"' : "this file"}
                    </span>{" "}
                    to the selected product?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmOpen(false)}
                    className="border-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-theme-primary text-theme-secondary hover:bg-theme-primary-dark shadow-md"
                    onClick={async () => {
                      setConfirmOpen(false);
                      await handleUpload(!showPreview);
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Confirm Upload
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}


