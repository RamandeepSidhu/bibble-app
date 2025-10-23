'use client';

import { useState } from 'react';
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
  Eye,
  Globe,
  FileText
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { Product, LANGUAGES } from '@/lib/types/bibble';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  // Mock data - in real app, this would come from API
  const [products, setProducts] = useState<Product[]>([
    {
      productId: '1',
      type: 'book',
      categoryId: 'cat1',
      tags: ['bible', 'genesis'],
      title: { 
        en: 'Genesis', 
        sw: 'Mwanzo', 
        fr: 'Genèse', 
        rn: 'Itanguriro' 
      },
      description: { 
        en: 'The first book of the Bible, describing creation.', 
        sw: 'Kitabu cha kwanza cha Biblia, kinaelezea uumbaji.', 
        fr: 'Le premier livre de la Bible, décrivant la création.', 
        rn: 'Igitabu ca mbere c\'uburimwo bw\'isi.' 
      },
      producer: 'Bibble Admin',
      profile_image: 'https://cdn.mysite.com/images/genesis_cover.png',
      images: [
        'https://cdn.mysite.com/images/genesis1.png',
        'https://cdn.mysite.com/images/genesis2.png'
      ],
      createdAt: '2024-01-15T10:30:00Z',
      status: 'active'
    },
    {
      productId: '2',
      type: 'story',
      categoryId: 'cat2',
      tags: ['bible', 'creation'],
      title: { 
        en: 'The Creation Story', 
        sw: 'Hadithi ya Uumbaji', 
        fr: 'L\'Histoire de la Création', 
        rn: 'Inkuru y\'Irema' 
      },
      description: { 
        en: 'The story of how God created the world in seven days.', 
        sw: 'Hadithi ya jinsi Mungu alivyoumba dunia katika siku saba.', 
        fr: 'L\'histoire de comment Dieu a créé le monde en sept jours.', 
        rn: 'Inkuru ivuga ukuntu Imana yaremye isi mu minsi irindwi.' 
      },
      producer: 'Bibble Admin',
      profile_image: 'https://cdn.mysite.com/images/creation_cover.png',
      images: [],
      createdAt: '2024-01-16T14:20:00Z',
      status: 'active'
    }
  ]);

  // Filter products based on search and type
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.title.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.title.sw.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.title.fr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.title.rn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.en.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || product.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.productId !== productId));
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs rounded-full border";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800 border-green-200`;
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-200`;
      case 'draft':
        return `${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-200`;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'book':
        return '📖';
        return '📝';
      case 'hymns':
        return '🎵';
      default:
        return '📄';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6 border-b border-gray-200 pb-4 lg:pb-6">
        <div className="w-full">
          <h2 className="font-inter font-semibold text-2xl sm:text-[30px] leading-[38px] tracking-[0em] text-gray-800">
            Products Management
          </h2>
          <p className="font-inter font-normal text-sm sm:text-[16px] leading-[24px] tracking-[0em] text-gray-600 mt-1">
            Manage your products and content
          </p>
        </div>
        <Link href="/products/add">
          <Button className="bg-theme-primary text-theme-secondary hover:bg-theme-primary-dark">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3 md:gap-4 mt-5">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            placeholder="Search products..."
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full sm:w-80 h-[40px] pl-10 pr-4 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
        <div className="w-full sm:w-auto">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="book">Book</SelectItem>
              <SelectItem value="song">Hymns</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No products found</div>
          <p className="text-gray-400 mt-2">
            {searchTerm || selectedType !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first product'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#EAECF0] rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#EAECF0]">
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Product</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Type</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Title (EN)</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Title (SW)</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Status</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6">Created</TableHead>
                <TableHead className="font-semibold text-[#475467] text-xs py-4 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product, index) => (
                <TableRow 
                  key={product.productId} 
                  className={`border-b border-[#EAECF0] hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-[#F9FAFB]' : 'bg-white'
                  }`}
                >
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      {product.profile_image ? (
                        <img 
                          src={product.profile_image} 
                          alt={product.title.en} 
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-theme-secondary text-theme-primary flex items-center justify-center font-semibold">
                          {getTypeIcon(product.type)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {product.title.en || 'Untitled'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.tags.slice(0, 2).join(', ')}
                          {product.tags.length > 2 && ` +${product.tags.length - 2} more`}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-theme-secondary text-theme-primary border border-theme-primary">
                      {getTypeIcon(product.type)} {product.type}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="max-w-xs truncate" dangerouslySetInnerHTML={{ __html: product.title.en || '-' }} />
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="max-w-xs truncate" dangerouslySetInnerHTML={{ __html: product.title.sw || '-' }} />
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className={getStatusBadge(product.status || 'inactive')}>
                      {product.status || 'inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-gray-700 text-sm">
                    {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-right py-4 px-6">
                    <div className="flex justify-end gap-2">
                      <Link href={`/products/edit/${product.productId}`}>
                        <Button variant="outline" size="sm" className="!min-w-[80px]">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="!min-w-[80px] bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        onClick={() => handleDeleteProduct(product.productId || '')}
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
    </div>
  );
}