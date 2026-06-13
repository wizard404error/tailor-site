'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigationStore, useCartStore } from '@/lib/store';
import { toast } from 'sonner';

interface ColorOption {
  name: string;
  hex: string;
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug?: string;
    price: number;
    stock: number;
    sizes: string[];
    colors?: ColorOption[];
    images: string[];
    category?: {
      name: string;
      slug: string;
    };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { navigate } = useNavigationStore();
  const { addItem } = useCartStore();

  const imageUrl =
    product.images && product.images.length > 0
      ? product.images[0]
      : '/placeholder-product.jpg';

  const colors = product.colors || [];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const firstColor = colors.length > 0 ? colors[0] : null;
    addItem({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      itemType: 'product',
      itemId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      size: product.sizes?.[0],
      color: firstColor?.name,
      colorHex: firstColor?.hex,
      image: imageUrl,
    });
    toast.success(`${product.name} added to cart`);
  };

  const handleClick = () => {
    navigate('product-detail', { id: product.id });
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative overflow-hidden rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <motion.img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />

          {/* Category Badge */}
          {product.category && (
            <Badge
              className="absolute top-3 right-3 bg-accent text-accent-foreground text-[10px] uppercase tracking-wider font-medium"
            >
              {product.category.name}
            </Badge>
          )}

          {/* Low Stock Warning */}
          {product.stock > 0 && product.stock < 5 && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-destructive/90 text-white text-[10px] font-medium px-2 py-1 rounded-full">
              <AlertTriangle className="h-3 w-3" />
              Low Stock
            </div>
          )}

          {/* Out of Stock Overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-primary/60 flex items-center justify-center">
              <span className="font-heading text-lg text-primary-foreground font-semibold">
                Out of Stock
              </span>
            </div>
          )}

          {/* Hover Add to Cart Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileHover={{ opacity: 1, y: 0 }}
            className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-medium shadow-lg"
              size="sm"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </motion.div>
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-2">
          <h3 className="font-heading text-base font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-accent">
              ${product.price.toFixed(2)}
            </span>
          </div>

          {/* Color Swatches */}
          {colors.length > 0 && (
            <div className="flex items-center gap-1.5">
              {colors.slice(0, 6).map((color, index) => (
                <span
                  key={index}
                  className="inline-block h-4 w-4 rounded-full border border-border/50 shadow-sm"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
              {colors.length > 6 && (
                <span className="text-[10px] text-muted-foreground ml-0.5">
                  +{colors.length - 6}
                </span>
              )}
            </div>
          )}

          {/* Size Badges */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.sizes.slice(0, 5).map((size) => (
                <span
                  key={size}
                  className="inline-flex items-center justify-center h-6 min-w-[28px] px-1.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-medium"
                >
                  {size}
                </span>
              ))}
              {product.sizes.length > 5 && (
                <span className="inline-flex items-center justify-center h-6 min-w-[28px] px-1.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-medium">
                  +{product.sizes.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
