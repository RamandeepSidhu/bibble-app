'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, Info } from 'lucide-react';

interface ProductOption {
  _id: string;
  title: { [lang: string]: string };
  type: string;
}

export default function UploadCsvPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [validationState, setValidationState] = useState<{ isValid: boolean; errors: string[] } | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const res: any = await ClientInstance.APP.getProducts();
        if (res?.success && Array.isArray(res?.data)) {
          setProducts((res.data as ProductOption[]).filter((p) => p.type === 'book'));
        } else if (Array.isArray(res)) {
          setProducts((res as ProductOption[]).filter((p) => p.type === 'book'));
        }
      } catch (e) {
        showToast.error('Error', 'Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleUpload = async (skipPreview: boolean = false) => {
    // debug: verify state before calling APIs
    // eslint-disable-next-line no-console
    console.log('[UploadCsv] handleUpload clicked', { selectedProductId, hasFile: !!file });
    if (!selectedProductId) {
      showToast.error('Missing product', 'Please select a product first');
      return;
    }
    if (!file) {
      showToast.error('Missing file', 'Please choose a CSV file to upload');
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
      console.log('[UploadCsv] validation response', validation);
      const isValid = validation?.success && validation?.data?.isValid !== false;
      setValidationState({ isValid: !!isValid, errors: validation?.data?.errors || [] });
      if (!isValid) {
        const errors: string[] = validation?.data?.errors || [];
        const msg = errors.length ? errors.slice(0, 5).join(' | ') : (validation?.message || 'CSV format is invalid');
        showToast.error('Validation failed', msg);
        return;
      }

      // Step 2: upload CSV with productId
      const res: any = await ClientInstance.APP.uploadCsv(selectedProductId, uploadFile);
      // eslint-disable-next-line no-console
      console.log('[UploadCsv] upload response', res);
      if (res?.success) {
        showToast.success('Upload complete', res?.message || 'CSV processed successfully');
        setFile(null);
        setValidationState(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setPreview(null);
        setShowPreview(false);
        router.push('/bible');
      } else {
        showToast.error('Upload failed', res?.message || 'Could not process CSV');
      }
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('[UploadCsv] upload error', e);
      showToast.error('Upload failed', e?.message || 'Network error');
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
    const parseLine = (line: string) => line.split(',');
    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(parseLine);
    setPreview({ headers, rows });
  };

  // Build a File object from edited preview
  const buildFileFromPreview = async (original: File): Promise<File> => {
    if (!preview) return original;
    const csvLines: string[] = [];
    const escape = (val: string) => {
      if (val == null) return '';
      if (/[",\n]/.test(val)) {
        return '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    };
    csvLines.push(preview.headers.map(escape).join(','));
    for (const row of preview.rows) {
      csvLines.push(row.map(escape).join(','));
    }
    const text = csvLines.join('\n');
    const blob = new Blob([text], { type: 'text/csv' });
    const newFile = new File([blob], original.name, { type: 'text/csv' });
    return newFile;
  };

  // Handle drop-upload for the CSV dropzone
  const onDropFile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.name.toLowerCase().endsWith('.csv')) {
      setFile(dropped);
    } else if (dropped) {
      showToast.error('Invalid file', 'Only .csv files are supported');
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
    const isCsv = name.endsWith('.csv') || picked.type === 'text/csv' || picked.type === 'application/vnd.ms-excel';
    if (!isCsv) {
      showToast.error('Invalid file', 'Only .csv files are supported');
      // reset input value so same file can be reselected later
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFile(null);
      return;
    }
    setValidationState(null);
    setFile(picked);
  };

  // Explicitly start preview flow from button
  const startReview = async () => {
    if (!selectedProductId) {
      showToast.error('Missing product', 'Please select a product first');
      return;
    }
    if (!file) {
      showToast.error('Missing file', 'Please choose a CSV file to upload');
      return;
    }
    setValidationState(null);
    await buildPreviewFromFile(file as File);
    setShowPreview(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="w-full">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-theme-secondary text-theme-primary flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Upload Book by CSV</h1>
          </div>
          <p className="text-gray-600">First choose a product (Book), then upload a CSV to import data.</p>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 container mx-auto px-10 py-10">
        {/* Product Select */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Choose Product</label>
            {selectedProductId && (
              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded">
                <CheckCircle2 className="h-3 w-3" /> Selected
              </span>
            )}
          </div>
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={isLoading ? 'Loading products...' : 'Select product'} />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.title?.en || p._id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* CSV Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">CSV File</label>
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDropFile}
            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors ${
              isDragging ? 'border-theme-primary bg-theme-secondary' : 'border-gray-300 bg-gray-50'
            }`}
          >
            <Upload className={`h-6 w-6 mb-2 ${isDragging ? 'text-theme-primary' : 'text-gray-500'}`} />

            <Input
              type="file"
              accept=".csv"
            onChange={onSelectFile}
              ref={fileInputRef}
              disabled={!selectedProductId}
              className={`mt-3 w-full sm:w-auto ${!selectedProductId ? 'opacity-60 pointer-events-none' : ''}`}
            />
            {file && (
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
                <span>Selected: <span className="font-medium">{file.name}</span></span>
                <button
                  type="button"
                  className="underline text-theme-primary"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  Change file
                </button>
              </div>
            )}
          </div>

          <div className="mt-3">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <FileSpreadsheet className="h-3 w-3" /> Only .csv files are supported.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-4 justify-end">
            {!showPreview && (
              <>
                <Button
                  variant="outline"
                  onClick={startReview}
                  disabled={!selectedProductId || !file || isUploading}
                >
                  Review CSV
                </Button>
                <Button
                  onClick={() => setConfirmOpen(true)}
                  disabled={!selectedProductId || !file || isUploading}
                  className="bg-theme-primary text-theme-secondary hover:bg-theme-primary-dark "
                >
                  Upload CSV
                </Button>
              </>
            )}
          </div>
        </div>

        {showPreview && preview && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Review and update CSV file</h2>
            <div className="mx-auto w-full  overflow-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {preview.headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left font-semibold text-gray-700 border-b">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {preview.headers.map((_, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 border-b">
                          <input
                            className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                            value={row[cIdx] ?? ''}
                            onChange={(e) => {
                              setPreview((prev) => {
                                if (!prev) return prev;
                                const next = { headers: [...prev.headers], rows: prev.rows.map((r) => [...r]) };
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
            <div className="mt-4 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
                Close Review
              </Button>
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={!selectedProductId || !file || isUploading}
                className="bg-theme-primary text-theme-secondary hover:bg-theme-primary-dark "
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
              <div className="mt-4">
                <div className="mx-auto w-full  rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                  <p className="font-semibold mb-2">Validation errors</p>
                  <ul className="list-disc pl-5 text-sm">
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload CSV</DialogTitle>
              <DialogDescription>
                Are you sure you want to upload {file ? '"' + file.name + '"' : 'this file'} to the selected product?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button
                className="bg-theme-primary text-theme-secondary hover:bg-theme-primary-dark"
                onClick={async () => { setConfirmOpen(false); await handleUpload(!showPreview); }}
              >
                Confirm Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


