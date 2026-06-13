'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Minus,
  Plus,
  ChevronRight,
  AlertTriangle,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/store/product-card';
import { useNavigationStore, useCartStore } from '@/lib/store';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  stock: number;
  sizes: string[];
  images: string[];
  category?: { id: string; name: string; slug: string };
}

interface RelatedProduct {
  id: string;
  name: string;
  slug?: string;
  price: number;
  stock: number;
  sizes: string[];
  images: string[];
  category?: { name: string; slug: string };
}

export function ProductDetailView() {
  const { pageParams, navigate } = useNavigationStore();
  const { addItem } = useCartStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [loadedId, setLoadedId] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  const loading = loadedId !== pageParams.id;

  useEffect(() => {
    if (!pageParams.id) return;
    let cancelled = false;

    fetch(`/api/products/${pageParams.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const p = data.product;
        if (p) {
          setProduct(p);
          if (p.sizes && p.sizes.length > 0) {
            setSelectedSize(p.sizes[0]);
          }
          // Fetch related products
          if (p.category?.id) {
            fetch(`/api/products?category=${p.category.id}`)
              .then((res) => res.json())
              .then((data) => {
                if (!cancelled) {
                  setRelatedProducts(
                    (data.products || []).filter(
                      (rp: RelatedProduct) => rp.id !== p.id
                    )
                  );
                }
              })
              .catch(() => {});
          }
        }
        setLoadedId(pageParams.id);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadedId(pageParams.id);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pageParams.id]);

  const handleAddToCart = () => {
    if (!product) return;
    if (product.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    addItem({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      itemType: 'product',
      itemId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      size: selectedSize,
      image:
        product.images && product.images.length > 0
          ? product.images[0]
          : undefined,
    });
    toast.success(`${product.name} added to cart`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="font-heading text-xl text-foreground mb-2">
          Product not found
        </p>
        <Button
          onClick={() => navigate('products')}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Back to Collection
        </Button>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : ['/placeholder-product.jpg'];

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-primary/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <button
              onClick={() => navigate('home')}
              className="hover:text-accent transition-colors flex items-center gap-1"
            >
              <Home className="h-3.5 w-3.5" />
              Home
            </button>
            <ChevronRight className="h-3.5 w-3.5" />
            <button
              onClick={() => navigate('products')}
              className="hover:text-accent transition-colors"
            >
              Shop
            </button>
            {product.category && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-foreground">{product.category.name}</span>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Main Image */}
            <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary mb-4">
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                src={images[selectedImage]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-primary/60 flex items-center justify-center">
                  <span className="font-heading text-2xl text-primary-foreground font-semibold">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative shrink-0 h-20 w-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-accent shadow-sm'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col"
          >
            {/* Category Badge */}
            {product.category && (
              <Badge
                variant="outline"
                className="w-fit mb-3 text-accent border-accent/30"
              >
                {product.category.name}
              </Badge>
            )}

            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mt-3">
              <span className="text-2xl font-bold text-accent">
                ${product.price.toFixed(2)}
              </span>
            </div>

            {/* Stock Indicator */}
            <div className="mt-3 flex items-center gap-2">
              {product.stock > 0 ? (
                product.stock < 5 ? (
                  <div className="flex items-center gap-1.5 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Only {product.stock} left in stock</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span>In Stock</span>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-1.5 text-sm text-destructive">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  <span>Out of Stock</span>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-3">
                  Select Size
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedSize(size)}
                      className={
                        selectedSize === size
                          ? 'bg-accent text-accent-foreground hover:bg-accent/90 min-w-[48px]'
                          : 'min-w-[48px]'
                      }
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground mb-3">
                Quantity
              </h3>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center text-lg font-medium">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              size="lg"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-heading text-base py-6 shadow-md"
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <Separator className="mb-12" />
            <h2 className="font-heading text-2xl font-bold text-foreground mb-8">
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((rp) => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
