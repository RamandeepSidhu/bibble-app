'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Globe,
  Check,
  X
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LanguageManagement, CreateLanguagePayload, UpdateLanguagePayload } from '@/lib/types/bibble';
import ClientInstance from '@/shared/client';
import { showToast } from '@/lib/toast';

export default function LanguagesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [languages, setLanguages] = useState<LanguageManagement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingLanguage, setDeletingLanguage] = useState<LanguageManagement | null>(null);
  const [editingLanguage, setEditingLanguage] = useState<LanguageManagement | null>(null);
  const [formData, setFormData] = useState<CreateLanguagePayload>({
    name: '',
    code: '',
    symbol: '',
    isActive: true,
    isDefault: false,
    sortOrder: 0
  });

  // Fetch languages from API
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setIsLoading(true);
        const response: any = await ClientInstance.APP.getLanguage();
        if (response?.success && response?.data) {
          setLanguages(response.data);
        }
      } catch (error) {
        console.error("Error fetching languages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  // Filter languages based on search and status
  const filteredLanguages = languages.filter(language => {
    const matchesSearch = 
      language.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      language.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      language.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' && language.isActive) ||
      (selectedStatus === 'inactive' && !language.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateLanguage = async () => {
    try {
      const response: any = await ClientInstance.APP.CreateLanguage(formData);
      if (response?.success) {
        // Refresh languages list
        const updatedResponse: any = await ClientInstance.APP.getLanguage();
        if (updatedResponse?.success && updatedResponse?.data) {
          setLanguages(updatedResponse.data);
        }
        setIsCreateModalOpen(false);
        setFormData({
          name: '',
          code: '',
          symbol: '',
          isActive: true,
          isDefault: false,
          sortOrder: 0
        });
        showToast.success("Language Created", "Language has been created successfully!");
      } else {
        showToast.error("Error", response?.message || "Failed to create language");
      }
    } catch (error) {
      console.error("Error creating language:", error);
      showToast.error("Error", "Network error. Please check your connection and try again.");
    }
  };

  const handleUpdateLanguage = async () => {
    if (!editingLanguage) return;
    
    try {
      const response: any = await ClientInstance.APP.UpdateLanguage(editingLanguage._id, formData);
      if (response?.success) {
        // Refresh languages list
        const updatedResponse: any = await ClientInstance.APP.getLanguage();
        if (updatedResponse?.success && updatedResponse?.data) {
          setLanguages(updatedResponse.data);
        }
        setIsEditModalOpen(false);
        setEditingLanguage(null);
        setFormData({
          name: '',
          code: '',
          symbol: '',
          isActive: true,
          isDefault: false,
          sortOrder: 0
        });
        showToast.success("Language Updated", "Language has been updated successfully!");
      } else {
        showToast.error("Error", response?.message || "Failed to update language");
      }
    } catch (error) {
      console.error("Error updating language:", error);
      showToast.error("Error", "Network error. Please check your connection and try again.");
    }
  };

  const handleDeleteClick = (language: LanguageManagement) => {
    setDeletingLanguage(language);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteLanguage = async () => {
    if (!deletingLanguage) return;
    
    try {
      const response: any = await ClientInstance.APP.DeleteLanguage(deletingLanguage._id);
      if (response?.success) {
        // Refresh languages list
        const updatedResponse: any = await ClientInstance.APP.getLanguage();
        if (updatedResponse?.success && updatedResponse?.data) {
          setLanguages(updatedResponse.data);
        }
        setIsDeleteDialogOpen(false);
        setDeletingLanguage(null);
        showToast.success("Language Deleted", "Language has been deleted successfully!");
      } else {
        showToast.error("Error", response?.message || "Failed to delete language");
      }
    } catch (error) {
      console.error("Error deleting language:", error);
      showToast.error("Error", "Network error. Please check your connection and try again.");
    }
  };

  const handleEditClick = (language: LanguageManagement) => {
    setEditingLanguage(language);
    setFormData({
      name: language.name,
      code: language.code,
      symbol: language.symbol,
      isActive: language.isActive,
      isDefault: language.isDefault,
      sortOrder: language.sortOrder
    });
    setIsEditModalOpen(true);
  };

  const getStatusBadge = (isActive: boolean) => {
    const baseClasses = "px-2 py-1 text-xs rounded-full border";
    return isActive 
      ? `${baseClasses} bg-green-100 text-green-800 border-green-200`
      : `${baseClasses} bg-gray-100 text-gray-800 border-gray-200`;
  };

  const getDefaultBadge = (isDefault: boolean) => {
    const baseClasses = "px-2 py-1 text-xs rounded-full border";
    return isDefault 
      ? `${baseClasses} bg-blue-100 text-blue-800 border-blue-200`
      : `${baseClasses} bg-gray-100 text-gray-800 border-gray-200`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6 border-b border-gray-200 pb-4 lg:pb-6">
        <div className="w-full">
          <h2 className="font-inter font-semibold text-2xl sm:text-[30px] leading-[38px] tracking-[0em] text-gray-800">
            Language Management
          </h2>
          <p className="font-inter font-normal text-sm sm:text-[16px] leading-[24px] tracking-[0em] text-gray-600 mt-1">
            Manage system languages and their settings
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-theme-primary text-theme-secondary hover:bg-theme-primary-dark"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Language
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 md:gap-4 mt-5">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            placeholder="Search languages..."
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full sm:w-80 h-[40px] pl-10 pr-4 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
        <div className="w-full sm:w-auto">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Default</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Languages Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Loading languages...</div>
        </div>
      ) : filteredLanguages.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No languages found</div>
          <p className="text-gray-400 mt-2">
            {searchTerm || selectedStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first language'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#EAECF0] rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#EAECF0]">
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Language</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Code</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Symbol</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Status</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Default</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLanguages.map((language, index) => (
                <TableRow 
                  key={language._id} 
                  className={`border-b border-[#EAECF0] hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-[#F9FAFB]' : 'bg-white'
                  }`}
                >
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-theme-secondary text-theme-primary flex items-center justify-center font-semibold">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {language.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-theme-secondary text-theme-primary border border-theme-primary">
                      {language.code}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className="text-sm text-gray-700">{language.symbol}</span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className={getStatusBadge(language.isActive)}>
                      {language.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className={getDefaultBadge(language.isDefault)}>
                      {language.isDefault ? 'Default' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="!min-w-[80px]"
                        onClick={() => handleEditClick(language)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="!min-w-[80px] bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        onClick={() => handleDeleteClick(language)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Language Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Language</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter language name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="Enter language code (e.g., en, es)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                <Input maxLength={5} minLength={2}
                  value={formData.symbol}
                  onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                  placeholder="Enter language symbol"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Default</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateLanguage}
                className="bg-theme-primary text-theme-secondary hover:bg-theme-primary-dark"
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Language Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Language</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter language name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="Enter language code (e.g., en, es)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                <Input
                  value={formData.symbol}  maxLength={5} minLength={2}
                  onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                  placeholder="Enter language symbol"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Default</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateLanguage}
                className="bg-theme-primary text-theme-secondary hover:bg-theme-primary-dark"
              >
                Update
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Language</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the language "{deletingLanguage?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteLanguage}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
