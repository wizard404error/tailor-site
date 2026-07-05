'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ProductCard } from '@/components/store/product-card';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

interface Product {
  id: string;
  name: string;
  slug?: string;
  price: number;
  stock: number;
  sizes: string[];
  colors?: { name: string; hex: string }[];
  images: string[];
  category?: { name: string; slug: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
}

const ITEMS_PER_PAGE = 6;
const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export function ProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }
      if (sortBy) {
        params.set('sort', sortBy);
      }

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      let fetchedProducts = data.products || [];

      // Client-side size filtering
      if (selectedSizes.length > 0) {
        fetchedProducts = fetchedProducts.filter((p: Product) =>
          p.sizes?.some((s) => selectedSizes.includes(s))
        );
      }

      setProducts(fetchedProducts);
      setCurrentPage(1);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedSizes, sortBy]);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const paginatedProducts = products.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedSizes([]);
    setSortBy('newest');
  };

  const hasActiveFilters =
    selectedCategory !== 'all' || selectedSizes.length > 0;

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-primary/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
              Our Collection
            </h1>
            <div className="flex items-center gap-4 mt-3">
              <div className="h-px w-12 bg-accent" />
              <div className="h-1.5 w-1.5 rounded-full bg-accent" />
              <div className="h-px w-12 bg-accent" />
            </div>
            <p className="mt-4 text-muted-foreground max-w-lg">
              Discover handcrafted pieces designed to celebrate your unique
              silhouette. Every garment tells a story of elegance and precision.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px]">
                  !
                </Badge>
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            )}

            <span className="text-sm text-muted-foreground">
              {products.length} product{products.length !== 1 ? 's' : ''}
            </span>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="name_asc">Name: A to Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 p-6 bg-card rounded-xl border border-border shadow-sm"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Category Filter */}
              <div>
                <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-accent mb-4">
                  Category
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                    className={
                      selectedCategory === 'all'
                        ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                        : ''
                    }
                  >
                    All
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={
                        selectedCategory === cat.id ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={
                        selectedCategory === cat.id
                          ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                          : ''
                      }
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Size Filter */}
              <div>
                <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-accent mb-4">
                  Size
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ALL_SIZES.map((size) => (
                    <div key={size} className="flex items-center gap-2">
                      <Checkbox
                        id={`size-${size}`}
                        checked={selectedSizes.includes(size)}
                        onCheckedChange={() => toggleSize(size)}
                      />
                      <Label
                        htmlFor={`size-${size}`}
                        className="text-sm cursor-pointer"
                      >
                        {size}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : paginatedProducts.length > 0 ? (
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.05 },
              },
            }}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {paginatedProducts.map((product) => (
              <motion.div key={product.id} variants={fadeUp}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <p className="font-heading text-xl text-foreground mb-2">
              No products found
            </p>
            <p className="text-muted-foreground text-sm">
              Try adjusting your filters to find what you&apos;re looking for.
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mt-4 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    className={
                      currentPage === 1
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      onClick={() => setCurrentPage(i + 1)}
                      isActive={currentPage === i + 1}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    className={
                      currentPage === totalPages
                        ? 'pointer-events-none opacity-50'
                        : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
