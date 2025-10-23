import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    isLoading?: boolean;
    className?: string;
}

export default function Pagination({
    currentPage,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    isLoading = false,
    className = '',
}: PaginationProps) {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
    const endItem = Math.min(currentPage * pageSize, totalItems);

    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement> | string) => {
        const newSize = typeof e === 'string' ? Number(e) : Number(e.target.value);
        onPageSizeChange(newSize);
        onPageChange(1); // Reset to first page when changing page size
    };

    // Hide pagination if there are no items or only one page with 10 or fewer items
    if (totalItems === 0 || (totalPages === 1 && totalItems <= 10)) return null;

    return (
        <div className={`flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-white ${className}`}>
            {/* Mobile pagination */}
            <div className="flex items-center justify-between w-full sm:hidden px-2">
                <Button
                    variant="outline"
                    className="!min-w-[40px] !h-9 p-0 flex items-center justify-center"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="text-sm text-gray-700 font-medium">
                    <p className="text-sm text-gray-700 font-[500]">
                        Page <span className="font-medium">{currentPage}</span> of{' '}
                        <span className="font-medium">{totalPages}</span>
                    </p>
                </div>

                <Button
                    variant="outline"
                    className="!min-w-[40px] !h-9 p-0 flex items-center justify-center"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Desktop pagination */}
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700 font-[500] whitespace-nowrap">Rows per page</span>
                            <Select
                                value={pageSize.toString()}
                                onValueChange={handlePageSizeChange}
                                disabled={isLoading}
                            >
                                <SelectTrigger className="w-[80px] h-9">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 20, 30, 40, 50].map((size) => (
                                        <SelectItem key={size} value={size.toString()}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-gray-700 font-[500]">
                            Page <span className="font-medium">{currentPage}</span> of{' '}
                            <span className="font-medium">{totalPages}</span>
                        </p>
                    </div>
                </div>

                <nav className="relative z-0 inline-flex -space-x-px mt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1 || isLoading}
                        className="rounded-r-none !min-w-[40px] !h-[40px] p-0 flex items-center justify-center hover:text-primary-500"
                    >
                        <ChevronLeft className="h-4" />
                        <span className="sr-only">Previous</span>
                    </Button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                            pageNum = i + 1;
                        } else if (currentPage <= 3) {
                            pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                        } else {
                            pageNum = currentPage - 2 + i;
                        }

                        if (i === 3 && currentPage < totalPages - 3) {
                            return (
                                <span key="ellipsis" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    ...
                                </span>
                            );
                        }
                        if (i === 1 && currentPage > 4) {
                            return (
                                <span key="ellipsis-start" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    ...
                                </span>
                            );
                        }
                        if (i > 3 && currentPage < totalPages - 3) {
                            return null;
                        }

                        return (
                            <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                className={`rounded-none !min-w-[40px] !h-[40px] p-0 flex items-center justify-center  hover:text-primary-500 ${currentPage === pageNum ? 'z-10' : ''}`}
                                onClick={() => onPageChange(pageNum)}
                                disabled={isLoading}
                            >
                                {pageNum}
                            </Button>
                        );
                    })}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || isLoading}
                        className="rounded-l-none !h-[40px] !min-w-[40px] p-0 flex items-center justify-center  hover:text-primary-500"
                    >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-4" />
                    </Button>
                </nav>
            </div>
        </div>
    );
}
