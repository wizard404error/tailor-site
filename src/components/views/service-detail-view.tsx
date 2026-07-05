'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  ChevronRight,
  Clock,
  Calendar,
  Home,
  Ruler,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigationStore, useCartStore } from '@/lib/store';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  slug?: string;
  description: string;
  basePrice: number;
  turnaroundDays: number;
  requiresAppointment: boolean;
  measurementSchema?: Record<string, unknown>;
}

interface PortfolioItem {
  id: string;
  title: string;
  imageUrl: string;
  category?: string;
}

export function ServiceDetailView() {
  const { pageParams, navigate } = useNavigationStore();
  const { addItem } = useCartStore();
  const [service, setService] = useState<Service | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loadedId, setLoadedId] = useState<string>('');

  const loading = loadedId !== pageParams.id;

  useEffect(() => {
    if (!pageParams.id) return;
    let cancelled = false;

    fetch(`/api/services/${pageParams.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          if (data.service) {
            setService(data.service);
          }
          setLoadedId(pageParams.id);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadedId(pageParams.id);
        }
      });

    fetch('/api/portfolio')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setPortfolio(data.portfolio || []);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [pageParams.id]);

  const handleAddToCart = () => {
    if (!service) return;
    addItem({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      itemType: 'service',
      itemId: service.id,
      name: service.name,
      price: service.basePrice,
      quantity: 1,
      requiresAppointment: service.requiresAppointment,
    });
    toast.success(`${service.name} added to cart`);
  };

  // Parse measurement schema fields
  const measurementFields = service?.measurementSchema
    ? Object.entries(service.measurementSchema).map(([key, value]) => {
        const fieldDef = value as Record<string, unknown>;
        return {
          key,
          label: (fieldDef.label as string) || key,
          unit: (fieldDef.unit as string) || 'cm',
          required: fieldDef.required as boolean || false,
        };
      })
    : [];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="font-heading text-xl text-foreground mb-2">
          Service not found
        </p>
        <Button
          onClick={() => navigate('services')}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Back to Services
        </Button>
      </div>
    );
  }

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
              onClick={() => navigate('services')}
              className="hover:text-accent transition-colors"
            >
              Services
            </button>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">{service.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Service Illustration Area */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-secondary via-secondary/50 to-muted flex items-center justify-center">
              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="service-detail-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#service-detail-grid)" />
                </svg>
              </div>

              <div className="relative z-10 flex flex-col items-center gap-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Ruler className="h-20 w-20 text-accent" strokeWidth={1} />
                </motion.div>
                <span className="font-heading text-lg text-foreground/60">
                  {service.name}
                </span>
              </div>

              {/* Requires Fitting Badge */}
              {service.requiresAppointment && (
                <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground gap-1">
                  <Calendar className="h-3 w-3" />
                  Fitting Required
                </Badge>
              )}
            </div>
          </motion.div>

          {/* Service Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col"
          >
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
              {service.name}
            </h1>

            <div className="mt-3 flex items-center gap-4">
              <span className="text-2xl font-bold text-accent">
                From {formatPrice(service.basePrice)}
              </span>
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <Clock className="h-4 w-4" />
                <span>{service.turnaroundDays} business days</span>
              </div>
            </div>

            {/* Appointment Note */}
            {service.requiresAppointment && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
                <Info className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <p className="text-sm text-foreground/80">
                  <span className="font-medium">Fitting appointment required.</span>{' '}
                  A consultation will be scheduled after booking to ensure the perfect fit.
                </p>
              </div>
            )}

            <Separator className="my-6" />

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground mb-2">
                About This Service
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </div>

            {/* Measurement Schema Preview */}
            {measurementFields.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-accent" />
                  Measurements Required
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {measurementFields.map((field) => (
                    <div
                      key={field.key}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border"
                    >
                      <span className="text-sm text-foreground">
                        {field.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {field.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              size="lg"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-heading text-base py-6 shadow-md"
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>
          </motion.div>
        </div>

        {/* Portfolio Section */}
        {portfolio.length > 0 && (
          <div className="mt-16">
            <Separator className="mb-12" />
            <h2 className="font-heading text-2xl font-bold text-foreground mb-8">
              Our Work
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {portfolio.slice(0, 4).map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -4 }}
                  className="relative aspect-square overflow-hidden rounded-lg group cursor-pointer"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="font-heading text-sm text-primary-foreground font-medium">
                      {item.title}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
